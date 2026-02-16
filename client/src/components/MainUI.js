// src/components/MainUI.js (美化版：現代化血條與魔力條設計 + 性能優化)
import useGameState from '../hooks/useGameState';
import React from 'react';

const expPerLevel = (level) => Math.floor(100 * Math.pow(1.15, level - 1));

function MainUI() {
    const playerHP = useGameState((state) => state.playerHP);
    const playerMaxHP = useGameState((state) => state.playerMaxHP);
    const playerMana = useGameState((state) => state.playerMana);
    const playerMaxMana = useGameState((state) => state.playerMaxMana);
    const playerLevel = useGameState((state) => state.playerLevel);
    const playerExp = useGameState((state) => state.playerExp);
    const playerGold = useGameState((state) => state.playerGold);

    const hpPercent = Math.min(100, Math.max(0, (playerHP / playerMaxHP) * 100));
    const manaPercent = Math.min(100, Math.max(0, (playerMana / playerMaxMana) * 100));
    const nextExp = expPerLevel(playerLevel + 1);
    const expPercent = nextExp > 0 ? (playerExp / nextExp) * 100 : 0;

    const isLowHP = hpPercent < 25;
    const isLowMana = manaPercent < 20;

    return (
        <>
            {/* 左上：血量與魔力橫條 - 現代化設計 */}
            <div className="main-ui-container">
                {/* 玩家資訊卡 */}
                <div className="player-info-card">
                    <div className="player-header">
                        <div className="level-badge">
                            <span className="level-icon">⚔️</span>
                            <span className="level-number">{playerLevel}</span>
                        </div>
                        <div className="gold-display">
                            <span className="gold-icon">💰</span>
                            <span className="gold-amount">{playerGold.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* 血量條 */}
                    <div className={`bar-container hp-container ${isLowHP ? 'critical' : ''}`}>
                        <div className="bar-icon">❤️</div>
                        <div className="bar-wrapper">
                            <div className="bar-bg">
                                <div 
                                    className="bar-fill hp-fill"
                                    style={{ width: `${hpPercent}%` }}
                                >
                                    <div className="bar-shine" />
                                    <div className="bar-pattern" />
                                </div>
                                <div className="bar-text">
                                    <span className="current">{Math.floor(playerHP).toLocaleString()}</span>
                                    <span className="separator">/</span>
                                    <span className="max">{playerMaxHP.toLocaleString()}</span>
                                </div>
                            </div>
                            {isLowHP && <div className="warning-pulse" />}
                        </div>
                        <div className="bar-percentage" style={{ color: '#ff4757' }}>
                            {Math.round(hpPercent)}%
                        </div>
                    </div>

                    {/* 魔力條 */}
                    <div className={`bar-container mana-container ${isLowMana ? 'low' : ''}`}>
                        <div className="bar-icon">💧</div>
                        <div className="bar-wrapper">
                            <div className="bar-bg">
                                <div 
                                    className="bar-fill mana-fill"
                                    style={{ width: `${manaPercent}%` }}
                                >
                                    <div className="bar-shine" />
                                    <div className="bar-pattern" />
                                </div>
                                <div className="bar-text">
                                    <span className="current">{Math.floor(playerMana).toLocaleString()}</span>
                                    <span className="separator">/</span>
                                    <span className="max">{playerMaxMana.toLocaleString()}</span>
                                </div>
                            </div>
                            {isLowMana && <div className="warning-pulse blue" />}
                        </div>
                        <div className="bar-percentage" style={{ color: '#3498db' }}>
                            {Math.round(manaPercent)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部經驗條（現代化設計） */}
            <div className="exp-bar-container">
                <div className="exp-bar-wrapper">
                    <div className="exp-fill" style={{ width: `${expPercent}%` }}>
                        <div className="exp-shine" />
                    </div>
                    <div className="exp-text">
                        <span className="exp-label">EXP</span>
                        <span className="exp-value">{Math.floor(expPercent)}%</span>
                        <span className="exp-detail">{playerExp.toLocaleString()} / {nextExp.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                /* 主容器 */
                .main-ui-container {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    z-index: 50;
                }

                /* 玩家資訊卡 */
                .player-info-card {
                    background: linear-gradient(145deg, rgba(20, 25, 35, 0.95), rgba(10, 15, 25, 0.98));
                    border-radius: 16px;
                    padding: 16px 20px;
                    border: 1px solid rgba(100, 120, 140, 0.3);
                    box-shadow: 
                        0 10px 40px rgba(0, 0, 0, 0.5),
                        inset 0 1px 1px rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    min-width: 320px;
                }

                /* 頭部資訊 */
                .player-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .level-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: linear-gradient(135deg, #f39c12, #e67e22);
                    padding: 6px 12px;
                    border-radius: 20px;
                    box-shadow: 0 4px 15px rgba(243, 156, 18, 0.4);
                }

                .level-icon {
                    font-size: 16px;
                }

                .level-number {
                    font-size: 18px;
                    font-weight: bold;
                    color: white;
                    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                }

                .gold-display {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 6px 12px;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 215, 0, 0.3);
                }

                .gold-icon {
                    font-size: 16px;
                }

                .gold-amount {
                    font-size: 16px;
                    font-weight: 600;
                    color: #ffd700;
                    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                }

                /* 條形容器 */
                .bar-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                }

                .bar-container:last-child {
                    margin-bottom: 0;
                }

                .bar-icon {
                    font-size: 22px;
                    width: 30px;
                    text-align: center;
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
                }

                .bar-wrapper {
                    flex: 1;
                    position: relative;
                    height: 32px;
                }

                .bar-bg {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(180deg, #1a1e1f 0%, #0d1112 100%);
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 
                        inset 0 2px 8px rgba(0, 0, 0, 0.6),
                        0 1px 2px rgba(255, 255, 255, 0.1);
                }

                /* 血量條樣式 */
                .hp-container .bar-bg {
                    border: 2px solid rgba(255, 71, 87, 0.4);
                }

                .hp-fill {
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        #c0392b 0%,
                        #e74c3c 30%,
                        #ff6b6b 50%,
                        #e74c3c 70%,
                        #c0392b 100%
                    );
                    border-radius: 8px;
                    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 
                        0 0 20px rgba(231, 76, 60, 0.5),
                        inset 0 1px 1px rgba(255, 255, 255, 0.3);
                }

                .hp-container.critical .bar-bg {
                    border-color: #ff0000;
                    animation: borderFlash 1s ease-in-out infinite;
                }

                /* 魔力條樣式 */
                .mana-container .bar-bg {
                    border: 2px solid rgba(52, 152, 219, 0.4);
                }

                .mana-fill {
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        #2980b9 0%,
                        #3498db 30%,
                        #5dade2 50%,
                        #3498db 70%,
                        #2980b9 100%
                    );
                    border-radius: 8px;
                    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 
                        0 0 20px rgba(52, 152, 219, 0.5),
                        inset 0 1px 1px rgba(255, 255, 255, 0.3);
                }

                .mana-container.low .bar-bg {
                    border-color: #3498db;
                }

                /* 光澤效果 */
                .bar-shine {
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.4),
                        transparent
                    );
                    animation: shine 3s ease-in-out infinite;
                }

                /* 網格紋理 */
                .bar-pattern {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
                    background-size: 10px 100%;
                    pointer-events: none;
                }

                /* 條內文字 */
                .bar-text {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    font-family: 'Segoe UI', 'Arial', sans-serif;
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
                    z-index: 10;
                }

                .bar-text .current {
                    font-size: 16px;
                    font-weight: bold;
                    color: #ffffff;
                }

                .bar-text .separator {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.6);
                }

                .bar-text .max {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.7);
                }

                /* 百分比顯示 */
                .bar-percentage {
                    font-size: 14px;
                    font-weight: bold;
                    min-width: 40px;
                    text-align: right;
                    text-shadow: 0 0 10px currentColor;
                }

                /* 警告脈動 */
                .warning-pulse {
                    position: absolute;
                    inset: -2px;
                    border: 2px solid #ff0000;
                    border-radius: 12px;
                    animation: pulse 1.5s ease-in-out infinite;
                    pointer-events: none;
                }

                .warning-pulse.blue {
                    border-color: #3498db;
                }

                /* 經驗條容器 */
                .exp-bar-container {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 45px;
                    background: linear-gradient(180deg, #0d1112 0%, #1a1e1f 100%);
                    border-top: 2px solid rgba(46, 204, 113, 0.5);
                    z-index: 50;
                    box-shadow: 0 -5px 25px rgba(0, 0, 0, 0.6);
                }

                .exp-bar-wrapper {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }

                .exp-fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        #27ae60 0%,
                        #2ecc71 30%,
                        #58d68d 50%,
                        #2ecc71 70%,
                        #27ae60 100%
                    );
                    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 
                        0 0 20px rgba(46, 204, 113, 0.4),
                        inset 0 1px 1px rgba(255, 255, 255, 0.3);
                }

                .exp-shine {
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.3),
                        transparent
                    );
                    animation: shine 4s ease-in-out infinite;
                }

                .exp-text {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    font-family: 'Segoe UI', 'Arial', sans-serif;
                    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
                    z-index: 10;
                }

                .exp-label {
                    font-size: 14px;
                    font-weight: bold;
                    color: #2ecc71;
                    letter-spacing: 2px;
                }

                .exp-value {
                    font-size: 18px;
                    font-weight: bold;
                    color: #ffffff;
                }

                .exp-detail {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.7);
                }

                /* 動畫 */
                @keyframes shine {
                    0%, 100% { transform: translateX(-100%); }
                    50% { transform: translateX(200%); }
                }

                @keyframes pulse {
                    0%, 100% { 
                        opacity: 0.6;
                        transform: scale(1);
                    }
                    50% { 
                        opacity: 1;
                        transform: scale(1.02);
                    }
                }

                @keyframes borderFlash {
                    0%, 100% { 
                        border-color: rgba(255, 0, 0, 0.4);
                        box-shadow: 0 0 10px rgba(255, 0, 0, 0.3);
                    }
                    50% { 
                        border-color: rgba(255, 0, 0, 0.8);
                        box-shadow: 0 0 20px rgba(255, 0, 0, 0.6);
                    }
                }
            `}</style>
        </>
    );
}

export default MainUI;
