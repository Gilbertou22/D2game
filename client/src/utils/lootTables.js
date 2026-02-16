// lootTables.js - 寶箱掉落表與稀有度機率
import { RARITIES } from './itemSystem';

// 使用 itemSystem 的稀有度權重
export const RARITY_WEIGHTS = {
    common: RARITIES.common.dropWeight,
    uncommon: RARITIES.uncommon.dropWeight,
    rare: RARITIES.rare.dropWeight,
    epic: RARITIES.epic.dropWeight,
    legendary: RARITIES.legendary.dropWeight
};

export const BOSS_LOOT_TABLE = {
    minItems: 2,
    maxItems: 4,
    rarityWeights: { rare: 40, epic: 30, legendary: 30 }, // 高稀有度
    types: ['weapon', 'armor', 'helmet', 'ring', 'amulet']
};

// 累計權重（用來快速隨機抽取）
const cumulativeRarities = (() => {
    const entries = Object.entries(RARITY_WEIGHTS);
    let sum = 0;
    return entries.map(([rarity, weight]) => {
        sum += weight;
        return { rarity, cumulative: sum };
    });
})();

// 快速抽稀有度函數
function getRandomRarity() {
    const rand = Math.random() * 100;
    for (const entry of cumulativeRarities) {
        if (rand <= entry.cumulative) return entry.rarity;
    }
    return 'common'; // fallback
}

// 物品類型權重（每種稀有度內的物品分布）
const itemTypeWeights = {
    common: { potion: 50, gold: 40, weapon: 5, armor: 5 },
    uncommon: { potion: 30, gold: 30, weapon: 20, armor: 20 },
    rare: { gold: 20, weapon: 30, armor: 30, ring: 10, amulet: 10 },
    epic: { weapon: 35, armor: 35, ring: 15, amulet: 15 },
    legendary: { weapon: 40, armor: 30, ring: 15, amulet: 15 }
};

// 物品等級範圍（依稀有度）
const levelRanges = {
    common: [1, 3],
    uncommon: [3, 6],
    rare: [6, 10],
    epic: [10, 15],
    legendary: [15, 20]
};

// 寶箱類型 → 掉落表
export const CHEST_LOOT_TABLES = {
    normal: {
        minGold: 20,
        maxGold: 80,
        minItems: 1,
        maxItems: 3,
        rarityWeights: RARITY_WEIGHTS
    },
    magic: {
        minGold: 80,
        maxGold: 200,
        minItems: 2,
        maxItems: 5,
        rarityWeights: { ...RARITY_WEIGHTS, uncommon: 35, rare: 15 }
    },
    rare: {
        minGold: 150,
        maxGold: 400,
        minItems: 3,
        maxItems: 6,
        rarityWeights: { ...RARITY_WEIGHTS, rare: 30, epic: 10 }
    },
    legendary: {
        minGold: 300,
        maxGold: 800,
        minItems: 4,
        maxItems: 8,
        rarityWeights: { epic: 40, legendary: 30 }
    }
};

export function generateBossLoot(level) {
    const count = Math.floor(Math.random() * (BOSS_LOOT_TABLE.maxItems - BOSS_LOOT_TABLE.minItems + 1)) + BOSS_LOOT_TABLE.minItems;
    const items = [];

    for (let i = 0; i < count; i++) {
        // 稀有度
        const rand = Math.random() * 100;
        let rarity = 'rare';
        if (rand < BOSS_LOOT_TABLE.rarityWeights.legendary) rarity = 'legendary';
        else if (rand < BOSS_LOOT_TABLE.rarityWeights.epic + BOSS_LOOT_TABLE.rarityWeights.legendary) rarity = 'epic';

        // 類型
        const type = BOSS_LOOT_TABLE.types[Math.floor(Math.random() * BOSS_LOOT_TABLE.types.length)];

        // 屬性（簡化）
        const basePower = level * 10;
        const power = basePower * (rarity === 'legendary' ? 3 : rarity === 'epic' ? 2 : 1.5);

        items.push({
            type,
            rarity,
            level,
            power: Math.floor(power),
            rarityName: rarity === 'legendary' ? '傳說' : rarity === 'epic' ? '史詩' : '稀有',
            rarityColor: rarity === 'legendary' ? '#ff00ff' : rarity === 'epic' ? '#ff8800' : '#00ff00'
        });
    }

    return items;
}

// 主生成函數
export function generateChestLoot(chestType = 'normal') {
    const table = CHEST_LOOT_TABLES[chestType] || CHEST_LOOT_TABLES.normal;

    const gold = Math.floor(Math.random() * (table.maxGold - table.minGold + 1)) + table.minGold;
    const itemCount = Math.floor(Math.random() * (table.maxItems - table.minItems + 1)) + table.minItems;

    const items = [];

    for (let i = 0; i < itemCount; i++) {
        const rarity = getRandomRarity(table.rarityWeights || RARITY_WEIGHTS);
        const typeWeights = itemTypeWeights[rarity] || itemTypeWeights.common;

        // 抽物品類型
        const totalWeight = Object.values(typeWeights).reduce((a, b) => a + b, 0);
        let rand = Math.random() * totalWeight;
        let selectedType = 'potion';
        for (const [type, weight] of Object.entries(typeWeights)) {
            if (rand <= weight) {
                selectedType = type;
                break;
            }
            rand -= weight;
        }

        // 等級
        const [minLvl, maxLvl] = levelRanges[rarity] || levelRanges.common;
        const level = Math.floor(Math.random() * (maxLvl - minLvl + 1)) + minLvl;

        items.push({
            type: selectedType,
            level,
            rarity,
            goldValue: selectedType === 'gold' ? Math.floor(Math.random() * 50) + 20 : 0
        });
    }

    return { gold, items };
}