// src/components/Inventory.js - 優化版：完整的物品裝備系統
import React, { useState, useCallback } from 'react';
import useGameState from '../hooks/useGameState';
import { RARITIES, EQUIPMENT_TYPES, compareItems } from '../utils/itemSystem';
import ItemTooltip from './ItemTooltip';
import './Inventory.css';

// 裝備槽配置
const EQUIPMENT_SLOTS = [
    { key: 'weapon', name: '武器', icon: '⚔️', description: '增加攻擊力和暴擊' },
    { key: 'armor', name: '護甲', icon: '🛡️', description: '增加防禦和生命' },
    { key: 'helmet', name: '頭盔', icon: '⛑️', description: '增加防禦和魔力' },
    { key: 'ring', name: '戒指', icon: '💍', description: '增加多種屬性' },
    { key: 'amulet', name: '項鍊', icon: '📿', description: '增加高級屬性' }
];

// 背包每頁大小
const BACKPACK_PAGE_SIZE = 36;

function Inventory({ open, onClose }) {
    const {
        backpack,
        equipped,
        equipItem,
        unequipItem,
        inventory,
        consumePotion,
        dropItem,
        sellItem,
        sortBackpack,
        playerGold
    } = useGameState();

    // UI 狀態
    const [hoveredItem, setHoveredItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [compareItem, setCompareItem] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [showSellConfirm, setShowSellConfirm] = useState(false);

    // 計算背包分頁
    const totalPages = Math.ceil(backpack.length / BACKPACK_PAGE_SIZE);
    const currentItems = backpack.slice(
        currentPage * BACKPACK_PAGE_SIZE,
        (currentPage + 1) * BACKPACK_PAGE_SIZE
    );

    // 獲取對應槽位的已裝備物品
    const getEquippedForComparison = useCallback((itemType) => {
        return equipped[itemType] || null;
    }, [equipped]);

    // 處理物品懸停
    const handleItemHover = (item, e) => {
        setHoveredItem(item);
        setCompareItem(getEquippedForComparison(item.type));
        setTooltipPos({ x: e.clientX + 15, y: e.clientY + 15 });
    };

    // 處理裝備槽懸停
    const handleSlotHover = (slot, e) => {
        const item = equipped[slot.key];
        if (item) {
            setHoveredItem(item);
            setCompareItem(null);
            setTooltipPos({ x: e.clientX + 15, y: e.clientY + 15 });
        }
    };

    // 處理鼠標移出
    const handleMouseLeave = () => {
        setHoveredItem(null);
        setCompareItem(null);
    };

    // 處理物品點擊
    const handleItemClick = (item, index) => {
        if (EQUIPMENT_TYPES[item.type]) {
            // 可裝備物品
            const currentEquipped = equipped[item.type];
            if (currentEquipped) {
                // 有裝備時顯示比較
                setSelectedItem({ item, index });
                setCompareItem(currentEquipped);
            } else {
                // 直接裝備
                equipItem(item.type, index);
            }
        }
    };

    // 處理右鍵點擊（菜單）
    const handleItemRightClick = (e, item, index) => {
        e.preventDefault();
        setSelectedItem({ item, index, showMenu: true, menuPos: { x: e.clientX, y: e.clientY } });
    };

    // 確認出售
    const handleSellConfirm = () => {
        if (selectedItem) {
            sellItem(selectedItem.index);
            setSelectedItem(null);
            setShowSellConfirm(false);
        }
    };

    // 裝備品質樣式
    const getRarityClass = (rarity) => {
        return `rarity-${rarity || 'common'}`;
    };

    // 物品圖標
    const getItemIcon = (item) => {
        if (item.type === 'hp_potion') return '❤️';
        if (item.type === 'mana_potion') return '💙';
        if (item.type === 'gold') return '💰';
        return EQUIPMENT_TYPES[item.type]?.icon || '📦';
    };

    if (!open) return null;

    return (
        <div className="inventory-overlay" onClick={onClose}>
            <div className="inventory-container" onClick={e => e.stopPropagation()}>
                {/* 標題欄 */}
                <div className="inventory-header">
                    <h2>🎒 背包與裝備</h2>
                    <div className="inventory-stats">
                        <span className="gold-display">💰 {playerGold.toLocaleString()}</span>
                        <span className="capacity-display">
                            📦 {backpack.length}/{40}
                        </span>
                    </div>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="inventory-content">
                    {/* 左側：裝備槽 */}
                    <div className="equipment-panel">
                        <h3>已裝備</h3>
                        <div className="equipment-slots">
                            {EQUIPMENT_SLOTS.map(slot => {
                                const item = equipped[slot.key];
                                return (
                                    <div
                                        key={slot.key}
                                        className={`equipment-slot ${getRarityClass(item?.rarity)} ${!item ? 'empty' : ''}`}
                                        onMouseEnter={(e) => handleSlotHover(slot, e)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => item && unequipItem(slot.key)}
                                    >
                                        {!item ? (
                                            <div className="slot-placeholder">
                                                <span className="slot-icon">{slot.icon}</span>
                                                <span className="slot-name">{slot.name}</span>
                                                <span className="slot-desc">{slot.description}</span>
                                            </div>
                                        ) : (
                                            <div className="equipped-item">
                                                <span className="item-icon">{item.icon}</span>
                                                <div className="item-info">
                                                    <span className="item-name" style={{ color: item.rarityColor }}>
                                                        {item.name || '未命名'}
                                                    </span>
                                                    <span className="item-level">Lv.{item.level}</span>
                                                </div>
                                                {item.affixes && item.affixes.length > 0 && (
                                                    <div className="item-affix-count">
                                                        +{item.affixes.length}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 藥水快捷使用 */}
                        <div className="potion-quick-access">
                            <h4>快速使用</h4>
                            <div className="potion-buttons">
                                <button 
                                    className="potion-btn hp"
                                    onClick={() => consumePotion('hp_potion')}
                                    disabled={inventory.hp_potion <= 0}
                                >
                                    <span className="potion-icon">❤️</span>
                                    <span className="potion-count">{inventory.hp_potion}</span>
                                    <span className="potion-key">Q</span>
                                </button>
                                <button 
                                    className="potion-btn mana"
                                    onClick={() => consumePotion('mana_potion')}
                                    disabled={inventory.mana_potion <= 0}
                                >
                                    <span className="potion-icon">💙</span>
                                    <span className="potion-count">{inventory.mana_potion}</span>
                                    <span className="potion-key">E</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 右側：背包 */}
                    <div className="backpack-panel">
                        <div className="backpack-header">
                            <h3>背包物品</h3>
                            <div className="backpack-actions">
                                <button className="sort-btn" onClick={sortBackpack} title="整理背包">
                    🔃 整理
                                </button>
                            </div>
                        </div>

                        <div className="backpack-grid">
                            {currentItems.map((item, idx) => {
                                const actualIndex = currentPage * BACKPACK_PAGE_SIZE + idx;
                                return (
                                    <div
                                        key={`${item.id}-${idx}`}
                                        className={`backpack-item ${getRarityClass(item.rarity)} ${selectedItem?.index === actualIndex ? 'selected' : ''}`}
                                        onMouseEnter={(e) => handleItemHover(item, e)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => handleItemClick(item, actualIndex)}
                                        onContextMenu={(e) => handleItemRightClick(e, item, actualIndex)}
                                    >
                                        <div className="item-icon-container">
                                            <span className="item-icon">{getItemIcon(item)}</span>
                                            {item.quantity > 1 && (
                                                <span className="item-quantity">{item.quantity}</span>
                                            )}
                                        </div>
                                        <span className="item-name-small" style={{ color: item.rarityColor }}>
                                            {item.name?.length > 8 ? item.name?.slice(0, 8) + '...' : (item.name || '未命名')}
                                        </span>
                                        {EQUIPMENT_TYPES[item.type] && compareItems(equipped[item.type], item).better && (
                                            <div className="upgrade-indicator">⬆️</div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {/* 空白格子 */}
                            {Array.from({ length: BACKPACK_PAGE_SIZE - currentItems.length }).map((_, i) => (
                                <div key={`empty-${i}`} className="backpack-item empty" />
                            ))}
                        </div>

                        {/* 分頁控制 */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button 
                                    disabled={currentPage === 0}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                >
                                    ◀
                                </button>
                                <span>{currentPage + 1} / {totalPages}</span>
                                <button 
                                    disabled={currentPage >= totalPages - 1}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                >
                                    ▶
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 右鍵菜單 */}
                {selectedItem?.showMenu && (
                    <div 
                        className="context-menu"
                        style={{ 
                            left: selectedItem.menuPos.x, 
                            top: selectedItem.menuPos.y 
                        }}
                    >
                        {EQUIPMENT_TYPES[selectedItem.item.type] && (
                            <button onClick={() => {
                                equipItem(selectedItem.item.type, selectedItem.index);
                                setSelectedItem(null);
                            }}>
                                🎽 裝備
                            </button>
                        )}
                        <button onClick={() => {
                            setShowSellConfirm(true);
                            setSelectedItem({ ...selectedItem, showMenu: false });
                        }}>
                            💰 出售 ({Math.floor((selectedItem.item.value || 10) * 0.3)} 金幣)
                        </button>
                        <button onClick={() => {
                            dropItem(selectedItem.index);
                            setSelectedItem(null);
                        }}>
                            🗑️ 丟棄
                        </button>
                        <button onClick={() => setSelectedItem(null)}>
                            取消
                        </button>
                    </div>
                )}

                {/* 出售確認框 */}
                {showSellConfirm && selectedItem && (
                    <div className="confirm-dialog">
                        <div className="confirm-content">
                            <p>確定要出售 <strong>{selectedItem.item.name}</strong> 嗎？</p>
                            <p>將獲得 <strong>{Math.floor((selectedItem.item.value || 10) * 0.3)}</strong> 金幣</p>
                            <div className="confirm-buttons">
                                <button onClick={handleSellConfirm} className="confirm">確定</button>
                                <button onClick={() => setShowSellConfirm(false)} className="cancel">取消</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 物品提示框 */}
                {hoveredItem && (
                    <ItemTooltip 
                        item={hoveredItem}
                        compareItem={compareItem}
                        position={tooltipPos}
                    />
                )}
            </div>
        </div>
    );
}

export default Inventory;
