import { useEffect } from 'react';
import * as THREE from 'three';
import useGameState from '../hooks/useGameState';
import { generateChestLoot } from '../utils/lootTables';
import { rarities } from '../utils/rarities';
import { createParticles } from './Particles';
import { createItem } from '../utils/itemUtils'; // 假設有工具生成物品


function openChest(chest) {
    if (chest.opened) return;

    const { showLootNotification, setChests } = useGameState.getState();

    const loot = generateChestLoot(chest.rarity.toLowerCase());

    // 顯示 UI
    showLootNotification({
        gold: loot.gold,
        items: loot.items,
        chestRarity: chest.rarity
    });

    // 實際加入背包（可延遲或動畫後加入）
    loot.items.forEach(item => {
        useGameState.getState().addToInventory(item);
    });

    // 更新金幣
    useGameState.getState().updatePlayer(prev => ({
        playerGold: prev.playerGold + loot.gold
    }));

    // 特效
    createParticles(chest.position, 0xffff00, 30, 12, 2, 'chest_open');

    // 標記已開啟
    setChests(prev => prev.map(c =>
        c.id === chest.id ? { ...c, opened: true } : c
    ));
}

function Chest({ chest }) {
    const playerPos = useGameState((state) => state.playerPos);
    const addToInventory = useGameState((state) => state.addToInventory);
    const playerGold = useGameState((state) => state.playerGold);
    const updatePlayer = useGameState((state) => state.updatePlayer);
    const setChests = useGameState((state) => state.setChests);

    useEffect(() => {
        if (playerPos.distanceTo(chest.position) < 8 && !chest.opened) {
            // 找到稀有度物件
            const rarityObj = rarities.find(r => r.name === chest.rarity) || rarities[0];

            // 金幣
            const gold = rarityObj.goldMin + Math.floor(Math.random() * (rarityObj.goldMax - rarityObj.goldMin + 1));
            updatePlayer({ playerGold: playerGold + gold });

            // 掉落物品
            const rewardCount = rarityObj.rewardMin + Math.floor(Math.random() * (rarityObj.rewardMax - rarityObj.rewardMin + 1));
            for (let i = 0; i < rewardCount; i++) {
                const types = ['hp_potion', 'mana_potion', 'weapon', 'armor', 'helmet', 'ring', 'amulet'];
                const type = types[Math.floor(Math.random() * types.length)];
                const item = createItem(chest.position.clone().add(new THREE.Vector3(Math.random() * 6 - 3, 1, Math.random() * 6 - 3)), type);
                addToInventory(item);
            }

            // 特效
            createParticles(chest.position, rarityObj.particleColor || 0xffff00, 40, 10, 2, 'chest_open');

            // 標記已開啟
            setChests(prev => prev.map(c =>
                c.id === chest.id ? { ...c, opened: true } : c
            ));
        }
    }, [playerPos, chest, addToInventory, playerGold, updatePlayer, setChests]);

    const colors = {
        普通: '#888888',
        魔法: '#4444ff',
        稀有: '#ffff44',
        傳說: '#ff8800'
    };

    return (
        <mesh position={chest.position} castShadow>
            <boxGeometry args={[4, 4, 4]} />
            <meshStandardMaterial color={chest.opened ? '#555555' : colors[chest.rarity] || '#888888'} />
        </mesh>
    );
}

function Chests() {
    const chests = useGameState((state) => state.chests);
    const setChests = useGameState((state) => state.setChests);
    const currentLevel = useGameState((state) => state.currentLevel);

    useEffect(() => {
        const newChests = [];
        const count = 8 + currentLevel * 3;

        for (let i = 0; i < count; i++) {
            let x, z;
            let attempts = 0;
            do {
                x = Math.random() * 240 - 120;
                z = Math.random() * 240 - 120;
                attempts++;
            } while (
                newChests.some(c => Math.hypot(c.position.x - x, c.position.z - z) < 15) &&
                attempts < 100
            );

            // 直接決定稀有度索引與物件
            const rarityIndex = Math.random() < 0.05 ? 3 : Math.random() < 0.15 ? 2 : Math.random() < 0.4 ? 1 : 0;
            const rarityObj = rarities[rarityIndex]; // 直接取物件

            newChests.push({
                id: `chest_${currentLevel}_${i}`,
                position: new THREE.Vector3(x, 2, z),
                rarity: rarityObj.name,      // 存字串名稱
                rarityObj: rarityObj,        // 同時存完整物件（方便後續使用）
                opened: false
            });
        }

        setChests(newChests);
    }, [currentLevel]);

    return (
        <>
            {Array.isArray(chests) && chests
                .filter(chest => chest && chest.position && chest.rarity)
                .map(chest => (
                    <Chest key={chest.id} chest={chest} />
                ))}
        </>
    );
}

export default Chests;