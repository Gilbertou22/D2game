// src/game/SkillsManager.jsx
import { useFrame } from '@react-three/fiber';
import { useEffect, useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import useGameState from '../hooks/useGameState';
import skillConfigManager from '../utils/SkillConfigManager';
import { createProjectile } from './Projectiles';
import { createParticles } from './Particles';
import { 
    LightningEffect, FrozenOrbEffect, BlizzardEffect, MeteorEffect, IceNovaEffect, 
    FireballEffect, FireExplosion, PlagueSpikeEffect, PoisonCloudEffect, SerpentSweepEffect, 
    WindBladesEffect, TornadoEffect, TornadoRingEffect,
    SlashEffect, ChargeEffect, WhirlwindEffect, ShieldBashEffect, BattlecryEffect, ExecuteEffect,
    QuickshotEffect, MultishotEffect, ArrowrainEffect, EvasionEffect, SnipeEffect,
    WrathEffect, RejuvenationEffect, ThornsEffect, SunfireEffect, BearformEffect, TranquilityEffect
} from './effects';
import { createSkillEffect, createHitEffect, createCastEffect } from './effects/SkillEffectFactory';
import { initDeathEffectManager, updateDeathEffects } from '../utils/gameUtils';
import * as THREE from 'three';

function SkillsManager() {
    const { scene } = useThree();

    const {
        skills, playerMana, playerPos, playerRotation, targetEnemy, enemies,
        playerHP, playerMaxHP, playerAttackPower, playerCritChance,
        castSkill, updateEnemy, setTargetEnemy,
        updatePlayer, updateSkillsCooldown, addFloatingNumber,
        skillKeybinds, talentUnlocks, classSelected
    } = useGameState();

    const effectsRef = useRef([]);
    const dotRef = useRef({});
    const handleSkillCastRef = useRef(null);
    const handleDynamicSkillRef = useRef(null);

    // 初始化死亡效果管理器
    useEffect(() => {
        initDeathEffectManager(scene);
    }, [scene]);

    // 動態技能處理函數
    const handleDynamicSkillDirect = useCallback((skillKey, config, result) => {
        console.log('[SkillsManager] handleDynamicSkillDirect called for:', skillKey, 'type:', config.type);
        
        let currentTarget = targetEnemy;
        if (!currentTarget || currentTarget.hp <= 0) {
            let closest = null, minDist = Infinity;
            enemies.forEach(e => {
                if (e.hp > 0) {
                    const d = e.position.distanceTo(playerPos);
                    if (d < minDist && d <= 80) { minDist = d; closest = e; }
                }
            });
            if (closest) { currentTarget = closest; setTargetEnemy(closest); }
        }

        const playerPosY = playerPos.clone().add(new THREE.Vector3(0, 4, 0));
        const forwardDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotation?.y || 0);
        
        let targetPos;
        if (config.type === 'melee' || config.type === 'buff') {
            targetPos = playerPos.clone();
        } else if (config.type === 'movement') {
            if (currentTarget) {
                targetPos = currentTarget.position.clone();
            } else {
                targetPos = playerPos.clone().add(forwardDir.clone().multiplyScalar(config.range || 20));
            }
        } else {
            targetPos = currentTarget 
                ? currentTarget.position.clone().add(new THREE.Vector3(0, (currentTarget.size || 2) / 2, 0))
                : playerPos.clone().add(forwardDir.clone().multiplyScalar(config.range || 20));
        }

        const callbacks = {
            onHit: (hitPos, damage) => {
                if (currentTarget) {
                    const isCrit = Math.random() < playerCritChance;
                    const finalDamage = isCrit ? Math.floor(damage * 1.8) : damage;
                    
                    updateEnemy(currentTarget.id, { hp: Math.max(0, currentTarget.hp - finalDamage) });
                    
                    const targetCenter = currentTarget.position.clone().add(new THREE.Vector3(0, (currentTarget.size || 2) / 2, 0));
                    addFloatingNumber(targetCenter, finalDamage, isCrit ? 'crit' : 'damage');
                    
                    createHitEffect(targetCenter, config, isCrit);
                    
                    if (currentTarget.hp - finalDamage <= 0) {
                        createParticles(
                            targetCenter,
                            0xffff00,
                            60,
                            20,
                            2.5,
                            'death_explosion'
                        );
                    }
                }
                if (config.explosion?.enabled) {
                    const explosion = new FireExplosion(hitPos, 'fireball');
                    scene.add(explosion.getLights()[0]);
                    effectsRef.current.push({
                        group: { add: () => {}, remove: () => {} },
                        update: (delta) => explosion.update(delta),
                        dispose: () => explosion.dispose(),
                        getParticles: () => explosion.getParticles(),
                        lights: explosion.getLights()
                    });
                }
            },
            onDamage: (pos, damage, radius) => {
                if (config.type === 'lightning') {
                    if (currentTarget) {
                        const isCrit = Math.random() < playerCritChance;
                        const finalDamage = isCrit ? Math.floor(damage * 1.8) : damage;
                        
                        updateEnemy(currentTarget.id, { hp: Math.max(0, currentTarget.hp - finalDamage) });
                        
                        const targetCenter = currentTarget.position.clone().add(new THREE.Vector3(0, (currentTarget.size || 2) / 2, 0));
                        addFloatingNumber(targetCenter, finalDamage, isCrit ? 'crit' : 'damage');
                        
                        createHitEffect(targetCenter, config, isCrit);
                        
                        if (currentTarget.hp - finalDamage <= 0) {
                            createParticles(targetCenter, 0xffff00, 60, 20, 2.5, 'death_explosion');
                        }
                    }
                } else if (config.type === 'melee') {
                    const playerForward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotation?.y || 0);
                    const coneAngle = config.coneAngle || 1.05;
                    const range = radius || config.range || 8;
                    
                    enemies.forEach(enemy => {
                        const toEnemy = enemy.position.clone().sub(playerPos);
                        toEnemy.y = 0;
                        const dist = toEnemy.length();
                        
                        if (dist < range && enemy.hp > 0) {
                            const angle = Math.acos(Math.min(1, Math.max(-1, playerForward.dot(toEnemy.normalize()))));
                            
                            if (config.subType === 'aoe' || angle < coneAngle) {
                                const isCrit = Math.random() < playerCritChance;
                                const finalDamage = isCrit ? Math.floor(damage * 1.8) : damage;
                                
                                updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - finalDamage) });
                                addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, (enemy.size || 2) / 2, 0)), finalDamage, isCrit ? 'crit' : 'damage');
                                
                                createHitEffect(enemy.position.clone().add(new THREE.Vector3(0, (enemy.size || 2) / 2, 0)), config, isCrit);
                            }
                        }
                    });
                } else if (config.type === 'movement') {
                    enemies.forEach(enemy => {
                        const dist = enemy.position.distanceTo(pos);
                        if (dist < radius && enemy.hp > 0) {
                            const isCrit = Math.random() < playerCritChance;
                            const finalDamage = isCrit ? Math.floor(damage * 1.8) : damage;
                            
                            updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - finalDamage) });
                            addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, (enemy.size || 2) / 2, 0)), finalDamage, isCrit ? 'crit' : 'damage');
                            
                            createHitEffect(enemy.position.clone().add(new THREE.Vector3(0, (enemy.size || 2) / 2, 0)), config, isCrit);
                        }
                    });
                } else {
                    enemies.forEach(enemy => {
                        const dist = enemy.position.distanceTo(pos);
                        if (dist < radius && enemy.hp > 0) {
                            const isCrit = Math.random() < playerCritChance;
                            const finalDamage = Math.floor(damage * (1 - dist / radius * 0.5));
                            const actualDamage = isCrit ? Math.floor(finalDamage * 1.8) : finalDamage;
                            
                            updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - actualDamage) });
                            addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, (enemy.size || 2) / 2, 0)), actualDamage, isCrit ? 'crit' : 'damage');
                            
                            createHitEffect(enemy.position.clone().add(new THREE.Vector3(0, (enemy.size || 2) / 2, 0)), config, isCrit);
                        }
                    });
                }
            },
            onHeal: (amount) => {
                updatePlayer({ playerHP: Math.min(playerMaxHP, playerHP + amount) });
                addFloatingNumber(playerPos.clone().add(new THREE.Vector3(0, 6, 0)), amount, 'heal');
                createParticles(playerPos.clone().add(new THREE.Vector3(0, 4, 0)), 0x22c55e, 25, 8, 2, 'heal_wave');
            },
            onBuff: (buffConfig) => {
                const buffName = buffConfig.name || '增益效果';
                let buffText = buffName;
                
                if (buffConfig.attackBoost) {
                    const boostPercent = Math.floor(buffConfig.attackBoost * 100);
                    buffText += ` +${boostPercent}%攻擊`;
                }
                if (buffConfig.hpBoost) {
                    buffText += ` +${buffConfig.hpBoost}生命`;
                    updatePlayer({ playerMaxHP: playerMaxHP + buffConfig.hpBoost, playerHP: playerHP + buffConfig.hpBoost });
                }
                if (buffConfig.reflectDamage) {
                    buffText += ` 反傷${buffConfig.reflectDamage}`;
                }
                
                addFloatingNumber(playerPos.clone().add(new THREE.Vector3(0, 8, 0)), buffText, 'buff');
            }
        };

        const colors = config.colors || {};
        const glowColor = colors.glow || '#ff4400';
        const glowColorHex = new THREE.Color(glowColor).getHex();
        
        const castEffect = createCastEffect(playerPosY, glowColorHex);
        scene.add(castEffect.group);
        effectsRef.current.push(castEffect);

        const effect = createSkillEffect(config, playerPosY, targetPos, callbacks);
        if (effect) {
            scene.add(effect.group);
            effectsRef.current.push(effect);
        }
    }, [playerPos, playerRotation, targetEnemy, enemies, scene, updateEnemy, updatePlayer, addFloatingNumber, playerHP, playerMaxHP, playerCritChance]);

    handleDynamicSkillRef.current = handleDynamicSkillDirect;

    const handleSkillCast = useCallback((skillKey) => {
        if (!classSelected) return;
        
        // 強制使用新的動態技能效果系統
        const skillConfig = skillConfigManager.getSkill(skillKey);
        console.log('[SkillsManager] Using dynamic skill system for:', skillKey, 'config:', skillConfig);
        
        if (skillConfig && skillConfig.type && handleDynamicSkillRef.current) {
            const result = castSkill(skillKey);
            if (!result || !result.success) return;
            handleDynamicSkillRef.current(skillKey, skillConfig, result);
            return;
        }
        
        // 如果沒有動態配置，使用舊的硬編碼系統
        let currentTarget = targetEnemy;
        if (!currentTarget || currentTarget.hp <= 0) {
            let closest = null, minDist = Infinity;
            enemies.forEach(e => {
                if (e.hp > 0) {
                    const d = e.position.distanceTo(playerPos);
                    if (d < minDist && d <= 80) { minDist = d; closest = e; }
                }
            });
            if (closest) { currentTarget = closest; setTargetEnemy(closest); }
        }

        const result = castSkill(skillKey);
        if (!result || !result.success) return;

        const playerPosY = playerPos.clone().add(new THREE.Vector3(0, 4, 0));
        const forwardDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotation?.y || 0);
        const defaultTargetPos = playerPos.clone().add(forwardDir.multiplyScalar(20));
        
        switch (skillKey) {
            case 'fireball': {
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                
                const fireball = new FireballEffect(playerPosY, targetPos, result.damage);
                scene.add(fireball.group);
                effectsRef.current.push(fireball);
                
                const distance = playerPosY.distanceTo(targetPos);
                const travelTime = distance / 18;
                
                setTimeout(() => {
                    // 創建爆炸
                    const explosion = new FireExplosion(targetPos, 'fireball');
                    scene.add(explosion.getLights()[0]);
                    effectsRef.current.push({
                        group: { add: () => {}, remove: () => {} },
                        update: (delta) => explosion.update(delta),
                        dispose: () => explosion.dispose(),
                        getParticles: () => explosion.getParticles(),
                        lights: explosion.getLights()
                    });
                    
                    // 對敵人造成傷害
                    if (currentTarget) {
                        updateEnemy(currentTarget.id, { hp: Math.max(0, currentTarget.hp - result.damage) });
                        addFloatingNumber(targetPos, result.damage, 'damage');
                    }
                }, travelTime * 1000);
                
                break;
            }

            case 'icebolt': {
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                
                // 創建冰箭特效
                const direction = targetPos.clone().sub(playerPosY).normalize();
                const distance = playerPosY.distanceTo(targetPos);
                
                // 創建冰箭軌跡效果
                for (let i = 0; i < 5; i++) {
                    const offset = direction.clone().multiplyScalar(i * (distance / 5));
                    const pos = playerPosY.clone().add(offset);
                    setTimeout(() => {
                        createParticles(pos, 0x88ddff, 3, 1, 0.3, 'ice_shard');
                    }, i * 30);
                }
                
                createProjectile('icebolt', playerPosY, targetPos, result.damage);
                
                // 命中時的冰特效
                if (currentTarget) {
                    setTimeout(() => {
                        createParticles(targetPos, 0xaaddff, 8, 5, 0.5, 'ice_hit');
                    }, distance / 15 * 1000);
                }
                break;
            }

            case 'frozenorb': {
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                const dir = targetPos.clone().sub(playerPosY).normalize();
                const effect = new FrozenOrbEffect(playerPosY, dir, result.damage);
                scene.add(effect.group);
                effectsRef.current.push(effect);
                break;
            }

            case 'blizzard': {
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                targetPos.y = playerPos.y;
                const effect = new BlizzardEffect(targetPos);
                scene.add(effect.group);
                effectsRef.current.push(effect);
                break;
            }

            case 'lightning': {
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                const lightning = new LightningEffect(playerPosY, targetPos);
                scene.add(lightning.group);
                effectsRef.current.push(lightning);
                
                if (currentTarget) {
                    updateEnemy(currentTarget.id, { hp: Math.max(0, currentTarget.hp - (result.damage || 200)) });
                    addFloatingNumber(targetPos, result.damage || 200, 'damage');
                }
                break;
            }

            case 'chainlightning': {
                const targetPos = currentTarget ? currentTarget.position.clone() : playerPosY.clone().add(forwardDir);

                const mainBolt = new LightningEffect(playerPosY, targetPos);
                scene.add(mainBolt.group);
                effectsRef.current.push(mainBolt);

                if (currentTarget) {
                    updateEnemy(currentTarget.id, { hp: Math.max(0, currentTarget.hp - (result.damage || 120)) });
                    addFloatingNumber(targetPos, result.damage || 120, 'damage');
                }

                let chainTargets = enemies.filter(e => e.id !== currentTarget?.id && e.position.distanceTo(targetPos) < 15).slice(0, 3);
                let lastPos = targetPos;
                let chainDmg = result.damage || 120;

                chainTargets.forEach(t => {
                    chainDmg = Math.floor(chainDmg * 0.8);
                    const chainEnd = t.position.clone().add(new THREE.Vector3(0, 2, 0));
                    const chainBolt = new LightningEffect(lastPos, chainEnd);
                    scene.add(chainBolt.group);
                    effectsRef.current.push(chainBolt);

                    updateEnemy(t.id, { hp: Math.max(0, t.hp - chainDmg) });
                    addFloatingNumber(chainEnd, chainDmg, 'damage');
                    lastPos = chainEnd;
                });
                break;
            }

            case 'nova': {
                // 使用 IceNovaEffect 特效
                const iceNova = new IceNovaEffect(playerPos, result.damage || 300);
                scene.add(iceNova.group);
                effectsRef.current.push(iceNova);
                
                // 延遲一點時間後造成傷害，讓特效先展開
                setTimeout(() => {
                    const radius = result.radius || 20;
                    const damage = result.damage || 300;
                    
                    enemies.forEach(enemy => {
                        if (enemy.hp > 0 && enemy.position.distanceTo(playerPos) <= radius) {
                            const finalDamage = Math.floor(damage * (0.9 + Math.random() * 0.2));
                            updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - finalDamage) });
                            addFloatingNumber(
                                enemy.position.clone().add(new THREE.Vector3(0, enemy.size / 2, 0)),
                                finalDamage,
                                'damage'
                            );
                        }
                    });
                }, 300);
                break;
            }

            case 'heal': 
            case 'heal_spell': {
                const healAmount = result.healAmount || 100;
                updatePlayer({ playerHP: Math.min(playerMaxHP, playerHP + healAmount) });
                createParticles(playerPosY, 0x00ff88, 15, 5, 1.5, 'heal_wave');
                addFloatingNumber(playerPos.clone().add(new THREE.Vector3(0, 6, 0)), healAmount, 'heal');
                break;
            }

            case 'teleport': {
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                const teleportPos = targetPos.clone().add(new THREE.Vector3(0, 3, 0));
                
                // 起始點特效
                createParticles(playerPosY, 0xaa00ff, 20, 10, 1.5, 'teleport_start');
                
                // 更新玩家位置
                updatePlayer({ playerPos: teleportPos });
                
                // 終點特效
                setTimeout(() => {
                    createParticles(teleportPos.clone().add(new THREE.Vector3(0, 4, 0)), 0xaa00ff, 20, 10, 1.5, 'teleport_end');
                }, 100);
                break;
            }

            case 'meteor': {
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                targetPos.y = 0;
                
                const meteorStartPos = targetPos.clone();
                meteorStartPos.y = 50;
                
                const meteorEffect = new MeteorEffect(meteorStartPos, targetPos, result.damage);
                scene.add(meteorEffect.group);
                effectsRef.current.push(meteorEffect);
                
                // 延遲處理傷害 (隕石落地時間約 1.7 秒)
                setTimeout(() => {
                    enemies.forEach(enemy => {
                        const dist = enemy.position.distanceTo(targetPos);
                        if (dist < result.radius && enemy.hp > 0) {
                            const damage = Math.floor(result.damage * (1 - dist / result.radius));
                            updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - damage) });
                            addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, 4, 0)), damage, 'damage');
                        }
                    });
                }, 1700);
                break;
            }
            
            // ==================== 毒系技能 ====================
            
            case 'plagueSpike': {
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                targetPos.y = 1;
                
                const skill = skills.plagueSpike;
                const plagueSpike = new PlagueSpikeEffect(
                    playerPosY, 
                    targetPos, 
                    skill.damage || 120,
                    skill.dotDamage || 30,
                    skill.dotDuration || 5
                );
                scene.add(plagueSpike.group);
                effectsRef.current.push(plagueSpike);
                
                // 延遲造成傷害
                const distance = playerPosY.distanceTo(targetPos);
                const travelTime = distance / 25;
                
                setTimeout(() => {
                    if (currentTarget) {
                        const directDamage = skill.damage || 120;
                        updateEnemy(currentTarget.id, { hp: Math.max(0, currentTarget.hp - directDamage) });
                        addFloatingNumber(targetPos, directDamage, 'damage');
                        createParticles(targetPos, 0x45ff45, 15, 8, 1, 'poison_hit');
                        
                        // 添加 DOT 效果
                        const enemyId = currentTarget.id;
                        dotRef.current[enemyId] = {
                            damage: skill.dotDamage || 30,
                            duration: skill.dotDuration || 5,
                            lastTick: 1,
                            source: 'plagueSpike'
                        };
                    }
                }, travelTime * 1000);
                break;
            }
            
            case 'poisonCloud': {
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                targetPos.y = 0;
                
                const skill = skills.poisonCloud;
                const poisonCloud = new PoisonCloudEffect(
                    targetPos,
                    skill.damage || 60,
                    skill.dotDamage || 25,
                    skill.dotDuration || 6,
                    skill.radius || 8,
                    skill.duration || 5
                );
                scene.add(poisonCloud.group);
                effectsRef.current.push(poisonCloud);
                
                // 持續範圍傷害
                const damageInterval = setInterval(() => {
                    if (poisonCloud.life <= 0) {
                        clearInterval(damageInterval);
                        return;
                    }
                    
                    enemies.forEach(enemy => {
                        const dist = enemy.position.distanceTo(targetPos);
                        if (dist < (skill.radius || 8) && enemy.hp > 0) {
                            const dmg = skill.dotDamage || 25;
                            updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - dmg) });
                            addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, 3, 0)), dmg, 'damage');
                            
                            // 添加/更新 DOT 效果
                            const enemyId = enemy.id;
                            if (!dotRef.current[enemyId]) {
                                dotRef.current[enemyId] = {
                                    damage: skill.dotDamage || 20,
                                    duration: skill.dotDuration || 4,
                                    lastTick: 1,
                                    source: 'poisonCloud'
                                };
                            } else {
                                // 刷新 DOT 時間
                                dotRef.current[enemyId].duration = Math.max(dotRef.current[enemyId].duration, skill.dotDuration || 4);
                                dotRef.current[enemyId].damage = Math.max(dotRef.current[enemyId].damage, skill.dotDamage || 20);
                            }
                        }
                    });
                }, 1000);
                
                // 清理定時器
                setTimeout(() => clearInterval(damageInterval), (skill.duration || 5) * 1000);
                break;
            }
            
            case 'serpentSweep': {
                const skill = skills.serpentSweep;
                const coneAngle = skill.coneAngle || Math.PI * 0.4;
                const range = skill.range || 15;
                
                // 扇形攻擊
                const serpentSweep = new SerpentSweepEffect(
                    playerPos.clone(),
                    forwardDir,
                    skill.damage || 180,
                    skill.dotDamage || 20,
                    skill.dotDuration || 4,
                    coneAngle,
                    range
                );
                scene.add(serpentSweep.group);
                effectsRef.current.push(serpentSweep);
                
                // 扇形範圍內敵人受傷
                const playerAngle = Math.atan2(forwardDir.x, -forwardDir.z);
                
                setTimeout(() => {
                    enemies.forEach(enemy => {
                        const toEnemy = enemy.position.clone().sub(playerPos);
                        const dist = toEnemy.length();
                        
                        if (dist <= range && enemy.hp > 0) {
                            const enemyAngle = Math.atan2(toEnemy.x, -toEnemy.z);
                            let angleDiff = enemyAngle - playerAngle;
                            
                            // 規範化角度差
                            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                            
                            if (Math.abs(angleDiff) <= coneAngle / 2) {
                                const dmg = skill.damage || 180;
                                updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - dmg) });
                                addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, 3, 0)), dmg, 'damage');
                                
                                // 添加 DOT 效果
                                const enemyId = enemy.id;
                                if (!dotRef.current[enemyId]) {
                                    dotRef.current[enemyId] = {
                                        damage: skill.dotDamage || 20,
                                        duration: skill.dotDuration || 4,
                                        lastTick: 1,
                                        source: 'serpentSweep'
                                    };
                                }
                            }
                        }
                    });
                    createParticles(playerPosY, 0x45ff45, 20, 10, 1, 'poison_aoe');
                }, 100);
                break;
            }
            
            // ==================== 風系技能 ====================
            
            case 'windBlades': {
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                targetPos.y = 1;
                
                const skill = skills.windBlades;
                const windBlades = new WindBladesEffect(
                    playerPosY,
                    targetPos,
                    skill.damage || 150,
                    skill.bladeCount || 3,
                    skill.spreadAngle || 0.15
                );
                scene.add(windBlades.group);
                effectsRef.current.push(windBlades);
                
                // 延遲造成傷害
                const distance = playerPosY.distanceTo(targetPos);
                const travelTime = distance / 30;
                
                setTimeout(() => {
                    enemies.forEach(enemy => {
                        const dist = enemy.position.distanceTo(targetPos);
                        if (dist < 3 && enemy.hp > 0) {
                            const dmg = skill.damage || 150;
                            updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - dmg) });
                            addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, 3, 0)), dmg, 'damage');
                        }
                    });
                    createParticles(targetPos, 0xaaccff, 15, 10, 1, 'wind_hit');
                }, travelTime * 1000);
                break;
            }
            
            case 'tornado': {
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                targetPos.y = 0;
                
                const skill = skills.tornado;
                const tornado = new TornadoEffect(
                    targetPos,
                    skill.damage || 80,
                    skill.dotDamage || 20,
                    skill.dotDuration || 8,
                    skill.radius || 6,
                    skill.duration || 8,
                    skill.moveSpeed || 4
                );
                scene.add(tornado.group);
                effectsRef.current.push(tornado);
                
                // 持續範圍傷害
                const damageInterval = setInterval(() => {
                    if (tornado.life <= 0) {
                        clearInterval(damageInterval);
                        return;
                    }
                    
                    const tornadoPos = tornado.group.position;
                    enemies.forEach(enemy => {
                        const dist = enemy.position.distanceTo(tornadoPos);
                        if (dist < (skill.radius || 6) && enemy.hp > 0) {
                            const dmg = skill.dotDamage || 20;
                            updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - dmg) });
                            addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, 3, 0)), dmg, 'damage');
                        }
                    });
                }, 1000);
                
                setTimeout(() => clearInterval(damageInterval), (skill.duration || 8) * 1000);
                break;
            }
            
            case 'tornadoRing': {
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                targetPos.y = 0;
                
                const skill = skills.tornadoRing;
                const tornadoRing = new TornadoRingEffect(
                    targetPos,
                    skill.damage || 100,
                    skill.tornadoCount || 6,
                    skill.spreadRadius || 25,
                    skill.duration || 4
                );
                scene.add(tornadoRing.group);
                effectsRef.current.push(tornadoRing);
                
                // 範圍傷害
                setTimeout(() => {
                    enemies.forEach(enemy => {
                        const dist = enemy.position.distanceTo(targetPos);
                        if (dist < (skill.spreadRadius || 25) && enemy.hp > 0) {
                            const dmg = skill.damage || 100;
                            updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - dmg) });
                            addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, 3, 0)), dmg, 'damage');
                        }
                    });
                    createParticles(targetPos, 0xaaccff, 30, 15, 2, 'wind_aoe');
                }, 200);
                break;
            }

            // ==================== 戰士技能 ====================
            case 'slash': {
                const skill = skills.slash;
                const range = skill.range || 5;
                
                const slash = new SlashEffect(playerPos, forwardDir, skill.damage || 200, range);
                scene.add(slash.group);
                effectsRef.current.push(slash);
                
                setTimeout(() => {
                    enemies.forEach(enemy => {
                        const toEnemy = enemy.position.clone().sub(playerPos);
                        const dist = toEnemy.length();
                        if (dist <= range && enemy.hp > 0) {
                            const enemyAngle = Math.atan2(toEnemy.x, -toEnemy.z);
                            const playerAngle = Math.atan2(forwardDir.x, -forwardDir.z);
                            let angleDiff = enemyAngle - playerAngle;
                            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                            if (Math.abs(angleDiff) <= Math.PI / 3) {
                                const dmg = skill.damage || 200;
                                updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - dmg) });
                                addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, enemy.size / 2, 0)), dmg, 'damage');
                            }
                        }
                    });
                }, 100);
                break;
            }

            case 'charge': {
                const skill = skills.charge;
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                
                const charge = new ChargeEffect(playerPos, targetPos, skill.damage || 300);
                scene.add(charge.group);
                effectsRef.current.push(charge);
                
                const direction = targetPos.clone().sub(playerPos).normalize();
                const chargeEndPos = targetPos.clone().sub(direction.multiplyScalar(2));
                updatePlayer({ playerPos: chargeEndPos });
                
                setTimeout(() => {
                    if (currentTarget) {
                        const dmg = skill.damage || 300;
                        updateEnemy(currentTarget.id, { hp: Math.max(0, currentTarget.hp - dmg) });
                        addFloatingNumber(currentTarget.position.clone().add(new THREE.Vector3(0, currentTarget.size / 2, 0)), dmg, 'damage');
                    }
                }, 400);
                break;
            }

            case 'whirlwind': {
                const skill = skills.whirlwind;
                const radius = skill.radius || 4;
                
                const whirlwind = new WhirlwindEffect(playerPos, skill.damage || 180, radius);
                scene.add(whirlwind.group);
                effectsRef.current.push(whirlwind);
                
                setTimeout(() => {
                    enemies.forEach(enemy => {
                        const dist = enemy.position.distanceTo(playerPos);
                        if (dist <= radius && enemy.hp > 0) {
                            const dmg = skill.damage || 180;
                            updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - dmg) });
                            addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, enemy.size / 2, 0)), dmg, 'damage');
                        }
                    });
                }, 200);
                break;
            }

            case 'shieldbash': {
                const skill = skills.shieldbash;
                const targetPos = currentTarget ? currentTarget.position.clone() : playerPos.clone().add(forwardDir.clone().multiplyScalar(3));
                
                const shieldBash = new ShieldBashEffect(playerPos, targetPos, skill.damage || 150);
                scene.add(shieldBash.group);
                effectsRef.current.push(shieldBash);
                
                setTimeout(() => {
                    if (currentTarget) {
                        const dmg = skill.damage || 150;
                        updateEnemy(currentTarget.id, { hp: Math.max(0, currentTarget.hp - dmg) });
                        addFloatingNumber(currentTarget.position.clone().add(new THREE.Vector3(0, currentTarget.size / 2, 0)), dmg, 'damage');
                    }
                }, 300);
                const shieldAmt = skill.shield || 100;
                updatePlayer({ playerHP: Math.min(playerMaxHP, playerHP + shieldAmt) });
                break;
            }

            case 'battlecry': {
                const skill = skills.battlecry;
                const attackBoost = skill.attackBoost || 0.5;
                
                const battlecry = new BattlecryEffect(playerPos);
                scene.add(battlecry.group);
                effectsRef.current.push(battlecry);
                
                addFloatingNumber(playerPos.clone().add(new THREE.Vector3(0, 8, 0)), '+' + Math.floor(attackBoost * 100) + '% ATK', 'buff');
                break;
            }

            case 'execute': {
                const skill = skills.execute;
                if (currentTarget && currentTarget.hp / currentTarget.maxHp <= (skill.executeThreshold || 0.2)) {
                    const targetPos = currentTarget.position.clone();
                    
                    const execute = new ExecuteEffect(playerPos, targetPos, skill.damage || 500);
                    scene.add(execute.group);
                    effectsRef.current.push(execute);
                    
                    setTimeout(() => {
                        const dmg = skill.damage || 500;
                        updateEnemy(currentTarget.id, { hp: Math.max(0, currentTarget.hp - dmg) });
                        addFloatingNumber(currentTarget.position.clone().add(new THREE.Vector3(0, currentTarget.size / 2, 0)), dmg, 'crit');
                    }, 300);
                }
                break;
            }

            // ==================== 弓箭手技能 ====================
            case 'quickshot': {
                const skill = skills.quickshot;
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                
                const quickshot = new QuickshotEffect(playerPosY, targetPos, skill.damage || 100);
                scene.add(quickshot.group);
                effectsRef.current.push(quickshot);
                
                const distance = playerPosY.distanceTo(targetPos);
                setTimeout(() => {
                    if (currentTarget) {
                        const dmg = skill.damage || 100;
                        updateEnemy(currentTarget.id, { hp: Math.max(0, currentTarget.hp - dmg) });
                        addFloatingNumber(currentTarget.position.clone().add(new THREE.Vector3(0, currentTarget.size / 2, 0)), dmg, 'damage');
                    }
                }, distance / 25 * 1000);
                break;
            }

            case 'multishot': {
                const skill = skills.multishot;
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                const arrowCount = skill.arrowCount || 5;
                
                const multishot = new MultishotEffect(playerPosY, targetPos, skill.damage || 80, arrowCount);
                scene.add(multishot.group);
                effectsRef.current.push(multishot);
                
                const angleSpread = Math.PI / 3;
                const baseAngle = Math.atan2(forwardDir.x, forwardDir.z);
                setTimeout(() => {
                    enemies.forEach(enemy => {
                        const toEnemy = enemy.position.clone().sub(playerPos);
                        const dist = toEnemy.length();
                        if (dist <= 30 && enemy.hp > 0) {
                            const enemyAngle = Math.atan2(toEnemy.x, toEnemy.z);
                            let angleDiff = enemyAngle - baseAngle;
                            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                            if (Math.abs(angleDiff) <= angleSpread / 2) {
                                const dmg = skill.damage || 80;
                                updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - dmg) });
                                addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, enemy.size / 2, 0)), dmg, 'damage');
                            }
                        }
                    });
                }, 500);
                break;
            }

            case 'poisonarrow': {
                const skill = skills.poisonarrow;
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                
                const poisonarrow = new QuickshotEffect(playerPosY, targetPos, skill.damage || 60);
                poisonarrow.arrow.material.color.setHex(0x44ff44);
                scene.add(poisonarrow.group);
                effectsRef.current.push(poisonarrow);
                
                setTimeout(() => {
                    if (currentTarget) {
                        const dmg = skill.damage || 60;
                        updateEnemy(currentTarget.id, { hp: Math.max(0, currentTarget.hp - dmg) });
                        addFloatingNumber(currentTarget.position.clone().add(new THREE.Vector3(0, currentTarget.size / 2, 0)), dmg, 'damage');
                        dotRef.current[currentTarget.id] = {
                            damage: skill.dotDamage || 30,
                            duration: skill.dotDuration || 5,
                            lastTick: 1,
                            source: 'poisonarrow'
                        };
                    }
                    createParticles(targetPos, 0x44ff44, 20, 5, 1, 'smoke');
                }, 500);
                break;
            }

            case 'arrowrain': {
                const skill = skills.arrowrain;
                const radius = skill.radius || 10;
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                
                const arrowrain = new ArrowrainEffect(targetPos, skill.damage || 150, radius);
                scene.add(arrowrain.group);
                effectsRef.current.push(arrowrain);
                
                for (let i = 0; i < 15; i++) {
                    setTimeout(() => {
                        enemies.forEach(enemy => {
                            const dist = enemy.position.distanceTo(targetPos);
                            if (dist < radius && enemy.hp > 0) {
                                const dmg = skill.damage || 150;
                                updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - dmg) });
                                addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, enemy.size / 2, 0)), dmg, 'damage');
                            }
                        });
                    }, 500 + i * 100);
                }
                break;
            }

            case 'evasion': {
                const skill = skills.evasion;
                
                const evasion = new EvasionEffect(playerPos);
                scene.add(evasion.group);
                effectsRef.current.push(evasion);
                
                addFloatingNumber(playerPos.clone().add(new THREE.Vector3(0, 8, 0)), '閃避', 'buff');
                break;
            }

            case 'snipe': {
                const skill = skills.snipe;
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                
                const snipe = new SnipeEffect(playerPosY, targetPos, skill.damage || 400);
                scene.add(snipe.group);
                effectsRef.current.push(snipe);
                
                setTimeout(() => {
                    if (currentTarget) {
                        const dmg = skill.damage || 400;
                        const critBonus = skill.critBonus || 0.5;
                        const isCrit = Math.random() < (playerCritChance + critBonus);
                        const finalDmg = isCrit ? dmg * 2 : dmg;
                        updateEnemy(currentTarget.id, { hp: Math.max(0, currentTarget.hp - finalDmg) });
                        addFloatingNumber(currentTarget.position.clone().add(new THREE.Vector3(0, currentTarget.size / 2, 0)), finalDmg, isCrit ? 'crit' : 'damage');
                    }
                }, 800);
                break;
            }

            // ==================== 德魯伊技能 ====================
            case 'wrath': {
                const skill = skills.wrath;
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                
                const wrath = new WrathEffect(playerPosY, targetPos, skill.damage || 150);
                scene.add(wrath.group);
                effectsRef.current.push(wrath);
                
                setTimeout(() => {
                    if (currentTarget) {
                        const dmg = skill.damage || 150;
                        updateEnemy(currentTarget.id, { hp: Math.max(0, currentTarget.hp - dmg) });
                        addFloatingNumber(currentTarget.position.clone().add(new THREE.Vector3(0, currentTarget.size / 2, 0)), dmg, 'damage');
                    }
                }, 800);
                break;
            }

            case 'rejuvenation': {
                const skill = skills.rejuvenation;
                const healAmt = skill.healAmount || 80;
                
                const rejuvenation = new RejuvenationEffect(playerPos, healAmt);
                scene.add(rejuvenation.group);
                effectsRef.current.push(rejuvenation);
                
                updatePlayer({ playerHP: Math.min(playerMaxHP, playerHP + healAmt) });
                addFloatingNumber(playerPos.clone().add(new THREE.Vector3(0, 8, 0)), healAmt, 'heal');
                dotRef.current['player_heal'] = {
                    damage: -(skill.hotAmount || 20),
                    duration: skill.hotDuration || 6,
                    lastTick: 1,
                    source: 'rejuvenation'
                };
                break;
            }

            case 'thorns': {
                const skill = skills.thorns;
                
                const thorns = new ThornsEffect(playerPos, skill.damage || 50);
                scene.add(thorns.group);
                effectsRef.current.push(thorns);
                
                addFloatingNumber(playerPos.clone().add(new THREE.Vector3(0, 8, 0)), '荊棘', 'buff');
                break;
            }

            case 'sunfire': {
                const skill = skills.sunfire;
                const radius = skill.radius || 8;
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                targetPos.y = playerPos.y;
                
                const sunfire = new SunfireEffect(targetPos, skill.damage || 200, radius);
                scene.add(sunfire.group);
                effectsRef.current.push(sunfire);
                
                enemies.forEach(enemy => {
                    if (enemy.position.distanceTo(targetPos) < radius && enemy.hp > 0) {
                        const dmg = skill.damage || 200;
                        updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - dmg) });
                        addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, enemy.size / 2, 0)), dmg, 'damage');
                        dotRef.current[`${enemy.id}_sunfire`] = {
                            damage: skill.dotDamage || 40,
                            duration: skill.dotDuration || 4,
                            lastTick: 1,
                            source: 'sunfire'
                        };
                    }
                });
                break;
            }

            case 'bearform': {
                const skill = skills.bearform;
                
                const beaform = new BearformEffect(playerPos);
                scene.add(beaform.group);
                effectsRef.current.push(beaform);
                
                const hpBoost = skill.hpBoost || 500;
                const attackBoost = skill.attackBoost || 50;
                updatePlayer({ 
                    playerHP: Math.min(playerMaxHP + hpBoost, playerHP + hpBoost),
                    playerAttackPower: playerAttackPower + attackBoost
                });
                addFloatingNumber(playerPos.clone().add(new THREE.Vector3(0, 10, 0)), '熊形態!', 'buff');
                break;
            }

            case 'tranquility': {
                const skill = skills.tranquility;
                const healAmt = skill.healAmount || 200;
                const radius = skill.radius || 15;
                
                const tranquility = new TranquilityEffect(playerPos, healAmt, radius);
                scene.add(tranquility.group);
                effectsRef.current.push(tranquility);
                
                updatePlayer({ playerHP: Math.min(playerMaxHP, playerHP + healAmt) });
                addFloatingNumber(playerPos.clone().add(new THREE.Vector3(0, 10, 0)), healAmt, 'heal');
                break;
            }

            default:
                break;
        }
    }, [skills, playerPos, targetEnemy, enemies, castSkill, scene, playerRotation, playerHP, playerMaxHP, playerAttackPower, playerCritChance, updatePlayer, updateEnemy, addFloatingNumber, classSelected]);

    handleSkillCastRef.current = handleSkillCast;

    const frameCount = useRef(0);
    
    useFrame((state, delta) => {
        updateSkillsCooldown(delta);
        
        // 更新死亡效果
        updateDeathEffects(delta);
        
        frameCount.current++;
        
        if (frameCount.current % 2 !== 0) return;

        // 處理 DOT 傷害
        Object.keys(dotRef.current).forEach(enemyId => {
            const dot = dotRef.current[enemyId];
            dot.lastTick -= delta;
            
            if (dot.lastTick <= 0) {
                // 檢查敵人是否還活著
                const enemy = enemies.find(e => e.id === enemyId);
                if (enemy && enemy.hp > 0) {
                    const dmg = dot.damage;
                    updateEnemy(enemyId, { hp: Math.max(0, enemy.hp - dmg) });
                    addFloatingNumber(
                        enemy.position.clone().add(new THREE.Vector3(0, enemy.size / 2 + 2, 0)),
                        dmg,
                        'damage'
                    );
                }
                
                dot.duration -= 1;
                dot.lastTick = 1; // 每秒觸發一次
                
                if (dot.duration <= 0) {
                    delete dotRef.current[enemyId];
                }
            }
        });

        for (let i = effectsRef.current.length - 1; i >= 0; i--) {
            const effect = effectsRef.current[i];
            const isAlive = effect.update(delta);

            if (!isAlive) {
                effect.dispose();
                // 檢查是否有 group 屬性 (FireExplosion 可能沒有)
                if (effect.group && effect.group !== scene) {
                    scene.remove(effect.group);
                }
                // 移除爆炸光源
                if (effect.lights) {
                    effect.lights.forEach(light => {
                        if (light.parent) light.parent.remove(light);
                    });
                }
                effectsRef.current.splice(i, 1);
            }
        }
    });

    useEffect(() => {
        if (!classSelected) return;
        
        const keyMap = skillKeybinds;
        const handleKey = (e) => {
            const skillKey = keyMap[e.key];
            if (skillKey && handleSkillCastRef.current) {
                e.preventDefault();
                handleSkillCastRef.current(skillKey);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [skillKeybinds, classSelected]);

    return null;
}

export default SkillsManager;
