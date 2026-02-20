// src/utils/itemSystem.js - 完整的物品和装备系统
import * as THREE from 'three';

// ==========================================
// 1. 稀有度定義
// ==========================================
export const RARITIES = {
    common: {
        name: '普通',
        nameEn: 'Common',
        color: '#9d9d9d',
        bgColor: '#2a2a2a',
        borderColor: '#666666',
        particleColor: 0x888888,
        multiplier: 1.0,
        maxAffixes: 0,
        dropWeight: 60,
        goldMin: 20,
        goldMax: 80,
        rewardMin: 1,
        rewardMax: 3
    },
    uncommon: {
        name: '魔法',
        nameEn: 'Magic',
        color: '#1eff00',
        bgColor: '#0a1a0a',
        borderColor: '#1eff00',
        particleColor: 0x4444ff,
        multiplier: 1.3,
        maxAffixes: 2,
        dropWeight: 25,
        goldMin: 80,
        goldMax: 200,
        rewardMin: 2,
        rewardMax: 5
    },
    rare: {
        name: '稀有',
        nameEn: 'Rare',
        color: '#0070dd',
        bgColor: '#0a0a1a',
        borderColor: '#0070dd',
        particleColor: 0xffff44,
        multiplier: 1.6,
        maxAffixes: 4,
        dropWeight: 12,
        goldMin: 150,
        goldMax: 400,
        rewardMin: 3,
        rewardMax: 6
    },
    epic: {
        name: '史詩',
        nameEn: 'Epic',
        color: '#a335ee',
        bgColor: '#1a0a1a',
        borderColor: '#a335ee',
        particleColor: 0xff8800,
        multiplier: 2.0,
        maxAffixes: 5,
        dropWeight: 2.5,
        goldMin: 300,
        goldMax: 600,
        rewardMin: 4,
        rewardMax: 7
    },
    legendary: {
        name: '傳說',
        nameEn: 'Legendary',
        color: '#ff8000',
        bgColor: '#1a0f00',
        borderColor: '#ff8000',
        particleColor: 0xff00ff,
        multiplier: 2.5,
        maxAffixes: 6,
        dropWeight: 0.5,
        goldMin: 500,
        goldMax: 1000,
        rewardMin: 5,
        rewardMax: 9
    }
};

// 兼容舊版導出
export const rarities = Object.values(RARITIES);

// ==========================================
// 2. 装备类型定义
// ==========================================
export const EQUIPMENT_TYPES = {
    weapon: {
        name: '武器',
        icon: '⚔️',
        slot: 'weapon',
        baseStats: ['attack', 'critChance'],
        possibleAffixes: ['attack', 'attackPercent', 'fireDamage', 'iceDamage', 'lightningDamage', 'critChance', 'critDamage', 'attackSpeed', 'castSpeed', 'lifeSteal', 'igniteChance', 'freezeChance', 'shockChance', 'skillLevel']
    },
    armor: {
        name: '護甲',
        icon: '🛡️',
        slot: 'armor',
        baseStats: ['defense', 'hp'],
        possibleAffixes: ['defense', 'defensePercent', 'hp', 'hpPercent', 'hpRegen', 'damageReduction', 'resistance', 'fireResist', 'iceResist', 'lightningResist', 'strength', 'allStats']
    },
    helmet: {
        name: '頭盔',
        icon: '⛑️',
        slot: 'helmet',
        baseStats: ['defense', 'mana'],
        possibleAffixes: ['defense', 'hp', 'hpRegen', 'mana', 'manaRegen', 'resistance', 'cooldownReduction', 'manaCostReduction', 'intelligence', 'allStats']
    },
    ring: {
        name: '戒指',
        icon: '💍',
        slot: 'ring',
        baseStats: ['attack', 'defense'],
        possibleAffixes: ['attack', 'defense', 'hp', 'mana', 'critChance', 'critDamage', 'attackSpeed', 'goldFind', 'expBonus', 'allStats']
    },
    amulet: {
        name: '項鍊',
        icon: '📿',
        slot: 'amulet',
        baseStats: ['hp', 'mana'],
        possibleAffixes: ['hp', 'hpPercent', 'mana', 'manaPercent', 'allStats', 'lifeSteal', 'manaSteal', 'cooldownReduction', 'manaCostReduction', 'areaIncrease', 'skillLevel', 'movementSpeed']
    }
};

