// src/game/Player.js (修正版：被攻擊時血條即時變化 + 受擊閃紅反饋 + 平滑動畫)
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import useGameState from '../hooks/useGameState';
import { createParticles } from './Particles';
import PlayerHealthBar from '../components/PlayerHealthBar';
import { checkPlayerObstacleCollision } from '../utils/collision';

const ATTACK_RANGE = 8;
const ATTACK_SPEED = 1.5;
const BASE_ATTACK_POWER = 200;
const BASE_CRIT_CHANCE = 0.15; // 基礎暴擊率
const CRIT_MULTIPLIER = 2;
const MAP_HALF_SIZE = 450;

// 技能射程配置
const SKILL_RANGES = {
    fireball: 80,
    icebolt: 80,
    meteor: 100,
    chainlightning: 60,
    frozenorb: 70,
    blizzard: 50,
    lightning: 50
};

//const PLAYER_MODEL_URL = 'https://threejs.org/examples/models/gltf/Soldier.glb';

const PLAYER_MODEL_URL = 'models/Soldier.glb'; // 本地模型路徑，請確保 public/models/player.glb 存在

function PlayerModel({ isMoving, isAttacking }) {
    const { scene, animations, error } = useGLTF(PLAYER_MODEL_URL);
    const modelRef = useRef();
    const { actions } = useAnimations(animations, modelRef);

    useEffect(() => {
        if (scene) {
            scene.scale.set(2.5, 2.5, 2.5);
            scene.position.set(0, -1, 0);

            scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) child.material.color.set('#00aa88');
                }
            });
        }

        actions.Idle?.reset().play();
    }, [scene, actions]);

    useEffect(() => {
        if (!actions.Walk || !actions.Idle) return;

        if (isMoving) {
            actions.Walk.reset().fadeIn(0.2).play();
            actions.Idle.fadeOut(0.2);
        } else {
            actions.Idle.reset().fadeIn(0.2).play();
            actions.Walk.fadeOut(0.2);
        }
    }, [isMoving, actions]);

    useEffect(() => {
        if (!actions.Attack || !actions.Idle || !actions.Walk) return;

        if (isAttacking) {
            Object.values(actions).forEach(action => action?.fadeOut(0.1));
            actions.Attack.reset().setLoop(THREE.LoopOnce).clampWhenFinished = true;
            actions.Attack.fadeIn(0.1).play();
            actions.Attack.timeScale = 1.8;

            const onFinish = () => {
                actions.Attack.fadeOut(0.1);
                if (isMoving) actions.Walk.fadeIn(0.2).play();
                else actions.Idle.fadeIn(0.2).play();
            };
            actions.Attack.onFinished = onFinish;
        }
    }, [isAttacking, isMoving, actions]);

    if (error || !scene) {
        return (
            <mesh>
                <cylinderGeometry args={[2, 2, 6, 8]} />
                <meshStandardMaterial color="#00aa00" />
            </mesh>
        );
    }

    return <primitive ref={modelRef} object={scene} />;
}

