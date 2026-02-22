// src/components/ItemTooltip.js - 物品提示組件（帶比較功能）
import React from 'react';
import { RARITIES, EQUIPMENT_TYPES, AFFIXES, compareItems, isItemIdentifiable } from '../utils/itemSystem';
import './ItemTooltip.css';

function ItemTooltip({ item, compareItem, position }) {
    if (!item) return null;

    // 檢查是否是消耗品或金幣
    const isConsumable = item.type === 'hp_potion' || item.type === 'mana_potion' || item.type === 'gold';
    const isUnidentified = !item.identified && (item.rarity === 'epic' || item.rarity === 'legendary') && !isConsumable;
    
    // 獲取稀有度數據
    const rarityData = RARITIES[item.rarity] || RARITIES.common;
    
    // 比較屬性（未鑑定不比較）
    const comparison = compareItem && !isConsumable && !isUnidentified ? compareItems(compareItem, item) : null;

    // 格式化屬性值
    const formatStatValue = (key, value) => {
        const affix = AFFIXES[key];
        if (affix) {
            return affix.format(value);
        }
        return `+${value} ${key}`;
    };

    // 獲取屬性變化的箭頭和顏色
    const getStatComparison = (key) => {
        if (!comparison) return null;
        const diff = comparison.differences.find(d => d.key === key);
        if (!diff) return null;
        
        if (diff.better) {
            return { arrow: '▲', color: '#1eff00' };
        } else {
            return { arrow: '▼', color: '#ff4444' };
        }
    };

    return (
        <div 
            className="item-tooltip"
            style={{
                left: Math.min(position.x, window.innerWidth - 320),
                top: Math.min(position.y, window.innerHeight - 400),
                borderColor: rarityData.color
            }}
        >
            {/* 頭部：名稱和稀有度 */}
            <div className="tooltip-header" style={{ 
                background: `linear-gradient(90deg, ${rarityData.bgColor} 0%, transparent 100%)`,
                borderLeft: `4px solid ${rarityData.color}`
            }}>
                <div className="item-icon-large">{isUnidentified ? '❓' : item.icon}</div>
                <div className="item-title">
                    <h3 style={{ color: rarityData.color }}>{isUnidentified ? '???' : (item.name || '未命名')}</h3>
                    <span className="rarity-label">{rarityData.name}</span>
                </div>
            </div>

            {/* 未鑑定提示 */}
            {isUnidentified && (
                <div className="tooltip-unidentified">
                    <div className="unidentified-warning">
                        <span className="unidentified-icon">🔮</span>
                        <span>此物品尚未鑑定</span>
                    </div>
                    <p className="unidentified-hint">使用鑑定卷軸來揭示物品屬性</p>
                </div>
            )}

            {/* 基礎信息 */}
            {!isUnidentified && (
            <div className="tooltip-info">
                {item.type && (
                    <div className="info-row">
                        <span className="info-label">類型:</span>
                        <span className="info-value">
                            {EQUIPMENT_TYPES[item.type]?.name || (item.type === 'hp_potion' ? '生命藥水' : item.type === 'mana_potion' ? '魔力藥水' : item.type === 'gold' ? '金幣' : item.type)}
                        </span>
                    </div>
                )}
                {item.level !== undefined && (
                    <div className="info-row">
                        <span className="info-label">等級:</span>
                        <span className="info-value">{item.level}</span>
                    </div>
                )}
                {item.value !== undefined && item.type !== 'gold' && (
                    <div className="info-row">
                        <span className="info-label">價值:</span>
                        <span className="info-value gold">{item.value} 金幣</span>
                    </div>
                )}
                {item.amount !== undefined && (
                    <div className="info-row">
                        <span className="info-label">數量:</span>
                        <span className="info-value">{item.amount}</span>
                    </div>
                )}
            </div>
            )}

            {/* 屬性區域 */}
            {!isUnidentified && !isConsumable && item.stats && Object.keys(item.stats).length > 0 && (
                <div className="tooltip-stats">
                    <h4>屬性</h4>
                    {Object.entries(item.stats).map(([key, value]) => {
                        const comparisonInfo = getStatComparison(key);
                        return (
                            <div 
                                key={key} 
                                className={`stat-row ${comparisonInfo ? (comparisonInfo.arrow === '▲' ? 'better' : 'worse') : ''}`}
                            >
                                <span className="stat-text">
                                    {formatStatValue(key, value)}
                                </span>
                                {comparisonInfo && (
                                    <span 
                                        className="stat-comparison"
                                        style={{ color: comparisonInfo.color }}
                                    >
                                        {comparisonInfo.arrow}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 詞綴區域 */}
            {!isUnidentified && item.affixes && item.affixes.length > 0 && (
                <div className="tooltip-affixes">
                    <h4>附加屬性</h4>
                    {item.affixes.map((affix, idx) => (
                        <div key={idx} className="affix-row">
                            <span className="affix-name">{affix.display}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* 套裝效果 */}
            {!isUnidentified && item.setName && (
                <div className="tooltip-set">
                    <h4 style={{ color: '#ffdd00' }}>套裝: {item.setName}</h4>
                    <p className="set-description">收集更多套裝部件可獲得額外加成</p>
                </div>
            )}

            {/* 特殊效果（傳奇裝備） */}
            {!isUnidentified && item.special && (
                <div className="tooltip-special">
                    <h4>特殊效果</h4>
                    <p style={{ color: '#ff8000' }}>{item.special}</p>
                </div>
            )}

            {/* 藥水效果 */}
            {item.effect && (
                <div className="tooltip-effect">
                    <h4>效果</h4>
                    <p>
                        {item.effect.type === 'heal' ? (
                            <span style={{ color: '#00ff88' }}>恢復 {item.effect.amount} 點生命值</span>
                        ) : item.effect.type === 'restore_mana' ? (
                            <span style={{ color: '#4444ff' }}>恢復 {item.effect.amount} 點魔力</span>
                        ) : (
                            <span>{item.effect.type}: {item.effect.amount}</span>
                        )}
                    </p>
                </div>
            )}

            {/* 比較信息 */}
            {compareItem && !isConsumable && (
                <div className="tooltip-comparison">
                    <h4>與當前裝備比較</h4>
                    {comparison && comparison.differences.length > 0 ? (
                        <>
                            <div className="comparison-summary">
                                {comparison.better ? (
                                    <span className="better-indicator">✓ 優於當前裝備</span>
                                ) : (
                                    <span className="worse-indicator">✗ 不如當前裝備</span>
                                )}
                            </div>
                            <div className="comparison-details">
                                {comparison.differences.slice(0, 5).map((diff, idx) => (
                                    <div 
                                        key={idx}
                                        className={`comparison-stat ${diff.better ? 'better' : 'worse'}`}
                                    >
                                        <span>{diff.name}</span>
                                        <span>
                                            {diff.current} → {diff.next} 
                                            ({diff.diff > 0 ? '+' : ''}{diff.diff})
                                        </span>
                                    </div>
                                ))}
                                {comparison.differences.length > 5 && (
                                    <p className="more-differences">
                                        還有 {comparison.differences.length - 5} 項差異...
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="no-difference">與當前裝備屬性相同</p>
                    )}
                </div>
            )}

            {/* 提示文字 */}
            <div className="tooltip-hint">
                {isUnidentified ? (
                    <p>💡 右鍵使用鑑定卷軸</p>
                ) : item.type === 'identification_scroll' ? (
                    <p>💡 右鍵選擇鑑定物品</p>
                ) : EQUIPMENT_TYPES[item.type] ? (
                    <p>💡 左鍵裝備 | 右鍵選單</p>
                ) : item.type === 'hp_potion' || item.type === 'mana_potion' ? (
                    <p>💡 點擊使用或按 Q/E 快捷鍵</p>
                ) : (
                    <p>💡 右鍵開啟選單</p>
                )}
            </div>
        </div>
    );
}

export default ItemTooltip;