// ==========================================
// 3. 詞綴群組定義 (移動端優化)
// ==========================================
export const AFFIX_GROUPS = {
    MaxLife: {
        name: '生命',
        max: 1,
        description: '最大生命、%最大生命、生命回復'
    },
    Resource: {
        name: '資源',
        max: 1,
        description: '最大魔力、能量、怒氣、%回復'
    },
    PhysicalDamage: {
        name: '物理傷害',
        max: 1,
        description: '物理傷害、%物理傷害'
    },
    ElementalDamage: {
        name: '元素傷害',
        max: 2,
        description: '火焰/冰/雷傷害%、轉換傷害'
    },
    AttackSpeed: {
        name: '攻擊速度',
        max: 1,
        description: '攻擊速度%、施法速度%'
    },
    Critical: {
        name: '暴擊',
        max: 1,
        description: '暴擊率、暴擊傷害'
    },
    Resistances: {
        name: '抗性',
        max: 2,
        description: '全抗、單元素抗性'
    },
    Defense: {
        name: '防禦',
        max: 1,
        description: '護甲、%護甲、閃避、格擋'
    },
    MovementSpeed: {
        name: '移動速度',
        max: 1,
        description: '移動速度%'
    },
    SkillLevel: {
        name: '技能等級',
        max: 1,
        description: '技能等級、特定職業技能'
    },
    Leech: {
        name: '偷取',
        max: 1,
        description: '生命/魔力偷取'
    },
    Ailment: {
        name: '異常狀態',
        max: 1,
        description: '點燃/冰凍/感電機率與持續'
    },
    Utility: {
        name: '輔助',
        max: 2,
        description: '魔力消耗減少、冷卻縮短、範圍擴大'
    },
    Attribute: {
        name: '屬性',
        max: 1,
        description: '力量/敏捷/智力'
    },
    GoldExp: {
        name: '金幣經驗',
        max: 1,
        description: '金幣獲取、經驗加成'
    }
};

