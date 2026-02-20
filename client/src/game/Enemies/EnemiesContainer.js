// src/game/Enemies/EnemiesContainer.js (完整最終版：怪物密度控制 + 權重隨機 + 種子隨機 + 隨機名字)
import { useEffect } from 'react';
import * as THREE from 'three';
import useGameState from '../../hooks/useGameState';
import Enemy from './Enemy';
import Boss from './Boss';
import enemyConfigs from '../../configs/enemyConfigs';

const VIEW_RADIUS = 150;

// 簡單 seeded random（基於關卡種子，確保同關卡一致）
function seededRandom(seedRef) {
    const seed = seedRef.value++;
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function EnemiesContainer() {
    const {
        setEnemies,
        currentLevel,
        isBossLevel,
        obstacles,
        classSelected
    } = useGameState();

    useEffect(() => {
        if (!classSelected) return;
        
        let difficulty = 1 + (currentLevel - 1) * 0.25;

        if (currentLevel === 1) {
            difficulty *= 0.4; // 整體強度 50%
        }

        
        const newEnemies = [];

        // 種子參考（用物件避免閉包問題）
        const seedRef = { value: currentLevel * 1000 };

        // 怪物密度上限 (暫時減少以提升 FPS)
        const maxEnemies = Math.min(10 + currentLevel * 2, 30);

        // 怪物類型權重（總和 100）
        const typeWeights = [
            { type: 'melee', weight: 30 },
            { type: 'ranged', weight: 20 },
            { type: 'tank', weight: 15 },
            { type: 'flying', weight: 10 },
            { type: 'mage', weight: 10 },
            { type: 'summoner', weight: 5 },
            { type: 'sniper', weight: 8 },
            { type: 'healer', weight: 5 },
            { type: 'berserker', weight: 10 },
            { type: 'shadow', weight: 8 },
            { type: 'elemental', weight: 7 }
        ];

        // 加權隨機類型
        const getRandomType = () => {
            let rand = seededRandom(seedRef) * 100;
            for (const t of typeWeights) {
                rand -= t.weight;
                if (rand <= 0) return t.type;
            }
            return 'melee';
        };

        // 隨機名字（優先 names 陣列）
        const getRandomName = (type) => {
            const config = enemyConfigs[type] || enemyConfigs.melee;
            const names = config.names || [config.name || type];
            return names[Math.floor(seededRandom(seedRef) * names.length)];
        };

        let enemyCount = 0;

        if (isBossLevel) {
            // BOSS 關：小怪減半 + BOSS
            const smallCount = Math.min(Math.floor((10 + currentLevel * 5) * 0.4), maxEnemies - 1);

            for (let i = 0; i < smallCount && enemyCount < maxEnemies; i++) {
                const type = getRandomType();
                const base = enemyConfigs[type] || enemyConfigs.melee;

                let pos;
                let attempts = 0;
                do {
                    pos = new THREE.Vector3(
                        seededRandom(seedRef) * 240 - 120,
                        base.size || 3,
                        seededRandom(seedRef) * 240 - 120
                    );
                    attempts++;
                } while (obstacles.some(obs => pos.distanceTo(obs.position) < (base.size || 3) + obs.radius + 5) && attempts < 100);

                if (attempts < 100) {
                    newEnemies.push({
                        id: `minion_${currentLevel}_${Date.now()}_${i}`,
                        position: pos,
                        type,
                        name: getRandomName(type),
                        hp: (base.baseHp || 80) * difficulty * 1.2,
                        maxHp: (base.baseHp || 80) * difficulty * 1.2,
                        attackPower: (base.baseAttack || 15) * difficulty,
                        moveSpeed: base.baseSpeed || 12,
                        attackRange: base.range || 6,
                        size: base.size || 3,
                        radius: (base.size || 3) + 1,
                        detectRange: base.detectRange || 30,
                        aggro: false,
                        lastAttackTime: 0,
                        path: [],
                        pathIndex: 0,
                        pathRecalcTimer: 0,
                        dodge: base.dodge || 0.05,
                        level: currentLevel
                    });
                    enemyCount++;
                }
            }

            // BOSS
            const bossBase = enemyConfigs.boss || enemyConfigs.melee;
            let bossPos = new THREE.Vector3(0, bossBase.size || 10, 100);
            let attempts = 0;
            while (obstacles.some(obs => bossPos.distanceTo(obs.position) < (bossBase.size || 10) + obs.radius + 10) && attempts < 100) {
                bossPos.set(seededRandom(seedRef) * 200 - 100, bossBase.size || 10, seededRandom(seedRef) * 200 - 100);
                attempts++;
            }

            newEnemies.push({
                id: `boss_${currentLevel}`,
                position: bossPos,
                type: 'boss',
                name: getRandomName('boss'),
                hp: (bossBase.baseHp || 1000) * difficulty * 2.5,
                maxHp: (bossBase.baseHp || 1000) * difficulty * 2.5,
                attackPower: (bossBase.baseAttack || 50) * difficulty * 2,
                moveSpeed: bossBase.baseSpeed || 10,
                attackRange: bossBase.range || 12,
                size: bossBase.size || 10,
                radius: (bossBase.size || 10) + 2,
                detectRange: bossBase.detectRange || 60,
                aggro: false,
                lastAttackTime: 0,
                lastSpecialTime: 0,
                specialCooldown: 10,
                currentPhase: 0,
                path: [],
                pathIndex: 0,
                pathRecalcTimer: 0,
                dodge: 0.15,
                level: currentLevel
            });
        } else {
            // 普通關卡 (暫時減少以提升 FPS)
            const targetCount = Math.min(5 + currentLevel * 2, maxEnemies);

            while (enemyCount < targetCount) {
                const type = getRandomType();
                const base = enemyConfigs[type] || enemyConfigs.melee;

                let pos;
                let attempts = 0;
                do {
                    pos = new THREE.Vector3(
                        seededRandom(seedRef) * 240 - 120,
                        base.size || 3,
                        seededRandom(seedRef) * 240 - 120
                    );
                    attempts++;
                } while (obstacles.some(obs => pos.distanceTo(obs.position) < (base.size || 3) + obs.radius + 5) && attempts < 100);

                if (attempts < 100) {
                    newEnemies.push({
                        id: `enemy_${type}_${currentLevel}_${Date.now()}_${enemyCount}`,
                        position: pos,
                        type,
                        name: getRandomName(type),
                        hp: (base.baseHp || 80) * difficulty,
                        maxHp: (base.baseHp || 80) * difficulty,
                        attackPower: (base.baseAttack || 15) * difficulty,
                        moveSpeed: base.baseSpeed || 12,
                        attackRange: base.range || 6,
                        size: base.size || 3,
                        radius: (base.size || 3) + 1,
                        detectRange: base.detectRange || 30,
                        aggro: false,
                        lastAttackTime: 0,
                        path: [],
                        pathIndex: 0,
                        pathRecalcTimer: 0,
                        dodge: (base.dodge || 0.05) * (type === 'boss' ? 2 : 1), // 基礎閃避 5%，BOSS 10%
                        level: currentLevel
                    });
                    enemyCount++;
                } else {
                    break;
                }
            }
        }

        setEnemies(newEnemies);
    }, [currentLevel, isBossLevel, obstacles, classSelected, setEnemies]);

    const { enemies = [] } = useGameState();
    const enemyArray = Array.isArray(enemies) ? enemies : [];

    return (
        <>
            {enemyArray.map(enemy =>
                enemy.type === 'boss' ?
                    <Boss key={enemy.id} enemy={enemy} /> :
                    <Enemy key={enemy.id} enemy={enemy} />
            )}
        </>
    );
}

export default EnemiesContainer;