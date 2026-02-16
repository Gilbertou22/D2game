// src/components/KeybindSettings.js
import React, { useState, useEffect } from 'react';
import useGameState from '../hooks/useGameState';

function KeybindSettings({ onClose }) {
    const skills = useGameState((state) => state.skills);
    const skillKeybinds = useGameState((state) => state.skillKeybinds);
    const setSkillKeybind = useGameState((state) => state.setSkillKeybind);
    const resetSkillKeybinds = useGameState((state) => state.resetSkillKeybinds);
    
    const [editingKey, setEditingKey] = useState(null);
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        if (editingKey) {
            const handleKeyDown = (e) => {
                // 防止重複綁定
                const existingKey = Object.entries(skillKeybinds).find(([k, v]) => k === e.key && k !== editingKey);
                if (existingKey) {
                    // 移除舊綁定
                    setSkillKeybind(existingKey[0], null);
                }
                
                setSkillKeybind(e.key, skillKeybinds[editingKey]);
                setEditingKey(null);
            };
            
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [editingKey, skillKeybinds, setSkillKeybind]);

    const handleReset = () => {
        if (window.confirm('確定要重置所有按鍵綁定為預設值嗎？')) {
            resetSkillKeybinds();
        }
    };

    const handleRemoveKeybind = (key) => {
        setSkillKeybind(key, null);
    };

    // 獲取所有已解鎖的技能
    const availableSkills = Object.entries(skills)
        .filter(([_, skill]) => skill.unlocked)
        .map(([key, skill]) => ({ key, ...skill }));

    // 獲取當前綁定
    const currentBinds = Object.entries(skillKeybinds)
        .filter(([_, skillKey]) => skillKey && skills[skillKey]?.unlocked)
        .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: '#1a1a2e',
                border: '3px solid #4a4a6a',
                borderRadius: '15px',
                padding: '30px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                color: 'white'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#ffff00' }}>⚙️ 按鍵綁定設定</h2>
                    <button 
                        onClick={() => setShowHelp(!showHelp)}
                        style={{
                            background: '#4a4a6a',
                            border: 'none',
                            color: 'white',
                            padding: '5px 15px',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        {showHelp ? '隱藏說明' : '顯示說明'}
                    </button>
                </div>

                {showHelp && (
                    <div style={{
                        background: '#2a2a4e',
                        padding: '15px',
                        borderRadius: '10px',
                        marginBottom: '20px',
                        fontSize: '14px',
                        lineHeight: '1.6'
                    }}>
                        <p><strong>📖 使用說明：</strong></p>
                        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                            <li>點擊「更改」按鈕後，按下任意按鍵即可設定</li>
                            <li>支援數字鍵 (1-9)、字母鍵 (A-Z)、功能鍵 (F1-F12)</li>
                            <li>特殊按鍵：Space (空格)、Enter、Tab、Escape</li>
                            <li>點擊 🗑️ 可移除綁定</li>
                        </ul>
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#00ff00', marginBottom: '15px' }}>當前綁定</h3>
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {currentBinds.length === 0 ? (
                            <p style={{ color: '#888', fontStyle: 'italic' }}>尚未設定任何按鍵綁定</p>
                        ) : (
                            currentBinds.map(([key, skillKey]) => {
                                const skill = skills[skillKey];
                                return (
                                    <div key={key} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        background: '#2a2a4e',
                                        padding: '10px 15px',
                                        borderRadius: '8px',
                                        border: editingKey === key ? '2px solid #ffff00' : '2px solid transparent'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{
                                                background: '#4a4a6a',
                                                padding: '5px 15px',
                                                borderRadius: '5px',
                                                fontWeight: 'bold',
                                                minWidth: '40px',
                                                textAlign: 'center'
                                            }}>
                                                {key === ' ' ? 'Space' : key}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '24px' }}>{skill?.icon}</span>
                                                <span>{skill?.name}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => setEditingKey(editingKey === key ? null : key)}
                                                style={{
                                                    background: editingKey === key ? '#ffff00' : '#4a4a6a',
                                                    color: editingKey === key ? 'black' : 'white',
                                                    border: 'none',
                                                    padding: '5px 15px',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                    fontWeight: editingKey === key ? 'bold' : 'normal'
                                                }}
                                            >
                                                {editingKey === key ? '請按按鍵...' : '更改'}
                                            </button>
                                            <button
                                                onClick={() => handleRemoveKeybind(key)}
                                                style={{
                                                    background: '#ff4444',
                                                    border: 'none',
                                                    color: 'white',
                                                    padding: '5px 10px',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer'
                                                }}
                                                title="移除綁定"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#00ff00', marginBottom: '15px' }}>可綁定技能</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                        {availableSkills.map((skill) => {
                            const isBound = Object.values(skillKeybinds).includes(skill.key);
                            return (
                                <div key={skill.key} style={{
                                    background: isBound ? '#2a4a2e' : '#2a2a4e',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    opacity: isBound ? 0.7 : 1
                                }}>
                                    <span style={{ fontSize: '20px' }}>{skill.icon}</span>
                                    <div>
                                        <div style={{ fontSize: '12px' }}>{skill.name}</div>
                                        {isBound && (
                                            <div style={{ fontSize: '10px', color: '#00ff00' }}>✓ 已綁定</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: '1px solid #4a4a6a'
                }}>
                    <button
                        onClick={handleReset}
                        style={{
                            background: '#ff4444',
                            border: 'none',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🔄 重置為預設值
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#4a4a6a',
                            border: 'none',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        ✓ 完成
                    </button>
                </div>
            </div>
        </div>
    );
}

export default KeybindSettings;
