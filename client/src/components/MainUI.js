// src/components/MainUI.js - Dark Fantasy ARPG Style (Inspired by UI.html)
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

    return (
        <>
            {/* Left Panel - Status Cards */}
            <div className="status-panel-left">
                {/* Life Card */}
                <div className="status-card life">
                    <div className="status-label">
                        <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        <span>Life</span>
                    </div>
                    <div className="status-bar-bg">
                        <div className="status-bar-fill life-fill" style={{ width: `${hpPercent}%` }} />
                    </div>
                    <div className="status-values">
                        <span className="current">{Math.floor(playerHP).toLocaleString()}</span>
                        <span className="max">/ {playerMaxHP.toLocaleString()}</span>
                    </div>
                </div>

                {/* Shield Card */}
                <div className="status-card shield">
                    <div className="status-label">
                        <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        <span>Shield</span>
                    </div>
                    <div className="status-bar-bg">
                        <div className="status-bar-fill shield-fill" style={{ width: '0%' }} />
                    </div>
                    <div className="status-values">
                        <span className="current">0</span>
                        <span className="max">/ 0</span>
                    </div>
                </div>
            </div>

            {/* Right Panel - Mana & Level Info */}
            <div className="status-panel-right">
                {/* Mana Card */}
                <div className="status-card mana">
                    <div className="status-label">
                        <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        <span>Mana</span>
                    </div>
                    <div className="status-bar-bg">
                        <div className="status-bar-fill mana-fill" style={{ width: `${manaPercent}%` }} />
                    </div>
                    <div className="status-values">
                        <span className="current">{Math.floor(playerMana).toLocaleString()}</span>
                        <span className="max">/ {playerMaxMana.toLocaleString()}</span>
                    </div>
                </div>

                {/* Level & Gold Info */}
                <div className="info-card">
                    <div className="level-badge">
                        <span className="level-icon">⚔️</span>
                        <span className="level-number">Lv.{playerLevel}</span>
                    </div>
                    <div className="gold-display">
                        <span className="gold-icon">💰</span>
                        <span className="gold-amount">{playerGold.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Bottom - Experience Bar */}
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
                /* CSS Variables - Dark Fantasy Theme */
                :global(:root) {
                    --bg-deep: #0a0806;
                    --bg-cave: #1a1410;
                    --fg: #e8dcc8;
                    --muted: #6b5c4a;
                    --accent-fire: #ff6b2b;
                    --accent-mana: #9c6bff;
                    --life: #d32f2f;
                    --card: rgba(26, 20, 16, 0.85);
                    --border: #3d3229;
                }

                /* Left Status Panel */
                .status-panel-left {
                    position: fixed;
                    bottom: 32px;
                    left: 32px;
                    z-index: 50;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .status-panel-right {
                    position: fixed;
                    bottom: 32px;
                    right: 32px;
                    z-index: 50;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                /* Status Card */
                .status-card {
                    background: linear-gradient(135deg, var(--card) 0%, rgba(15, 12, 10, 0.95) 100%);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    padding: 12px 16px;
                    min-width: 220px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.03);
                }

                .status-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: var(--fg);
                }

                .life .status-label { color: #ff6b6b; }
                .shield .status-label { color: #4dd0e1; }
                .mana .status-label { color: #b388ff; }

                .status-icon {
                    width: 16px;
                    height: 16px;
                }

                /* Status Bar */
                .status-bar-bg {
                    height: 8px;
                    background: rgba(0, 0, 0, 0.6);
                    border-radius: 4px;
                    overflow: hidden;
                    position: relative;
                }

                .status-bar-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.5s ease-out;
                    position: relative;
                }

                .status-bar-fill::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
                    animation: shimmer 2s infinite;
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                /* Life Bar */
                .life-fill {
                    background: linear-gradient(90deg, #8b0000 0%, #d32f2f 50%, #ff4444 100%);
                    box-shadow: 0 0 12px rgba(211, 47, 47, 0.6);
                }

                /* Shield Bar */
                .shield-fill {
                    background: linear-gradient(90deg, #006064 0%, #00bcd4 50%, #26c6da 100%);
                    box-shadow: 0 0 12px rgba(0, 188, 212, 0.6);
                }

                /* Mana Bar */
                .mana-fill {
                    background: linear-gradient(90deg, #4a148c 0%, #9c6bff 50%, #b388ff 100%);
                    box-shadow: 0 0 12px rgba(156, 107, 255, 0.6);
                }

                /* Status Values */
                .status-values {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 6px;
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .current { color: var(--fg); }
                .max { color: var(--muted); }

                /* Info Card */
                .info-card {
                    display: flex;
                    gap: 12px;
                    background: linear-gradient(135deg, var(--card) 0%, rgba(15, 12, 10, 0.95) 100%);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    padding: 12px 16px;
                    backdrop-filter: blur(10px);
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
                    font-size: 14px;
                }

                .level-number {
                    font-size: 14px;
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
                    font-size: 14px;
                }

                .gold-amount {
                    font-size: 14px;
                    font-weight: 600;
                    color: #ffd700;
                    text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                }

                /* Experience Bar */
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
                    background: linear-gradient(90deg, #27ae60 0%, #2ecc71 30%, #58d68d 50%, #2ecc71 70%, #27ae60 100%);
                    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 0 20px rgba(46, 204, 113, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3);
                }

                .exp-shine {
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                    animation: shine 4s ease-in-out infinite;
                }

                @keyframes shine {
                    0%, 100% { transform: translateX(-100%); }
                    50% { transform: translateX(200%); }
                }

                .exp-text {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
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

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .status-panel-left, .status-panel-right {
                        left: 12px;
                        right: 12px;
                        bottom: 12px;
                    }
                    
                    .status-panel-right {
                        bottom: auto;
                        top: 80px;
                    }
                    
                    .status-card {
                        min-width: auto;
                    }
                }
            `}</style>
        </>
    );
}

export default MainUI;
