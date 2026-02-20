const classConfigs = {
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
        skills: {
            fireball: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 1,
                manaCost: 2,
                damage: 550,
                icon: '🔥',
                name: '火球術',
                description: '發射火球造成範圍傷害'
            },
            icebolt: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 3,
                manaCost: 15,
                damage: 80,
                icon: '❄️',
                name: '冰箭術',
                description: '發射冰箭減速敵人'
            },
            meteor: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 8,
                manaCost: 50,
                damage: 800,
                radius: 15,
                icon: '☄️',
                name: '隕石術',
                description: '召喚隕石造成巨大傷害'
            },
            chainlightning: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 10,
                manaCost: 35,
                damage: 120,
                chainCount: 3,
                icon: '⚡',
                name: '連鎖閃電',
                description: '閃電在敵人之間彈射'
            },
            heal: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 10,
                manaCost: 30,
                healAmount: 100,
                icon: '💚',
                name: '治療術',
                description: '恢復生命值'
            },
            nova: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 12,
                manaCost: 50,
                damage: 300,
                radius: 20,
                icon: '💥',
                name: '奧術新星',
                description: '以自身為中心釋放能量波'
            }
        },
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
        skills: {
            slash: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 0.8,
                manaCost: 0,
                damage: 200,
                range: 8,
                icon: '🗡️',
                name: '橫斬',
                description: '揮舞武器攻擊前方敵人'
            },
            charge: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 5,
                manaCost: 15,
                damage: 300,
                stunDuration: 1.5,
                range: 25,
                icon: '🏃',
                name: '衝鋒',
                description: '衝向敵人並造成暈眩'
            },
            whirlwind: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 6,
                manaCost: 25,
                damage: 180,
                radius: 12,
                icon: '🌀',
                name: '旋風斬',
                description: '旋轉攻擊周圍所有敵人'
            },
            shieldbash: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 8,
                manaCost: 20,
                damage: 150,
                stunDuration: 2,
                shield: 100,
                icon: '🛡️',
                name: '盾擊',
                description: '用盾牌猛擊敵人並獲得護盾'
            },
            battlecry: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 15,
                manaCost: 30,
                damage: 0,
                attackBoost: 0.5,
                duration: 8,
                icon: '📢',
                name: '戰吼',
                description: '提升攻擊力持續一段時間'
            },
            execute: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 10,
                manaCost: 40,
                damage: 500,
                executeThreshold: 0.2,
                icon: '💀',
                name: '處決',
                description: '對低血量敵人造成巨大傷害'
            }
        },
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
        skills: {
            quickshot: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 0.5,
                manaCost: 0,
                damage: 100,
                icon: '➡️',
                name: '速射',
                description: '快速射出一支箭矢'
            },
            multishot: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 4,
                manaCost: 20,
                damage: 80,
                arrowCount: 5,
                icon: '🎯',
                name: '多重射擊',
                description: '同時射出多支箭矢'
            },
            poisonarrow: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 6,
                manaCost: 25,
                damage: 60,
                dotDamage: 30,
                dotDuration: 5,
                icon: '☠️',
                name: '毒箭',
                description: '射出毒箭造成持續傷害'
            },
            arrowrain: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 12,
                manaCost: 50,
                damage: 150,
                radius: 20,
                duration: 3,
                icon: '🌧️',
                name: '箭雨',
                description: '在區域降下箭雨'
            },
            evasion: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 10,
                manaCost: 15,
                duration: 3,
                icon: '💨',
                name: '閃避',
                description: '短時間內閃避所有攻擊'
            },
            snipe: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 8,
                manaCost: 35,
                damage: 400,
                critBonus: 0.5,
                icon: '🎯',
                name: '狙擊',
                description: '蓄力射出高暴擊的一箭'
            }
        },
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
        skills: {
            wrath: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 1,
                manaCost: 5,
                damage: 150,
                icon: '⚡',
                name: '憤怒',
                description: '釋放自然能量攻擊敵人'
            },
            rejuvenation: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 8,
                manaCost: 25,
                healAmount: 80,
                hotAmount: 20,
                hotDuration: 6,
                icon: '💚',
                name: '回春術',
                description: '立即治療並持續恢復生命'
            },
            thorns: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 10,
                manaCost: 30,
                reflectDamage: 50,
                duration: 8,
                icon: '🌵',
                name: '荊棘',
                description: '受到攻擊時反彈傷害'
            },
            sunfire: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 6,
                manaCost: 35,
                damage: 200,
                dotDamage: 40,
                dotDuration: 4,
                radius: 10,
                icon: '☀️',
                name: '日炎術',
                description: '太陽之力灼燒區域敵人'
            },
            bearform: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 20,
                manaCost: 50,
                hpBoost: 500,
                attackBoost: 50,
                duration: 15,
                icon: '🐻',
                name: '熊形態',
                description: '變身為熊，提升血量和攻擊'
            },
            tranquility: {
                unlocked: true,
                level: 1,
                cooldown: 0,
                maxCooldown: 30,
                manaCost: 80,
                healAmount: 200,
                radius: 25,
                duration: 5,
                icon: '🌸',
                name: '寧靜',
                description: '持續治療周圍所有友方'
            }
        },
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

export default classConfigs;
