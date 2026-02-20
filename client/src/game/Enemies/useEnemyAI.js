// src/game/Enemies/useEnemyAI.js (深度性能優化版)
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

const _tempVec = new THREE.Vector3();
const _dirVec = new THREE.Vector3();
const _stepVec = new THREE.Vector3();
const _newPosVec = new THREE.Vector3();
const _particleVec = new THREE.Vector3();

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
    const damageMultiplier = currentLevel === 1 ? 0.3 : 0.5;
    
    const adjustedAttackCooldown = enemy.attackCooldown ? enemy.attackCooldown / enemyAggression : 1 / enemyAggression;
    const adjustedMoveSpeed = enemy.moveSpeed * enemyAggression;
    const adjustedDetectRange = (enemy.detectRange || 30) * (0.5 + enemyAggression * 0.5);
    
    const frameCount = useRef(0);

    useFrame((state, delta) => {
        frameCount.current++;
        
        if (frameCount.current % 2 !== 0) return;
        
        if (!meshRef.current || enemy.hp <= 0) return;

        const distToPlayer = enemy.position.distanceTo(playerPos);

        if (distToPlayer > VIEW_RADIUS) return;

        if (distToPlayer <= adjustedDetectRange) {
            enemy.aggro = true;
        }

        if (!enemy.aggro) return;

        if (frameCount.current % 10 === 0 && Math.random() < 0.3) {
            _particleVec.copy(enemy.position).add(new THREE.Vector3(0, enemy.size / 2, 0));
            createParticles(_particleVec, 0xff4444, 5, 4, 0.8, 'aggro_trail');
        }

        const pathRecalcInterval = 2.0 / enemyAggression;
        if (state.clock.getElapsedTime() - (enemy.pathRecalcTimer || 0) > pathRecalcInterval) {
            if (Math.random() < 0.3) {
                enemy.path = findPath(enemy.position, playerPos);
                enemy.pathIndex = 0;
                enemy.pathRecalcTimer = state.clock.getElapsedTime();
            }
        }

        if (enemy.path.length > 0 && enemy.pathIndex < enemy.path.length) {
            const target = enemy.path[enemy.pathIndex];
            _dirVec.copy(target).sub(enemy.position).normalize();
            const speed = adjustedMoveSpeed * (enemy.type === 'berserker' && enemy.hp < enemy.maxHp * 0.3 ? 1.8 : 1);
            _stepVec.copy(_dirVec).multiplyScalar(speed * delta);

            _newPosVec.copy(enemy.position).add(_stepVec);

            const enemyRadius = enemy.radius || enemy.size || 3;

            let shouldMove = true;
            if (frameCount.current % 3 === 0) {
                const collideObstacle = checkEnemyObstacleCollision(_newPosVec, enemyRadius);
                const collideOtherEnemy = checkEnemyCollision(_newPosVec, enemyRadius, enemy.id);
                const collidePlayer = checkEnemyPlayerCollision(_newPosVec, enemyRadius);
                shouldMove = !collideObstacle && !collideOtherEnemy && !collidePlayer;
            }

            if (shouldMove) {
                enemy.position.copy(_newPosVec);
                meshRef.current.position.copy(_newPosVec);
                meshRef.current.lookAt(playerPos);
                updateEnemy(enemy.id, { position: _newPosVec.clone() });
            } else {
                enemy.pathRecalcTimer = 0;
            }

            if (_newPosVec.distanceTo(target) < 4) {
                enemy.pathIndex++;
            }
        }

        // 暫時禁用怪物攻擊以提升 FPS
        return;
        
        switch (enemy.type) {
            case 'melee':
            case 'tank':
            case 'berserker':
                if (distToPlayer <= enemy.attackRange) {
                    if (state.clock.getElapsedTime() - enemy.lastAttackTime >= adjustedAttackCooldown) {
                        const damage = enemy.attackPower * (enemy.type === 'berserker' ? 1.5 : 1);
                        updatePlayer({ playerHP: playerHP - damage });
                        enemy.lastAttackTime = state.clock.getElapsedTime();

                        _particleVec.copy(playerPos).add(new THREE.Vector3(0, 4, 0));
                        createParticles(_particleVec, 0xff0000, 40, 15, 1.5, 'player_hit');

                        if (meshRef.current) {
                            meshRef.current.traverse((child) => {
                                if (child.isMesh && child.material?.emissive) {
                                    child.material.emissive.set(0xff0000);
                                }
                            });
                            setTimeout(() => {
                                if (meshRef.current) {
                                    meshRef.current.traverse((child) => {
                                        if (child.isMesh && child.material?.emissive) {
                                            child.material.emissive.set(0x000000);
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
                    _particleVec.copy(enemy.position).add(new THREE.Vector3(0, enemy.size, 0));
                    createProjectile(projType, _particleVec.clone(), playerPos);
                    enemy.lastAttackTime = state.clock.getElapsedTime();
                    createParticles(_particleVec, 0xaaaaff, 20, 10, 1, 'shoot_flash');
                }
                break;

            case 'summoner':
                if (state.clock.getElapsedTime() - (enemy.lastSummonTime || 0) >= 15) {
                    const count = 2 + Math.floor(currentLevel / 5);
                    const newMinions = [];
                    for (let i = 0; i < count; i++) {
                        const angle = (i / count) * Math.PI * 2;
                        _tempVec.set(Math.cos(angle) * 6, 3, Math.sin(angle) * 6).add(enemy.position);
                        newMinions.push({
                            id: Math.random(),
                            position: _tempVec.clone(),
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
                    for (let i = 0; i < enemies.length; i++) {
                        const other = enemies[i];
                        if (other.id !== enemy.id && other.position.distanceTo(enemy.position) <= 20 && other.hp < other.maxHp) {
                            updateEnemy(other.id, { hp: Math.min(other.maxHp, other.hp + 30) });
                            createParticles(other.position, 0x00ff88, 15, 10, 2, 'heal');
                            break;
                        }
                    }
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