// src/configs/enemyConfigs.js (擴充怪物名字池)
const enemyConfigs = {
    melee: {
        name: '近戰',
        baseHp: 80,
        baseAttack: 15,
        baseSpeed: 12,
        range: 6,
        size: 3,
        detectRange: 30,
        color: '#ff4444',
        names: ['狂戰士', '蠻族戰士', '鐵錘鬥士', '血斧狂人', '戰吼者']
    },
    ranged: {
        name: '遠程',
        baseHp: 60,
        baseAttack: 20,
        baseSpeed: 10,
        range: 25,
        size: 2.5,
        detectRange: 40,
        color: '#44ff44',
        names: ['精靈弓手', '黑暗射手', '毒箭獵人', '風行箭士', '影箭手']
    },
    tank: {
        name: '坦克',
        baseHp: 150,
        baseAttack: 12,
        baseSpeed: 8,
        range: 7,
        size: 5,
        detectRange: 25,
        color: '#4444ff',
        names: ['鋼鐵守衛', '不動山嶽', '重甲巨人', '盾牆戰士', '堡壘守護者']
    },
    flying: {
        name: '飛行怪物',
        baseHp: 70,
        baseAttack: 18,
        baseSpeed: 18,
        range: 8,
        size: 3,
        detectRange: 35,
        color: '#ffaa00',
        names: ['翼魔', '天空掠奪者', '風暴蝙蝠', '火焰飛龍', '影翼惡魔']
    },
    mage: {
        name: '法師',
        baseHp: 55,
        baseAttack: 30,
        baseSpeed: 9,
        range: 30,
        size: 2.8,
        detectRange: 40,
        color: '#aa00ff',
        names: ['黑暗法師', '火焰術士', '冰霜巫師', '雷電召喚者', '秘法大師']
    },
    summoner: {
        name: '召喚師',
        baseHp: 90,
        baseAttack: 10,
        baseSpeed: 10,
        range: 5,
        size: 3.5,
        detectRange: 30,
        color: '#00aaaa',
        names: ['亡靈召喚師', '惡魔契約者', '蟲群主宰', '元素召喚者', '深淵使者']
    },
    sniper: {
        name: '狙擊手',
        baseHp: 50,
        baseAttack: 45,
        baseSpeed: 8,
        range: 45,
        size: 2.5,
        detectRange: 50,
        color: '#ff8888',
        names: ['死亡狙擊手', '遠距離獵殺者', '影中箭神', '致命一擊', '幽靈射手']
    },
    healer: {
        name: '治療者',
        baseHp: 70,
        baseAttack: 8,
        baseSpeed: 10,
        range: 20,
        size: 3,
        detectRange: 35,
        color: '#88ff88',
        names: ['聖光治療者', '生命守護者', '神聖牧師', '再生術士', '靈魂療癒者']
    },
    berserker: {
        name: '狂戰士',
        baseHp: 120,
        baseAttack: 35,
        baseSpeed: 15,
        range: 7,
        size: 4,
        detectRange: 30,
        color: '#ff0000',
        names: ['狂怒戰神', '毀滅狂人', '血腥屠夫', '無盡怒火', '戰爭瘋子']
    },
    shadow: {

        baseHp: 60,
        baseAttack: 25,
        baseSpeed: 20,
        range: 6,
        size: 2,
        detectRange: 40,
        color: '#333333',
        names: ['暗影刺客', '夜行者', '無聲殺手', '幽靈潛行者', '黑刃']
    },
    elemental: {
        name: '元素怪物',
        baseHp: 100,
        baseAttack: 28,
        baseSpeed: 11,
        range: 25,
        size: 4,
        detectRange: 35,
        color: '#00ffff',
        names: ['火焰元素', '冰霜元素', '雷電元素', '大地元素', '風暴元素']
    },
    boss: {
        name: '首領',
        baseHp: 1000,
        baseAttack: 50,
        baseSpeed: 10,
        range: 12,
        size: 10,
        detectRange: 60,
        color: '#ff00ff',
        names: ['地獄領主', '深淵魔王', '毀滅之王', '永恆黑暗', '終極恐懼']
    }
};

export default enemyConfigs;