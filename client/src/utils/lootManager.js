// src/utils/lootManager.js - 優化的掉落管理系統
import { generateLoot, generateEquipment, generatePotion, generateGold, RARITIES } from './itemSystem';

// ==========================================
// 掉落配置
// ==========================================
export const LOOT_CONFIG = {
    // 敵人類型配置
    enemyTypes: {
        normal: {
            dropChance: 0.25,
            rarityBonus: 0,
            minGold: 10,
            maxGold: 50,
            potionChance: 0.25,
            minItems: 0,
            maxItems: 1
        },
        elite: {
            dropChance: 0.6,
            rarityBonus: 0.08,
            minGold: 50,
            maxGold: 150,
            potionChance: 0.5,
            minItems: 1,
            maxItems: 2
        },
        boss: {
            dropChance: 1.0,
            rarityBonus: 0.15,
            minGold: 200,
            maxGold: 500,
            potionChance: 0.8,
            minItems: 2,
            maxItems: 4
        }
    },
    
    // 寶箱類型配置
    chestTypes: {
        normal: {
            minGold: 20,
            maxGold: 80,
            minItems: 1,
            maxItems: 3,
            rarityBonus: 0
        },
        magic: {
            minGold: 80,
            maxGold: 200,
            minItems: 2,
            maxItems: 5,
            rarityBonus: 0.05
        },
        rare: {
            minGold: 150,
            maxGold: 400,
            minItems: 3,
            maxItems: 6,
            rarityBonus: 0.1
        },
        legendary: {
            minGold: 300,
            maxGold: 800,
            minItems: 4,
            maxItems: 8,
            rarityBonus: 0.2
        }
    },
    
    // 幸運值影響（每點幸運增加的稀有度加成）
    luckMultiplier: 0.001
};

// ==========================================
// 掉落管理器類
// ==========================================
export class LootManager {
    constructor() {
        this.dropHistory = [];
        this.rarityWeights = this.calculateRarityWeights();
    }
    
    // 計算稀有度權重
    calculateRarityWeights() {
        const weights = {};
        let total = 0;
        
        Object.entries(RARITIES).forEach(([key, data]) => {
            weights[key] = data.dropWeight;
            total += data.dropWeight;
        });
        
        // 正規化
        Object.keys(weights).forEach(key => {
            weights[key] = (weights[key] / total) * 100;
        });
        
        return weights;
    }
    
    // 生成敵人掉落
    generateEnemyDrop(enemyLevel, enemyType = 'normal', playerLuck = 0, playerGoldFind = 0) {
        const config = LOOT_CONFIG.enemyTypes[enemyType] || LOOT_CONFIG.enemyTypes.normal;
        const loot = [];
        
        // 檢查是否掉落
        if (Math.random() > config.dropChance) {
            return loot;
        }
        
        // 計算幸運加成
        const luckBonus = playerLuck * LOOT_CONFIG.luckMultiplier;
        const totalRarityBonus = config.rarityBonus + luckBonus;
        
        // 生成金幣
        const goldAmount = Math.floor(
            (config.minGold + Math.random() * (config.maxGold - config.minGold)) *
            (1 + playerGoldFind / 100)
        );
        loot.push(generateGold(goldAmount, enemyLevel));
        
        // 生成藥水
        if (Math.random() < config.potionChance) {
            const potionType = Math.random() > 0.5 ? 'hp' : 'mana';
            loot.push(generatePotion(potionType, enemyLevel));
        }
        
        // 生成裝備
        const itemCount = Math.floor(
            Math.random() * (config.maxItems - config.minItems + 1)
        ) + config.minItems;
        
        for (let i = 0; i < itemCount; i++) {
            const equipmentTypes = ['weapon', 'armor', 'helmet', 'ring', 'amulet'];
            const type = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
            loot.push(generateEquipment(type, enemyLevel, null, totalRarityBonus));
        }
        
        // 記錄掉落歷史
        this.logDrop({
            type: 'enemy',
            enemyType,
            level: enemyLevel,
            items: loot.length,
            timestamp: Date.now()
        });
        
        return loot;
    }
    
    // 生成寶箱掉落
    generateChestLoot(chestType = 'normal', playerLevel, playerLuck = 0, playerGoldFind = 0) {
        const config = LOOT_CONFIG.chestTypes[chestType] || LOOT_CONFIG.chestTypes.normal;
        const loot = [];
        
        // 計算幸運加成
        const luckBonus = playerLuck * LOOT_CONFIG.luckMultiplier;
        const totalRarityBonus = config.rarityBonus + luckBonus;
        
        // 生成金幣
        const goldAmount = Math.floor(
            (config.minGold + Math.random() * (config.maxGold - config.minGold)) *
            (1 + playerGoldFind / 100)
        );
        loot.push(generateGold(goldAmount, playerLevel));
        
        // 生成物品
        const itemCount = Math.floor(
            Math.random() * (config.maxItems - config.minItems + 1)
        ) + config.minItems;
        
        for (let i = 0; i < itemCount; i++) {
            const rand = Math.random();
            
            if (rand < 0.3) {
                // 30% 藥水
                const potionType = Math.random() > 0.5 ? 'hp' : 'mana';
                loot.push(generatePotion(potionType, playerLevel));
            } else {
                // 70% 裝備
                const equipmentTypes = ['weapon', 'armor', 'helmet', 'ring', 'amulet'];
                const type = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
                loot.push(generateEquipment(type, playerLevel, null, totalRarityBonus));
            }
        }
        
        // 傳奇寶箱有機會額外掉落
        if (chestType === 'legendary' && Math.random() < 0.2) {
            const equipmentTypes = ['weapon', 'armor', 'helmet', 'ring', 'amulet'];
            const type = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
            loot.push(generateEquipment(type, playerLevel, 'legendary'));
        }
        
        // 記錄掉落歷史
        this.logDrop({
            type: 'chest',
            chestType,
            level: playerLevel,
            items: loot.length,
            timestamp: Date.now()
        });
        
        return loot;
    }
    
