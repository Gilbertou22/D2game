// client/src/utils/talentTree.js
// 天賦樹配置數據

export const TALENT_TREE = {
    // === 火焰系天賦 ===
    fire_mastery: {
        id: 'fire_mastery',
        name: '火焰大師',
        description: '火焰法術傷害+20%',
        icon: '🔥',
        color: '#ff6b35',
        maxTier: 3,
        tierNames: ['火焰初步', '火焰掌控', '火焰大師'],
        bonuses: [
            { fireDamage: 10, cost: 1 },
            { fireDamage: 20, cost: 2 },
            { fireDamage: 35, cost: 3 }
        ],
        parent: null,
        school: 'fire'
    },
    fireball_talent: {
        id: 'fireball_talent',
        name: '火球術專精',
        description: '解鎖火球術',
        icon: '🔥',
        color: '#ff6b35',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'fireball' }],
        cost: 1,
        parent: 'fire_mastery',
        school: 'fire'
    },
    meteor_talent: {
        id: 'meteor_talent',
        name: '隕石術專精',
        description: '解鎖隕石術',
        icon: '☄️',
        color: '#ff6b35',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'meteor' }],
        cost: 2,
        parent: 'fireball_talent',
        school: 'fire'
    },
    pyromaniac: {
        id: 'pyromaniac',
        name: '縱火狂',
        description: '火焰法術暴擊率+5%',
        icon: '💢',
        color: '#ff6b35',
        maxTier: 2,
        tierNames: ['縱火其一', '縱火其二'],
        bonuses: [
            { fireCrit: 3, cost: 2 },
            { fireCrit: 5, cost: 3 }
        ],
        parent: 'fire_mastery',
        school: 'fire'
    },

    // === 冰霜系天賦 ===
    ice_mastery: {
        id: 'ice_mastery',
        name: '冰霜大師',
        description: '冰霜法術傷害+20%',
        icon: '❄️',
        color: '#4ecdc4',
        maxTier: 3,
        tierNames: ['冰霜初步', '冰霜掌控', '冰霜大師'],
        bonuses: [
            { iceDamage: 10, cost: 1 },
            { iceDamage: 20, cost: 2 },
            { iceDamage: 35, cost: 3 }
        ],
        parent: null,
        school: 'ice'
    },
    icebolt_talent: {
        id: 'icebolt_talent',
        name: '冰箭術專精',
        description: '解鎖冰箭術',
        icon: '❄️',
        color: '#4ecdc4',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'icebolt' }],
        cost: 1,
        parent: 'ice_mastery',
        school: 'ice'
    },
    frozenorb_talent: {
        id: 'frozenorb_talent',
        name: '冰封球專精',
        description: '解鎖冰封球',
        icon: '🧊',
        color: '#4ecdc4',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'frozenorb' }],
        cost: 2,
        parent: 'icebolt_talent',
        school: 'ice'
    },
    blizzard_talent: {
        id: 'blizzard_talent',
        name: '暴風雪專精',
        description: '解鎖暴風雪',
        icon: '🌨️',
        color: '#4ecdc4',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'blizzard' }],
        cost: 3,
        parent: 'frozenorb_talent',
        school: 'ice'
    },
    frozen_heart: {
        id: 'frozen_heart',
        name: '冰凍之心',
        description: '冰霜法術减速效果+20%',
        icon: '💎',
        color: '#4ecdc4',
        maxTier: 2,
        tierNames: ['冰心其一', '冰心其二'],
        bonuses: [
            { slowEffect: 10, cost: 2 },
            { slowEffect: 20, cost: 3 }
        ],
        parent: 'ice_mastery',
        school: 'ice'
    },

    // === 閃電系天賦 ===
    lightning_mastery: {
        id: 'lightning_mastery',
        name: '閃電大師',
        description: '閃電法術傷害+20%',
        icon: '⚡',
        color: '#f1c40f',
        maxTier: 3,
        tierNames: ['閃電初步', '閃電掌控', '閃電大師'],
        bonuses: [
            { lightningDamage: 10, cost: 1 },
            { lightningDamage: 20, cost: 2 },
            { lightningDamage: 35, cost: 3 }
        ],
        parent: null,
        school: 'lightning'
    },
    lightning_talent: {
        id: 'lightning_talent',
        name: '閃電專精',
        description: '解鎖閃電術',
        icon: '⚡',
        color: '#f1c40f',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'lightning' }],
        cost: 1,
        parent: 'lightning_mastery',
        school: 'lightning'
    },
    chainlightning_talent: {
        id: 'chainlightning_talent',
        name: '連鎖閃電專精',
        description: '解鎖連鎖閃電',
        icon: '🔱',
        color: '#f1c40f',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'chainlightning' }],
        cost: 2,
        parent: 'lightning_talent',
        school: 'lightning'
    },
    thunderlord: {
        id: 'thunderlord',
        name: '雷神之怒',
        description: '閃電法術暴擊率+8%',
        icon: '🌩️',
        color: '#f1c40f',
        maxTier: 2,
        tierNames: ['雷神其一', '雷神其二'],
        bonuses: [
            { lightningCrit: 4, cost: 2 },
            { lightningCrit: 8, cost: 3 }
        ],
        parent: 'lightning_mastery',
        school: 'lightning'
    },

    // === 毒系天賦 ===
    poison_mastery: {
        id: 'poison_mastery',
        name: '毒系大師',
        description: '毒系法術傷害+20%',
        icon: '🦠',
        color: '#2ecc71',
        maxTier: 3,
        tierNames: ['毒系初步', '毒系掌控', '毒系大師'],
        bonuses: [
            { poisonDamage: 10, cost: 1 },
            { poisonDamage: 20, cost: 2 },
            { poisonDamage: 35, cost: 3 }
        ],
        parent: null,
        school: 'poison'
    },
    plague_talent: {
        id: 'plague_talent',
        name: '瘟疫專精',
        description: '解鎖瘟疫釘刺',
        icon: '🦠',
        color: '#2ecc71',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'plagueSpike' }],
        cost: 1,
        parent: 'poison_mastery',
        school: 'poison'
    },
    poisoncloud_talent: {
        id: 'poisoncloud_talent',
        name: '瘴氣專精',
        description: '解鎖腐敗瘴氣',
        icon: '☠️',
        color: '#2ecc71',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'poisonCloud' }],
        cost: 2,
        parent: 'plague_talent',
        school: 'poison'
    },
    serpent_talent: {
        id: 'serpent_talent',
        name: '蛇信專精',
        description: '解鎖蛇信橫掃',
        icon: '🐍',
        color: '#2ecc71',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'serpentSweep' }],
        cost: 2,
        parent: 'poisoncloud_talent',
        school: 'poison'
    },
    toxic_master: {
        id: 'toxic_master',
        name: '劇毒大師',
        description: '毒系DOT傷害+25%',
        icon: '☣️',
        color: '#2ecc71',
        maxTier: 2,
        tierNames: ['劇毒其一', '劇毒其二'],
        bonuses: [
            { dotBonus: 15, cost: 2 },
            { dotBonus: 25, cost: 3 }
        ],
        parent: 'poison_mastery',
        school: 'poison'
    },

    // === 風系天賦 ===
    wind_mastery: {
        id: 'wind_mastery',
        name: '風系大師',
        description: '風系法術傷害+20%',
        icon: '🌀',
        color: '#a9a9a9',
        maxTier: 3,
        tierNames: ['風系初步', '風系掌控', '風系大師'],
        bonuses: [
            { windDamage: 10, cost: 1 },
            { windDamage: 20, cost: 2 },
            { windDamage: 35, cost: 3 }
        ],
        parent: null,
        school: 'wind'
    },
    windblades_talent: {
        id: 'windblades_talent',
        name: '風刃專精',
        description: '解鎖風之極刑',
        icon: '🌀',
        color: '#a9a9a9',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'windBlades' }],
        cost: 1,
        parent: 'wind_mastery',
        school: 'wind'
    },
    tornado_talent: {
        id: 'tornado_talent',
        name: '塵魔專精',
        description: '解鎖狂怒塵魔',
        icon: '🌪️',
        color: '#a9a9a9',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'tornado' }],
        cost: 2,
        parent: 'windblades_talent',
        school: 'wind'
    },
    tornadoring_talent: {
        id: 'tornadoring_talent',
        name: '風環專精',
        description: '解鎖塵魔之環',
        icon: '💨',
        color: '#a9a9a9',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'tornadoRing' }],
        cost: 2,
        parent: 'tornado_talent',
        school: 'wind'
    },
    gale_force: {
        id: 'gale_force',
        name: '狂風之力',
        description: '風系法術攻擊速度+15%',
        icon: '💨',
        color: '#a9a9a9',
        maxTier: 2,
        tierNames: ['疾風其一', '疾風其二'],
        bonuses: [
            { attackSpeedBonus: 8, cost: 2 },
            { attackSpeedBonus: 15, cost: 3 }
        ],
        parent: 'wind_mastery',
        school: 'wind'
    },

    // === 輔助天賦 ===
    arcane_mastery: {
        id: 'arcane_mastery',
        name: '奧術大師',
        description: '法術暴擊率+3%',
        icon: '🔮',
        color: '#9b59b6',
        maxTier: 3,
        tierNames: ['奧術初步', '奧術掌控', '奧術大師'],
        bonuses: [
            { spellCrit: 2, cost: 1 },
            { spellCrit: 3, cost: 2 },
            { spellCrit: 5, cost: 3 }
        ],
        parent: null,
        school: 'arcane'
    },
    nova_talent: {
        id: 'nova_talent',
        name: '冰nova專精',
        description: '解鎖冰nova',
        icon: '💥',
        color: '#9b59b6',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'nova' }],
        cost: 1,
        parent: 'arcane_mastery',
        school: 'arcane'
    },
    teleport_talent: {
        id: 'teleport_talent',
        name: '傳送專精',
        description: '解鎖傳送',
        icon: '🌀',
        color: '#9b59b6',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'teleport' }],
        cost: 1,
        parent: 'arcane_mastery',
        school: 'arcane'
    },
    heal_talent: {
        id: 'heal_talent',
        name: '治療專精',
        description: '解鎖治療術',
        icon: '💚',
        color: '#9b59b6',
        maxTier: 1,
        tierNames: ['已解鎖'],
        bonuses: [{ skillUnlock: 'heal_spell' }],
        cost: 1,
        parent: 'arcane_mastery',
        school: 'arcane'
    },
    mana_surge: {
        id: 'mana_surge',
        name: '魔力湧動',
        description: '法力回復+30%',
        icon: '💎',
        color: '#9b59b6',
        maxTier: 2,
        tierNames: ['魔力其一', '魔力其二'],
        bonuses: [
            { manaRegen: 20, cost: 2 },
            { manaRegen: 30, cost: 3 }
        ],
        parent: 'arcane_mastery',
        school: 'arcane'
    },

    // === 通用天賦 ===
    vitality: {
        id: 'vitality',
        name: '生命力',
        description: '最大生命+50',
        icon: '❤️',
        color: '#e74c3c',
        maxTier: 3,
        tierNames: ['生命力I', '生命力II', '生命力III'],
        bonuses: [
            { maxHP: 50, cost: 1 },
            { maxHP: 100, cost: 2 },
            { maxHP: 200, cost: 3 }
        ],
        parent: null,
        school: 'utility'
    },
    strength: {
        id: 'strength',
        name: '力量',
        description: '攻擊力+15',
        icon: '💪',
        color: '#e74c3c',
        maxTier: 3,
        tierNames: ['力量I', '力量II', '力量III'],
        bonuses: [
            { attackPower: 15, cost: 1 },
            { attackPower: 30, cost: 2 },
            { attackPower: 50, cost: 3 }
        ],
        parent: null,
        school: 'utility'
    },
    endurance: {
        id: 'endurance',
        name: '耐力',
        description: '防禦力+10',
        icon: '🛡️',
        color: '#e74c3c',
        maxTier: 3,
        tierNames: ['耐力I', '耐力II', '耐力III'],
        bonuses: [
            { defense: 10, cost: 1 },
            { defense: 20, cost: 2 },
            { defense: 35, cost: 3 }
        ],
        parent: null,
        school: 'utility'
    }
};

