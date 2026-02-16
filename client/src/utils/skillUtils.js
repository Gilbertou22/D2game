// client/src/utils/skillUtils.js (完整修正版：實作 castSkill + Nova 技能 + 鏈電優化 + 粒子特效)
import { createProjectile } from '../game/Projectiles';
import { createParticles } from '../game/Particles';
import useGameState from '../hooks/useGameState';
import * as THREE from 'three';

// 主要技能釋放入口
export const castSkill = (skillKey) => {
    const state = useGameState.getState();
    const skill = state.skills[skillKey];

    if (!skill || !skill.unlocked || skill.cooldown > 0 || state.playerMana < skill.manaCost || state.isDead) {
        return false;
    }

    // 扣魔力與冷卻（假設 store 有相關函數，或 component 處理）
    useGameState.getState().updatePlayer({ playerMana: state.playerMana - skill.manaCost });
    // 冷卻在 component 或 store 內處理

    const playerPosY = state.playerPos.clone().add(new THREE.Vector3(0, 4, 0));

    // 通用施法光暈
    createParticles(playerPosY, 0xffffff, 50, 10, 1, 'cast_flash');

    switch (skillKey) {
        case 'fireball':
            if (state.targetEnemy) {
                createProjectile('fireball', playerPosY, state.targetEnemy.position);
                createParticles(playerPosY, 0xff6600, 100, 15, 1.5, 'fire_cast');
            }
            break;

        case 'icebolt':
            if (state.targetEnemy) {
                createProjectile('icebolt', playerPosY, state.targetEnemy.position);
                createParticles(playerPosY, 0x88ffff, 80, 12, 1.2, 'ice_cast');
            }
            break;

        case 'heal':
            const healAmount = skill.healAmount || 100;
            useGameState.getState().updatePlayer({ playerHP: Math.min(state.playerMaxHP, state.playerHP + healAmount) });
            createParticles(playerPosY, 0x00ff88, 200, 20, 3, 'heal_wave');
            createParticles(playerPosY, 0xffffff, 100, 15, 2.5, 'heal_sparkle');
            break;

        case 'nova':
            castNova(playerPosY);
            break;

        case 'chainlightning':
            if (state.targetEnemy) {
                chainLightning(playerPosY, skill.chains || 5);
            }
            break;

        default:
            break;
    }

    return true;
};

// Nova 範圍傷害
export const castNova = (playerPosY) => {
    const state = useGameState.getState();
    const radius = 20;
    const damage = 300;

    // 中心大爆炸
    createParticles(playerPosY, 0x00ffff, 400, 40, 3, 'nova_center');

    (state.enemies || []).forEach(enemy => {
        if (enemy.position.distanceTo(state.playerPos) <= radius) {
            const finalDamage = Math.floor(damage * (0.9 + Math.random() * 0.2));
            useGameState.getState().updateEnemy(enemy.id, { hp: Math.max(0, enemy.hp - finalDamage) });
            createParticles(
                enemy.position.clone().add(new THREE.Vector3(0, enemy.size / 2, 0)),
                0x00ffff,
                100,
                20,
                2,
                'nova_hit'
            );
            useGameState.getState().addFloatingNumber(
                enemy.position.clone().add(new THREE.Vector3(0, enemy.size / 2, 0)),
                finalDamage,
                'damage'
            );
        }
    });

    useGameState.getState().addEvent('釋放 Nova！範圍造成毀滅性傷害', '#00ffff', 'skill_cast');
};

// 閃電鏈（優化：避免重複擊中 + 粒子連線）
export const chainLightning = (startPos, chainsLeft, previousTarget = null) => {
    if (chainsLeft <= 0) return;

    const state = useGameState.getState();
    const enemies = state.enemies || [];
    let closest = null;
    let minDist = Infinity;

    enemies.forEach(enemy => {
        if (enemy !== previousTarget && enemy.hp > 0) {
            const d = startPos.distanceTo(enemy.position);
            if (d < minDist && d < 30) {
                minDist = d;
                closest = enemy;
            }
        }
    });

    if (closest) {
        createProjectile('chainlightning', startPos, closest.position);

        const damage = 60;
        useGameState.getState().updateEnemy(closest.id, { hp: Math.max(0, closest.hp - damage) });
        createParticles(closest.position.clone().add(new THREE.Vector3(0, closest.size / 2, 0)), 0xffffff, 80, 15, 1, 'lightning_hit');
        useGameState.getState().addFloatingNumber(
            closest.position.clone().add(new THREE.Vector3(0, closest.size / 2, 0)),
            damage,
            'damage'
        );

        setTimeout(() => chainLightning(closest.position.clone().add(new THREE.Vector3(0, closest.size / 2, 0)), chainsLeft - 1, closest), 200);
    }
};