    // 生成任務獎勵
    generateQuestReward(questLevel, difficulty = 'normal', playerLuck = 0) {
        const loot = [];
        const luckBonus = playerLuck * LOOT_CONFIG.luckMultiplier;
        
        // 根據難度調整獎勵
        const difficultyMultipliers = {
            easy: 0.8,
            normal: 1.0,
            hard: 1.3,
            epic: 1.6
        };
        const multiplier = difficultyMultipliers[difficulty] || 1.0;
        
        // 金幣獎勵
        const baseGold = 100 + questLevel * 20;
        loot.push(generateGold(Math.floor(baseGold * multiplier), questLevel));
        
        // 經驗藥水
        if (Math.random() < 0.5 * multiplier) {
            loot.push(generatePotion('hp', questLevel));
        }
        
        // 裝備獎勵
        const rarityBonus = (difficulty === 'hard' ? 0.1 : difficulty === 'epic' ? 0.2 : 0) + luckBonus;
        const equipmentTypes = ['weapon', 'armor', 'helmet', 'ring', 'amulet'];
        const type = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
        loot.push(generateEquipment(type, questLevel, null, rarityBonus));
        
        // 史詩難度額外獎勵
        if (difficulty === 'epic' && Math.random() < 0.3) {
            const type2 = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
            loot.push(generateEquipment(type2, questLevel, null, rarityBonus));
        }
        
        this.logDrop({
            type: 'quest',
            difficulty,
            level: questLevel,
            items: loot.length,
            timestamp: Date.now()
        });
        
        return loot;
    }
    
    // 生成 BOSS 專屬掉落
    generateBossLoot(bossLevel, bossType = 'normal', playerLuck = 0) {
        const loot = [];
        const luckBonus = playerLuck * LOOT_CONFIG.luckMultiplier;
        
        // BOSS 必定掉落多個物品
        const itemCount = 3 + Math.floor(Math.random() * 3); // 3-5 件
        
        for (let i = 0; i < itemCount; i++) {
            const equipmentTypes = ['weapon', 'armor', 'helmet', 'ring', 'amulet'];
            const type = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
            
            // BOSS 有更高機率掉落稀有裝備
            let forcedRarity = null;
            const rarityRoll = Math.random();
            if (rarityRoll < 0.3 + luckBonus) {
                forcedRarity = 'legendary';
            } else if (rarityRoll < 0.6 + luckBonus) {
                forcedRarity = 'epic';
            } else {
                forcedRarity = 'rare';
            }
            
            loot.push(generateEquipment(type, bossLevel, forcedRarity, luckBonus));
        }
        
        // 額外金幣
        const goldAmount = 300 + bossLevel * 50 + Math.floor(Math.random() * 200);
        loot.push(generateGold(goldAmount, bossLevel));
        
        this.logDrop({
            type: 'boss',
            bossType,
            level: bossLevel,
            items: loot.length,
            timestamp: Date.now()
        });
        
        return loot;
    }
    
    // 記錄掉落
    logDrop(dropData) {
        this.dropHistory.push(dropData);
        
        // 限制歷史記錄大小
        if (this.dropHistory.length > 1000) {
            this.dropHistory = this.dropHistory.slice(-500);
        }
    }
    
    // 獲取掉落統計
    getDropStatistics(timeRange = 3600000) { // 默認最近1小時
        const cutoff = Date.now() - timeRange;
        const recentDrops = this.dropHistory.filter(d => d.timestamp > cutoff);
        
        const stats = {
            total: recentDrops.length,
            byType: {},
            averageItems: 0
        };
        
        let totalItems = 0;
        
        recentDrops.forEach(drop => {
            stats.byType[drop.type] = (stats.byType[drop.type] || 0) + 1;
            totalItems += drop.items || 0;
        });
        
        if (recentDrops.length > 0) {
            stats.averageItems = (totalItems / recentDrops.length).toFixed(2);
        }
        
        return stats;
    }
    
    // 清除歷史
    clearHistory() {
        this.dropHistory = [];
    }
}

// ==========================================
// 快捷函數
// ==========================================

// 單例實例
let lootManagerInstance = null;

export function getLootManager() {
    if (!lootManagerInstance) {
        lootManagerInstance = new LootManager();
    }
    return lootManagerInstance;
}

// 快速生成掉落
export function quickGenerateEnemyDrop(enemyLevel, enemyType, playerStats = {}) {
    const manager = getLootManager();
    return manager.generateEnemyDrop(
        enemyLevel,
        enemyType,
        playerStats.luck || 0,
        playerStats.goldFind || 0
    );
}

export function quickGenerateChestLoot(chestType, playerLevel, playerStats = {}) {
    const manager = getLootManager();
    return manager.generateChestLoot(
        chestType,
        playerLevel,
        playerStats.luck || 0,
        playerStats.goldFind || 0
    );
}

export function quickGenerateBossLoot(bossLevel, bossType, playerStats = {}) {
    const manager = getLootManager();
    return manager.generateBossLoot(
        bossLevel,
        bossType,
        playerStats.luck || 0
    );
}

// 導出默認配置
export default {
    LootManager,
    LOOT_CONFIG,
    getLootManager,
    quickGenerateEnemyDrop,
    quickGenerateChestLoot,
    quickGenerateBossLoot
};
