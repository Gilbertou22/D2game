// src/game/Enemies/Boss.js (完整修正版：Boss 多階段 AI 模式 + 防呆 + 性能優化)
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import useGameState from '../../hooks/useGameState';
import { useGLTF } from '@react-three/drei';
import useEnemyAI from './useEnemyAI';
import { createParticles } from '../Particles';
import { createProjectile } from '../Projectiles';
import EnemyHealthBar from './EnemyHealthBar';
import enemyConfigs from '../../configs/enemyConfigs'; // default import
import { generateBossLoot } from '../../utils/lootTables';
import { generateBossExclusiveLoot } from '../../utils/bossLootPool';

const BOSS_MODEL_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SciFiHelmet/glTF/SciFiHelmet.gltf'; // 可換成更大模型

function BossModel() {
    const { scene, error } = useGLTF(BOSS_MODEL_URL);
    const modelRef = useRef();

    useEffect(() => {
        if (scene) {
            const config = enemyConfigs.boss;
            // 調整大小：原始模型太大，縮小到合理範圍
            const scale = config.size / 10; // 基礎縮放（原 size 8 → scale ≈ 2.67）
            scene.scale.set(scale, scale, scale);

            // 地面對齊（模型中心通常在底部）
            scene.position.set(0, -config.size / 2 + 1, 0); // 微調 y 讓腳踩地

            scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // 可加材質調整（更暗黑風）
                    if (child.material) {
                        child.material.color.set(config.color);
                        child.material.metalness = 0.8;
                        child.material.roughness = 0.3;
                    }
                }
            });
        }
    }, [scene]);

    // 載入失敗 fallback 球體
    if (error || !scene) {
        const config = enemyConfigs.boss;
        return (
            <mesh>
                <sphereGeometry args={[config.size, 32, 32]} />
                <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={0.8} />
            </mesh>
        );
    }

    return <primitive ref={modelRef} object={scene} />;
}

function Boss({ enemy }) {
    const mesh = useRef();
    const lastPhase = useRef(0);
    const specialTimer = useRef(0);

    const {
        playerPos,
        updateEnemy,        
        removeEnemy,
        setEnemies,
        updatePlayer,
        showLootNotification,
        addToInventory,
        nextLevel,
        currentLevel,
        playerHP
    } = useGameState();

    // 通用 AI (移動、追擊)
    useEnemyAI(enemy, mesh);

    // BOSS 死亡處理
    useEffect(() => {
        if (enemy.hp <= 0) {
            createParticles(enemy.position, 0xff00ff, 120, 40, 6, 'boss_death_explosion');

            // BOSS 專屬稀有裝備
            const exclusiveLoot = generateBossExclusiveLoot(currentLevel);
            exclusiveLoot.forEach(item => addToInventory(item));

            // 高額金幣
            const gold = 1000 + currentLevel * 200;

            // 顯示專屬掉落通知
            showLootNotification({
                gold,
                items: exclusiveLoot,
                chestRarity: 'BOSS 專屬'
            });

            //updatePlayer({ playerGold: playerGold + gold });

            removeEnemy(enemy.id);

            setTimeout(() => nextLevel(), 5000);
        }
    }, [enemy.hp]);

    // Boss 階段變化與專屬模式
    useEffect(() => {
        if (enemy.hp > 0) {
            const hpPercent = enemy.hp / enemy.maxHp;
            let currentPhase = 0;
            const phases = enemyConfigs.boss.phases || [];

            for (let i = phases.length - 1; i >= 0; i--) {
                if (hpPercent > phases[i].threshold) {
                    currentPhase = i;
                    break;
                }
            }

            if (currentPhase > lastPhase.current) {
                const phase = phases[currentPhase] || phases[0];
                createParticles(enemy.position, 0xff00ff, 100, 35, 5, 'phase_change');

                // 階段屬性提升
                updateEnemy(enemy.id, {
                    moveSpeed: enemy.baseSpeed * phase.speedMult,
                    attackPower: enemy.baseAttack * phase.attackMult,
                    specialCooldown: phase.specialCD
                });

                // 階段專屬行為觸發
                if (phase.summon) {
                    summonMinions(enemy.position, 6 + currentPhase * 2);
                }

                lastPhase.current = currentPhase;
            }
        }
    }, [enemy.hp]);

    // Boss 專屬攻擊模式
    useFrame((state, delta) => {
        if (enemy.hp <= 0 || !mesh.current) return;

        const dist = enemy.position.distanceTo(playerPos);
        const now = state.clock.getElapsedTime();

        // 階段專屬特殊攻擊
        const hpPercent = enemy.hp / enemy.maxHp;
        let phaseIndex = 0;
        const phases = enemyConfigs.boss.phases || [];
        if (hpPercent <= 0.4) phaseIndex = 2;
        else if (hpPercent <= 0.7) phaseIndex = 1;

        specialTimer.current += delta;
        if (specialTimer.current >= enemy.specialCooldown) {
            specialTimer.current = 0;

            switch (phaseIndex) {
                case 0: // Phase 1: 強力單體攻擊
                    if (dist <= enemy.attackRange * 1.5) {
                        const damage = enemy.attackPower * 1.5;
                        updatePlayer({ playerHP: playerHP - damage });
                        createParticles(playerPos, 0xff0000, 30, 20, 2, 'heavy_hit');
                    }
                    break;

                case 1: // Phase 2: 範圍衝擊波 + 召喚
                    createParticles(enemy.position, 0xff00ff, 50, 25, 3, 'shockwave');
                    if (dist <= 20) {
                        updatePlayer({ playerHP: playerHP - 30 });
                    }
                    summonMinions(enemy.position, 4);
                    break;

                case 2: // Phase 3: 狂暴投射物雨 + 快速衝鋒
                    for (let i = 0; i < 12; i++) {
                        const angle = (i / 12) * Math.PI * 2;
                        const offset = new THREE.Vector3(Math.cos(angle) * 15, 10, Math.sin(angle) * 15);
                        const target = playerPos.clone().add(offset);
                        createProjectile('boss_bullet', enemy.position.clone().addY(10), target);
                    }
                    // 衝鋒加速
                    updateEnemy(enemy.id, { moveSpeed: enemy.moveSpeed * 2 });
                    setTimeout(() => updateEnemy(enemy.id, { moveSpeed: enemy.moveSpeed / 2 }), 3000);
                    break;
            }
        }
    });

    // 召喚小怪函數
    const summonMinions = (centerPos, count) => {
        const newMinions = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const pos = centerPos.clone().add(new THREE.Vector3(Math.cos(angle) * 8, 3, Math.sin(angle) * 8));
            newMinions.push({
                id: Math.random(),
                position: pos,
                type: 'melee',
                hp: 50,
                maxHp: 50,
                attackPower: 12,
                moveSpeed: 12,
                attackRange: 6,
                size: 2,
                radius: 3,
                aggro: true,
                lastAttackTime: 0
            });
        }
        setEnemies(prev => [...prev, ...newMinions]);
        createParticles(centerPos, 0x00ff00, 40, 20, 3, 'summon');
    };

    return (
        <group ref={mesh} position={enemy.position} scale={[0.5, 0.5, 0.5]}>
            <BossModel />
            <EnemyHealthBar enemy={enemy} />
        </group>
    );
}

export default Boss;