// ==========================================
// 4. 属性词缀定义
// ==========================================
export const AFFIXES = {
    // 生命類 (MaxLife)
    hp: {
        name: '生命值',
        group: 'MaxLife',
        suffixes: ['之血', '的生命', '的活力', '的坚韧'],
        getValue: (level, rarity) => Math.floor((30 + level * 8) * RARITIES[rarity].multiplier),
        format: (val) => `+${val} 生命值`
    },
    hpPercent: {
        name: '最大生命',
        group: 'MaxLife',
        suffixes: ['之血', '的生命', '的活力'],
        getValue: (level, rarity) => Math.floor((2 + level * 0.15) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 最大生命`
    },
    hpRegen: {
        name: '生命恢復',
        group: 'MaxLife',
        suffixes: ['的恢復', '的再生', '的治愈'],
        getValue: (level, rarity) => Math.floor((2 + level * 0.3) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}/秒 生命恢復`
    },
    
    // 資源類 (Resource)
    mana: {
        name: '魔力值',
        group: 'Resource',
        suffixes: ['之藍', '的魔力', '的法術', '的神秘'],
        getValue: (level, rarity) => Math.floor((20 + level * 6) * RARITIES[rarity].multiplier),
        format: (val) => `+${val} 魔力值`
    },
    manaPercent: {
        name: '最大魔力',
        group: 'Resource',
        suffixes: ['之藍', '的魔力'],
        getValue: (level, rarity) => Math.floor((2 + level * 0.12) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 最大魔力`
    },
    manaRegen: {
        name: '魔力恢復',
        group: 'Resource',
        suffixes: ['的冥想', '的專注', '的清晰'],
        getValue: (level, rarity) => Math.floor((1.5 + level * 0.2) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}/秒 魔力恢復`
    },
    
    // 物理傷害類 (PhysicalDamage)
    attack: {
        name: '攻擊力',
        group: 'PhysicalDamage',
        suffixes: ['之力', '的毀滅', '的屠殺', '的破壞'],
        getValue: (level, rarity) => Math.floor((10 + level * 3) * RARITIES[rarity].multiplier),
        format: (val) => `+${val} 攻擊力`
    },
    attackPercent: {
        name: '攻擊力%',
        group: 'PhysicalDamage',
        suffixes: ['之力', '的毀滅'],
        getValue: (level, rarity) => Math.floor((3 + level * 0.2) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 攻擊力`
    },
    
    // 元素傷害類 (ElementalDamage) - max 2
    fireDamage: {
        name: '火焰傷害',
        group: 'ElementalDamage',
        suffixes: ['之焰', '的燃燒', '的熾熱'],
        getValue: (level, rarity) => Math.floor((5 + level * 2) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 火焰傷害`
    },
    iceDamage: {
        name: '冰霜傷害',
        group: 'ElementalDamage',
        suffixes: ['之霜', '的冰凍', '的寒冰'],
        getValue: (level, rarity) => Math.floor((5 + level * 2) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 冰霜傷害`
    },
    lightningDamage: {
        name: '閃電傷害',
        group: 'ElementalDamage',
        suffixes: ['之雷', '的閃電', '的雷電'],
        getValue: (level, rarity) => Math.floor((5 + level * 2) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 閃電傷害`
    },
    
    // 攻擊速度類 (AttackSpeed)
    attackSpeed: {
        name: '攻擊速度',
        group: 'AttackSpeed',
        suffixes: ['的迅捷', '的狂風', '的颶風'],
        getValue: (level, rarity) => Math.floor((5 + level * 0.3) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 攻擊速度`
    },
    castSpeed: {
        name: '施法速度',
        group: 'AttackSpeed',
        suffixes: ['的迅捷', '的流暢'],
        getValue: (level, rarity) => Math.floor((4 + level * 0.25) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 施法速度`
    },
    
    // 暴擊類 (Critical)
    critChance: {
        name: '暴擊率',
        group: 'Critical',
        suffixes: ['的精準', '的致命', '的收割'],
        getValue: (level, rarity) => Math.floor((3 + level * 0.2) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 暴擊率`
    },
    critDamage: {
        name: '暴擊傷害',
        group: 'Critical',
        suffixes: ['的毀滅', '的破壞', '的湮滅'],
        getValue: (level, rarity) => Math.floor((10 + level * 1.5) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 暴擊傷害`
    },
    
    // 抗性類 (Resistances) - max 2
    resistance: {
        name: '全元素抗性',
        group: 'Resistances',
        suffixes: ['的抵抗', '的防護', '的屏障'],
        getValue: (level, rarity) => Math.floor((5 + level * 0.5) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 全元素抗性`
    },
    fireResist: {
        name: '火焰抗性',
        group: 'Resistances',
        suffixes: ['的火焰抵抗', '的熾熱防護'],
        getValue: (level, rarity) => Math.floor((8 + level * 0.8) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 火焰抗性`
    },
    iceResist: {
        name: '冰霜抗性',
        group: 'Resistances',
        suffixes: ['的冰霜抵抗', '的寒冰防護'],
        getValue: (level, rarity) => Math.floor((8 + level * 0.8) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 冰霜抗性`
    },
    lightningResist: {
        name: '閃電抗性',
        group: 'Resistances',
        suffixes: ['的閃電抵抗', '的雷電防護'],
        getValue: (level, rarity) => Math.floor((8 + level * 0.8) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 閃電抗性`
    },
    
    // 防禦類 (Defense)
    defense: {
        name: '防禦力',
        group: 'Defense',
        suffixes: ['之盾', '的守護', '的保護', '的鋼鐵'],
        getValue: (level, rarity) => Math.floor((8 + level * 2.5) * RARITIES[rarity].multiplier),
        format: (val) => `+${val} 防禦力`
    },
    defensePercent: {
        name: '防禦力%',
        group: 'Defense',
        suffixes: ['之盾', '的守護'],
        getValue: (level, rarity) => Math.floor((3 + level * 0.2) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 防禦力`
    },
    damageReduction: {
        name: '傷害減免',
        group: 'Defense',
        suffixes: ['的堅韌', '的吸收', '的緩衝'],
        getValue: (level, rarity) => Math.floor((3 + level * 0.2) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 傷害減免`
    },
    
    // 移動速度類 (MovementSpeed)
    movementSpeed: {
        name: '移動速度',
        group: 'MovementSpeed',
        suffixes: ['的疾風', '的迅捷', '的飛馳'],
        getValue: (level, rarity) => Math.floor((5 + level * 0.4) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 移動速度`
    },
    
    // 技能等級類 (SkillLevel)
    skillLevel: {
        name: '技能等級',
        group: 'SkillLevel',
        suffixes: ['的精通', '的專精'],
        getValue: (level, rarity) => Math.min(3, Math.floor((1 + level * 0.05) * RARITIES[rarity].multiplier)),
        format: (val) => `+${val} 技能等級`
    },
    
    // 偷取類 (Leech)
    lifeSteal: {
        name: '生命偷取',
        group: 'Leech',
        suffixes: ['的吸血鬼', '的鮮血', '的嗜血'],
        getValue: (level, rarity) => Math.floor((2 + level * 0.15) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 生命偷取`
    },
    manaSteal: {
        name: '魔力偷取',
        group: 'Leech',
        suffixes: ['的吸魔', '的竊取', '的榨取'],
        getValue: (level, rarity) => Math.floor((1 + level * 0.1) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 魔力偷取`
    },
    
    // 異常狀態類 (Ailment)
    igniteChance: {
        name: '點燃機率',
        group: 'Ailment',
        suffixes: ['的燃燒', '的熾熱'],
        getValue: (level, rarity) => Math.floor((5 + level * 0.3) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 點燃機率`
    },
    freezeChance: {
        name: '冰凍機率',
        group: 'Ailment',
        suffixes: ['的冰凍', '的寒冰'],
        getValue: (level, rarity) => Math.floor((5 + level * 0.3) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 冰凍機率`
    },
    shockChance: {
        name: '感電機率',
        group: 'Ailment',
        suffixes: ['的感電', '的雷電'],
        getValue: (level, rarity) => Math.floor((5 + level * 0.3) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 感電機率`
    },
    
    // 輔助類 (Utility) - max 2
    cooldownReduction: {
        name: '冷卻縮減',
        group: 'Utility',
        suffixes: ['的急速', '的流暢', '的迅捷'],
        getValue: (level, rarity) => Math.floor((3 + level * 0.15) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 冷卻縮減`
    },
    manaCostReduction: {
        name: '魔力消耗減少',
        group: 'Utility',
        suffixes: ['的節能', '的省魔'],
        getValue: (level, rarity) => Math.floor((3 + level * 0.2) * RARITIES[rarity].multiplier),
        format: (val) => `-${val}% 魔力消耗`
    },
    areaIncrease: {
        name: '範圍擴大',
        group: 'Utility',
        suffixes: ['的廣域', '的擴散'],
        getValue: (level, rarity) => Math.floor((5 + level * 0.3) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 技能範圍`
    },
    
    // 屬性類 (Attribute)
    strength: {
        name: '力量',
        group: 'Attribute',
        suffixes: ['的力量', '的強壯'],
        getValue: (level, rarity) => Math.floor((3 + level * 0.4) * RARITIES[rarity].multiplier),
        format: (val) => `+${val} 力量`
    },
    dexterity: {
        name: '敏捷',
        group: 'Attribute',
        suffixes: ['的敏捷', '的靈巧'],
        getValue: (level, rarity) => Math.floor((3 + level * 0.4) * RARITIES[rarity].multiplier),
        format: (val) => `+${val} 敏捷`
    },
    intelligence: {
        name: '智力',
        group: 'Attribute',
        suffixes: ['的智力', '的智慧'],
        getValue: (level, rarity) => Math.floor((3 + level * 0.4) * RARITIES[rarity].multiplier),
        format: (val) => `+${val} 智力`
    },
    allStats: {
        name: '全屬性',
        group: 'Attribute',
        suffixes: ['的均衡', '的完美', '的和諧'],
        getValue: (level, rarity) => Math.floor((2 + level * 0.3) * RARITIES[rarity].multiplier),
        format: (val) => `+${val} 所有屬性`
    },
    
    // 金幣經驗類 (GoldExp)
    goldFind: {
        name: '金幣獲取',
        group: 'GoldExp',
        suffixes: ['的財富', '的貪婪', '的幸運'],
        getValue: (level, rarity) => Math.floor((10 + level * 1) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 金幣獲取`
    },
    expBonus: {
        name: '經驗加成',
        group: 'GoldExp',
        suffixes: ['的智慧', '的學識', '的啟迪'],
        getValue: (level, rarity) => Math.floor((5 + level * 0.5) * RARITIES[rarity].multiplier),
        format: (val) => `+${val}% 經驗加成`
    }
};

// ==========================================
// 4. 装备名称前缀
// ==========================================
const NAME_PREFIXES = {
    weapon: ['锋利', '精钢', '符文', '元素', '暗影', '圣光', '远古', '传说'],
    armor: ['坚固', '板甲', '魔纹', '龙鳞', '暗影', '圣光', '远古', '传说'],
    helmet: ['铁铸', '钢盔', '魔导', '龙角', '暗影', '圣光', '远古', '传说'],
    ring: ['银制', '金制', '秘银', '龙血', '暗影', '圣光', '远古', '传说'],
    amulet: [' bone', '水晶', '灵魂', '龙心', '暗影', '圣光', '远古', '传说']
};

// ==========================================
// 5. 套裝定義
// ==========================================
export const EQUIPMENT_SETS = {
    暗影獵手: {
        name: '暗影獵手',
        nameEn: 'Shadow Hunter',
        color: '#9933ff',
        pieces: ['weapon', 'armor', 'helmet'],
        bonuses: {
            2: { stats: { attack: 15, critChance: 5 }, description: '+15 攻擊力, +5% 暴擊率' },
            3: { stats: { attack: 30, critDamage: 20, lifeSteal: 10 }, description: '+30 攻擊力, +20% 暴擊傷害, +10% 生命偷取' }
        }
    },
    龍之守護: {
        name: '龍之守護',
        nameEn: 'Dragon Guardian',
        color: '#ff6600',
        pieces: ['armor', 'helmet', 'ring'],
        bonuses: {
            2: { stats: { defense: 20, hp: 100 }, description: '+20 防禦力, +100 生命值' },
            3: { stats: { defense: 40, damageReduction: 15, resistance: 15 }, description: '+40 防禦力, +15% 傷害減免, +15% 元素抗性' }
        }
    },
    奧術法師: {
        name: '奧術法師',
        nameEn: 'Arcane Mage',
        color: '#00ccff',
        pieces: ['weapon', 'amulet', 'ring'],
        bonuses: {
            2: { stats: { mana: 100, manaRegen: 5 }, description: '+100 魔力值, +5/秒 魔力恢復' },
            3: { stats: { mana: 200, cooldownReduction: 15, manaSteal: 5 }, description: '+200 魔力值, +15% 冷卻縮減, +5% 魔力偷取' }
        }
    },
    死亡騎士: {
        name: '死亡騎士',
        nameEn: 'Death Knight',
        color: '#cc0000',
        pieces: ['weapon', 'armor', 'amulet'],
        bonuses: {
            2: { stats: { hp: 150, defense: 15 }, description: '+150 生命值, +15 防禦力' },
            3: { stats: { hp: 300, lifeSteal: 15, damageReduction: 10 }, description: '+300 生命值, +15% 生命偷取, +10% 傷害減免' }
        }
    }
};

// ==========================================
// 6. 升級獎勵系統
// ==========================================
export const LEVEL_UP_REWARDS = {
    // 攻擊類獎勵
    attack: {
        type: 'stat',
        stat: 'playerAttackPower',
        name: '攻擊力強化',
        description: '攻擊力 +15',
        icon: '⚔️',
        value: 15,
        color: '#ff4444'
    },
    critChance: {
        type: 'stat',
        stat: 'playerCritChance',
        name: '暴擊率覺醒',
        description: '暴擊率 +3%',
        icon: '🎯',
        value: 3,
        color: '#ffdd00'
    },
    critDamage: {
        type: 'stat',
        stat: 'playerCritDamage',
        name: '暴擊傷害加成',
        description: '暴擊傷害 +10%',
        icon: '💥',
        value: 10,
        color: '#ff8800'
    },
    attackSpeed: {
        type: 'stat',
        stat: 'playerAttackSpeed',
        name: '攻擊速度提升',
        description: '攻擊速度 +5%',
        icon: '⚡',
        value: 5,
        color: '#ffff00'
    },
    lifeSteal: {
        type: 'stat',
        stat: 'playerLifeSteal',
        name: '生命偷取強化',
        description: '生命偷取 +3%',
        icon: '🩸',
        value: 3,
        color: '#ff0000'
    },
    
    // 防禦類獎勵
    defense: {
        type: 'stat',
        stat: 'playerDefense',
        name: '防禦力強化',
        description: '防禦力 +10',
        icon: '🛡️',
        value: 10,
        color: '#4488ff'
    },
    maxHP: {
        type: 'stat',
        stat: 'playerMaxHPBonus',
        name: '生命上限提升',
        description: '最大生命 +50',
        icon: '❤️',
        value: 50,
        color: '#ff4444'
    },
    hpRegen: {
        type: 'stat',
        stat: 'playerManaRegen',
        name: '生命恢復強化',
        description: '生命恢復 +2/秒',
        icon: '💚',
        value: 2,
        color: '#00ff88'
    },
    damageReduction: {
        type: 'stat',
        stat: 'playerDamageReduction',
        name: '傷害減免',
        description: '傷害減免 +3%',
        icon: '🛡️',
        value: 3,
        color: '#4488ff'
    },
    resistance: {
        type: 'stat',
        stat: 'playerResistance',
        name: '元素抗性',
        description: '元素抗性 +5%',
        icon: '🔥',
        value: 5,
        color: '#aa44ff'
    },
    
    // 魔法類獎勵
    maxMana: {
        type: 'stat',
        stat: 'playerMaxManaBonus',
        name: '魔力上限提升',
        description: '最大魔力 +40',
        icon: '💙',
        value: 40,
        color: '#4444ff'
    },
    manaRegen: {
        type: 'stat',
        stat: 'playerManaRegen',
        name: '魔力恢復',
        description: '魔力恢復 +2/秒',
        icon: '💎',
        value: 2,
        color: '#00ccff'
    },
    cooldownReduction: {
        type: 'stat',
        stat: 'playerCooldownReduction',
        name: '冷卻縮減',
        description: '冷卻縮減 +3%',
        icon: '⏱️',
        value: 3,
        color: '#ff88ff'
    },
    
    // 實用類獎勵
    movementSpeed: {
        type: 'stat',
        stat: 'playerMoveSpeedBonus',
        name: '移動速度',
        description: '移動速度 +3%',
        icon: '👟',
        value: 3,
        color: '#88ff88'
    },
    goldFind: {
        type: 'stat',
        stat: 'playerGoldFind',
        name: '金幣獲取',
        description: '金幣獲取 +10%',
        icon: '💰',
        value: 10,
        color: '#ffd700'
    },
    expBonus: {
        type: 'stat',
        stat: 'playerExpBonus',
        name: '經驗加成',
        description: '經驗加成 +10%',
        icon: '📖',
        value: 10,
        color: '#ff88ff'
    },
    allStats: {
        type: 'stat',
        stat: 'playerAllStats',
        name: '全屬性強化',
        description: '全屬性 +5',
        icon: '⭐',
        value: 5,
        color: '#ffdd00'
    },
    
    // 道具類獎勵
    hpPotion: {
        type: 'item',
        name: '生命藥水',
        description: '獲得 3 瓶生命藥水',
        icon: '❤️',
        item: { type: 'hp_potion', count: 3 },
        color: '#ff4444'
    },
    manaPotion: {
        type: 'item',
        name: '魔力藥水',
        description: '獲得 3 瓶魔力藥水',
        icon: '💙',
        item: { type: 'mana_potion', count: 3 },
        color: '#4444ff'
    },
    goldReward: {
        type: 'gold',
        name: '金幣獎勵',
        description: '獲得 100 金幣',
        icon: '💰',
        amount: 100,
        color: '#ffd700'
    }
};

// 根據等級生成隨機獎勵選項
export function generateLevelUpRewards(playerLevel, count = 3) {
    const rewardKeys = Object.keys(LEVEL_UP_REWARDS);
    const selected = [];
    const used = new Set();
    
    // 根據等級調整獎勵權重
    const getWeight = (key) => {
        const reward = LEVEL_UP_REWARDS[key];
        if (reward.type === 'stat') {
            // 基礎/防禦類在前期更重要
            if (['maxHP', 'defense', 'attack'].includes(reward.stat)) {
                return playerLevel <= 5 ? 3 : 1;
            }
            // 後期解鎖更多進階獎勵
            if (playerLevel < 10 && ['cooldownReduction', 'lifeSteal', 'damageReduction'].includes(reward.stat)) {
                return 0.3;
            }
        }
        return 1;
    };
    
    while (selected.length < count && selected.length < rewardKeys.length) {
        const weighted = rewardKeys.filter(k => !used.has(k)).map(k => ({
            key: k,
            weight: getWeight(k)
        }));
        
        const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
        let rand = Math.random() * totalWeight;
        
        for (const w of weighted) {
            rand -= w.weight;
            if (rand <= 0) {
                selected.push({
                    id: Math.random().toString(36).substr(2, 9),
                    key: w.key,
                    ...LEVEL_UP_REWARDS[w.key]
                });
                used.add(w.key);
                break;
            }
        }
    }
    
    return selected;
}

// 應用獎勵
export function applyLevelUpReward(currentStats, reward) {
    if (reward.type === 'stat') {
        return {
            [reward.stat]: (currentStats[reward.stat] || 0) + reward.value
        };
    }
    return null;
}

// ==========================================
// 7. 生成隨機稀有度
// ==========================================
export function getRandomRarity(bonus = 0) {
    const totalWeight = Object.values(RARITIES).reduce((sum, r) => sum + r.dropWeight, 0);
    let rand = Math.random() * totalWeight * (1 - bonus);
    
    for (const [key, rarity] of Object.entries(RARITIES)) {
        rand -= rarity.dropWeight;
        if (rand <= 0) return key;
    }
    return 'common';
}

// ==========================================
// 6. 生成词缀 (使用群組限制)
// ==========================================
function generateAffixes(type, rarity, level) {
    const rarityData = RARITIES[rarity];
    const numAffixes = Math.floor(Math.random() * (rarityData.maxAffixes + 1));
    const affixList = [];
    
    if (numAffixes === 0) return affixList;
    
    const possibleAffixes = EQUIPMENT_TYPES[type].possibleAffixes;
    const usedAffixes = new Set();
    const groupCounts = {};
    
    for (let i = 0; i < numAffixes; i++) {
        const available = possibleAffixes.filter(a => {
            if (usedAffixes.has(a)) return false;
            
            const affix = AFFIXES[a];
            if (!affix || !affix.group) return true;
            
            const group = AFFIX_GROUPS[affix.group];
            if (!group) return true;
            
            const currentCount = groupCounts[affix.group] || 0;
            return currentCount < group.max;
        });
        
        if (available.length === 0) break;
        
        const affixKey = available[Math.floor(Math.random() * available.length)];
        usedAffixes.add(affixKey);
        
        const affix = AFFIXES[affixKey];
        if (affix.group) {
            groupCounts[affix.group] = (groupCounts[affix.group] || 0) + 1;
        }
        
        const value = affix.getValue(level, rarity);
        
        affixList.push({
            key: affixKey,
            name: affix.name,
            value: value,
            display: affix.format(value),
            group: affix.group,
            suffix: affix.suffixes[Math.floor(Math.random() * affix.suffixes.length)]
        });
    }
    
    return affixList;
}

// ==========================================
// 7. 生成装备名称
// ==========================================
function generateItemName(type, rarity, affixes) {
    const rarityData = RARITIES[rarity];
    const prefixes = NAME_PREFIXES[type];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const typeName = EQUIPMENT_TYPES[type].name;
    
    if (rarity === 'common') {
        return `${prefix}${typeName}`;
    }
    
    if (rarity === 'uncommon' && affixes.length > 0) {
        return `${prefix}${typeName}${affixes[0].suffix}`;
    }
    
    if (rarity === 'rare') {
        const namePool = ['屠龙者', '暗影之刃', '圣光守护', '元素之心', '远古神器', '龙血契约'];
        return namePool[Math.floor(Math.random() * namePool.length)];
    }
    
    if (rarity === 'epic' || rarity === 'legendary') {
        const epicNames = {
            weapon: ['末日审判者', '虚空吞噬者', '星辰毁灭者', '诸神黄昏'],
            armor: ['永恒壁垒', '虚空铠甲', '龙神庇护', '神圣守护'],
            helmet: ['智慧之冠', '虚空视界', '龙息头盔', '神谕之眼'],
            ring: ['无限之力', '虚空指环', '龙血印记', '命运之轮'],
            amulet: ['永恒之心', '虚空项链', '龙之灵魂', '神圣遗物']
        };
        const names = epicNames[type];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    return `${prefix}${typeName}`;
}

// ==========================================
// 8. 生成完整裝備
// ==========================================
export function generateEquipment(type, level = 1, forcedRarity = null, rarityBonus = 0) {
    const rarity = forcedRarity || getRandomRarity(rarityBonus);
    const rarityData = RARITIES[rarity];
    const affixes = generateAffixes(type, rarity, level);
    
    // 计算基础属性
    const baseStats = {};
    EQUIPMENT_TYPES[type].baseStats.forEach(statKey => {
        if (AFFIXES[statKey]) {
            baseStats[statKey] = AFFIXES[statKey].getValue(level, rarity);
        }
    });
    
    // 合并词缀属性
    const allStats = { ...baseStats };
    affixes.forEach(affix => {
        if (allStats[affix.key]) {
            allStats[affix.key] += affix.value;
        } else {
            allStats[affix.key] = affix.value;
        }
    });
    
    // 計算物品價值
    const baseValue = level * 10;
    const value = Math.floor(baseValue * rarityData.multiplier * (1 + affixes.length * 0.2));
    
    // 套裝判定（史詩和傳說有幾率成為套裝部件）
    let setName = null;
    let setInfo = null;
    if ((rarity === 'epic' || rarity === 'legendary') && Math.random() < 0.3) {
        const availableSets = Object.values(EQUIPMENT_SETS).filter(set => 
            set.pieces.includes(type)
        );
        if (availableSets.length > 0) {
            setInfo = availableSets[Math.floor(Math.random() * availableSets.length)];
            setName = setInfo.name;
        }
    }
    
    const item = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        level,
        rarity,
        name: generateItemName(type, rarity, affixes),
        icon: EQUIPMENT_TYPES[type].icon,
        rarityData,
        affixes,
        stats: allStats,
        value,
        identified: rarity === 'common',
        setName,
        setPiece: setInfo ? setInfo.pieces.indexOf(type) + 1 : null
    };
    
    if (setName) {
        item.rarityColor = setInfo.color;
    }
    
    return item;
}

// ==========================================
// 9. 生成药水
// ==========================================
export function generatePotion(type = 'hp', level = 1) {
    const isHp = type === 'hp';
    const baseAmount = isHp ? 50 : 40;
    const amount = Math.floor(baseAmount + level * (isHp ? 10 : 8));
    
    return {
        id: Math.random().toString(36).substr(2, 9),
        type: isHp ? 'hp_potion' : 'mana_potion',
        level,
        name: isHp ? '生命药水' : '魔力药水',
        icon: isHp ? '❤️' : '💙',
        rarity: 'common',
        rarityData: RARITIES.common,
        effect: { type: isHp ? 'heal' : 'restore_mana', amount },
        value: Math.floor(10 + level * 2),
        stackable: true,
        maxStack: 99
    };
}

// ==========================================
// 10. 生成金币堆
// ==========================================
export function generateGold(amount = null, level = 1) {
    const baseAmount = amount || Math.floor(10 + Math.random() * 50 + level * 5);
    
    return {
        id: Math.random().toString(36).substr(2, 9),
        type: 'gold',
        name: `${baseAmount} 金币`,
        icon: '💰',
        amount: baseAmount,
        rarity: 'common',
        rarityData: RARITIES.common,
        value: baseAmount,
        stackable: true,
        maxStack: 99999
    };
}

// ==========================================
// 10b. 鑑定卷軸
// ==========================================
export function generateIdentificationScroll(level = 1) {
    return {
        id: Math.random().toString(36).substr(2, 9),
        type: 'identification_scroll',
        level,
        name: '鑑定卷軸',
        icon: '🔮',
        rarity: 'uncommon',
        rarityData: RARITIES.uncommon,
        value: Math.floor(50 + level * 10),
        stackable: true,
        maxStack: 99
    };
}

// 鑑定物品
export function identifyItem(item) {
    if (!item) return item;
    if (item.identified) return item;
    
    return {
        ...item,
        identified: true,
        name: item.name // 鑑定後顯示真實名稱
    };
}

// 獲取物品是否可鑑定
export function isItemIdentifiable(item) {
    if (!item) return false;
    if (item.type === 'gold' || item.type === 'hp_potion' || item.type === 'mana_potion' || item.type === 'identification_scroll') {
        return false;
    }
    return !item.identified && item.rarity !== 'common';
}

// 鑑定費用計算
export function getIdentificationCost(item) {
    if (!item) return 0;
    const baseCost = 25;
    const rarityMultiplier = {
        uncommon: 1.5,
        rare: 3,
        epic: 6,
        legendary: 12
    };
    return Math.floor(baseCost * (rarityMultiplier[item.rarity] || 1) * (item.level || 1));
}

// ==========================================
// 11. 生成掉落物品
// ==========================================
export function generateLoot(enemyLevel = 1, enemyType = 'normal', chestType = null) {
    const loot = [];
    
    // 金币掉落
    const goldAmount = Math.floor(10 + enemyLevel * 5 + Math.random() * 30);
    loot.push(generateGold(goldAmount, enemyLevel));
    
    // 药水掉落 (30% 概率)
    if (Math.random() < 0.3) {
        loot.push(generatePotion(Math.random() > 0.5 ? 'hp' : 'mana', enemyLevel));
    }
    
    // 鑑定卷軸掉落 (5% 概率，精英和BOSS更高)
    const scrollChance = enemyType === 'boss' ? 0.2 : enemyType === 'elite' ? 0.1 : 0.05;
    if (Math.random() < scrollChance) {
        loot.push(generateIdentificationScroll(enemyLevel));
    }
    
    // 装备掉落
    let dropChance = enemyType === 'boss' ? 0.8 : enemyType === 'elite' ? 0.5 : 0.25;
    
    if (chestType) {
        // 宝箱掉落
        const chestMultipliers = {
            normal: 1,
            magic: 1.5,
            rare: 2,
            legendary: 3
        };
        dropChance = 1; // 宝箱必定掉落装备
        
        const types = Object.keys(EQUIPMENT_TYPES);
        const numItems = Math.floor(Math.random() * 2) + 1;
        
        for (let i = 0; i < numItems; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const rarityBonus = (chestMultipliers[chestType] || 1) * 0.1;
            const item = generateEquipment(type, enemyLevel, getRandomRarity(rarityBonus));
            loot.push(item);
        }
    } else if (Math.random() < dropChance) {
        // 敌人掉落装备
        const types = Object.keys(EQUIPMENT_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Boss 有更高稀有度
        const rarityBonus = enemyType === 'boss' ? 0.15 : enemyType === 'elite' ? 0.08 : 0;
        const item = generateEquipment(type, enemyLevel, getRandomRarity(rarityBonus));
        loot.push(item);
    }
    
    return loot;
}

// ==========================================
// 12. 计算装备属性总和
// ==========================================
export function calculateTotalStats(equipped) {
    const totals = {
        attack: 0,
        defense: 0,
        hp: 0,
        mana: 0,
        hpRegen: 0,
        manaRegen: 0,
        critChance: 0,
        critDamage: 0,
        attackSpeed: 0,
        lifeSteal: 0,
        damageReduction: 0,
        resistance: 0,
        movementSpeed: 0,
        goldFind: 0,
        expBonus: 0
    };
    
    Object.values(equipped).forEach(item => {
        if (item && item.stats) {
            Object.entries(item.stats).forEach(([key, value]) => {
                if (totals[key] !== undefined) {
                    totals[key] += value;
                }
            });
        }
    });
    
    return totals;
}

// ==========================================
// 12b. 計算套裝加成
// ==========================================
export function calculateSetBonus(equipped) {
    const setCounts = {};
    const setItems = {};
    
    Object.values(equipped).forEach(item => {
        if (item && item.setName) {
            setCounts[item.setName] = (setCounts[item.setName] || 0) + 1;
            setItems[item.setName] = item;
        }
    });
    
    const bonuses = { stats: {}, activeSets: [] };
    
    Object.entries(setCounts).forEach(([setName, count]) => {
        const setData = EQUIPMENT_SETS[setName];
        if (!setData) return;
        
        Object.entries(setData.bonuses).forEach(([pieceCount, bonus]) => {
            if (count >= parseInt(pieceCount)) {
                bonuses.activeSets.push({
                    name: setName,
                    pieceCount: count,
                    bonus: bonus.description
                });
                Object.entries(bonus.stats).forEach(([stat, value]) => {
                    bonuses.stats[stat] = (bonuses.stats[stat] || 0) + value;
                });
            }
        });
    });
    
    return bonuses;
}

// ==========================================
// 13. 物品堆疊
// ==========================================
export function stackItems(items) {
    const stacked = [];
    const stacks = new Map();
    
    items.forEach(item => {
        if (item.stackable) {
            const key = `${item.type}_${item.level}`;
            if (stacks.has(key)) {
                const existing = stacks.get(key);
                if (item.type === 'gold') {
                    existing.amount += item.amount;
                    existing.name = `${existing.amount} 金币`;
                } else {
                    existing.quantity = (existing.quantity || 1) + 1;
                }
            } else {
                const newItem = { ...item, quantity: 1 };
                stacks.set(key, newItem);
                stacked.push(newItem);
            }
        } else {
            stacked.push(item);
        }
    });
    
    return stacked;
}

// ==========================================
// 14. 比较装备
// ==========================================
export function compareItems(currentItem, newItem) {
    if (!currentItem) return { better: true, differences: [] };
    if (!newItem) return { better: false, differences: [] };
    
    const differences = [];
    const allKeys = new Set([
        ...Object.keys(currentItem.stats || {}),
        ...Object.keys(newItem.stats || {})
    ]);
    
    allKeys.forEach(key => {
        const current = currentItem.stats?.[key] || 0;
        const next = newItem.stats?.[key] || 0;
        const diff = next - current;
        
        if (diff !== 0) {
            const affix = AFFIXES[key];
            differences.push({
                key,
                name: affix?.name || key,
                current,
                next,
                diff,
                better: diff > 0
            });
        }
    });
    
    const betterCount = differences.filter(d => d.better).length;
    const worseCount = differences.filter(d => !d.better).length;
    
    return {
        better: betterCount > worseCount,
        differences
    };
}

export default {
    RARITIES,
    EQUIPMENT_TYPES,
    EQUIPMENT_SETS,
    AFFIXES,
    LEVEL_UP_REWARDS,
    getRandomRarity,
    generateEquipment,
    generatePotion,
    generateGold,
    generateIdentificationScroll,
    identifyItem,
    isItemIdentifiable,
    getIdentificationCost,
    generateLoot,
    generateLevelUpRewards,
    applyLevelUpReward,
    calculateTotalStats,
    calculateSetBonus,
    stackItems,
    compareItems
};
