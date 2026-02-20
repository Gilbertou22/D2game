// src/game/Enemies/EnemiesContainer.js (優化版：難度遞增 + 消滅所有敵人進下一關)
import { useEffect } from 'react';
import * as THREE from 'three';
import useGameState from '../../hooks/useGameState';
import Enemy from './Enemy';
import Boss from './Boss';
import enemyConfigs from '../../configs/enemyConfigs';

const VIEW_RADIUS = 150;

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
        
        // 難度曲線：每關增加 20% 強度
        let difficulty = 1 + (currentLevel - 1) * 0.2;
        
        // 第一關簡單一點
        if (currentLevel === 1) {
            difficulty *= 0.5;
        }
        
        // 每 5 關額外增加難度
        if (currentLevel % 5 === 0) {
            difficulty *= 1.3;
        }
        
        const newEnemies = [];
        const seedRef = { value: currentLevel * 1000 };

        // 敵人數量隨關卡增加
        const baseEnemyCount = 10 + Math.floor(currentLevel * 3);
        const maxEnemies = Math.min(baseEnemyCount, 35);

        // 根據關卡調整怪物類型權重
        const getDynamicWeights = () => {
            const base = [
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
            
            // 高關卡增加精英怪物權重
            if (currentLevel >= 5) {
                base.find(t => t.type === 'berserker').weight = 15;
                base.find(t => t.type === 'shadow').weight = 12;
            }
            if (currentLevel >= 10) {
                base.find(t => t.type === 'elemental').weight = 12;
                base.find(t => t.type === 'mage').weight = 15;
            }
            if (currentLevel >= 15) {
                base.find(t => t.type === 'summoner').weight = 10;
            }
            
            return base;
        };

        const typeWeights = getDynamicWeights();

        const getRandomType = () => {
            const totalWeight = typeWeights.reduce((sum, t) => sum + t.weight, 0);
            let rand = seededRandom(seedRef) * totalWeight;
            for (const t of typeWeights) {
                rand -= t.weight;
                if (rand <= 0) return t.type;
            }
            return 'melee';
        };

        const getRandomName = (type) => {
            const config = enemyConfigs[type] || enemyConfigs.melee;
            const names = config.names || [config.name || type];
            return names[Math.floor(seededRandom(seedRef) * names.length)];
        };

        let enemyCount = 0;

        if (isBossLevel) {
            // BOSS 關：小怪數量隨關卡增加
            const smallCount = Math.min(8 + currentLevel * 2, maxEnemies - 1);

            for (let i = 0; i < smallCount && enemyCount < maxEnemies - 1; i++) {
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
                        hp: (base.baseHp || 80) * difficulty * 1.3,
                        maxHp: (base.baseHp || 80) * difficulty * 1.3,
                        attackPower: (base.baseAttack || 15) * difficulty * 1.2,
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

            // BOSS - 隨關卡增強
            const bossBase = enemyConfigs.boss || enemyConfigs.melee;
            const bossMultiplier = 2 + (currentLevel / 10) * 0.5; // 每 10 關 BOSS 增強 50%
            
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
                hp: (bossBase.baseHp || 1000) * difficulty * bossMultiplier,
                maxHp: (bossBase.baseHp || 1000) * difficulty * bossMultiplier,
                attackPower: (bossBase.baseAttack || 50) * difficulty * 1.5,
                moveSpeed: bossBase.baseSpeed || 10,
                attackRange: bossBase.range || 12,
                size: bossBase.size || 10,
                radius: (bossBase.size || 10) + 2,
                detectRange: bossBase.detectRange || 60,
                aggro: false,
                lastAttackTime: 0,
                lastSpecialTime: 0,
                specialCooldown: Math.max(5, 10 - Math.floor(currentLevel / 5)), // 高關卡 BOSS 技能更頻繁
                currentPhase: 0,
                path: [],
                pathIndex: 0,
                pathRecalcTimer: 0,
                dodge: 0.15 + (currentLevel / 100), // BOSS 閃避隨關卡增加
                level: currentLevel
            });
        } else {
            // 普通關卡：敵人數量隨關卡增加
            const targetCount = Math.min(12 + currentLevel * 4, maxEnemies);

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
                    // 精英怪物：高關卡有機率生成更強的怪物
                    const isElite = currentLevel >= 5 && seededRandom(seedRef) < 0.15;
                    const eliteMultiplier = isElite ? 1.5 : 1;
                    
                    newEnemies.push({
                        id: `enemy_${type}_${currentLevel}_${Date.now()}_${enemyCount}`,
                        position: pos,
                        type,
                        name: isElite ? `★${getRandomName(type)}` : getRandomName(type),
                        hp: (base.baseHp || 80) * difficulty * eliteMultiplier,
                        maxHp: (base.baseHp || 80) * difficulty * eliteMultiplier,
                        attackPower: (base.baseAttack || 15) * difficulty * eliteMultiplier,
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
                        dodge: (base.dodge || 0.05) * (isElite ? 1.5 : 1),
                        level: currentLevel,
                        isElite
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