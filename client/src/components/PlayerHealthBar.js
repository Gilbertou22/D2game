// src/components/PlayerHealthBar.js (現代化美化版本)
import { Html } from '@react-three/drei';
import useGameState from '../hooks/useGameState';

function PlayerHealthBar() {
    const playerHP = useGameState((state) => state.playerHP);
    const playerMaxHP = useGameState((state) => state.playerMaxHP);
    const playerLevel = useGameState((state) => state.playerLevel);
    
    const percent = Math.min(100, Math.max(0, (playerHP / playerMaxHP) * 100));
    
    // 低血量狀態
    const isCritical = percent < 25;
    const isLow = percent < 50;
    
    // 根據血量動態調整顏色
    const getHealthColor = (p) => {
        if (p > 60) return { main: '#00d9ff', glow: '#00d9ff', secondary: '#00a8cc' };
        if (p > 30) return { main: '#ffd700', glow: '#ffaa00', secondary: '#ff8c00' };
        return { main: '#ff4757', glow: '#ff0000', secondary: '#cc0000' };
    };
    
    const colors = getHealthColor(percent);
    
    return (
        <Html position={[0, 12, 0]} center>
            <div className="health-bar-container">
                {/* 等級徽章 */}
                <div className="level-badge">
                    <div className="level-icon">⚔️</div>
                    <div className="level-text">{playerLevel}</div>
                </div>
                
                {/* 主血條容器 */}
                <div className={`health-bar-wrapper ${isCritical ? 'critical' : ''} ${isLow ? 'warning' : ''}`}>
                    {/* 外框光暈 */}
                    <div className="health-glow" style={{ '--glow-color': colors.glow }} />
                    
                    {/* 血條背景 */}
                    <div className="health-bar-bg">
                        {/* 血量填充 */}
                        <div 
                            className="health-fill"
                            style={{ 
                                width: `${percent}%`,
                                '--health-color': colors.main,
                                '--health-secondary': colors.secondary
                            }}
                        >
                            {/* 內部光效 */}
                            <div className="health-shine" />
                            <div className="health-pulse" />
                        </div>
                        
                        {/* 網格紋理覆蓋 */}
                        <div className="health-grid" />
                        
                        {/* 血量數值 */}
                        <div className="health-text">
                            <span className="current-hp">{Math.floor(playerHP).toLocaleString()}</span>
                            <span className="hp-divider">/</span>
                            <span className="max-hp">{playerMaxHP.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                {/* 狀態指示器 */}
                <div className="status-indicators">
                    <div className="hp-percentage" style={{ color: colors.main }}>
                        {Math.round(percent)}%
                    </div>
                    {isCritical && (
                        <div className="critical-warning">
                            <span className="warning-icon">⚠️</span>
                            <span className="warning-text">危急</span>
                        </div>
                    )}
                </div>
                
                {/* CSS 樣式 */}
                <style jsx>{`
                    .health-bar-container {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        filter: drop-shadow(0 4px 20px rgba(0,0,0,0.5));
                    }
                    
                    /* 等級徽章 */
                    .level-badge {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        background: linear-gradient(145deg, #2d3436, #1a1e1f);
                        border: 3px solid #636e72;
                        border-radius: 12px;
                        padding: 8px 12px;
                        box-shadow: 
                            0 4px 15px rgba(0,0,0,0.4),
                            inset 0 1px 1px rgba(255,255,255,0.1);
                    }
                    
                    .level-icon {
                        font-size: 20px;
                        margin-bottom: 2px;
                    }
                    
                    .level-text {
                        font-size: 18px;
                        font-weight: bold;
                        color: #ffd700;
                        text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                    }
                    
                    /* 血條外殼 */
                    .health-bar-wrapper {
                        position: relative;
                        width: 380px;
                        height: 55px;
                        border-radius: 16px;
                        padding: 4px;
                        background: linear-gradient(145deg, #2d3436, #1e272e);
                        box-shadow: 
                            0 8px 32px rgba(0,0,0,0.4),
                            inset 0 1px 2px rgba(255,255,255,0.1);
                    }
                    
                    .health-bar-wrapper.critical {
                        animation: borderPulse 0.8s ease-in-out infinite;
                    }
                    
                    .health-bar-wrapper.warning {
                        border-color: rgba(255, 215, 0, 0.5);
                    }
                    
                    /* 光暈效果 */
                    .health-glow {
                        position: absolute;
                        inset: -2px;
                        border-radius: 18px;
                        background: var(--glow-color);
                        opacity: 0.3;
                        filter: blur(15px);
                        transition: all 0.3s ease;
                    }
                    
                    .health-bar-wrapper:hover .health-glow {
                        opacity: 0.5;
                        filter: blur(20px);
                    }
                    
                    /* 血條背景 */
                    .health-bar-bg {
                        position: relative;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(180deg, #1a1e1f 0%, #0d1112 100%);
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: inset 0 2px 8px rgba(0,0,0,0.6);
                    }
                    
                    /* 血量填充 */
                    .health-fill {
                        height: 100%;
                        background: linear-gradient(
                            90deg,
                            var(--health-secondary) 0%,
                            var(--health-color) 30%,
                            var(--health-color) 70%,
                            var(--health-secondary) 100%
                        );
                        border-radius: 12px;
                        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        position: relative;
                        overflow: hidden;
                        box-shadow: 
                            0 0 20px var(--health-color),
                            inset 0 1px 1px rgba(255,255,255,0.3);
                    }
                    
                    /* 光澤效果 */
                    .health-shine {
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 50%;
                        height: 100%;
                        background: linear-gradient(
                            90deg,
                            transparent,
                            rgba(255,255,255,0.4),
                            transparent
                        );
                        animation: shine 3s ease-in-out infinite;
                    }
                    
                    .health-pulse {
                        position: absolute;
                        inset: 0;
                        background: radial-gradient(
                            ellipse at center,
                            rgba(255,255,255,0.2) 0%,
                            transparent 70%
                        );
                        animation: pulse 2s ease-in-out infinite;
                    }
                    
                    /* 網格紋理 */
                    .health-grid {
                        position: absolute;
                        inset: 0;
                        background-image: 
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
                        background-size: 20px 10px;
                        pointer-events: none;
                    }
                    
                    /* 血量文字 */
                    .health-text {
                        position: absolute;
                        inset: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        font-family: 'Arial Black', 'Segoe UI', sans-serif;
                        text-shadow: 0 2px 10px rgba(0,0,0,0.8);
                        z-index: 10;
                    }
                    
                    .current-hp {
                        font-size: 24px;
                        font-weight: bold;
                        color: #ffffff;
                    }
                    
                    .hp-divider {
                        font-size: 20px;
                        color: rgba(255,255,255,0.6);
                    }
                    
                    .max-hp {
                        font-size: 18px;
                        color: rgba(255,255,255,0.7);
                    }
                    
                    /* 傷害彈出 */
                    .damage-popup {
                        position: absolute;
                        top: -40px;
                        right: 20px;
                        font-size: 28px;
                        font-weight: bold;
                        color: #ff4757;
                        text-shadow: 0 0 20px rgba(255, 71, 87, 0.8);
                        animation: damageFloat 1s ease-out forwards;
                        pointer-events: none;
                    }
                    
                    /* 狀態指示器 */
                    .status-indicators {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 5px;
                    }
                    
                    .hp-percentage {
                        font-size: 20px;
                        font-weight: bold;
                        text-shadow: 0 0 15px currentColor;
                        min-width: 50px;
                        text-align: center;
                    }
                    
                    .critical-warning {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        background: linear-gradient(135deg, #ff4757, #cc0000);
                        padding: 4px 10px;
                        border-radius: 20px;
                        animation: warningBlink 0.6s ease-in-out infinite;
                        box-shadow: 0 0 20px rgba(255, 71, 87, 0.6);
                    }
                    
                    .warning-icon {
                        font-size: 14px;
                    }
                    
                    .warning-text {
                        font-size: 12px;
                        font-weight: bold;
                        color: white;
                    }
                    
                    /* 動畫 */
                    @keyframes shine {
                        0%, 100% { transform: translateX(-100%); }
                        50% { transform: translateX(200%); }
                    }
                    
                    @keyframes pulse {
                        0%, 100% { opacity: 0.3; }
                        50% { opacity: 0.6; }
                    }
                    
                    @keyframes borderPulse {
                        0%, 100% { 
                            box-shadow: 
                                0 8px 32px rgba(255, 0, 0, 0.3),
                                inset 0 1px 2px rgba(255,255,255,0.1);
                        }
                        50% { 
                            box-shadow: 
                                0 8px 32px rgba(255, 0, 0, 0.6),
                                inset 0 1px 2px rgba(255,255,255,0.1);
                        }
                    }
                    
                    @keyframes damageFloat {
                        0% {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                        100% {
                            opacity: 0;
                            transform: translateY(-30px) scale(1.3);
                        }
                    }
                    
                    @keyframes warningBlink {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.8; transform: scale(1.05); }
                    }
                `}</style>
            </div>
        </Html>
    );
}

export default PlayerHealthBar;
