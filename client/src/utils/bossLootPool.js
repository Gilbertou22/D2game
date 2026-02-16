// src/utils/bossLootPool.js
export const BOSS_UNIQUE_ITEMS = [
    // 通用傳說裝備（所有 BOSS 可能掉）
    { name: "惡魔之爪", type: 'weapon', rarity: 'legendary', power: 150, special: 'lifesteal 15%' },
    { name: "黑暗皇冠", type: 'helmet', rarity: 'legendary', power: 120, special: '+20% mana regen' },
    { name: "地獄護甲", type: 'armor', rarity: 'legendary', power: 200, special: '+30% damage resistance' },
    { name: "毀滅之戒", type: 'ring', rarity: 'legendary', power: 80, special: '+25% critical chance' },
    { name: "永恆護符", type: 'amulet', rarity: 'legendary', power: 100, special: '-20% skill cooldown' },

    // 高階 BOSS 專屬（level >= 20）
    { name: "地獄領主之刃", type: 'weapon', rarity: 'legendary', power: 300, special: 'cleave attack' },
    { name: "混沌之眼", type: 'amulet', rarity: 'legendary', power: 200, special: 'random skill cast on hit' }
];

export function generateBossExclusiveLoot(level) {
    const pool = BOSS_UNIQUE_ITEMS.filter(item =>
        !item.minLevel || level >= item.minLevel
    );

    const count = 2 + Math.floor(Math.random() * 3); // 2~4 件
    const loot = [];

    for (let i = 0; i < count; i++) {
        const item = pool[Math.floor(Math.random() * pool.length)];
        loot.push({
            ...item,
            level,
            rarityName: '傳說',
            rarityColor: '#ff00ff'
        });
    }

    return loot;
}