function Player() {
    const groupRef = useRef();
    const lastAttackTime = useRef(0);
    const [isAttacking, setIsAttacking] = useState(false);
    const previousHP = useRef(100); // 記錄上一次 HP，用來偵測受擊

    const {
        playerPos,
        playerRotation,
        targetPosition,
        targetEnemy,
        setPlayerPos,
        setPlayerRotation,
        setTargetPosition,
        setTargetEnemy,
        updateEnemy,
        playerAttackPower = BASE_ATTACK_POWER,
        playerCritChance = BASE_CRIT_CHANCE,
        playerLevel = 1,
        playerHP
    } = useGameState();

    // 受擊閃紅效果
    useEffect(() => {
        if (groupRef.current && playerHP < previousHP.current) {
            groupRef.current.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.emissive.set(0xff4444);
                }
            });

            // 玩家受擊粒子
            createParticles(playerPos.clone().add(new THREE.Vector3(0, 4, 0)), 0xff0000, 30, 15, 1.5, 'player_hit');

            setTimeout(() => {
                if (groupRef.current) {
                    groupRef.current.traverse((child) => {
                        if (child.isMesh && child.material) {
                            child.material.emissive.set(0x000000);
                        }
                    });
                }
            }, 300);
        }
        previousHP.current = playerHP;
    }, [playerHP]);

    // 計算與目標敵人的距離
    const distanceToEnemy = targetEnemy ? playerPos.distanceTo(targetEnemy.position) : null;
    
    // 是否在近戰攻擊範圍內
    const isInMeleeRange = distanceToEnemy !== null && distanceToEnemy <= ATTACK_RANGE;
    
    // 是否在技能射程內（任意遠程技能）
    const isInSkillRange = distanceToEnemy !== null && 
        Object.values(SKILL_RANGES).some(range => distanceToEnemy <= range);
    
    // 移動目標邏輯：
    // - 如果有 targetEnemy 且不在近戰範圍也不在技能射程內，走向敵人
    // - 如果有 targetEnemy 但在技能射程內（不在近戰範圍），不移動
    // - 如果只有 targetPosition，走向該位置
    let moveTarget = null;
    if (targetEnemy) {
        // 目標是敵人：如果在近戰範圍或技能射程外，才需要移動
        if (!isInMeleeRange && !isInSkillRange) {
            moveTarget = targetEnemy.position;
        }
        // 如果在技能射程內但不在近戰範圍，不移動（可以原地施法）
    } else if (targetPosition) {
        moveTarget = targetPosition;
    }
    
    const isMoving = moveTarget && moveTarget.clone().sub(playerPos).length() > 0.5;

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        groupRef.current.position.copy(playerPos);
        groupRef.current.rotation.y = playerRotation?.y ?? 0;

        const now = state.clock.getElapsedTime();

        if (moveTarget) {
            let direction = moveTarget.clone().sub(playerPos);
            direction.y = 0;
            const distance = direction.length();

            if (distance > (targetEnemy ? ATTACK_RANGE : 0.5)) {
                direction.normalize();
                const step = direction.multiplyScalar(20 * delta);
                let newPos = playerPos.clone().add(step);

                newPos.x = Math.max(-MAP_HALF_SIZE, Math.min(MAP_HALF_SIZE, newPos.x));
                newPos.z = Math.max(-MAP_HALF_SIZE, Math.min(MAP_HALF_SIZE, newPos.z));

                // 碰撞檢查：障礙物
                if (!checkPlayerObstacleCollision(newPos)) {
                    setPlayerPos(newPos);
                    const rotationY = Math.atan2(-direction.x, -direction.z);
                    setPlayerRotation(new THREE.Euler(0, rotationY, 0));
                }
            } else {
                if (targetEnemy) {
                    if (!targetEnemy.id || targetEnemy.hp <= 0) {
                        setTargetEnemy(null);
                        return;
                    }

                    const dir = targetEnemy.position.clone().sub(playerPos);
                    dir.y = 0;
                    dir.normalize();
                    const rotationY = Math.atan2(-dir.x, -dir.z);
                    setPlayerRotation(new THREE.Euler(0, rotationY, 0));

                    if (now - lastAttackTime.current >= 1 / ATTACK_SPEED) {
                        lastAttackTime.current = now;
                        setIsAttacking(true);

                        // 計算命中率 (基礎 85% + 玩家等級*0.5% - 敵人閃避)
                        const hitChance = 0.85 + playerLevel * 0.005 - (targetEnemy.dodge || 0);
                        const isHit = Math.random() < hitChance;
                        
                        // 暴擊判定 (在命中時)
                        const isCrit = isHit && Math.random() < playerCritChance;
                        
                        if (!isHit) {
                            // 攻擊MISS
                            const hitPos = targetEnemy.position.clone().add(new THREE.Vector3(0, targetEnemy.size / 2, 0));
                            useGameState.getState().addFloatingNumber(hitPos, 0, 'miss');
                            createParticles(hitPos, 0x888888, 10, 8, 0.8, 'miss');
                        } else {
                            const damage = isCrit ? playerAttackPower * CRIT_MULTIPLIER : playerAttackPower;

                            updateEnemy(targetEnemy.id, { hp: Math.max(0, targetEnemy.hp - damage) });

                            const hitPos = targetEnemy.position.clone().add(new THREE.Vector3(0, targetEnemy.size / 2, 0));
                            createParticles(hitPos, 0xffffff, 20, 15, 1.2, 'melee_hit');
                            createParticles(hitPos, 0xff0000, 15, 10, 1, 'hit_flash');

                            if (isCrit) {
                                createParticles(hitPos, 0xffff00, 50, 40, 3, 'crit_explosion');
                                createParticles(hitPos, 0xffaa00, 30, 30, 2.5, 'crit_sparks');
                                createParticles(hitPos, 0xffffff, 20, 20, 2, 'crit_flash');
                            }

                            useGameState.getState().addFloatingNumber(hitPos, damage, isCrit ? 'crit' : 'damage');
                        }

                        setTimeout(() => setIsAttacking(false), 600);
                    }
                } else {
                    setTargetPosition(null);
                }
            }
        }
        
        // 如果在技能射程內選中了敵人但不移動，仍然面向敵人
        if (targetEnemy && !moveTarget && isInSkillRange) {
            if (!targetEnemy.id || targetEnemy.hp <= 0) {
                setTargetEnemy(null);
            } else {
                const dir = targetEnemy.position.clone().sub(playerPos);
                dir.y = 0;
                dir.normalize();
                const rotationY = Math.atan2(-dir.x, -dir.z);
                setPlayerRotation(new THREE.Euler(0, rotationY, 0));
            }
        }
    });

    return (
        <group ref={groupRef} scale={[2.5, 2.5, 2.5]}>
            <PlayerModel isMoving={isMoving} isAttacking={isAttacking} />
            <PlayerHealthBar />
        </group>
    );
}

export default Player;