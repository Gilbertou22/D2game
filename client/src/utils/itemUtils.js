// 物品生成工具
import { rarities } from './rarities'; // 如果有 rarities.js，否則直接定義

const defaultRarities = [
    { name: "一般", color: "#ffffff", multiplier: 1.0 },
    { name: "高級", color: "#00ff00", multiplier: 1.5 },
    { name: "英雄", color: "#0088ff", multiplier: 2.0 },
    { name: "傳說", color: "#ff00ff", multiplier: 3.0 }
];

export function createItem(position, type = 'gold', level = 1) {
    const rand = Math.random() * 100;
    let rarity = defaultRarities[0];
    if (rand < 1) rarity = defaultRarities[3];
    else if (rand < 5) rarity = defaultRarities[2];
    else if (rand < 20) rarity = defaultRarities[1];

    return {
        type,
        level,
        position,
        rarityName: rarity.name,
        rarityColor: rarity.color,
        rarityMultiplier: rarity.multiplier
    };
}