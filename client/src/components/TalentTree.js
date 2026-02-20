// src/components/TalentTree.js - 天賦樹系統
import React, { useState } from 'react';
import useGameState from '../hooks/useGameState';
import { TALENT_TREE, calculateTalentBonuses } from '../utils/talentTree';
import './TalentTree.css';

function TalentTree({ onClose }) {
    const talentPoints = useGameState((state) => state.talentPoints);
    const talentTree = useGameState((state) => state.talentTree);
    const talentUnlocks = useGameState((state) => state.talentUnlocks);
    const spendTalentPoint = useGameState((state) => state.spendTalentPoint);
    const playerLevel = useGameState((state) => state.playerLevel);
    
    const [selectedTalent, setSelectedTalent] = useState(null);
    
    const rootTalents = Object.values(TALENT_TREE).filter(t => t.parent === null);
    
    const getTalentStatus = (talentId) => {
        const tier = talentTree[talentId] || 0;
        const talent = TALENT_TREE[talentId];
        const maxTier = talent?.maxTier || 1;
        const parentUnlocked = !talent?.parent || (talentTree[talent.parent] || 0) > 0;
        
        if (tier >= maxTier) return 'maxed';
        if (!parentUnlocked) return 'locked';
        return 'available';
    };
    
    const getTalentCost = (talentId) => {
        const tier = talentTree[talentId] || 0;
        const talent = TALENT_TREE[talentId];
        return talent?.bonuses[tier]?.cost || talent?.cost || 1;
    };
    
    const handleTalentClick = (talentId) => {
        const status = getTalentStatus(talentId);
        if (status === 'maxed' || status === 'locked') return;
        
        const cost = getTalentCost(talentId);
        if (talentPoints >= cost) {
            spendTalentPoint(talentId);
        }
    };
    
    const renderTalentNode = (talentId, x, y) => {
        const talent = TALENT_TREE[talentId];
        if (!talent) return null;
        
        const tier = talentTree[talentId] || 0;
        const status = getTalentStatus(talentId);
        const cost = getTalentCost(talentId);
        
        const childTalents = Object.values(TALENT_TREE).filter(t => t.parent === talentId);
        
        return (
            <div key={talentId} className="talent-node-container" style={{ left: x, top: y }}>
                <button
                    className={`talent-node ${status} tier-${tier}`}
                    onClick={() => handleTalentClick(talentId)}
                    style={{ borderColor: talent.color }}
                >
                    <span className="talent-icon">{talent.icon}</span>
                    {tier > 0 && <span className="talent-tier">{tier}/{talent.maxTier}</span>}
                </button>
                
                {status === 'available' && (
                    <div className="talent-cost">{cost}點</div>
                )}
                
                {childTalents.map((child, idx) => (
                    <React.Fragment key={child.id}>
                        <div className="talent-line" style={{
                            top: '50%',
                            left: '100%',
                            width: '60px',
                            height: '2px',
                            background: talentTree[child.id] > 0 ? child.color : '#444'
                        }} />
                        {renderTalentNode(child.id, x + 80 + (idx * 20), y + (idx - (childTalents.length - 1) / 2) * 60)}
                    </React.Fragment>
                ))}
            </div>
        );
    };
    
    const renderSchoolTree = (schoolName, schoolColor, talentIds) => {
        const talent = TALENT_TREE[talentIds[0]];
        if (!talent) return null;
        
        return (
            <div className="talent-school" key={schoolName}>
                <div className="school-header" style={{ borderColor: schoolColor }}>
                    <span style={{ color: schoolColor }}>{schoolName}</span>
                </div>
                <div className="school-tree">
                    {renderTalentNode(talentIds[0], 20, 40)}
                </div>
            </div>
        );
    };
    
    const schools = [
        { name: '火焰系', color: '#ff6b35', talents: ['fire_mastery', 'fireball_talent', 'meteor_talent', 'pyromaniac'] },
        { name: '冰霜系', color: '#4ecdc4', talents: ['ice_mastery', 'icebolt_talent', 'frozenorb_talent', 'blizzard_talent', 'frozen_heart'] },
        { name: '閃電系', color: '#f1c40f', talents: ['lightning_mastery', 'lightning_talent', 'chainlightning_talent', 'thunderlord'] },
        { name: '毒系', color: '#2ecc71', talents: ['poison_mastery', 'plague_talent', 'poisoncloud_talent', 'serpent_talent', 'toxic_master'] },
        { name: '風系', color: '#a9a9a9', talents: ['wind_mastery', 'windblades_talent', 'tornado_talent', 'tornadoring_talent', 'gale_force'] },
        { name: '輔助系', color: '#9b59b6', talents: ['arcane_mastery', 'nova_talent', 'teleport_talent', 'heal_talent', 'mana_surge'] },
        { name: '通用', color: '#e74c3c', talents: ['vitality', 'strength', 'endurance'] }
    ];
    
    const bonuses = calculateTalentBonuses(talentTree);
    
    return (
        <div className="talent-overlay">
            <div className="talent-container">
                <div className="talent-header">
                    <h2>🌟 天賦系統</h2>
                    <div className="talent-points-display">
                        <span className="points-icon">⭐</span>
                        <span className="points-amount">{talentPoints}</span>
                        <span className="points-label">天賦點數</span>
                    </div>
                    <p className="level-hint">角色等級 {playerLevel} 可獲得天賦點數</p>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>
                
                <div className="talent-bonuses-summary">
                    <h4>已啟動加成</h4>
                    <div className="bonuses-grid">
                        {bonuses.fireDamage > 0 && <span className="bonus-tag" style={{borderColor: '#ff6b35'}}>火焰+{bonuses.fireDamage}%</span>}
                        {bonuses.iceDamage > 0 && <span className="bonus-tag" style={{borderColor: '#4ecdc4'}}>冰霜+{bonuses.iceDamage}%</span>}
                        {bonuses.lightningDamage > 0 && <span className="bonus-tag" style={{borderColor: '#f1c40f'}}>閃電+{bonuses.lightningDamage}%</span>}
                        {bonuses.poisonDamage > 0 && <span className="bonus-tag" style={{borderColor: '#2ecc71'}}>毒系+{bonuses.poisonDamage}%</span>}
                        {bonuses.windDamage > 0 && <span className="bonus-tag" style={{borderColor: '#a9a9a9'}}>風系+{bonuses.windDamage}%</span>}
                        {bonuses.spellCrit > 0 && <span className="bonus-tag" style={{borderColor: '#9b59b6'}}>法術暴擊+{bonuses.spellCrit}%</span>}
                        {bonuses.maxHP > 0 && <span className="bonus-tag" style={{borderColor: '#e74c3c'}}>生命+{bonuses.maxHP}</span>}
                        {bonuses.attackPower > 0 && <span className="bonus-tag" style={{borderColor: '#e74c3c'}}>攻擊+{bonuses.attackPower}</span>}
                        {bonuses.defense > 0 && <span className="bonus-tag" style={{borderColor: '#e74c3c'}}>防禦+{bonuses.defense}</span>}
                        {bonuses.manaRegen > 0 && <span className="bonus-tag" style={{borderColor: '#9b59b6'}}>魔力回覆+{bonuses.manaRegen}%</span>}
                        <span className="bonus-tag unlocked">已解鎖技能: {bonuses.unlockedSkills.size}個</span>
                    </div>
                </div>
                
                <div className="talent-schools">
                    {schools.map(school => (
                        <div className="school-column" key={school.name}>
                            <div className="school-title" style={{ color: school.color, borderBottomColor: school.color }}>
                                {school.name}
                            </div>
                            <div className="school-talents">
                                {school.talents.map(talentId => {
                                    const talent = TALENT_TREE[talentId];
                                    const tier = talentTree[talentId] || 0;
                                    const status = getTalentStatus(talentId);
                                    const cost = getTalentCost(talentId);
                                    
                                    return (
                                        <div key={talentId} className={`talent-row ${status}`}>
                                            <button
                                                className={`talent-btn ${status}`}
                                                style={{ 
                                                    borderColor: talent.color,
                                                    background: status === 'maxed' ? talent.color + '40' : 'transparent'
                                                }}
                                                onClick={() => handleTalentClick(talentId)}
                                                disabled={status === 'maxed' || status === 'locked'}
                                            >
                                                <span className="talent-icon">{talent.icon}</span>
                                                <div className="talent-info">
                                                    <span className="talent-name">{talent.name}</span>
                                                    <span className="talent-desc">{talent.description}</span>
                                                </div>
                                                {status === 'maxed' ? (
                                                    <span className="talent-status max">MAX</span>
                                                ) : status === 'locked' ? (
                                                    <span className="talent-status locked">🔒</span>
                                                ) : (
                                                    <span className="talent-status cost">{cost}點</span>
                                                )}
                                            </button>
                                            {tier < talent.maxTier && (
                                                <div className="talent-progress">
                                                    {Array.from({length: talent.maxTier}).map((_, i) => (
                                                        <div 
                                                            key={i} 
                                                            className={`progress-pip ${i < tier ? 'filled' : ''}`}
                                                            style={{ background: i < tier ? talent.color : '#333' }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TalentTree;
