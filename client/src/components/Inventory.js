import React, { useState, useCallback, useEffect, useRef } from 'react';
import useGameState from '../hooks/useGameState';
import { RARITIES, EQUIPMENT_TYPES, getItemSize } from '../utils/itemSystem';
import ItemTooltip from './ItemTooltip';
import './Inventory.css';

const GRID_COLS = 7;
const GRID_ROWS = 8;

const EQUIP_SLOTS = [
    { id: 'helmet', label: '頭盔', pos: { top: 20, left: '50%', transform: 'translateX(-50%)' }, size: [1, 2] },
    { id: 'amulet', label: '項鍊', pos: { top: 20, right: 20 }, size: [1, 1] },
    { id: 'weapon', label: '武器', pos: { top: 90, left: 15 }, size: [1, 3] },
    { id: 'armor', label: '護甲', pos: { top: 85, left: '50%', transform: 'translateX(-50%)' }, size: [2, 3] },
    { id: 'ring', label: '戒指', pos: { top: 200, left: 25 }, size: [1, 1] }
];

const SLOT_ICONS = {
    helmet: '⛑️',
    amulet: '📿',
    weapon: '⚔️',
    armor: '🛡️',
    ring: '💍'
};

function Inventory({ open, setOpen }) {
    const onClose = () => setOpen(false);
    const backpack = useGameState((state) => state.backpack);
    const equipped = useGameState((state) => state.equipped);
    const playerGold = useGameState((state) => state.playerGold);
    const playerHP = useGameState((state) => state.playerHP);
    const playerMaxHP = useGameState((state) => state.playerMaxHP);
    const playerMana = useGameState((state) => state.playerMana);
    const playerMaxMana = useGameState((state) => state.playerMaxMana);
    const playerLevel = useGameState((state) => state.playerLevel);
    const playerAttackPower = useGameState((state) => state.playerAttackPower);
    const playerDefense = useGameState((state) => state.playerDefense);
    const playerCritChance = useGameState((state) => state.playerCritChance);
    const playerCritDamage = useGameState((state) => state.playerCritDamage);
    const playerClass = useGameState((state) => state.playerClass);
    const equipItem = useGameState((state) => state.equipItem);
    const unequipItem = useGameState((state) => state.unequipItem);
    const dropItem = useGameState((state) => state.dropItem);
    const sellItem = useGameState((state) => state.sellItem);
    const sortBackpack = useGameState((state) => state.sortBackpack);
    const moveBackpackItem = useGameState((state) => state.moveBackpackItem);

    const [hoveredItem, setHoveredItem] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [dragItem, setDragItem] = useState(null);
    const [dragSource, setDragSource] = useState(null);
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [dragOverGrid, setDragOverGrid] = useState(null);
    const [dragOverEquipSlot, setDragOverEquipSlot] = useState(null);
    
    const gridRef = useRef(null);
    const equipSlotsRef = useRef([]);

    const backpackArray = Array.isArray(backpack) ? backpack : [];
    const equippedObj = equipped || {};

    const hpPercent = playerMaxHP > 0 ? (playerHP / playerMaxHP) * 100 : 0;
    const manaPercent = playerMaxMana > 0 ? (playerMana / playerMaxMana) * 100 : 0;

    const getRarityClass = (rarity) => {
        const classes = {
            legendary: 'legendary',
            epic: 'epic',
            rare: 'rare',
            uncommon: 'magic',
            common: 'common'
        };
        return classes[rarity] || 'common';
    };

    const getItemIcon = (item) => {
        if (!item) return null;
        if (item.type === 'hp_potion') return '❤️';
        if (item.type === 'mana_potion') return '💙';
        if (item.type === 'gold') return '💰';
        return SLOT_ICONS[item.type] || EQUIPMENT_TYPES[item.type]?.icon || '📦';
    };

    const createGrid = useCallback(() => {
        const grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));
        
        backpackArray.forEach((item, index) => {
            if (!item) return;
            const size = getItemSize(item);
            const pos = item.gridPos;
            
            if (pos && pos.row >= 0 && pos.col >= 0) {
                for (let r = 0; r < size[1]; r++) {
                    for (let c = 0; c < size[0]; c++) {
                        if (pos.row + r < GRID_ROWS && pos.col + c < GRID_COLS) {
                            grid[pos.row + r][pos.col + c] = { item, index, isPart: r > 0 || c > 0, mainPos: pos };
                        }
                    }
                }
            }
        });
        
        return grid;
    }, [backpackArray]);

    const canPlaceItem = useCallback((grid, item, row, col) => {
        const size = getItemSize(item);
        
        if (row + size[1] > GRID_ROWS || col + size[0] > GRID_COLS) return false;
        
        for (let r = 0; r < size[1]; r++) {
            for (let c = 0; c < size[0]; c++) {
                const cell = grid[row + r][col + c];
                if (cell && cell.item && !(dragSource?.type === 'backpack' && cell.index === dragSource.index)) {
                    return false;
                }
            }
        }
        
        return true;
    }, [dragSource]);

    const handleItemHover = (item, e) => {
        if (!item || dragItem) return;
        setHoveredItem(item);
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({ x: rect.right + 12, y: rect.top });
    };

    const handleMouseLeave = () => {
        if (!dragItem) setHoveredItem(null);
    };

    const handleDragStart = (item, source, index, e) => {
        e.preventDefault();
        const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
        const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
        
        setDragItem(item);
        setDragSource({ type: source, index });
        setDragPos({ x: clientX, y: clientY });
        setHoveredItem(null);
    };

    const handleDragMove = useCallback((e) => {
        if (!dragItem) return;
        
        const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
        const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
        
        setDragPos({ x: clientX, y: clientY });
        
        const ghost = document.querySelector('.d4-drag-ghost');
        if (ghost) ghost.style.display = 'none';
        
        const target = document.elementFromPoint(clientX, clientY);
        
        if (ghost) ghost.style.display = '';
        
        setDragOverEquipSlot(null);
        setDragOverGrid(null);
        
        const equipSlot = target?.closest('.d4-equip-slot');
        
        if (equipSlot && dragItem.type) {
            const slotId = equipSlot.dataset.slot;
            if (slotId && dragItem.type === slotId) {
                setDragOverEquipSlot(slotId);
                return;
            }
        }
        
        if (gridRef.current) {
            const rect = gridRef.current.getBoundingClientRect();
            const cellSize = rect.width / GRID_COLS;
            const col = Math.floor((clientX - rect.left) / cellSize);
            const row = Math.floor((clientY - rect.top) / cellSize);
            
            if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
                setDragOverGrid({ row, col });
            }
        }
    }, [dragItem]);

    const handleDragEnd = useCallback((e) => {
        if (!dragItem) return;
        
        if (dragOverEquipSlot) {
            if (dragSource.type === 'backpack') {
                equipItem(dragOverEquipSlot, dragSource.index);
            }
        } else if (dragOverGrid) {
            const grid = createGrid();
            if (canPlaceItem(grid, dragItem, dragOverGrid.row, dragOverGrid.col)) {
                if (dragSource.type === 'backpack') {
                    moveBackpackItem(dragSource.index, dragOverGrid.row, dragOverGrid.col);
                } else if (dragSource.type === 'equip') {
                    unequipItem(dragSource.index, dragOverGrid.row, dragOverGrid.col);
                }
            }
        }
        
        setDragItem(null);
        setDragSource(null);
        setDragOverGrid(null);
        setDragOverEquipSlot(null);
    }, [dragItem, dragSource, dragOverGrid, dragOverEquipSlot, createGrid, canPlaceItem, moveBackpackItem, unequipItem, equipItem]);

    const handleEquipClick = (slotId) => {
        const item = equippedObj[slotId];
        if (item) {
            unequipItem(slotId);
        }
    };

    const handleGridCellClick = (row, col, cellData) => {
        if (dragItem) return;
        
        if (cellData?.item && !cellData.isPart) {
            if (EQUIPMENT_TYPES[cellData.item.type]) {
                equipItem(cellData.item.type, cellData.index);
            }
        }
    };

    useEffect(() => {
        const onMouseMove = (e) => handleDragMove(e);
        const onMouseUp = (e) => handleDragEnd(e);
        
        if (dragItem) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            window.addEventListener('touchmove', onMouseMove);
            window.addEventListener('touchend', onMouseUp);
        }
        
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onMouseMove);
            window.removeEventListener('touchend', onMouseUp);
        };
    }, [dragItem, handleDragMove, handleDragEnd]);

    const grid = createGrid();
    const dragItemSize = dragItem ? getItemSize(dragItem) : [1, 1];

    if (!open) return null;

    const classNames = {
        mage: '法師',
        warrior: '戰士',
        archer: '弓箭手',
        druid: '德魯伊'
    };

    const renderGridPreview = () => {
        if (!dragOverGrid || !dragItem) return null;
        
        const grid = createGrid();
        const canPlace = canPlaceItem(grid, dragItem, dragOverGrid.row, dragOverGrid.col);
        
        return (
            <div 
                className={`grid-preview ${canPlace ? 'can-place' : 'cannot-place'}`}
                style={{
                    gridColumn: `${dragOverGrid.col + 1} / span ${dragItemSize[0]}`,
                    gridRow: `${dragOverGrid.row + 1} / span ${dragItemSize[1]}`
                }}
            />
        );
    };

    return (
        <div className="d4-overlay" onClick={onClose}>
            <div className="d4-container" onClick={e => e.stopPropagation()}>
                <button className="d4-close-btn" onClick={onClose}>✕</button>
                
                <div className="d4-main">
                    <section className="d4-panel d4-stash-panel">
                        <div className="d4-panel-header">
                            <span className="d4-panel-title">背包</span>
                            <span className="d4-gold-display">
                                <span className="d4-gold-icon"></span>
                                <span>{playerGold?.toLocaleString() || 0}</span>
                            </span>
                        </div>
                        <div className="d4-grid-container">
                            <div className="d4-item-grid" ref={gridRef}>
                                {grid.map((row, rowIndex) => 
                                    row.map((cell, colIndex) => {
                                        if (cell?.isPart) return null;
                                        
                                        const item = cell?.item;
                                        const size = item ? getItemSize(item) : [1, 1];
                                        const isDragging = dragSource?.type === 'backpack' && cell?.index === dragSource?.index;
                                        
                                        return (
                                            <div
                                                key={`${rowIndex}-${colIndex}`}
                                                className={`d4-grid-cell ${item ? 'has-item' : ''} ${isDragging ? 'dragging' : ''}`}
                                                style={{
                                                    gridColumn: `${colIndex + 1} / span ${size[0]}`,
                                                    gridRow: `${rowIndex + 1} / span ${size[1]}`
                                                }}
                                                data-row={rowIndex}
                                                data-col={colIndex}
                                                onMouseEnter={(e) => item && handleItemHover(item, e)}
                                                onMouseLeave={handleMouseLeave}
                                                onMouseDown={(e) => item && handleDragStart(item, 'backpack', cell.index, e)}
                                                onTouchStart={(e) => item && handleDragStart(item, 'backpack', cell.index, e)}
                                                onClick={() => handleGridCellClick(rowIndex, colIndex, cell)}
                                            >
                                                {item && (
                                                    <div className={`d4-slot-item ${getRarityClass(item.rarity)}`}>
                                                        <span className="d4-item-icon">{getItemIcon(item)}</span>
                                                        {item.name && size[0] >= 2 && size[1] >= 2 && (
                                                            <span className="d4-item-name">{item.name.slice(0, 6)}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                                {renderGridPreview()}
                            </div>
                        </div>
                        <div className="d4-backpack-actions">
                            <button className="d4-sort-btn" onClick={sortBackpack}>整理背包</button>
                            <span className="d4-capacity">{backpackArray.length} 物品</span>
                        </div>
                    </section>

                    <section className="d4-panel d4-character-panel">
                        <div className="d4-char-info">
                            <div className="d4-char-name">{classNames[playerClass] || '冒險者'}</div>
                            <div className="d4-char-class">等級 {playerLevel}</div>
                        </div>
                        <div className="d4-char-display">
                            <div className="d4-char-silhouette">
                                <svg viewBox="0 0 100 200" fill="none" stroke="currentColor" strokeWidth="1">
                                    <ellipse cx="50" cy="22" rx="14" ry="16"/>
                                    <line x1="44" y1="38" x2="44" y2="48"/>
                                    <line x1="56" y1="38" x2="56" y2="48"/>
                                    <path d="M30 48 Q30 55 35 70 L35 110 Q35 115 40 120 L60 120 Q65 115 65 110 L65 70 Q70 55 70 48 L56 48 Q50 52 44 48 Z"/>
                                    <path d="M30 50 Q20 55 15 80 L15 110"/>
                                    <path d="M70 50 Q80 55 85 80 L85 110"/>
                                    <path d="M40 120 L38 180"/>
                                    <path d="M60 120 L62 180"/>
                                </svg>
                            </div>
                            <div className="d4-equip-slots">
                                {EQUIP_SLOTS.map(slot => {
                                    const item = equippedObj[slot.id];
                                    const size = slot.size || [1, 1];
                                    const width = size[0] * 44 + (size[0] - 1) * 3;
                                    const height = size[1] * 44 + (size[1] - 1) * 3;
                                    const isDragOver = dragOverEquipSlot === slot.id;
                                    const isDraggingThis = dragSource?.type === 'equip' && dragSource?.index === slot.id;
                                    
                                    return (
                                        <div
                                            key={slot.id}
                                            className={`d4-equip-slot ${item ? 'has-item' : ''} ${isDraggingThis ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                                            style={{ 
                                                ...slot.pos, 
                                                width, 
                                                height 
                                            }}
                                            data-slot={slot.id}
                                            onMouseEnter={(e) => item && handleItemHover(item, e)}
                                            onMouseLeave={handleMouseLeave}
                                            onMouseDown={(e) => item && handleDragStart(item, 'equip', slot.id, e)}
                                            onTouchStart={(e) => item && handleDragStart(item, 'equip', slot.id, e)}
                                            onClick={() => handleEquipClick(slot.id)}
                                        >
                                            {item ? (
                                                <div className={`d4-slot-item ${getRarityClass(item.rarity)}`}>
                                                    <span className="d4-item-icon">{getItemIcon(item)}</span>
                                                </div>
                                            ) : (
                                                <span className="d4-empty-icon">{SLOT_ICONS[slot.id]}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section className="d4-panel d4-stats-panel">
                        <div className="d4-panel-header">
                            <span className="d4-panel-title">角色屬性</span>
                        </div>
                        <div className="d4-bars-section">
                            <div className="d4-resource-bar">
                                <div className="d4-bar-fill health" style={{ width: `${hpPercent}%` }}></div>
                                <span className="d4-bar-text">{Math.floor(playerHP)} / {playerMaxHP}</span>
                            </div>
                            <div className="d4-resource-bar">
                                <div className="d4-bar-fill mana" style={{ width: `${manaPercent}%` }}></div>
                                <span className="d4-bar-text">{Math.floor(playerMana)} / {playerMaxMana}</span>
                            </div>
                        </div>
                        <div className="d4-stats-section">
                            <div className="d4-stat-group">
                                <div className="d4-stat-header">攻擊</div>
                                <div className="d4-stat-row">
                                    <span className="d4-stat-label">攻擊力</span>
                                    <span className="d4-stat-value highlight">{playerAttackPower || 0}</span>
                                </div>
                                <div className="d4-stat-row">
                                    <span className="d4-stat-label">暴擊率</span>
                                    <span className="d4-stat-value">{((playerCritChance || 0.15) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="d4-stat-row">
                                    <span className="d4-stat-label">暴擊傷害</span>
                                    <span className="d4-stat-value">+{playerCritDamage || 50}%</span>
                                </div>
                            </div>
                            <div className="d4-stat-group">
                                <div className="d4-stat-header">防禦</div>
                                <div className="d4-stat-row">
                                    <span className="d4-stat-label">護甲</span>
                                    <span className="d4-stat-value">{playerDefense || 0}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {hoveredItem && (
                <ItemTooltip
                    item={hoveredItem}
                    position={tooltipPos}
                    compareItem={hoveredItem?.type && equippedObj[hoveredItem.type]}
                />
            )}

            {dragItem && (
                <div 
                    className={`d4-drag-ghost ${getRarityClass(dragItem.rarity)}`}
                    style={{ 
                        left: dragPos.x - 20, 
                        top: dragPos.y - 20,
                        width: dragItemSize[0] * 44 + (dragItemSize[0] - 1) * 3,
                        height: dragItemSize[1] * 44 + (dragItemSize[1] - 1) * 3
                    }}
                >
                    <span className="d4-item-icon">{getItemIcon(dragItem)}</span>
                </div>
            )}
        </div>
    );
}

export default Inventory;
