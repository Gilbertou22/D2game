import { create } from 'zustand';
import * as THREE from 'three';
import { calculateTotalStats, stackItems, RARITIES, generateLevelUpRewards, applyLevelUpReward } from '../utils/itemSystem';
import { calculateTalentBonuses } from '../utils/talentTree';
import classConfigs from '../configs/classConfigs';

const expPerLevel = (level) => Math.floor(100 * Math.pow(1.15, level - 1));

const recalculateStats = (state, { backpack, equipped }) => {
    const totalStats = calculateTotalStats(equipped);
    const classConfig = classConfigs[state.playerClass] || classConfigs.mage;
    const baseAttack = classConfig.baseAttack + state.playerLevel * classConfig.attackPerLevel;
    const baseHP = classConfig.baseHP + state.playerLevel * classConfig.hpPerLevel;
    const baseMana = classConfig.baseMP + state.playerLevel * classConfig.mpPerLevel;
    const allStatsBonus = totalStats.allStats || 0;

    return {
        backpack,
        equipped,
        playerAttackPower: baseAttack + (totalStats.attack || 0) + allStatsBonus * 2,
        playerDefense: (totalStats.defense || 0) + allStatsBonus,
        playerMaxHPBonus: (totalStats.hp || 0) + allStatsBonus * 10,
        playerMaxManaBonus: (totalStats.mana || 0) + allStatsBonus * 5,
        playerManaRegen: 3 + (totalStats.manaRegen || 0) + allStatsBonus * 0.1,
        playerMoveSpeedBonus: totalStats.movementSpeed || 0,
        playerCritChance: (classConfig.critChance || 0.15) + (totalStats.critChance || 0) / 100,
        playerCritDamage: 50 + (totalStats.critDamage || 0),
        playerAttackSpeed: totalStats.attackSpeed || 0,
        playerLifeSteal: totalStats.lifeSteal || 0,
        playerDamageReduction: totalStats.damageReduction || 0,
        playerResistance: totalStats.resistance || 0,
        playerCooldownReduction: totalStats.cooldownReduction || 0,
        playerGoldFind: totalStats.goldFind || 0,
        playerExpBonus: totalStats.expBonus || 0,
        playerAllStats: allStatsBonus,
        playerMaxHP: baseHP + (totalStats.hp || 0) + allStatsBonus * 10,
        playerMaxMana: baseMana + (totalStats.mana || 0) + allStatsBonus * 5,
        playerHP: Math.min(state.playerHP, baseHP + (totalStats.hp || 0) + allStatsBonus * 10),
        playerMana: Math.min(state.playerMana, baseMana + (totalStats.mana || 0) + allStatsBonus * 5)
    };
};

