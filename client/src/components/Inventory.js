// src/components/Inventory.js - 優化版：完整的物品裝備系統 + 拖拽支援
import React, { useState, useCallback, useEffect } from 'react';
import useGameState from '../hooks/useGameState';
import { RARITIES, EQUIPMENT_TYPES, compareItems } from '../utils/itemSystem';
import { DragManager } from '../utils/DragManager';
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
        playerGold,
        moveBackpackItem,
        mergeStackItem,
        splitStackItem,
        dragToEquip,
        dragFromEquip
    } = useGameState();

    // UI 狀態
    const [hoveredItem, setHoveredItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [compareItem, setCompareItem] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [showSellConfirm, setShowSellConfirm] = useState(false);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [dragOverSlot, setDragOverSlot] = useState(null);
    const [showSplitDialog, setShowSplitDialog] = useState(false);
    const [splitInfo, setSplitInfo] = useState({ index: 0, quantity: 1 });

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
        setDragOverIndex(null);
        setDragOverSlot(null);
    };

    // ========== 拖拽處理 ==========
    
    // 開始拖拽
    const handleDragStart = (item, index, sourceContainer, e) => {
        if (e.button === 2) return; // 右鍵不拖拽
        e.preventDefault();
        DragManager.startDrag(item, index, sourceContainer, e);
    };

    // 拖拽移動
    const handleDragMove = useCallback((e) => {
        if (!DragManager.getDragState().isDragging) return;
        DragManager.moveDrag(e);
    }, []);

    // 拖拽結束
    const handleDragEnd = useCallback((e) => {
        if (!DragManager.getDragState().isDragging) return;
        
        // 獲取目標元素
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        
        // 隱藏拖拽元素以進行元素檢測
        const ghost = document.querySelector('.drag-ghost');
        if (ghost) ghost.style.display = 'none';
        
        // 檢測目標格子
        const elementUnder = document.elementFromPoint(clientX, clientY);
        if (ghost) ghost.style.display = 'flex';
        
        const targetSlot = elementUnder?.closest('.equipment-slot');
        const targetBackpack = elementUnder?.closest('.backpack-item');
        const targetIndex = targetBackpack?.dataset.index ? parseInt(targetBackpack.dataset.index) : null;
        
        const dragState = DragManager.getDragState();
        
        if (targetSlot) {
            // 拖到裝備槽
            const slotKey = targetSlot.dataset.slot;
            if (dragState.sourceContainer === 'backpack' && dragState.item.type === slotKey) {
                dragToEquip(dragState.index, slotKey);
            } else if (dragState.sourceContainer === 'equipment' && dragState.item.type === slotKey) {
                // 從裝備槽拖到同類型裝備槽，不處理
            }
        } else if (targetIndex !== null) {
            // 拖到背包格子
            const actualIndex = currentPage * BACKPACK_PAGE_SIZE + targetIndex;
            const targetItem = backpack[actualIndex];
            
            if (dragState.sourceContainer === 'backpack') {
                if (!targetItem) {
                    // 目標為空，直接移動
                    moveBackpackItem(dragState.index, actualIndex);
                } else if (targetItem.stackable && targetItem.type === dragState.item.type && targetItem.rarity === dragState.item.rarity) {
                    // 可堆疊且類型相同，嘗試合併
                    mergeStackItem(dragState.index, actualIndex);
                } else if (targetItem.type === dragState.item.type) {
                    // 同類型物品，交換
                    moveBackpackItem(dragState.index, actualIndex);
                }
            } else if (dragState.sourceContainer === 'equipment') {
                // 從裝備槽拖到背包
                dragFromEquip(actualIndex, dragState.item.type);
            }
        }
        
        // 拖到背包外部視為丟棄（可選功能）
        // if (!elementUnder?.closest('.inventory-container')) {
        //     dropItem(dragState.index);
        // }
        
        DragManager.endDrag(targetIndex, targetSlot?.dataset.slot || 'backpack');
        setDragOverIndex(null);
        setDragOverSlot(null);
    }, [backpack, currentPage, dragToEquip, dragFromEquip, moveBackpackItem, mergeStackItem]);

    // 觸控長按處理
    const [touchTimer, setTouchTimer] = useState(null);
    const [longPressedItem, setLongPressedItem] = useState(null);

    const handleTouchStart = (item, index, sourceContainer, e) => {
        const touch = e.touches[0];
        
        // 設定長按計時器 (500ms)
        const timer = setTimeout(() => {
            setLongPressedItem({ item, index, sourceContainer });
            handleDragStart(item, index, sourceContainer, { 
                touches: [touch], 
                preventDefault: () => {},
                target: e.target 
            });
        }, 300);
        
        setTouchTimer(timer);
    };

    const handleTouchEnd = (e) => {
        if (touchTimer) {
            clearTimeout(touchTimer);
            setTouchTimer(null);
        }
        
        if (DragManager.getDragState().isDragging) {
            handleDragEnd(e);
        }
        
        setLongPressedItem(null);
    };

    const handleTouchMove = (e) => {
        // 移動時取消長按
        if (touchTimer) {
            clearTimeout(touchTimer);
            setTouchTimer(null);
        }
        
        // 如果正在拖拽，移動拖拽元素
        if (DragManager.getDragState().isDragging) {
            e.preventDefault();
            handleDragMove(e);
        }
    };

    // 綁定全局事件
    useEffect(() => {
        const onMouseMove = (e) => handleDragMove(e);
        const onMouseUp = (e) => {
            if (DragManager.getDragState().isDragging) {
                handleDragEnd(e);
            }
        };
        const onTouchMove = (e) => handleTouchMove(e);
        const onTouchEnd = (e) => handleTouchEnd(e);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [handleDragMove, handleDragEnd]);

    // 處理拖拽進入目標格子
    const handleDragEnter = (index) => {
        setDragOverIndex(index);
    };

    const handleSlotDragEnter = (slotKey) => {
        setDragOverSlot(slotKey);
    };

    // 分割堆疊
    const handleSplitStack = (item, index) => {
        if (!item.stackable || item.quantity <= 1) return;
        setSplitInfo({ index, quantity: Math.floor(item.quantity / 2) });
        setShowSplitDialog(true);
    };

    const confirmSplit = () => {
        splitStackItem(splitInfo.index, splitInfo.quantity);
        setShowSplitDialog(false);
    };

    // 處理物品點擊
    const handleItemClick = (item, index) => {
        // 如果正在拖拽，不處理點擊
        if (DragManager.getDragState().isDragging) return;
        
        if (EQUIPMENT_TYPES[item.type]) {
            const currentEquipped = equipped[item.type];
            if (currentEquipped) {
                setSelectedItem({ item, index });
                setCompareItem(currentEquipped);
            } else {
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

    // 獲取拖拽狀態
    const dragState = DragManager.getDragState();

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
                                const isDragOver = dragOverSlot === slot.key;
                                const canAccept = dragState.isDragging && dragState.item?.type === slot.key;
                                
                                return (
                                    <div
                                        key={slot.key}
                                        data-slot={slot.key}
                                        className={`equipment-slot ${getRarityClass(item?.rarity)} ${!item ? 'empty' : ''} ${isDragOver && canAccept ? 'drag-over' : ''}`}
                                        onMouseEnter={(e) => { handleSlotHover(slot, e); handleSlotDragEnter(slot.key); }}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => item && unequipItem(slot.key)}
                                        onDragOver={(e) => { e.preventDefault(); handleSlotDragEnter(slot.key); }}
                                    >
                                        {!item ? (
                                            <div className="slot-placeholder">
                                                <span className="slot-icon">{slot.icon}</span>
                                                <span className="slot-name">{slot.name}</span>
                                                <span className="slot-desc">{slot.description}</span>
                                            </div>
                                        ) : (
                                            <div 
                                                className="equipped-item"
                                                onMouseDown={(e) => handleDragStart(item, slot.key, 'equipment', e)}
                                            >
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
                                const isDragging = dragState.isDragging && dragState.index === actualIndex && dragState.sourceContainer === 'backpack';
                                const isDragOver = dragOverIndex === idx && dragState.isDragging;
                                const canAccept = dragState.isDragging && dragState.sourceContainer === 'backpack';
                                
                                return (
                                    <div
                                        key={`${item?.id || 'empty'}-${idx}`}
                                        data-index={idx}
                                        className={`backpack-item ${item ? getRarityClass(item.rarity) : 'empty'} ${selectedItem?.index === actualIndex ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver && canAccept ? 'drag-over' : ''}`}
                                        onMouseEnter={(e) => { 
                                            if (item) handleItemHover(item, e);
                                            handleDragEnter(idx);
                                        }}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => item && handleItemClick(item, actualIndex)}
                                        onContextMenu={(e) => item && handleItemRightClick(e, item, actualIndex)}
                                        onMouseDown={(e) => item && handleDragStart(item, actualIndex, 'backpack', e)}
                                        onTouchStart={(e) => item && handleTouchStart(item, actualIndex, 'backpack', e)}
                                    >
                                        {item && (
                                            <>
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
                                                {/* 觸控提示 */}
                                                <div className="touch-hint">長按拖拽</div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {/* 空白格子 */}
                            {Array.from({ length: BACKPACK_PAGE_SIZE - currentItems.length }).map((_, i) => (
                                <div 
                                    key={`empty-${i}`} 
                                    data-index={BACKPACK_PAGE_SIZE - currentItems.length + i}
                                    className={`backpack-item empty ${dragOverIndex === currentItems.length + i && dragState.isDragging ? 'drag-over' : ''}`}
                                    onMouseEnter={() => handleDragEnter(currentItems.length + i)}
                                    onMouseLeave={handleMouseLeave}
                                />
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
                        {selectedItem.item.stackable && selectedItem.item.quantity > 1 && (
                            <button onClick={() => {
                                handleSplitStack(selectedItem.item, selectedItem.index);
                                setSelectedItem(null);
                            }}>
                                ✂️ 分割
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

                {/* 分割數量對話框 */}
                {showSplitDialog && (
                    <div className="split-dialog">
                        <div className="split-content">
                            <h3>分割堆疊</h3>
                            <div className="item-info">
                                <span className="item-icon">{getItemIcon(backpack[splitInfo.index])}</span>
                                <span>{backpack[splitInfo.index]?.name}</span>
                            </div>
                            <div className="split-controls">
                                <button onClick={() => setSplitInfo(s => ({ ...s, quantity: Math.max(1, s.quantity - 1) }))}>-</button>
                                <span className="split-value">{splitInfo.quantity}</span>
                                <button onClick={() => setSplitInfo(s => ({ ...s, quantity: Math.min((backpack[splitInfo.index]?.quantity || 1) - 1, s.quantity + 1) }))}>+</button>
                            </div>
                            <div className="split-buttons">
                                <button className="confirm" onClick={confirmSplit}>確認</button>
                                <button className="cancel" onClick={() => setShowSplitDialog(false)}>取消</button>
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
