// src/game/Enemies/useEnemyAI.js (修正 addY 錯誤 + 優化版)
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import useGameState from '../../hooks/useGameState';
import { findPath } from '../../utils/pathfinding';
import { createProjectile } from '../Projectiles';
import { createParticles } from '../Particles';
import {
    checkEnemyObstacleCollision,
    checkEnemyCollision,
    checkEnemyPlayerCollision
} from '../../utils/collision';

const VIEW_RADIUS = 150;

function useEnemyAI(enemy, meshRef) {
    const {
        playerPos,
        obstacles,
        playerHP,
        updatePlayer,
        updateEnemy,
        enemies,
        setEnemies,
        currentLevel,
        enemyAggression
    } = useGameState();

    const difficulty = 1 + (currentLevel - 1) * 0.3;
    
    // 整體傷害減弱
    const damageMultiplier = currentLevel === 1 ? 0.3 : 0.5; // 第一關 30%，之後 50%
    
    // 根據敵人攻擊意欲調整參數
    const adjustedAttackCooldown = enemy.attackCooldown ? enemy.attackCooldown / enemyAggression : 1 / enemyAggression;
    const adjustedMoveSpeed = enemy.moveSpeed * enemyAggression;
    const adjustedDetectRange = (enemy.detectRange || 30) * (0.5 + enemyAggression * 0.5);
    
    // 幀計數器用於限制更新頻率
    const frameCount = useRef(0);

    useFrame((state, delta) => {
        frameCount.current++;
        
        // 幀率限制：每2幀運行一次AI邏輯（30fps而非60fps）
        if (frameCount.current % 2 !== 0) return;
        
        if (!meshRef.current || enemy.hp <= 0) return;

        const distToPlayer = enemy.position.distanceTo(playerPos);

        if (distToPlayer > VIEW_RADIUS) return;

        if (distToPlayer <= adjustedDetectRange) {
            enemy.aggro = true;
        }

        if (!enemy.aggro) return;

        if (Math.random() < 0.1) {
            createParticles(
                enemy.position.clone().add(new THREE.Vector3(0, enemy.size / 2, 0)),
                0xff4444,
                5,
                4,
                0.8,
                'aggro_trail'
            );
        }

        // 路徑重算頻率（增加到2秒以提升性能）
        const pathRecalcInterval = 2.0 / enemyAggression;
        if (state.clock.getElapsedTime() - (enemy.pathRecalcTimer || 0) > pathRecalcInterval) {
            // 限制同時計算路徑的敵人數量（避免卡頓）
            if (Math.random() < 0.3) { // 只有30%的敵人同時計算路徑
                enemy.path = findPath(enemy.position, playerPos);
                enemy.pathIndex = 0;
                enemy.pathRecalcTimer = state.clock.getElapsedTime();
            }
        }

            if (enemy.path.length > 0 && enemy.pathIndex < enemy.path.length) {
                const target = enemy.path[enemy.pathIndex];
                const dir = target.clone().sub(enemy.position).normalize();
                const speed = adjustedMoveSpeed * (enemy.type === 'berserker' && enemy.hp < enemy.maxHp * 0.3 ? 1.8 : 1);
                const step = dir.multiplyScalar(speed * delta);

            const newPos = enemy.position.clone().add(step);
            /*
            const colliding = obstacles.some(obs =>
                newPos.distanceTo(obs.position) < enemy.radius + obs.radius + 1
            );

            if (!colliding) {
                enemy.position.copy(newPos);
                meshRef.current.position.copy(newPos);
                meshRef.current.lookAt(playerPos);
                updateEnemy(enemy.id, { position: newPos });
            }
            */
            

            if (enemy.path.length > 0 && enemy.pathIndex < enemy.path.length) {
                const target = enemy.path[enemy.pathIndex];
                const dir = target.clone().sub(enemy.position).normalize();
                const speed = enemy.moveSpeed * (enemy.type === 'berserker' && enemy.hp < enemy.maxHp * 0.3 ? 1.8 : 1);
                const step = dir.multiplyScalar(speed * delta);

                let newPos = enemy.position.clone().add(step);

                const enemyRadius = enemy.radius || enemy.size || 3;

                // 多層碰撞檢查（每3幀運行一次以提升性能）
                let shouldMove = true;
                if (frameCount.current % 3 === 0) {
                    const collideObstacle = checkEnemyObstacleCollision(newPos, enemyRadius);
                    const collideOtherEnemy = checkEnemyCollision(newPos, enemyRadius, enemy.id);
                    const collidePlayer = checkEnemyPlayerCollision(newPos, enemyRadius);
                    shouldMove = !collideObstacle && !collideOtherEnemy && !collidePlayer;
                }

                if (shouldMove) {
                    enemy.position.copy(newPos);
                    meshRef.current.position.copy(newPos);
                    meshRef.current.lookAt(playerPos);
                    updateEnemy(enemy.id, { position: newPos });
                } else {
                    // 碰撞：強制重算路徑避開
                    enemy.pathRecalcTimer = 0;
                }
            }

            if (newPos.distanceTo(target) < 4) {
                enemy.pathIndex++;
            }
        }

        // 專屬 AI 行為
        switch (enemy.type) {
            case 'melee':
            case 'tank':
            case 'berserker':
                if (distToPlayer <= enemy.attackRange) {
                    if (state.clock.getElapsedTime() - enemy.lastAttackTime >= adjustedAttackCooldown) {
                        const damage = enemy.attackPower * (enemy.type === 'berserker' ? 1.5 : 1);
                        updatePlayer({ playerHP: playerHP - damage });
                        enemy.lastAttackTime = state.clock.getElapsedTime();

                        createParticles(
                            playerPos.clone().add(new THREE.Vector3(0, 4, 0)),
                            0xff0000,
                            80,
                            15,
                            1.5,
                            'player_hit'
                        );

                        // 安全閃紅（支援 GLTF 多材質）
                        if (meshRef.current) {
                            meshRef.current.traverse((child) => {
                                if (child.isMesh && child.material) {
                                    child.material.emissive?.set(0xff0000);
                                }
                            });
                            setTimeout(() => {
                                if (meshRef.current) {
                                    meshRef.current.traverse((child) => {
                                        if (child.isMesh && child.material) {
                                            child.material.emissive?.set(0x000000);
                                        }
                                    });
                                }
                            }, 200);
                        }
                    }
                }
                break;

            case 'ranged':
            case 'sniper':
            case 'mage':
                if (distToPlayer <= enemy.attackRange && state.clock.getElapsedTime() - enemy.lastAttackTime >= (2 / enemyAggression)) {
                    const projType = enemy.type === 'mage' ? 'mage_fireball' : enemy.type === 'sniper' ? 'sniper_bullet' : 'enemy_arrow';
                    createProjectile(projType, enemy.position.clone().add(new THREE.Vector3(0, enemy.size, 0)), playerPos);
                    enemy.lastAttackTime = state.clock.getElapsedTime();

                    createParticles(
                        enemy.position.clone().add(new THREE.Vector3(0, enemy.size, 0)),
                        0xaaaaff,
                        40,
                        10,
                        1,
                        'shoot_flash'
                    );
                }
                break;

            case 'summoner':
                if (state.clock.getElapsedTime() - (enemy.lastSummonTime || 0) >= 15) {
                    const count = 2 + Math.floor(currentLevel / 5);
                    const newMinions = [];
                    for (let i = 0; i < count; i++) {
                        const angle = (i / count) * Math.PI * 2;
                        const pos = enemy.position.clone().add(new THREE.Vector3(Math.cos(angle) * 6, 3, Math.sin(angle) * 6));
                        newMinions.push({
                            id: Math.random(),
                            position: pos,
                            type: 'melee',
                            hp: 40 * difficulty,
                            maxHp: 40 * difficulty,
                            attackPower: 8,
                            moveSpeed: 12,
                            attackRange: 6,
                            size: 2,
                            radius: 3,
                            aggro: true,
                            lastAttackTime: 0
                        });
                    }
                    setEnemies(prev => [...prev, ...newMinions]);
                    createParticles(enemy.position, 0x00aaaa, 40, 20, 3, 'summon');
                    enemy.lastSummonTime = state.clock.getElapsedTime();
                }
                break;

            case 'healer':
                if (state.clock.getElapsedTime() - enemy.lastHealTime >= 8) {
                    enemies.forEach(other => {
                        if (other.id !== enemy.id && other.position.distanceTo(enemy.position) <= 20 && other.hp < other.maxHp) {
                            updateEnemy(other.id, { hp: Math.min(other.maxHp, other.hp + 30) });
                            createParticles(other.position, 0x00ff88, 15, 10, 2, 'heal');
                        }
                    });
                    enemy.lastHealTime = state.clock.getElapsedTime();
                }
                break;

            case 'shadow':
                if (distToPlayer <= enemy.attackRange * 2) {
                    enemy.moveSpeed = 25;
                } else {
                    enemy.moveSpeed = enemy.baseSpeed || 20;
                }
                break;

            case 'elemental':
                if (distToPlayer <= 15 && state.clock.getElapsedTime() - enemy.lastAoE >= 5) {
                    updatePlayer({ playerHP: playerHP - 25 });
                    createParticles(enemy.position, 0x00ffff, 50, 30, 3, 'elemental_burst');
                    enemy.lastAoE = state.clock.getElapsedTime();
                }
                break;

            default:
                if (distToPlayer <= enemy.attackRange && state.clock.getElapsedTime() - enemy.lastAttackTime >= adjustedAttackCooldown) {
                    updatePlayer({ playerHP: playerHP - enemy.attackPower });
                    enemy.lastAttackTime = state.clock.getElapsedTime();
                }
        }
    });
}

export default useEnemyAI;