const useGameState = create((set, get) => ({

    playerClass: 'mage',
    classSelected: false,
    
    selectClass: (className) => {
        const classConfig = classConfigs[className];
        if (!classConfig) return;
        
        console.log('Selecting class:', className, 'Skills:', Object.keys(classConfig.skills));
        
        set({
            playerClass: className,
            classSelected: true,
            skills: JSON.parse(JSON.stringify(classConfig.skills)),
            skillKeybinds: { ...classConfig.skillKeybinds },
            playerHP: classConfig.baseHP,
            playerMaxHP: classConfig.baseHP,
            playerMana: classConfig.baseMP,
            playerMaxMana: classConfig.baseMP,
            playerAttackPower: classConfig.baseAttack,
            playerCritChance: classConfig.critChance || 0.15
        });
    },

    // Initial skills from mage config
    skills: JSON.parse(JSON.stringify(classConfigs.mage.skills)),
    skillKeybinds: { ...classConfigs.mage.skillKeybinds },

    playerPos: new THREE.Vector3(0, 3, 0),
    playerRotation: new THREE.Euler(0, 0, 0),
    playerHP: 800,
    playerMaxHP: 800,
    playerMana: 200,
    playerMaxMana: 200,
    playerLevel: 1,
    playerExp: 0,
    playerGold: 0,

    cameraMode: 'isometric',
    currentLevel: 1,
    isDead: false,
    playerAttackPower: 100,
    playerCritChance: 0.15,
    playerDefense: 0,           // 新增：防禦
    playerMaxHPBonus: 0,
    playerMaxManaBonus: 0,      // 新增：魔力上限加成
    playerManaRegen: 3,         // 新增：每秒魔力回復
    playerMoveSpeedBonus: 0,    // 新增：移動速度加成（%）
    
    // 天賦屬性加成
    talentBonuses: {},

    // 升級獎勵系統
    pendingLevelUpRewards: null,  // 待選擇的獎勵
    levelUpQueue: 0,  // 累積的升級次數

    // 天賦系統
    talentPoints: 0,  // 可用天賦點數
    talentTree: {},  // 已解鎖的天賦: { skillId: tier }
    talentUnlocks: {},  // 已解鎖的技能: { skillId: true }

    // 關卡狀態
    isBossLevel: false,
    bossKilled: false,
    levelMessage: '',
    
    // 敵人攻擊意欲控制 (0.1 - 2.0, 預設 1.0)
    // 影響: 攻擊頻率、移動速度、偵測範圍
    enemyAggression: 1.0,



    // 藥水庫存（可從掉落獲得）
    inventory: {
        hp_potion: 3, // 初始 3 瓶生命藥水
        mana_potion: 2
    },

    // 背包物品陣列（裝備）
    backpack: [],
    backpackMaxSize: 40, // 背包最大容量

    // 裝備槽
    equipped: {
        weapon: null,
        armor: null,
        helmet: null,
        ring: null,
        amulet: null
    },
    
    // 新屬性：暴擊傷害、攻擊速度、生命偷取等
    playerCritDamage: 50, // 基礎暴擊傷害加成 50%
    playerAttackSpeed: 0, // 攻擊速度加成
    playerLifeSteal: 0, // 生命偷取
    playerDamageReduction: 0, // 傷害減免
    playerResistance: 0, // 元素抗性
    playerCooldownReduction: 0, // 冷卻縮減
    playerGoldFind: 0, // 金幣獲取加成
    playerExpBonus: 0, // 經驗加成
    playerAllStats: 0, // 全屬性加成

    setIsBossLevel: (bool) => set({ isBossLevel: bool }),
    setBossKilled: (bool) => set({ bossKilled: bool }),
    setLevelMessage: (msg) => set({ levelMessage: msg }),
    setEnemyAggression: (value) => set({ enemyAggression: Math.max(0.1, Math.min(2.0, value)) }),

    nextLevel: () => set((state) => ({
        currentLevel: state.currentLevel + 1,
        isBossLevel: (state.currentLevel + 1) % 10 === 0,
        bossKilled: false,
        levelMessage: ''
    })),

    resetScene: () => set({
        enemies: [],
        chests: [],
        obstacles: [],
        projectiles: [],
        particleSystems: [],
        particles: []
    }),



    // 遊戲物件
    obstacles: [],
    enemies: [],
    chests: [],
    projectiles: [],
    particleSystems: [],
    particles: [],

    // 目標與 UI
    targetPosition: null,
    targetEnemy: null,
    lootNotification: null,

    // 新增：技能系統初始化 (測試模式：所有技能已解鎖)
    skills: {
        fireball: {
            unlocked: true,
            level: 1,
            cooldown: 0,
            maxCooldown: 1,
            manaCost: 2,
            damage: 550,
            icon: '🔥',
            name: 'Fireball'
        },
        icebolt: {
            unlocked: true,
            level: 1,
            cooldown: 0,
            maxCooldown: 3,
            manaCost: 15,
            damage: 80,
            icon: '❄️',
            name: 'Ice Bolt'
        },
        heal: {
            unlocked: true,
            level: 1,
            cooldown: 0,
            maxCooldown: 10,
            manaCost: 30,
            healAmount: 100,
            icon: '💚',
            name: 'Heal'
        },
        lightning: {
            unlocked: true,
            level: 1,
            cooldown: 0,
            maxCooldown: 8,
            manaCost: 40,
            damage: 200,
            icon: '⚡',
            name: 'Lightning'
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
            name: 'Nova'
        },
        chainlightning: {
            unlocked: true,
            level: 1,
            cooldown: 0,
            maxCooldown: 10,
            manaCost: 35,
            damage: 120,
            chainCount: 3,
            icon: '⛓️',
            name: 'Chain Lightning'
        },
        teleport: {
            unlocked: true,
            level: 1,
            cooldown: 0,
            maxCooldown: 15,
            manaCost: 25,
            icon: '✨',
            name: 'Teleport'
        },
        heal_spell: {
            unlocked: true,
            level: 1,
            cooldown: 0,
            maxCooldown: 20,
            manaCost: 40,
            healAmount: 150,
            icon: '❤️',
            name: 'Heal Spell'
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
            name: 'Meteor'
        },
        // 毒系技能
        plagueSpike: {
            unlocked: true,
            level: 1,
            cooldown: 0,
            maxCooldown: 4,
            manaCost: 25,
            damage: 120,
            dotDamage: 30,
            dotDuration: 5,
            projectileSpeed: 25,
            icon: '🦠',
            name: '瘟疫釘刺'
        },
        poisonCloud: {
            unlocked: true,
            level: 1,
            cooldown: 0,
            maxCooldown: 15,
            manaCost: 45,
            damage: 60,
            dotDamage: 25,
            dotDuration: 6,
            radius: 8,
            duration: 5,
            icon: '☠️',
            name: '腐敗瘴氣'
        },
        serpentSweep: {
            unlocked: true,
            level: 1,
            cooldown: 0,
            maxCooldown: 10,
            manaCost: 35,
            damage: 180,
            dotDamage: 20,
            dotDuration: 4,
            coneAngle: Math.PI * 0.4,
            range: 15,
            icon: '🐍',
            name: '蛇信橫掃'
        },
        // 風系技能
        windBlades: {
            unlocked: true,
            level: 1,
            cooldown: 0,
            maxCooldown: 6,
            manaCost: 30,
            damage: 150,
            projectileSpeed: 30,
            bladeCount: 3,
            spreadAngle: 0.15,
            icon: '🌀',
            name: '風之極刑'
        },
        tornado: {
            unlocked: true,
            level: 1,
            cooldown: 0,
            maxCooldown: 18,
            manaCost: 55,
            damage: 80,
            dotDamage: 20,
            dotDuration: 8,
            radius: 6,
            duration: 8,
            moveSpeed: 4,
            icon: '🌪️',
            name: '狂怒塵魔'
        },
        tornadoRing: {
            unlocked: true,
            level: 1,
            cooldown: 0,
            maxCooldown: 20,
            manaCost: 70,
            damage: 100,
            tornadoCount: 6,
            spreadRadius: 25,
            duration: 4,
            icon: '💨',
            name: '塵魔之環'
        },
    },

    // 按鍵綁定配置 (可自行修改)
    skillKeybinds: {
        '1': 'fireball',
        '2': 'icebolt',
        '3': 'heal',
        '4': 'lightning',
        '5': 'nova',
        '6': 'chainlightning',
        '7': 'teleport',
        '8': 'heal_spell',
        '9': 'meteor',
        '0': 'plagueSpike',
        '-': 'poisonCloud',
        '=': 'serpentSweep',
        '[': 'windBlades',
        ']': 'tornado',
        '\\': 'tornadoRing'
    },

    // 設置按鍵綁定
    setSkillKeybind: (key, skillKey) => set((state) => ({
        skillKeybinds: {
            ...state.skillKeybinds,
            [key]: skillKey
        }
    })),

    // 重置按鍵綁定為預設值
    resetSkillKeybinds: () => set({
        skillKeybinds: {
            '1': 'fireball',
            '2': 'icebolt',
            '3': 'heal',
            '4': 'lightning',
            '5': 'nova',
            '6': 'chainlightning',
            '7': 'teleport',
            '8': 'heal_spell',
            '9': 'meteor'
        }
    }),

    // 解鎖技能
    unlockSkill: (skillKey) => set((state) => ({
        skills: {
            ...state.skills,
            [skillKey]: {
                ...state.skills[skillKey],
                unlocked: true,
                level: 1
            }
        }
    })),
    // 使用技能（安全檢查）
    castSkill: (skillKey) => {
        const state = get();
        const skill = state.skills[skillKey];
        
        console.log('castSkill called:', skillKey, 'skill:', skill, 'mana:', state.playerMana, 'isDead:', state.isDead);
        
        if (!skill) {
            console.log('Skill not found:', skillKey, 'Available skills:', Object.keys(state.skills));
            return false;
        }
        if (!skill.unlocked) return false;
        if (skill.cooldown > 0) { console.log('On cooldown:', skill.cooldown); return false; }
        if (state.playerMana < skill.manaCost) { console.log('Not enough mana'); return false; }
        if (state.isDead) return false;

        // 扣魔力
        get().updatePlayer({ playerMana: state.playerMana - skill.manaCost });

        // 觸發冷卻
        set({
            skills: {
                ...state.skills,
                [skillKey]: {
                    ...skill,
                    cooldown: skill.maxCooldown
                }
            }
        });

        // 返回技能資料，讓呼叫组件處理副作用（如投射物、傷害）
        return {
            success: true,
            skillKey,
            damage: skill.damage,
            healAmount: skill.healAmount,
            radius: skill.radius,
            chains: skill.chains,
        };
    },

    // 每幀更新冷卻
    updateSkillsCooldown: (delta) => {
        const state = get();
        const skills = state.skills;
        let hasChange = false;
        const updated = {};
        
        Object.keys(skills).forEach(key => {
            const skill = skills[key];
            if (skill.cooldown > 0) {
                const newCooldown = Math.max(0, skill.cooldown - delta);
                hasChange = true;
                updated[key] = { ...skill, cooldown: newCooldown };
            } else {
                updated[key] = skill;
            }
        });
        
        if (hasChange) {
            set({ skills: updated });
        }
    },

    damageNumbers: [],  // [{ id, position, value, isCrit, lifetime }]
    
    // 新增：連擊系統
    comboCount: 0,
    lastAttackTime: 0,
    comboTimeout: 2000, // 2秒內需要再次攻擊才能維持連擊

    addDamageNumber: (position, value, isCrit = false) => set((state) => ({
        damageNumbers: [...state.damageNumbers, {
            id: Math.random(),
            position: position.clone(),
            value,
            isCrit,
            lifetime: 1.5  // 秒
        }]
    })),

    updateDamageNumbers: (delta) => set((state) => ({
        damageNumbers: state.damageNumbers
            .map(d => ({ ...d, lifetime: d.lifetime - delta }))
            .filter(d => d.lifetime > 0)
    })),

    eventLog: [], // 事件記錄陣列

    addEvent: (message, color = '#ffffff', type = 'default') => set((state) => ({
        eventLog: [...state.eventLog, {
            message,
            color,
            type,
            time: Date.now()
        }].slice(-50)
    })),

    floatingNumbers: [],  // 統一浮動數字：{ id, position, value, isHeal, lifetime }

    addFloatingNumber: (position, value, type = 'damage') => set((state) => {
        const types = {
            damage: { 
                color: '#ff3333', 
                prefix: '-', 
                fontSize: '32px',
                glowColor: 'rgba(255, 50, 50, 0.8)',
                animation: 'damage'
            },
            crit: { 
                color: '#ffdd00', 
                prefix: '-', 
                fontSize: '52px', 
                suffix: '!',
                glowColor: 'rgba(255, 221, 0, 0.9)',
                animation: 'crit',
                shake: true
            },
            heal: { 
                color: '#00ff88', 
                prefix: '+', 
                fontSize: '36px', 
                suffix: ' ❤',
                glowColor: 'rgba(0, 255, 136, 0.8)',
                animation: 'heal'
            },
            mana: {
                color: '#00ccff',
                prefix: '+',
                fontSize: '28px',
                suffix: ' 💧',
                glowColor: 'rgba(0, 204, 255, 0.8)',
                animation: 'mana'
            },
            exp: { 
                color: '#ff88ff', 
                prefix: '+', 
                fontSize: '28px',
                value: value + ' XP',
                glowColor: 'rgba(255, 136, 255, 0.8)',
                animation: 'exp'
            },
            gold: { 
                color: '#ffd700', 
                prefix: '+', 
                fontSize: '28px',
                value: value + ' G',
                glowColor: 'rgba(255, 215, 0, 0.8)',
                animation: 'gold'
            },
            shield: {
                color: '#4488ff',
                prefix: '+',
                fontSize: '28px',
                suffix: ' 🛡️',
                glowColor: 'rgba(68, 136, 255, 0.8)',
                animation: 'shield'
            },
            miss: {
                color: '#888888',
                value: 'MISS',
                fontSize: '28px',
                glowColor: 'rgba(136, 136, 136, 0.6)',
                animation: 'miss'
            },
            dodge: {
                color: '#00ffaa',
                value: '閃避',
                fontSize: '28px',
                glowColor: 'rgba(0, 255, 170, 0.8)',
                animation: 'dodge'
            },
            // Elemental damage types (from UI.html)
            fire: {
                color: '#ff6b2b',
                prefix: '-',
                fontSize: '32px',
                glowColor: 'rgba(255, 107, 43, 0.8)',
                animation: 'elemental'
            },
            lightning: {
                color: '#4fc3f7',
                prefix: '-',
                fontSize: '32px',
                glowColor: 'rgba(79, 195, 247, 0.8)',
                animation: 'elemental'
            },
            ice: {
                color: '#80deea',
                prefix: '-',
                fontSize: '32px',
                glowColor: 'rgba(128, 222, 234, 0.8)',
                animation: 'elemental'
            },
            poison: {
                color: '#2ecc71',
                prefix: '-',
                fontSize: '32px',
                glowColor: 'rgba(46, 204, 113, 0.8)',
                animation: 'dot'
            },
            wind: {
                color: '#a9a9a9',
                prefix: '-',
                fontSize: '32px',
                glowColor: 'rgba(169, 169, 169, 0.8)',
                animation: 'elemental'
            }
        };

        const config = types[type] || types.damage;        

        // 根據類型調整偏移
        let horizOffset, startY;
        
        if (config.animation === 'crit') {
            // 暴擊更大偏移
            horizOffset = (Math.random() - 0.5) * 8;
            startY = 0;
        } else if (config.animation === 'heal') {
            // 治療向下
            horizOffset = (Math.random() - 0.5) * 4;
            startY = -2;
        } else {
            // 普通傷害
            horizOffset = (Math.random() - 0.5) * 6;
            startY = -3 - Math.random() * 2;
        }

        // 計算現有相同位置/類型的數字數量，用於堆疊
        const existingCount = state.floatingNumbers.filter(n => 
            n.position.distanceTo(position) < 2 && n.type === type
        ).length;
        
        // 根據堆疊數量調整 Y 偏移
        startY -= existingCount * 0.8;

        const startPos = position.clone().add(new THREE.Vector3(
            horizOffset, 
            startY, 
            (Math.random() - 0.5) * 2
        ));

        // 輕微隨機旋轉
        const rotation = (Math.random() - 0.5) * Math.PI / 8;

        // 根據類型調整生命週期
        const lifeMap = {
            crit: 2.0,
            heal: 2.5,
            damage: 1.8,
            miss: 1.5,
            dodge: 1.5,
            exp: 3.0,
            gold: 3.0,
            mana: 2.2,
            shield: 2.2
        };
        const life = lifeMap[type] || 2.0;

        // 根據類型調整大小
        const scaleMap = {
            crit: 2.2,
            heal: 1.6,
            damage: 1.4,
            exp: 1.2,
            gold: 1.2
        };
        const scale = scaleMap[type] || 1.0;

        let newNumbers = [...state.floatingNumbers, {
            id: Math.random(),
            position: startPos,
            value: config.value || value,
            prefix: config.prefix || '',
            suffix: config.suffix || '',
            color: config.color,
            glowColor: config.glowColor,
            fontSize: config.fontSize,
            animation: config.animation,
            life: life,
            maxLife: life,
            opacity: 1,
            scale: scale,
            rotation,
            shake: config.shake || false,
            type: type
        }].slice(-40);

        return { floatingNumbers: newNumbers };
    }),
    /*
        updateFloatingNumbers: (delta) => set((state) => {
            const updated = state.floatingNumbers
                .map(num => ({
                    ...num,
                    life: num.life - delta,
                    opacity: num.life / 1.8,
                    position: num.position.clone().add(new THREE.Vector3(0, delta * 1.5, 0)) // 上浮
                }))
                .filter(num => num.life > 0);
    
            return { floatingNumbers: updated };
        }),
    */
    updateFloatingNumbers: (updated) => set({ floatingNumbers: updated }),
    
    removeFloatingNumber: (id) => set((state) => ({
        floatingNumbers: state.floatingNumbers.filter(n => n.id !== id)
    })),
    // 更新函數
    setPlayerPos: (pos) => set({ playerPos: pos }),
    setPlayerRotation: (rot) => set({ playerRotation: rot }),
    
    // 選擇升級獎勵
    selectLevelUpReward: (reward) => {
        const state = get();
        if (!reward) return;
        
        const updates = {};
        
        if (reward.type === 'stat') {
            updates[reward.stat] = (state[reward.stat] || 0) + reward.value;
        } else if (reward.type === 'gold') {
            updates.playerGold = (state.playerGold || 0) + reward.amount;
        } else if (reward.type === 'item') {
            updates.inventory = {
                ...state.inventory,
                [reward.item.type]: (state.inventory[reward.item.type] || 0) + reward.item.count
            };
        }
        
        set((state) => {
            const newState = { ...state, ...updates };
            
            // 處理升級佇列
            let remainingQueue = state.levelUpQueue - 1;
            if (remainingQueue > 0) {
                // 還有更多升級等待處理
                const nextRewards = generateLevelUpRewards(state.playerLevel + 1, 3);
                return {
                    ...newState,
                    levelUpQueue: remainingQueue,
                    pendingLevelUpRewards: nextRewards
                };
            }
            
            // 恢復生命和魔力
            newState.playerHP = newState.playerMaxHP;
            newState.playerMana = newState.playerMaxMana;
            
            return {
                ...newState,
                pendingLevelUpRewards: null,
                levelUpQueue: 0
            };
        });
    },
    
    // 跳過升級獎勵（隨機選擇）
    skipLevelUpReward: () => {
        const state = get();
        if (!state.pendingLevelUpRewards || state.pendingLevelUpRewards.length === 0) return;
        
        const randomReward = state.pendingLevelUpRewards[Math.floor(Math.random() * state.pendingLevelUpRewards.length)];
        get().selectLevelUpReward(randomReward);
    },
    
    // 天賦系統
    spendTalentPoint: (talentId) => {
        const state = get();
        const talent = require('../utils/talentTree').TALENT_TREE[talentId];
        if (!talent) return;
        
        const currentTier = state.talentTree[talentId] || 0;
        if (currentTier >= talent.maxTier) return;
        
        const cost = talent.bonuses[currentTier]?.cost || talent.cost || 1;
        if (state.talentPoints < cost) return;
        
        // 檢查父天賦
        if (talent.parent) {
            const parentTier = state.talentTree[talent.parent] || 0;
            if (parentTier < 1) return;
        }
        
        set((state) => {
            const newTalentTree = { ...state.talentTree, [talentId]: currentTier + 1 };
            const newTalentUnlocks = { ...state.talentUnlocks };
            
            // 檢查是否有技能解鎖
            const bonus = talent.bonuses[currentTier];
            if (bonus?.skillUnlock) {
                newTalentUnlocks[bonus.skillUnlock] = true;
            }
            
            // 計算新的天賦加成
            const talentBonuses = calculateTalentBonuses(newTalentTree);
            
            // 計算新的玩家屬性加成
            const newPlayerMaxHPBonus = state.playerMaxHPBonus + (bonus?.maxHP || 0);
            const newPlayerAttackPower = state.playerAttackPower + (bonus?.attackPower || 0);
            const newPlayerDefense = state.playerDefense + (bonus?.defense || 0);
            const newPlayerManaRegen = state.playerManaRegen + (bonus?.manaRegen ? state.playerManaRegen * (bonus.manaRegen / 100) : 0);
            
            return {
                talentPoints: state.talentPoints - cost,
                talentTree: newTalentTree,
                talentUnlocks: newTalentUnlocks,
                talentBonuses: talentBonuses,
                // 套用屬性加成
                playerMaxHPBonus: newPlayerMaxHPBonus,
                playerAttackPower: newPlayerAttackPower,
                playerDefense: newPlayerDefense,
                playerManaRegen: newPlayerManaRegen
            };
        });
    },
    
    resetTalents: () => {
        set((state) => ({
            talentPoints: state.playerLevel - 1,
            talentTree: {},
            talentUnlocks: {}
        }));
    },
    
    updatePlayer: (updates) => set((state) => {
        // 如果有待選擇的獎勵，先不處理升級
        if (state.pendingLevelUpRewards) {
            let newState = { ...state, ...updates };
            const newHP = updates.playerHP !== undefined
                ? Math.max(0, updates.playerHP)
                : state.playerHP;
            newState.playerHP = newHP;
            newState.isDead = newHP <= 0;
            return newState;
        }

        let newState = { ...state, ...updates }; // ← 使用 let

        const newHP = updates.playerHP !== undefined
            ? Math.max(0, updates.playerHP)
            : state.playerHP;

        newState.playerHP = newHP;
        newState.isDead = newHP <= 0;

        // 自動檢查升級
        let exp = newState.playerExp;
        let lvl = newState.playerLevel;
        let expNeeded = expPerLevel(lvl);
        let levelUps = 0;

        while (exp >= expNeeded) {
            exp -= expNeeded;
            lvl++;
            levelUps++;
            expNeeded = expPerLevel(lvl);
        }

        if (levelUps > 0) {
            // 有升級，生成獎勵選項
            const rewards = generateLevelUpRewards(lvl, 3);
            
            newState = {
                ...newState,
                playerLevel: lvl,
                playerExp: exp,
                playerMaxHP: 100 + (lvl * 20),
                playerMaxMana: 100 + (lvl * 20),
                playerHP: 100 + (lvl * 20),
                playerMana: 100 + (lvl * 20),
                pendingLevelUpRewards: rewards,
                levelUpQueue: levelUps - 1,
                // 天賦點數：每級獲得1點
                talentPoints: state.talentPoints + levelUps
            };
        }

        return newState;
    }),
    // 重生玩家（點擊重新開始時呼叫）
    revivePlayer: () => set((state) => ({
        playerHP: state.playerMaxHP,
        playerMana: state.playerMaxMana,
        playerPos: new THREE.Vector3(0, 3, 0), // 重生到地圖中心
        isDead: false,
        // 可選懲罰
        playerGold: Math.floor(state.playerGold * 0.9), // 損失 10% 金幣
        playerExp: Math.floor(state.playerExp * 0.95),   // 損失 5% 經驗
        eventLog: [], // ← 清空事件記錄
    })),

    setTargetPosition: (pos) => set({ targetPosition: pos }),
    setTargetEnemy: (enemy) => set({ targetEnemy: enemy }),

    // 切換視角
    setCameraMode: (mode) => set({ cameraMode: mode }),

    // 添加物品到背包（改進版：支援堆疊和容量限制）
    addToInventory: (item) => set((state) => {
        // 檢查背包容量
        const nonStackableCount = state.backpack.filter(i => !i.stackable).length;
        const stackableItems = state.backpack.filter(i => i.stackable);
        
        if (nonStackableCount >= state.backpackMaxSize) {
            // 背包已滿，顯示提示
            return {
                eventLog: [...state.eventLog, {
                    message: '背包已滿！無法拾取物品。',
                    color: '#ff4444',
                    type: 'warning',
                    time: Date.now()
                }].slice(-50)
            };
        }
        
        // 處理可堆疊物品
        if (item.stackable) {
            const existingIndex = state.backpack.findIndex(i => 
                i.stackable && i.type === item.type && i.level === item.level
            );
            
            if (existingIndex >= 0) {
                // 合併到現有堆疊
                const newBackpack = [...state.backpack];
                const existing = newBackpack[existingIndex];
                
                if (item.type === 'gold') {
                    existing.amount = (existing.amount || 0) + item.amount;
                    existing.name = `${existing.amount} 金幣`;
                } else {
                    existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
                }
                
                return { backpack: newBackpack };
            }
        }
        
        // 添加新物品
        return {
            backpack: [...state.backpack, {
                ...item,
                id: item.id || Math.random().toString(36).substr(2, 9),
                rarityColor: RARITIES[item.rarity]?.color || '#ffffff',
                rarityName: RARITIES[item.rarity]?.name || '普通'
            }]
        };
    }),

    // 重新計算所有裝備屬性
    recalculateEquipmentStats: () => set((state) => {
        const totalStats = calculateTotalStats(state.equipped);
        
        // 基礎屬性 + 裝備加成
        const baseAttack = 50 + state.playerLevel * 10;
        const baseHP = 300 + state.playerLevel * 20;
        const baseMana = 300 + state.playerLevel * 20;
        
        // 全屬性加成影響所有主屬性
        const allStatsBonus = totalStats.allStats || 0;
        
        return {
            playerAttackPower: baseAttack + (totalStats.attack || 0) + allStatsBonus * 2,
            playerDefense: (totalStats.defense || 0) + allStatsBonus,
            playerMaxHPBonus: (totalStats.hp || 0) + allStatsBonus * 10,
            playerMaxManaBonus: (totalStats.mana || 0) + allStatsBonus * 5,
            playerManaRegen: 3 + (totalStats.manaRegen || 0) + allStatsBonus * 0.1,
            playerMoveSpeedBonus: totalStats.movementSpeed || 0,
            playerCritChance: 0.15 + (totalStats.critChance || 0) / 100,
            playerCritDamage: 50 + (totalStats.critDamage || 0),
            playerAttackSpeed: totalStats.attackSpeed || 0,
            playerLifeSteal: totalStats.lifeSteal || 0,
            playerDamageReduction: totalStats.damageReduction || 0,
            playerResistance: totalStats.resistance || 0,
            playerCooldownReduction: totalStats.cooldownReduction || 0,
            playerGoldFind: totalStats.goldFind || 0,
            playerExpBonus: totalStats.expBonus || 0,
            playerAllStats: allStatsBonus,
            playerMaxHP: baseHP + (totalStats.hp || 0) + allStatsBonus * 10,
            playerMaxMana: baseMana + (totalStats.mana || 0) + allStatsBonus * 5,
            playerHP: Math.min(state.playerHP, baseHP + (totalStats.hp || 0) + allStatsBonus * 10),
            playerMana: Math.min(state.playerMana, baseMana + (totalStats.mana || 0) + allStatsBonus * 5)
        };
    }),

    // 裝備/脫裝物品（改進版：自動計算所有屬性加成）
    equipItem: (slot, itemIndex) => set((state) => {
        const item = state.backpack[itemIndex];
        if (!item || !['weapon', 'armor', 'helmet', 'ring', 'amulet'].includes(slot)) return state;

        const oldItem = state.equipped[slot];

        // 交換物品
        const newBackpack = [...state.backpack];
        newBackpack.splice(itemIndex, 1);
        if (oldItem) newBackpack.push(oldItem);

        // 更新裝備並重新計算屬性
        const newEquipped = {
            ...state.equipped,
            [slot]: item
        };
        
        const totalStats = calculateTotalStats(newEquipped);
        const baseAttack = 50 + state.playerLevel * 10;
        const baseHP = 300 + state.playerLevel * 20;
        const baseMana = 300 + state.playerLevel * 20;
        const allStatsBonus = totalStats.allStats || 0;

        return {
            backpack: newBackpack,
            equipped: newEquipped,
            playerAttackPower: baseAttack + (totalStats.attack || 0) + allStatsBonus * 2,
            playerDefense: (totalStats.defense || 0) + allStatsBonus,
            playerMaxHPBonus: (totalStats.hp || 0) + allStatsBonus * 10,
            playerMaxManaBonus: (totalStats.mana || 0) + allStatsBonus * 5,
            playerManaRegen: 3 + (totalStats.manaRegen || 0) + allStatsBonus * 0.1,
            playerMoveSpeedBonus: totalStats.movementSpeed || 0,
            playerCritChance: 0.15 + (totalStats.critChance || 0) / 100,
            playerCritDamage: 50 + (totalStats.critDamage || 0),
            playerAttackSpeed: totalStats.attackSpeed || 0,
            playerLifeSteal: totalStats.lifeSteal || 0,
            playerDamageReduction: totalStats.damageReduction || 0,
            playerResistance: totalStats.resistance || 0,
            playerCooldownReduction: totalStats.cooldownReduction || 0,
            playerGoldFind: totalStats.goldFind || 0,
            playerExpBonus: totalStats.expBonus || 0,
            playerAllStats: allStatsBonus,
            playerMaxHP: baseHP + (totalStats.hp || 0) + allStatsBonus * 10,
            playerMaxMana: baseMana + (totalStats.mana || 0) + allStatsBonus * 5,
            playerHP: Math.min(state.playerHP, baseHP + (totalStats.hp || 0) + allStatsBonus * 10),
            playerMana: Math.min(state.playerMana, baseMana + (totalStats.mana || 0) + allStatsBonus * 5)
        };
    }),

    // 脫裝備（點擊已裝備槽）
    unequipItem: (slot) => set((state) => {
        const item = state.equipped[slot];
        if (!item) return state;

        // 檢查背包空間
        if (state.backpack.filter(i => !i.stackable).length >= state.backpackMaxSize) {
            return {
                eventLog: [...state.eventLog, {
                    message: '背包已滿！無法脫下裝備。',
                    color: '#ff4444',
                    type: 'warning',
                    time: Date.now()
                }].slice(-50)
            };
        }

        // 移除裝備並重新計算屬性
        const newEquipped = {
            ...state.equipped,
            [slot]: null
        };
        
        const totalStats = calculateTotalStats(newEquipped);
        const baseAttack = 50 + state.playerLevel * 10;
        const baseHP = 300 + state.playerLevel * 20;
        const baseMana = 300 + state.playerLevel * 20;
        const allStatsBonus = totalStats.allStats || 0;

        return {
            backpack: [...state.backpack, item],
            equipped: newEquipped,
            playerAttackPower: baseAttack + (totalStats.attack || 0) + allStatsBonus * 2,
            playerDefense: (totalStats.defense || 0) + allStatsBonus,
            playerMaxHPBonus: (totalStats.hp || 0) + allStatsBonus * 10,
            playerMaxManaBonus: (totalStats.mana || 0) + allStatsBonus * 5,
            playerManaRegen: 3 + (totalStats.manaRegen || 0) + allStatsBonus * 0.1,
            playerMoveSpeedBonus: totalStats.movementSpeed || 0,
            playerCritChance: 0.15 + (totalStats.critChance || 0) / 100,
            playerCritDamage: 50 + (totalStats.critDamage || 0),
            playerAttackSpeed: totalStats.attackSpeed || 0,
            playerLifeSteal: totalStats.lifeSteal || 0,
            playerDamageReduction: totalStats.damageReduction || 0,
            playerResistance: totalStats.resistance || 0,
            playerCooldownReduction: totalStats.cooldownReduction || 0,
            playerGoldFind: totalStats.goldFind || 0,
            playerExpBonus: totalStats.expBonus || 0,
            playerAllStats: allStatsBonus,
            playerMaxHP: baseHP + (totalStats.hp || 0) + allStatsBonus * 10,
            playerMaxMana: baseMana + (totalStats.mana || 0) + allStatsBonus * 5,
            playerHP: Math.min(state.playerHP, baseHP + (totalStats.hp || 0) + allStatsBonus * 10),
            playerMana: Math.min(state.playerMana, baseMana + (totalStats.mana || 0) + allStatsBonus * 5)
        };
    }),
    
    // 丟棄物品
    dropItem: (index) => set((state) => {
        const newBackpack = [...state.backpack];
        newBackpack.splice(index, 1);
        return { backpack: newBackpack };
    }),
    
    // 出售物品
    sellItem: (index) => set((state) => {
        const item = state.backpack[index];
        if (!item) return state;
        
        const sellValue = Math.floor((item.value || 10) * 0.3); // 30% 原價
        const newBackpack = [...state.backpack];
        newBackpack.splice(index, 1);
        
        return {
            backpack: newBackpack,
            playerGold: state.playerGold + sellValue,
            eventLog: [...state.eventLog, {
                message: `出售 ${item.name} 獲得 ${sellValue} 金幣`,
                color: '#ffdd00',
                type: 'info',
                time: Date.now()
            }].slice(-50)
        };
    }),
    
    // 整理背包（按稀有度排序）
    sortBackpack: () => set((state) => {
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
        const sorted = [...state.backpack].sort((a, b) => {
            // 先按稀有度排序
            const rarityDiff = (rarityOrder[a.rarity] || 5) - (rarityOrder[b.rarity] || 5);
            if (rarityDiff !== 0) return rarityDiff;
            // 再按類型排序
            return (a.type || '').localeCompare(b.type || '');
        });
        return { backpack: sorted };
    }),

    // 移動背包物品（交換位置）
    moveBackpackItem: (fromIndex, toIndex) => set((state) => {
        if (fromIndex === toIndex) return state;
        if (fromIndex < 0 || fromIndex >= state.backpack.length) return state;
        if (toIndex < 0 || toIndex >= state.backpack.length) return state;

        const newBackpack = [...state.backpack];
        const [movedItem] = newBackpack.splice(fromIndex, 1);
        newBackpack.splice(toIndex, 0, movedItem);
        
        return { backpack: newBackpack };
    }),

    // 合併堆疊物品
    mergeStackItem: (fromIndex, toIndex) => set((state) => {
        if (fromIndex === toIndex) return state;
        const fromItem = state.backpack[fromIndex];
        const toItem = state.backpack[toIndex];

        if (!fromItem || !toItem) return state;
        if (!fromItem.stackable || !toItem.stackable) return state;
        if (fromItem.type !== toItem.type) return state;
        if (fromItem.rarity !== toItem.rarity) return state;

        const maxStack = fromItem.maxStack || 99;
        const canMerge = toItem.quantity < maxStack;
        if (!canMerge) return state;

        const mergeQty = Math.min(fromItem.quantity, maxStack - toItem.quantity);
        
        const newBackpack = [...state.backpack];
        newBackpack[toIndex] = {
            ...toItem,
            quantity: toItem.quantity + mergeQty
        };
        newBackpack[fromIndex] = {
            ...fromItem,
            quantity: fromItem.quantity - mergeQty
        };

        // 如果來源物品數量為0，移除它
        if (newBackpack[fromIndex].quantity <= 0) {
            newBackpack.splice(fromIndex, 1);
        }

        return { backpack: newBackpack };
    }),

    // 分割堆疊物品
    splitStackItem: (fromIndex, splitQty) => set((state) => {
        const item = state.backpack[fromIndex];
        if (!item || !item.stackable || item.quantity <= 1) return state;
        if (splitQty <= 0 || splitQty >= item.quantity) return state;

        // 檢查背包是否有空位
        const nonStackableCount = state.backpack.filter(i => !i.stackable || i.quantity <= 0).length;
        const emptySlots = state.backpackMaxSize - nonStackableCount - 1;
        if (emptySlots < 0) return state;

        const newBackpack = [...state.backpack];
        newBackpack[fromIndex] = {
            ...item,
            quantity: item.quantity - splitQty
        };
        
        // 插入分割出的物品
        const newItem = { ...item, quantity: splitQty };
        newBackpack.push(newItem);

        return { backpack: newBackpack };
    }),

    // 從背包拖到裝備槽
    dragToEquip: (fromIndex, slot) => set((state) => {
        const item = state.backpack[fromIndex];
        if (!item) return state;
        
        const validSlots = ['weapon', 'armor', 'helmet', 'ring', 'amulet'];
        if (!validSlots.includes(slot)) return state;
        if (item.type !== slot) return state; // 類型不匹配

        const oldItem = state.equipped[slot];
        const newBackpack = [...state.backpack];
        newBackpack.splice(fromIndex, 1);
        if (oldItem) newBackpack.push(oldItem);

        const newEquipped = { ...state.equipped, [slot]: item };
        const totalStats = calculateTotalStats(newEquipped);
        
        // 計算屬性...
        return recalculateStats(state, { backpack: newBackpack, equipped: newEquipped });
    }),

    // 從裝備槽拖到背包
    dragFromEquip: (toIndex, slot) => set((state) => {
        const item = state.equipped[slot];
        if (!item) return state;

        // 檢查背包空間
        const nonStackableCount = state.backpack.filter(i => !i.stackable).length;
        if (nonStackableCount >= state.backpackMaxSize) {
            return {
                eventLog: [...state.eventLog, {
                    message: '背包已滿！',
                    color: '#ff4444',
                    type: 'warning',
                    time: Date.now()
                }].slice(-50)
            };
        }

        const newEquipped = { ...state.equipped, [slot]: null };
        
        // 如果目標位置有效，交換物品
        let newBackpack = [...state.backpack];
        if (toIndex >= 0 && toIndex < newBackpack.length) {
            const targetItem = newBackpack[toIndex];
            if (targetItem && targetItem.type === slot) {
                // 類型匹配，交換
                newBackpack[toIndex] = item;
                newEquipped[slot] = targetItem;
            } else {
                // 類型不匹配，插入並移動原有物品
                newBackpack.splice(toIndex, 0, item);
            }
        } else {
            // 放到背包末尾
            newBackpack.push(item);
        }

        return recalculateStats(state, { backpack: newBackpack, equipped: newEquipped });
    }),
    // 使用藥水
    consumePotion: (type) => {
        const state = get();
        if (state.inventory[type] <= 0 || state.isDead) return;

        if (type === 'hp_potion') {
            const heal = 60 + state.playerLevel * 10;
            get().updatePlayer({ playerHP: Math.min(state.playerMaxHP, state.playerHP + heal) });
            get().addFloatingNumber(state.playerPos.clone().add(new THREE.Vector3(0, 6, 0)), heal, 'heal');
            //createParticles(state.playerPos.clone().add(new THREE.Vector3(0, 4, 0)), 0x00ff88, 100, 20, 2, 'heal');
        } else if (type === 'mana_potion') {
            const restore = 50 + state.playerLevel * 8;
            get().updatePlayer({ playerMana: Math.min(state.playerMaxMana, state.playerMana + restore) });
        }

        set({
            inventory: {
                ...state.inventory,
                [type]: state.inventory[type] - 1
            }
        });
    },

    setObstacles: (obs) => set({ obstacles: obs }),

    setEnemies: (enemies) => set({
        enemies: Array.isArray(enemies) ? enemies : []
    }),

    updateEnemy: (id, updates) => set((state) => {
        const enemies = Array.isArray(state.enemies) ? state.enemies : [];
        const updatedEnemies = enemies.map(e => e.id === id ? { ...e, ...updates } : e);
        return { enemies: updatedEnemies };
    }),

    removeEnemy: (id) => set((state) => {
        const enemies = Array.isArray(state.enemies) ? state.enemies : [];
        return { enemies: enemies.filter(e => e.id !== id) };
    }),

    setChests: (chests) => set({ chests }),
    setProjectiles: (projs) => set({ projectiles: Array.isArray(projs) ? projs : [] }),
    addProjectile: (projectile) => set((state) => ({
        projectiles: [...(state.projectiles || []), projectile]
    })),
    removeProjectile: (index) => set((state) => ({
        projectiles: (state.projectiles || []).filter((_, i) => i !== index)
    })),
    setParticleSystems: (systems) => set({ particleSystems: Array.isArray(systems) ? systems : [] }),

    showLootNotification: (loot) => set({ lootNotification: loot }),
    clearLootNotification: () => set({ lootNotification: null }),
    
    // 連擊系統函數
    incrementCombo: () => set((state) => {
        const now = Date.now();
        const timeSinceLastAttack = now - state.lastAttackTime;
        
        let newComboCount = state.comboCount;
        if (timeSinceLastAttack < state.comboTimeout) {
            newComboCount = state.comboCount + 1;
        } else {
            newComboCount = 1; // 重新開始連擊
        }
        
        return {
            comboCount: newComboCount,
            lastAttackTime: now
        };
    }),
    
    resetCombo: () => set({ comboCount: 0, lastAttackTime: 0 }),

    // 粒子管理函數
    addParticle: (particle) => set((state) => ({
        particles: [...(state.particles || []), particle]
    })),
    
    removeParticle: (particleId) => set((state) => ({
        particles: (state.particles || []).filter(p => p.id !== particleId)
    })),
    
    // 批次移除粒子（性能優化）
    removeParticles: (particleIds) => set((state) => {
        if (!particleIds || particleIds.length === 0) return state;
        const idSet = new Set(particleIds);
        return {
            particles: (state.particles || []).filter(p => !idSet.has(p.id))
        };
    }),

}));

export default useGameState;