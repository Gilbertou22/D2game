import skillConfigManager from '../utils/SkillConfigManager';

const classBaseConfigs = {
    mage: {
        name: '法師',
        nameEn: 'Mage',
        icon: '🧙',
        description: '掌控元素之力，遠程魔法攻擊',
        baseHP: 800,
        baseMP: 200,
        baseAttack: 100,
        hpPerLevel: 50,
        mpPerLevel: 20,
        attackPerLevel: 15,
        color: '#6366f1',
        skillIds: ['fireball', 'icebolt', 'meteor', 'chainlightning', 'heal', 'nova'],
        skillKeybinds: {
            '1': 'fireball',
            '2': 'icebolt',
            '3': 'meteor',
            '4': 'chainlightning',
            '5': 'heal',
            'r': 'nova'
        }
    },

    warrior: {
        name: '戰士',
        nameEn: 'Warrior',
        icon: '⚔️',
        description: '近戰之王，高血量高防禦',
        baseHP: 1500,
        baseMP: 100,
        baseAttack: 150,
        hpPerLevel: 100,
        mpPerLevel: 10,
        attackPerLevel: 20,
        color: '#ef4444',
        skillIds: ['slash', 'charge', 'whirlwind', 'shieldbash', 'battlecry', 'execute'],
        skillKeybinds: {
            '1': 'slash',
            '2': 'charge',
            '3': 'whirlwind',
            '4': 'shieldbash',
            '5': 'battlecry',
            'r': 'execute'
        }
    },

    archer: {
        name: '弓箭手',
        nameEn: 'Archer',
        icon: '🏹',
        description: '遠程物理攻擊，高暴擊高機動',
        baseHP: 900,
        baseMP: 120,
        baseAttack: 120,
        hpPerLevel: 60,
        mpPerLevel: 15,
        attackPerLevel: 18,
        critChance: 0.25,
        color: '#22c55e',
        skillIds: ['quickshot', 'multishot', 'poisonarrow', 'arrowrain', 'evasion', 'snipe'],
        skillKeybinds: {
            '1': 'quickshot',
            '2': 'multishot',
            '3': 'poisonarrow',
            '4': 'arrowrain',
            '5': 'evasion',
            'r': 'snipe'
        }
    },

    druid: {
        name: '德魯伊',
        nameEn: 'Druid',
        icon: '🌿',
        description: '自然之力，治療與變身',
        baseHP: 1000,
        baseMP: 180,
        baseAttack: 80,
        hpPerLevel: 70,
        mpPerLevel: 25,
        attackPerLevel: 12,
        color: '#84cc16',
        skillIds: ['wrath', 'rejuvenation', 'thorns', 'sunfire', 'bearform', 'tranquility'],
        skillKeybinds: {
            '1': 'wrath',
            '2': 'rejuvenation',
            '3': 'thorns',
            '4': 'sunfire',
            '5': 'bearform',
            'r': 'tranquility'
        }
    }
};

function getClassConfig(className) {
    const baseConfig = classBaseConfigs[className];
    if (!baseConfig) return null;
    
    const allSkillConfigs = skillConfigManager.getAllSkills();
    const skills = {};
    
    (baseConfig.skillIds || []).forEach(skillId => {
        const skillConfig = allSkillConfigs[skillId];
        if (skillConfig) {
            skills[skillId] = {
                ...skillConfig,
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: skillConfig.cooldown
            };
        }
    });
    
    return {
        ...baseConfig,
        skills
    };
}

function getAllClassConfigs() {
    const configs = {};
    Object.keys(classBaseConfigs).forEach(className => {
        configs[className] = getClassConfig(className);
    });
    return configs;
}

const classConfigs = getAllClassConfigs();

export default classConfigs;
export { getClassConfig, classBaseConfigs };
