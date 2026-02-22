const skillConfigs = {
    fireball: {
        id: 'fireball',
        name: '火球術',
        nameEn: 'Fireball',
        icon: '🔥',
        description: '發射一顆火球，造成火焰傷害',
        type: 'projectile',
        element: 'fire',
        damage: 550,
        manaCost: 2,
        cooldown: 1,
        range: 40,
        projectile: {
            shape: 'sphere',
            speed: 18,
            size: 0.5,
            trailLength: 40,
            homing: false,
            spiralPath: false
        },
        colors: {
            primary: '#ff6b35',
            secondary: '#ffaa00',
            glow: '#ff4400',
            core: '#ffffff'
        },
        explosion: {
            enabled: true,
            size: 4.0,
            particles: 300,
            shockwave: true,
            ringWaves: true,
            sparks: true,
            coreFlash: true,
            smoke: false
        },
        particles: {
            amount: 600,
            size: 3.0,
            lifetime: 2.0,
            spreadRadius: 3.0,
            motionType: 'outward',
            spiralStrength: 0.5,
            turbulence: 0.3
        },
        statusEffect: {
            enabled: true,
            type: 'burn',
            duration: 3,
            damage: 20,
            chance: 0.3
        },
        sound: 'fireball_cast',
        classes: ['mage']
    },
    
    icebolt: {
        id: 'icebolt',
        name: '冰箭術',
        nameEn: 'Ice Bolt',
        icon: '❄️',
        description: '發射一支冰箭，有機率冰凍目標',
        type: 'projectile',
        element: 'ice',
        damage: 80,
        manaCost: 15,
        cooldown: 3,
        range: 35,
        projectile: {
            shape: 'arrow',
            speed: 28,
            size: 0.35,
            trailLength: 25,
            homing: false,
            spiralPath: false
        },
        colors: {
            primary: '#38bdf8',
            secondary: '#ffffff',
            glow: '#0ea5e9',
            core: '#ffffff'
        },
        explosion: {
            enabled: true,
            size: 2.5,
            particles: 200,
            shockwave: false,
            ringWaves: true,
            sparks: true,
            coreFlash: false,
            smoke: false
        },
        statusEffect: {
            enabled: true,
            type: 'freeze',
            duration: 2,
            chance: 0.25
        },
        classes: ['mage']
    },
    
    meteor: {
        id: 'meteor',
        name: '隕石術',
        nameEn: 'Meteor',
        icon: '☄️',
        description: '召喚隕石從天而降',
        type: 'area',
        subType: 'delayed',
        element: 'fire',
        damage: 800,
        manaCost: 50,
        cooldown: 8,
        range: 35,
        radius: 15,
        delay: 1.7,
        colors: {
            primary: '#ff4400',
            secondary: '#ff8800',
            glow: '#ff2200',
            core: '#ffffff'
        },
        areaEffect: {
            type: 'ground_target',
            indicator: true,
            indicatorColor: '#ff440033',
            travelFrom: 'sky',
            travelHeight: 50,
            impactSize: 8.0
        },
        particles: {
            amount: 800,
            size: 4.0,
            lifetime: 3.0,
            spreadRadius: 6.0,
            motionType: 'explosion'
        },
        explosion: {
            enabled: true,
            size: 8.0,
            particles: 500,
            shockwave: true,
            ringWaves: true,
            sparks: true,
            smoke: true
        },
        classes: ['mage']
    },
    
    chainlightning: {
        id: 'chainlightning',
        name: '連鎖閃電',
        nameEn: 'Chain Lightning',
        icon: '⚡',
        description: '釋放閃電，可跳躍至多個目標',
        type: 'lightning',
        element: 'lightning',
        damage: 120,
        manaCost: 35,
        cooldown: 10,
        range: 40,
        lightning: {
            type: 'chain',
            branchCount: 5,
            jitterAmount: 0.8,
            flickerRate: 18,
            continuous: false,
            chainCount: 3,
            chainRange: 15,
            chainDamageDecay: 0.8
        },
        colors: {
            primary: '#facc15',
            secondary: '#fef08a',
            glow: '#ffffff',
            core: '#ffffff'
        },
        statusEffect: {
            enabled: true,
            type: 'shock',
            duration: 1.5,
            chance: 0.4
        },
        classes: ['mage']
    },
    
    heal: {
        id: 'heal',
        name: '治療術',
        nameEn: 'Heal',
        icon: '💚',
        description: '恢復生命值',
        type: 'heal',
        element: 'holy',
        healAmount: 100,
        manaCost: 30,
        cooldown: 10,
        range: 0,
        colors: {
            primary: '#22c55e',
            secondary: '#86efac',
            glow: '#10b981',
            core: '#ffffff'
        },
        particles: {
            amount: 200,
            size: 2.5,
            lifetime: 2.0,
            motionType: 'rise'
        },
        classes: ['mage']
    },
    
    nova: {
        id: 'nova',
        name: '奧術新星',
        nameEn: 'Arcane Nova',
        icon: '💥',
        description: '以自身為中心釋放能量波',
        type: 'area',
        subType: 'instant',
        element: 'arcane',
        damage: 300,
        manaCost: 50,
        cooldown: 12,
        range: 0,
        radius: 20,
        colors: {
            primary: '#a855f7',
            secondary: '#e879f9',
            glow: '#7c3aed',
            core: '#ffffff'
        },
        areaEffect: {
            type: 'self_centered',
            expandSpeed: 20,
            ringCount: 3
        },
        particles: {
            amount: 400,
            size: 3.0,
            lifetime: 1.5,
            motionType: 'outward',
            spreadRadius: 20
        },
        classes: ['mage']
    },
    
    slash: {
        id: 'slash',
        name: '橫斬',
        nameEn: 'Slash',
        icon: '🗡️',
        description: '揮舞武器攻擊前方敵人',
        type: 'melee',
        subType: 'cone',
        element: 'physical',
        damage: 200,
        manaCost: 0,
        cooldown: 0.8,
        range: 8,
        coneAngle: 1.05,
        colors: {
            primary: '#f8fafc',
            secondary: '#e2e8f0',
            glow: '#94a3b8',
            core: '#ffffff'
        },
        slashEffect: {
            swingArc: 120,
            trailLength: 15,
            width: 3
        },
        classes: ['warrior']
    },
    
    charge: {
        id: 'charge',
        name: '衝鋒',
        nameEn: 'Charge',
        icon: '🏃',
        description: '衝向敵人並造成暈眩',
        type: 'movement',
        element: 'physical',
        damage: 300,
        manaCost: 15,
        cooldown: 5,
        range: 25,
        stunDuration: 1.5,
        colors: {
            primary: '#f97316',
            secondary: '#fdba74',
            glow: '#ea580c',
            core: '#ffffff'
        },
        movementEffect: {
            speed: 60,
            trailParticles: true,
            impactEffect: true
        },
        classes: ['warrior']
    },
    
    whirlwind: {
        id: 'whirlwind',
        name: '旋風斬',
        nameEn: 'Whirlwind',
        icon: '🌀',
        description: '旋轉攻擊周圍所有敵人',
        type: 'melee',
        subType: 'aoe',
        element: 'physical',
        damage: 180,
        manaCost: 25,
        cooldown: 6,
        range: 0,
        radius: 12,
        colors: {
            primary: '#94a3b8',
            secondary: '#cbd5e1',
            glow: '#64748b',
            core: '#ffffff'
        },
        spinEffect: {
            rotations: 2,
            duration: 1.0,
            particlesPerRotation: 30
        },
        classes: ['warrior']
    },
    
    quickshot: {
        id: 'quickshot',
        name: '速射',
        nameEn: 'Quick Shot',
        icon: '➡️',
        description: '快速射出一支箭矢',
        type: 'projectile',
        element: 'physical',
        damage: 100,
        manaCost: 0,
        cooldown: 0.5,
        range: 40,
        projectile: {
            shape: 'arrow',
            speed: 25,
            size: 0.3,
            trailLength: 10
        },
        colors: {
            primary: '#84cc16',
            secondary: '#a3e635',
            glow: '#65a30d',
            core: '#ffffff'
        },
        classes: ['archer']
    },
    
    multishot: {
        id: 'multishot',
        name: '多重射擊',
        nameEn: 'Multi Shot',
        icon: '🎯',
        description: '同時射出多支箭矢',
        type: 'projectile',
        subType: 'spread',
        element: 'physical',
        damage: 80,
        manaCost: 20,
        cooldown: 4,
        range: 30,
        projectile: {
            shape: 'arrow',
            speed: 22,
            size: 0.25,
            count: 5,
            spreadAngle: 1.05
        },
        colors: {
            primary: '#22c55e',
            secondary: '#4ade80',
            glow: '#16a34a',
            core: '#ffffff'
        },
        classes: ['archer']
    },
    
    arrowrain: {
        id: 'arrowrain',
        name: '箭雨',
        nameEn: 'Arrow Rain',
        icon: '🌧️',
        description: '在區域降下箭雨',
        type: 'area',
        subType: 'persistent',
        element: 'physical',
        damage: 150,
        manaCost: 50,
        cooldown: 12,
        range: 30,
        radius: 20,
        duration: 3,
        tickRate: 0.3,
        colors: {
            primary: '#22c55e',
            secondary: '#86efac',
            glow: '#15803d',
            core: '#ffffff'
        },
        areaEffect: {
            type: 'ground_target',
            indicator: true,
            arrowCount: 50,
            fallHeight: 30
        },
        classes: ['archer']
    },
    
    wrath: {
        id: 'wrath',
        name: '憤怒',
        nameEn: 'Wrath',
        icon: '⚡',
        description: '釋放自然能量攻擊敵人',
        type: 'projectile',
        element: 'nature',
        damage: 150,
        manaCost: 5,
        cooldown: 1,
        range: 30,
        projectile: {
            shape: 'sphere',
            speed: 20,
            size: 0.4,
            trailLength: 20
        },
        colors: {
            primary: '#84cc16',
            secondary: '#bef264',
            glow: '#65a30d',
            core: '#ffffff'
        },
        classes: ['druid']
    },
    
    rejuvenation: {
        id: 'rejuvenation',
        name: '回春術',
        nameEn: 'Rejuvenation',
        icon: '💚',
        description: '立即治療並持續恢復生命',
        type: 'heal',
        subType: 'hot',
        element: 'nature',
        healAmount: 80,
        hotAmount: 20,
        hotDuration: 6,
        manaCost: 25,
        cooldown: 8,
        colors: {
            primary: '#22c55e',
            secondary: '#86efac',
            glow: '#16a34a',
            core: '#ffffff'
        },
        particles: {
            amount: 150,
            size: 2.0,
            lifetime: 2.0,
            motionType: 'spiral'
        },
        classes: ['druid']
    },
    
    sunfire: {
        id: 'sunfire',
        name: '日炎術',
        nameEn: 'Sunfire',
        icon: '☀️',
        description: '太陽之力灼燒區域敵人',
        type: 'area',
        subType: 'instant',
        element: 'fire',
        damage: 200,
        dotDamage: 40,
        dotDuration: 4,
        manaCost: 35,
        cooldown: 6,
        range: 25,
        radius: 10,
        colors: {
            primary: '#fbbf24',
            secondary: '#fde68a',
            glow: '#f59e0b',
            core: '#ffffff'
        },
        statusEffect: {
            enabled: true,
            type: 'burn',
            duration: 4,
            damage: 40,
            chance: 1.0
        },
        classes: ['druid']
    },
    
    thorns: {
        id: 'thorns',
        name: '荊棘',
        nameEn: 'Thorns',
        icon: '🌵',
        description: '受到攻擊時反彈傷害',
        type: 'buff',
        element: 'nature',
        manaCost: 30,
        cooldown: 10,
        duration: 8,
        reflectDamage: 50,
        colors: {
            primary: '#84cc16',
            secondary: '#bef264',
            glow: '#65a30d',
            core: '#ffffff'
        },
        classes: ['druid']
    },
    
    beaform: {
        id: 'bearform',
        name: '熊形態',
        nameEn: 'Bear Form',
        icon: '🐻',
        description: '變身為熊，提升血量和攻擊',
        type: 'buff',
        element: 'nature',
        manaCost: 50,
        cooldown: 20,
        duration: 15,
        hpBoost: 500,
        attackBoost: 50,
        colors: {
            primary: '#92400e',
            secondary: '#b45309',
            glow: '#78350f',
            core: '#ffffff'
        },
        classes: ['druid']
    },
    
    tranquility: {
        id: 'tranquility',
        name: '寧靜',
        nameEn: 'Tranquility',
        icon: '🌸',
        description: '持續治療周圍所有友方',
        type: 'heal',
        subType: 'aoe',
        element: 'nature',
        healAmount: 200,
        manaCost: 80,
        cooldown: 30,
        radius: 25,
        duration: 5,
        colors: {
            primary: '#f472b6',
            secondary: '#fbcfe8',
            glow: '#ec4899',
            core: '#ffffff'
        },
        classes: ['druid']
    },
    
    shieldbash: {
        id: 'shieldbash',
        name: '盾擊',
        nameEn: 'Shield Bash',
        icon: '🛡️',
        description: '用盾牌猛擊敵人並獲得護盾',
        type: 'melee',
        element: 'physical',
        damage: 150,
        manaCost: 20,
        cooldown: 8,
        range: 5,
        stunDuration: 2,
        shield: 100,
        colors: {
            primary: '#94a3b8',
            secondary: '#cbd5e1',
            glow: '#64748b',
            core: '#ffffff'
        },
        classes: ['warrior']
    },
    
    battlecry: {
        id: 'battlecry',
        name: '戰吼',
        nameEn: 'Battle Cry',
        icon: '📢',
        description: '提升攻擊力持續一段時間',
        type: 'buff',
        element: 'physical',
        manaCost: 30,
        cooldown: 15,
        duration: 8,
        attackBoost: 0.5,
        colors: {
            primary: '#f97316',
            secondary: '#fdba74',
            glow: '#ea580c',
            core: '#ffffff'
        },
        classes: ['warrior']
    },
    
    execute: {
        id: 'execute',
        name: '處決',
        nameEn: 'Execute',
        icon: '💀',
        description: '對低血量敵人造成巨大傷害',
        type: 'melee',
        element: 'physical',
        damage: 500,
        manaCost: 40,
        cooldown: 10,
        range: 5,
        executeThreshold: 0.2,
        colors: {
            primary: '#7c3aed',
            secondary: '#a78bfa',
            glow: '#6d28d9',
            core: '#ffffff'
        },
        classes: ['warrior']
    },
    
    poisonarrow: {
        id: 'poisonarrow',
        name: '毒箭',
        nameEn: 'Poison Arrow',
        icon: '☠️',
        description: '射出毒箭造成持續傷害',
        type: 'projectile',
        element: 'poison',
        damage: 60,
        dotDamage: 30,
        dotDuration: 5,
        manaCost: 25,
        cooldown: 6,
        range: 35,
        projectile: {
            shape: 'arrow',
            speed: 25,
            size: 0.3,
            trailLength: 15
        },
        colors: {
            primary: '#22c55e',
            secondary: '#4ade80',
            glow: '#16a34a',
            core: '#ffffff'
        },
        statusEffect: {
            enabled: true,
            type: 'poison',
            duration: 5,
            damage: 30,
            chance: 1.0
        },
        classes: ['archer']
    },
    
    evasion: {
        id: 'evasion',
        name: '閃避',
        nameEn: 'Evasion',
        icon: '💨',
        description: '短時間內閃避所有攻擊',
        type: 'buff',
        element: 'physical',
        manaCost: 15,
        cooldown: 10,
        duration: 3,
        colors: {
            primary: '#06b6d4',
            secondary: '#67e8f9',
            glow: '#0891b2',
            core: '#ffffff'
        },
        classes: ['archer']
    },
    
    snipe: {
        id: 'snipe',
        name: '狙擊',
        nameEn: 'Snipe',
        icon: '🎯',
        description: '蓄力射出高暴擊的一箭',
        type: 'projectile',
        element: 'physical',
        damage: 400,
        manaCost: 35,
        cooldown: 8,
        range: 50,
        critBonus: 0.5,
        projectile: {
            shape: 'arrow',
            speed: 40,
            size: 0.4,
            trailLength: 30
        },
        colors: {
            primary: '#f59e0b',
            secondary: '#fcd34d',
            glow: '#d97706',
            core: '#ffffff'
        },
        classes: ['archer']
    }
};

export const SKILL_TYPES = {
    PROJECTILE: 'projectile',
    AREA: 'area',
    LIGHTNING: 'lightning',
    MELEE: 'melee',
    HEAL: 'heal',
    MOVEMENT: 'movement',
    BUFF: 'buff'
};

export const ELEMENTS = {
    FIRE: 'fire',
    ICE: 'ice',
    LIGHTNING: 'lightning',
    PHYSICAL: 'physical',
    NATURE: 'nature',
    HOLY: 'holy',
    SHADOW: 'shadow',
    ARCANE: 'arcane',
    POISON: 'poison'
};

export const STATUS_EFFECTS = {
    BURN: 'burn',
    FREEZE: 'freeze',
    SHOCK: 'shock',
    POISON: 'poison',
    CHILL: 'chill',
    STUN: 'stun',
    ROOT: 'root',
    SLOW: 'slow'
};

export default skillConfigs;
