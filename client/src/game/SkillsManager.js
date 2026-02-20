// src/game/SkillsManager.jsx
import { useFrame } from '@react-three/fiber';
import { useEffect, useCallback, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import useGameState from '../hooks/useGameState';
import { createProjectile } from './Projectiles';
import { createParticles } from './Particles';
import { LightningEffect, FrozenOrbEffect, BlizzardEffect, MeteorEffect, IceNovaEffect, FireballEffect, FireExplosion, PlagueSpikeEffect, PoisonCloudEffect, SerpentSweepEffect, WindBladesEffect, TornadoEffect, TornadoRingEffect } from './SkillEffects';
import * as THREE from 'three';

function SkillsManager() {
    const { scene } = useThree();

    const {
        skills, playerMana, playerPos, playerRotation, targetEnemy, enemies,
        playerHP, playerMaxHP, castSkill, updateEnemy, setTargetEnemy,
        updatePlayer, updateSkillsCooldown, addFloatingNumber,
        skillKeybinds, talentUnlocks
    } = useGameState();

    const effectsRef = useRef([]);
    const dotRef = useRef({}); // DOT 追蹤: { enemyId: { damage, duration, source, lastTick } }

    const handleSkillCast = useCallback((skillKey) => {
        // 鎖定邏輯
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
        if (!result.success) return;

        const playerPosY = playerPos.clone().add(new THREE.Vector3(0, 4, 0));
        const forwardDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotation?.y || 0);
        const defaultTargetPos = playerPos.clone().add(forwardDir.multiplyScalar(20));

        switch (skillKey) {
            case 'fireball': {
                const targetPos = currentTarget ? currentTarget.position.clone() : defaultTargetPos;
                
                // 創建新的火球特效
                const fireball = new FireballEffect(playerPosY, targetPos, result.damage);
                scene.add(fireball.group);
                effectsRef.current.push(fireball);
                
                // 延遲處理傷害和爆炸
                const distance = playerPosY.distanceTo(targetPos);
                const travelTime = distance / 18; // 火球速度為 18
                
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
                
                // 創建隕石特效 (現在會自動處理爆炸)
                const meteorEffect = new MeteorEffect(targetPos, result.damage, result.radius);
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
            
            default: break;
        }
    }, [playerPos, targetEnemy, enemies, castSkill, scene, playerRotation, playerHP, playerMaxHP, updatePlayer, updateEnemy, addFloatingNumber]);

    const frameCount = useRef(0);
    
    useFrame((state, delta) => {
        frameCount.current++;
        
        // 限制更新頻率：每2幀更新一次 (30fps)
        if (frameCount.current % 2 !== 0) return;
        
        updateSkillsCooldown(delta);

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

    // 動態生成 keyMap 基於 skillKeybinds
    useEffect(() => {
        const keyMap = skillKeybinds;
        const handleKey = (e) => {
            const skillKey = keyMap[e.key];
            if (skillKey) {
                e.preventDefault();
                handleSkillCast(skillKey);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [handleSkillCast, skillKeybinds]);

    // 動態生成技能列表基於 skillKeybinds
    const skillList = Object.entries(skillKeybinds).map(([hotkey, skillKey]) => {
        const skill = skills[skillKey];
        return {
            key: skillKey,
            icon: skill?.icon || '❓',
            name: skill?.name || skillKey,
            hotkey: hotkey
        };
    });

    return (
        <Html fullscreen>
            <div style={{ 
                position: 'fixed', 
                bottom: '20px', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                display: 'flex', 
                gap: '10px', 
                zIndex: 50,
                flexWrap: 'wrap',
                justifyContent: 'center',
                maxWidth: '90vw'
            }}>
                {skillList.map(({ key, icon, name, hotkey }) => {
                    const skill = skills[key] || { unlocked: false, cooldown: 0, maxCooldown: 1, manaCost: 0 };
                    // 天賦解鎖的技能視為已解鎖
                    const talentUnlocked = talentUnlocks && talentUnlocks[key];
                    const isUnlocked = skill.unlocked || talentUnlocked;
                    const canUse = isUnlocked && skill.cooldown <= 0 && playerMana >= skill.manaCost;
                    return (
                        <div key={key} onClick={() => handleSkillCast(key)} style={{
                            width: '65px', 
                            height: '65px', 
                            background: canUse ? '#004400' : '#222222',
                            border: `3px solid ${isUnlocked ? '#00ff00' : '#666666'}`, 
                            borderRadius: '12px',
                            position: 'relative', 
                            cursor: canUse ? 'pointer' : 'not-allowed', 
                            display: 'flex', 
                            flexDirection: 'column',
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            transition: 'all 0.2s', 
                            opacity: isUnlocked ? 1 : 0.5,
                            userSelect: 'none'
                        }} title={`${name} (Mana: ${skill.manaCost})${talentUnlocked ? ' [天賦解鎖]' : ''}`}>
                            <div style={{ fontSize: '28px' }}>{icon}</div>
                            <div style={{ 
                                position: 'absolute', 
                                top: '2px', 
                                right: '4px',
                                fontSize: '12px', 
                                color: '#ffff00',
                                fontWeight: 'bold',
                                textShadow: '1px 1px 2px black'
                            }}>{hotkey}</div>
                            {skill.cooldown > 0 && (
                                <div style={{ 
                                    position: 'absolute', 
                                    top: 0, 
                                    left: 0, 
                                    width: '100%', 
                                    height: '100%', 
                                    background: 'rgba(0,0,0,0.7)', 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center', 
                                    color: 'white', 
                                    fontSize: '16px', 
                                    borderRadius: '9px',
                                    fontWeight: 'bold'
                                }}>
                                    {skill.cooldown.toFixed(1)}
                                </div>
                            )}
                            {playerMana < skill.manaCost && skill.cooldown <= 0 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: '10px',
                                    color: '#ff4444',
                                    fontWeight: 'bold'
                                }}>⚠️</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Html>
    );
}

export default SkillsManager;