// 獲取天賦樹中可用的根節點（無父節點的天賦）
export function getRootTalents() {
    return Object.values(TALENT_TREE).filter(t => t.parent === null);
}

// 獲取天賦的所有子天賦
export function getChildTalents(parentId) {
    return Object.values(TALENT_TREE).filter(t => t.parent === parentId);
}

// 檢查天賦是否可以被解鎖
export function canUnlockTalent(talentId, talentTree, talentPoints) {
    const talent = TALENT_TREE[talentId];
    if (!talent) return false;
    
    const currentTier = talentTree[talentId] || 0;
    if (currentTier >= talent.maxTier) return false;
    
    // 檢查是否有足夠點數
    const cost = talent.bonuses[currentTier]?.cost || talent.cost || 1;
    if (talentPoints < cost) return false;
    
    // 檢查父天賦是否已解鎖
    if (talent.parent) {
        const parentTier = talentTree[talent.parent] || 0;
        if (parentTier < 1) return false;
    }
    
    return true;
}

// 計算天賦加成
export function calculateTalentBonuses(talentTree) {
    const bonuses = {
        // 法術傷害加成
        fireDamage: 0,
        iceDamage: 0,
        lightningDamage: 0,
        poisonDamage: 0,
        windDamage: 0,
        
        // 法術暴擊
        fireCrit: 0,
        lightningCrit: 0,
        spellCrit: 0,
        
        // 效果加成
        slowEffect: 0,
        dotBonus: 0,
        attackSpeedBonus: 0,
        manaRegen: 0,
        
        // 屬性加成
        maxHP: 0,
        attackPower: 0,
        defense: 0,
        
        // 技能解鎖
        unlockedSkills: new Set()
    };
    
    Object.entries(talentTree).forEach(([talentId, tier]) => {
        const talent = TALENT_TREE[talentId];
        if (!talent) return;
        
        for (let i = 0; i < tier; i++) {
            const bonus = talent.bonuses[i];
            if (!bonus) continue;
            
            Object.entries(bonus).forEach(([key, value]) => {
                if (key === 'skillUnlock') {
                    bonuses.unlockedSkills.add(value);
                } else if (key in bonuses) {
                    bonuses[key] += value;
                }
            });
        }
    });
    
    return bonuses;
}
