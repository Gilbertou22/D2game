// src/utils/gameUtils.js (改進版：使用新物品系統)
import useGameState from '../hooks/useGameState';
import { createParticles } from '../game/Particles';
import { generateLoot, generateGold, generatePotion, generateEquipment } from './itemSystem';
import * as THREE from 'three';

export function checkEnemyDeath(enemy) {
    if (enemy.hp > 0) return;

    const state = useGameState.getState();
    const {
        enemies,
        setEnemies,
        playerExp,
        playerGold,
        updatePlayer,
        addEvent,
        nextLevel,
        addFloatingNumber,
        addToInventory,
        playerExpBonus,
        playerGoldFind
    } = state;

    const isBoss = enemy.type === 'boss';
    const isElite = enemy.type === 'elite';
    const enemyLevel = enemy.level || state.currentLevel;
    
    // 基礎獎勵
    let expGain = isBoss ? 500 + enemyLevel * 50 : isElite ? 150 + enemyLevel * 15 : 30 + enemyLevel * 5;
    let goldGain = isBoss ? 300 + enemyLevel * 50 : isElite ? 100 + enemyLevel * 15 : 10 + enemyLevel * 3;
    
    // 應用加成
    expGain = Math.floor(expGain * (1 + playerExpBonus / 100));
    goldGain = Math.floor(goldGain * (1 + playerGoldFind / 100));

    // 更新經驗與金幣
    updatePlayer({
        playerExp: playerExp + expGain,
        playerGold: playerGold + goldGain
    });

    // 浮動數字（經驗 + 金幣）
    const pos = enemy.position.clone().add(new THREE.Vector3(0, enemy.size, 0));
    addFloatingNumber(pos, expGain, 'exp');
    addFloatingNumber(pos.clone().add(new THREE.Vector3(1, 0, 0)), goldGain, 'gold');

    // 事件記錄
    addEvent(
        `擊殺 ${isBoss ? 'BOSS' : isElite ? '精英' : '怪物'}，獲得 ${expGain} 經驗 + ${goldGain} 金幣`,
        '#ffff00',
        isBoss ? 'boss_kill' : 'kill'
    );

    // 生成掉落
    const loot = generateLoot(
        enemyLevel,
        isBoss ? 'boss' : isElite ? 'elite' : 'normal'
    );

    // 將掉落添加到背包或創建地面物品
    loot.forEach((item, index) => {
        // 直接添加到背包
        addToInventory(item);
        
        // 顯示掉落提示
        if (item.type === 'gold') {
            addEvent(`拾取 ${item.amount} 金幣`, '#ffdd00', 'drop_gold');
        } else if (item.type === 'hp_potion' || item.type === 'mana_potion') {
            const potionName = item.type === 'hp_potion' ? '生命藥水' : '魔力藥水';
            addEvent(`獲得 ${potionName}`, '#00ff88', 'drop_potion');
        } else {
            const rarityColor = item.rarityData?.color || '#ffffff';
            addEvent(`獲得 ${item.name}`, rarityColor, 'drop_equip');
            
            // 傳說裝備特殊提示
            if (item.rarity === 'legendary') {
                addEvent(`✨ 傳說裝備！${item.name}！`, '#ff8000', 'legendary_drop');
            }
        }
    });

    // 死亡特效
    createParticles(
        enemy.position.clone().add(new THREE.Vector3(0, enemy.size / 2, 0)),
        isBoss ? 0xff4400 : isElite ? 0xff8800 : 0xffff00,
        isBoss ? 300 : isElite ? 150 : 100,
        isBoss ? 30 : isElite ? 20 : 15,
        isBoss ? 5 : isElite ? 3.5 : 2.5,
        'death_explosion'
    );

    // 移除怪物
    setEnemies(enemies.filter(e => e.id !== enemy.id));

    // BOSS 專屬處理
    if (isBoss) {
        addEvent('🏆 BOSS 已擊敗！進入下一層地牢...', '#ff00ff', 'boss_kill');
        
        // 額外獎勵
        const bonusExp = 1000;
        const bonusGold = 500;
        updatePlayer({
            playerExp: playerExp + bonusExp,
            playerGold: playerGold + bonusGold
        });
        
        addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(0, enemy.size + 2, 0)), bonusExp, 'exp');
        addFloatingNumber(enemy.position.clone().add(new THREE.Vector3(2, enemy.size + 2, 0)), bonusGold, 'gold');

        // 延遲進入下一層
        setTimeout(() => nextLevel(), 3000);
    }
}

// 寶箱掉落處理
export function openChest(chest) {
    const state = useGameState.getState();
    const { addToInventory, addEvent, playerGold } = state;
    
    const chestType = chest.chestType || 'normal';
    const chestLevel = chest.level || 1;
    
    // 生成寶箱掉落
    const loot = generateLoot(chestLevel, 'normal', chestType);
    
    let totalGold = 0;
    
    loot.forEach(item => {
        addToInventory(item);
        
        if (item.type === 'gold') {
            totalGold += item.amount;
        } else if (item.rarity === 'legendary') {
            addEvent(`✨ 寶箱發現傳說裝備！${item.name}！`, '#ff8000', 'chest_legendary');
        } else if (item.rarity === 'epic') {
            addEvent(`🎁 寶箱發現史詩裝備！${item.name}`, '#a335ee', 'chest_epic');
        }
    });
    
    if (totalGold > 0) {
        addEvent(`💰 寶箱獲得 ${totalGold} 金幣`, '#ffdd00', 'chest_gold');
    }
    
    // 寶箱開啟特效
    createParticles(
        chest.position.clone().add(new THREE.Vector3(0, 1, 0)),
        0xffdd00,
        50,
        15,
        2,
        'chest_open'
    );
    
    return loot;
}

export default {
    checkEnemyDeath,
    openChest
};
