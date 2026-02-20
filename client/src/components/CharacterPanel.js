// src/components/CharacterPanel.js - 角色資訊面板
import React, { useState } from 'react';
import useGameState from '../hooks/useGameState';
import { TALENT_TREE, calculateTalentBonuses } from '../utils/talentTree';
import './CharacterPanel.css';

function CharacterPanel({ onClose }) {
    const playerLevel = useGameState((state) => state.playerLevel);
    const playerHP = useGameState((state) => state.playerHP);
    const playerMaxHP = useGameState((state) => state.playerMaxHP);
    const playerMana = useGameState((state) => state.playerMana);
    const playerMaxMana = useGameState((state) => state.playerMaxMana);
    const playerAttackPower = useGameState((state) => state.playerAttackPower);
    const playerDefense = useGameState((state) => state.playerDefense);
    const playerCritChance = useGameState((state) => state.playerCritChance);
    const playerGold = useGameState((state) => state.playerGold);
    const playerExp = useGameState((state) => state.playerExp);
    const talentPoints = useGameState((state) => state.talentPoints);
    const talentTree = useGameState((state) => state.talentTree);
    const talentUnlocks = useGameState((state) => state.talentUnlocks);
    const equipped = useGameState((state) => state.equipped);
    const backpack = useGameState((state) => state.backpack);
    
    const [activeTab, setActiveTab] = useState('stats');
    
    const expPerLevel = (level) => Math.floor(100 * Math.pow(1.15, level - 1));
    const nextExp = expPerLevel(playerLevel + 1);
    const expPercent = (playerExp / nextExp) * 100;
    
    const bonuses = calculateTalentBonuses(talentTree);
    
    const renderStats = () => (
        <div className="stats-content">
            <div className="stat-row">
                <span className="stat-label">等級</span>
                <span className="stat-value level">{playerLevel}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">生命值</span>
                <span className="stat-value hp">{Math.floor(playerHP)} / {playerMaxHP}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">魔力值</span>
                <span className="stat-value mana">{Math.floor(playerMana)} / {playerMaxMana}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">攻擊力</span>
                <span className="stat-value attack">{playerAttackPower}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">防禦力</span>
                <span className="stat-value defense">{playerDefense}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">暴擊率</span>
                <span className="stat-value crit">{(playerCritChance * 100).toFixed(1)}%</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">天賦點數</span>
                <span className="stat-value talent">{talentPoints}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">金幣</span>
                <span className="stat-value gold">{playerGold.toLocaleString()}</span>
            </div>
            <div className="stat-row">
                <span className="stat-label">經驗值</span>
                <span className="stat-value exp">{playerExp} / {nextExp}</span>
            </div>
            <div className="exp-bar">
                <div className="exp-fill" style={{ width: `${expPercent}%` }} />
            </div>
        </div>
    );
    
    const renderTalents = () => (
        <div className="talents-content">
            <div className="talent-points-header">
                可用點數: <span className="points">{talentPoints}</span>
            </div>
            <div className="talent-list">
                {Object.entries(talentTree).map(([talentId, tier]) => {
                    const talent = TALENT_TREE[talentId];
                    if (!talent) return null;
                    return (
                        <div key={talentId} className="talent-item" style={{ borderLeftColor: talent.color }}>
                            <span className="talent-icon">{talent.icon}</span>
                            <span className="talent-name">{talent.name}</span>
                            <span className="talent-tier">Lv.{tier}</span>
                        </div>
                    );
                })}
            </div>
            <div className="bonus-list">
                <h4>屬性加成</h4>
                {bonuses.fireDamage > 0 && <div className="bonus-item">火焰傷害 +{bonuses.fireDamage}%</div>}
                {bonuses.iceDamage > 0 && <div className="bonus-item">冰霜傷害 +{bonuses.iceDamage}%</div>}
                {bonuses.lightningDamage > 0 && <div className="bonus-item">閃電傷害 +{bonuses.lightningDamage}%</div>}
                {bonuses.poisonDamage > 0 && <div className="bonus-item">毒系傷害 +{bonuses.poisonDamage}%</div>}
                {bonuses.windDamage > 0 && <div className="bonus-item">風系傷害 +{bonuses.windDamage}%</div>}
                {bonuses.spellCrit > 0 && <div className="bonus-item">法術暴擊 +{bonuses.spellCrit}%</div>}
                {bonuses.maxHP > 0 && <div className="bonus-item">最大生命 +{bonuses.maxHP}</div>}
                {bonuses.attackPower > 0 && <div className="bonus-item">攻擊力 +{bonuses.attackPower}</div>}
                {bonuses.defense > 0 && <div className="bonus-item">防禦力 +{bonuses.defense}</div>}
                <div className="bonus-item unlocked">已解鎖技能: {bonuses.unlockedSkills.size}個</div>
            </div>
        </div>
    );
    
    const renderEquipment = () => (
        <div className="equipment-content">
            <div className="equip-slots">
                {Object.entries(equipped).map(([slot, item]) => (
                    <div key={slot} className="equip-slot">
                        <div className="slot-label">{slot}</div>
                        {item ? (
                            <div className="equipped-item" style={{ borderColor: item.rarityData?.color || '#666' }}>
                                <span className="item-icon">{item.icon}</span>
                                <span className="item-name">{item.name}</span>
                                <span className="item-level">Lv.{item.level}</span>
                            </div>
                        ) : (
                            <div className="empty-slot">-</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
    
    const renderInventory = () => (
        <div className="inventory-content">
            <div className="inventory-grid">
                {backpack.slice(0, 20).map((item, idx) => (
                    <div key={idx} className="inventory-slot" style={{ borderColor: item?.rarityData?.color || '#444' }}>
                        {item && <span className="item-icon">{item.icon}</span>}
                    </div>
                ))}
                {backpack.length === 0 && <div className="empty-inventory">背包空空如也</div>}
            </div>
            <div className="inventory-count">物品數量: {backpack.length}</div>
        </div>
    );
    
    return (
        <div className="character-overlay">
            <div className="character-panel">
                <div className="panel-header">
                    <h2>👤 角色資訊</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>
                
                <div className="tabs">
                    <button className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
                        📊 屬性
                    </button>
                    <button className={`tab ${activeTab === 'talents' ? 'active' : ''}`} onClick={() => setActiveTab('talents')}>
                        ⭐ 天賦
                    </button>
                    <button className={`tab ${activeTab === 'equipment' ? 'active' : ''}`} onClick={() => setActiveTab('equipment')}>
                        ⚔️ 裝備
                    </button>
                    <button className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
                        🎒 背包
                    </button>
                </div>
                
                <div className="tab-content">
                    {activeTab === 'stats' && renderStats()}
                    {activeTab === 'talents' && renderTalents()}
                    {activeTab === 'equipment' && renderEquipment()}
                    {activeTab === 'inventory' && renderInventory()}
                </div>
            </div>
        </div>
    );
}

export default CharacterPanel;
