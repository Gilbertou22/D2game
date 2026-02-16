// src/components/LootNotification.js
import { useEffect } from 'react';
import useGameState from '../hooks/useGameState';

function LootNotification() {
    const lootNotification = useGameState((state) => state.lootNotification);
    const clearLootNotification = useGameState((state) => state.clearLootNotification);

    useEffect(() => {
        if (!lootNotification) return;

        const timer = setTimeout(() => {
            clearLootNotification();
        }, 6000); // 延長到 6 秒，讓玩家看清楚 BOSS 掉落

        return () => clearTimeout(timer);
    }, [lootNotification, clearLootNotification]);

    if (!lootNotification) return null;

    const { gold, items, chestRarity } = lootNotification;
    const isBoss = chestRarity?.includes('BOSS');

    const rarityColors = {
        普通: '#ffffff',
        魔法: '#0088ff',
        稀有: '#00ff00',
        傳說: '#ff00ff',
        BOSS: '#ff00ff' // BOSS 專屬紫金
    };

    const borderColor = isBoss ? '#ff00ff' : rarityColors[chestRarity] || '#ffffff';

    return (
        <div
            style={{
                position: 'fixed',
                top: '20%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '460px',
                maxHeight: '75vh',
                background: 'rgba(0,0,0,0.9)',
                border: `6px solid ${borderColor}`,
                borderRadius: '20px',
                padding: '25px',
                boxShadow: `0 0 40px ${borderColor}, inset 0 0 20px rgba(255,255,255,0.1)`,
                color: 'white',
                zIndex: 300,
                overflowY: 'auto',
                textAlign: 'center',
                animation: 'fadeInScale 0.6s ease-out',
                pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()} // 防止點擊背景關閉
        >
            <h2
                style={{
                    color: borderColor,
                    fontSize: '36px',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    textShadow: `0 0 20px ${borderColor}`,
                    animation: isBoss ? 'pulseGlow 2s infinite' : 'none'
                }}
            >
                {isBoss ? 'BOSS 專屬掉落！' : `開啟 ${chestRarity || '未知'} 寶箱！`}
            </h2>

            {gold > 0 && (
                <div
                    style={{
                        marginBottom: '25px',
                        fontSize: '32px',
                        color: '#ffd700',
                        fontWeight: 'bold',
                        textShadow: '0 0 15px #ffd700',
                        animation: 'goldShine 2s infinite'
                    }}
                >
                    + {gold} 金幣
                </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: `3px solid ${item.rarityColor || '#888'}`,
                            borderRadius: '12px',
                            padding: '15px',
                            minWidth: '140px',
                            textAlign: 'center',
                            boxShadow: `0 0 15px ${item.rarityColor || '#888'}`
                        }}
                    >
                        {/* 類型圖示（emoji，可換真圖片） */}
                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>
                            {item.type === 'weapon' ? '⚔️' :
                                item.type === 'armor' ? '🛡️' :
                                    item.type === 'helmet' ? '⛑️' :
                                        item.type === 'ring' ? '💍' :
                                            item.type === 'amulet' ? '📿' :
                                                item.type === 'hp_potion' ? '❤️' : '💙'}
                        </div>

                        <div style={{ color: item.rarityColor || '#ffffff', fontWeight: 'bold', fontSize: '18px' }}>
                            {item.rarityName || '未知'}
                        </div>
                        <div style={{ fontSize: '16px', margin: '5px 0' }}>
                            {item.type === 'hp_potion' ? '生命藥水' :
                                item.type === 'mana_potion' ? '魔力藥水' :
                                    item.type}
                        </div>
                        <div style={{ fontSize: '14px', color: '#aaa' }}>
                            等級 {item.level || 1}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={clearLootNotification}
                style={{
                    marginTop: '30px',
                    padding: '12px 40px',
                    background: '#333',
                    border: '3px solid #888',
                    color: 'white',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s',
                }}
                onMouseOver={(e) => e.target.style.background = '#555'}
                onMouseOut={(e) => e.target.style.background = '#333'}
            >
                關閉
            </button>
        </div>
    );
}

export default LootNotification;