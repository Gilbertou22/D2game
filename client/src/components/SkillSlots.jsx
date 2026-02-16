// src/components/SkillSlots.jsx (美化優化版：現代化技能欄位設計)
import useGameState from '../hooks/useGameState';

// 技能配置數據
const SKILL_CONFIG = {
    fireball: { 
        label: '1', 
        color: '#ff6b35', 
        name: '火球術',
        icon: '🔥',
        description: '發射火球造成範圍傷害'
    },
    icebolt: { 
        label: '2', 
        color: '#4ecdc4', 
        name: '冰箭術',
        icon: '❄️',
        description: '發射冰箭減速敵人'
    },
    meteor: { 
        label: '3', 
        color: '#9b59b6', 
        name: '隕石術',
        icon: '☄️',
        description: '召喚隕石造成巨大傷害'
    },
    chainlightning: { 
        label: '4', 
        color: '#f1c40f', 
        name: '連鎖閃電',
        icon: '⚡',
        description: '閃電在敵人之間彈射'
    },
    heal: { 
        label: '5', 
        color: '#2ecc71', 
        name: '治療術',
        icon: '💚',
        description: '恢復生命值'
    },
    frozenorb: { 
        label: '6', 
        color: '#3498db', 
        name: '冰封球',
        icon: '🧊',
        description: '發射旋轉冰球'
    }
};

function SkillSlot({ skillKey, skill, playerMana, currentTime }) {
    const config = SKILL_CONFIG[skillKey] || { label: '?', color: '#888', name: '未知', icon: '?' };
    const 
        remaining = skill?.unlocked 
            ? Math.max(0, (skill.cooldown || 0) - (currentTime - (skill.lastUse || 0)))
            : 0,
        percent = skill?.cooldown > 0 ? (remaining / skill.cooldown) * 100 : 0,
        isReady = skill?.unlocked && remaining <= 0 && playerMana >= (skill.manaCost || 0),
        manaInsufficient = skill?.unlocked && playerMana < (skill.manaCost || 0),
        isLocked = !skill?.unlocked;

    return (
        <div className="skill-slot-wrapper">
            {/* 快捷鍵標籤 */}
            <div className="key-label">{config.label}</div>
            
            {/* 技能圓形容器 */}
            <div 
                className={`skill-slot ${isReady ? 'ready' : ''} ${manaInsufficient ? 'no-mana' : ''} ${isLocked ? 'locked' : ''}`}
                style={{
                    '--skill-color': config.color,
                    '--cooldown-percent': `${percent}%`
                }}
            >
                {/* 背景光暈 */}
                <div className="skill-glow" />
                
                {/* 技能圖示 */}
                <div className="skill-icon">
                    {config.icon}
                </div>
                
                {/* 冷卻遮罩 */}
                {remaining > 0 && (
                    <div className="cooldown-overlay">
                        <svg viewBox="0 0 100 100" className="cooldown-ring">
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="rgba(0,0,0,0.7)"
                                strokeWidth="90"
                                strokeDasharray={`${percent * 2.83} 283`}
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <span className="cooldown-text">{remaining.toFixed(1)}</span>
                    </div>
                )}
                
                {/* 鎖定圖示 */}
                {isLocked && (
                    <div className="lock-overlay">
                        <span className="lock-icon">🔒</span>
                    </div>
                )}
                
                {/* Mana不足提示 */}
                {manaInsufficient && remaining <= 0 && (
                    <div className="mana-warning">
                        <span>!</span>
                    </div>
                )}
            </div>
            
            {/* 技能名稱 */}
            <div className="skill-name">{config.name}</div>
            
            {/* 魔力消耗 */}
            {skill?.unlocked && (
                <div className={`mana-cost ${manaInsufficient ? 'insufficient' : ''}`}>
                    <span className="mana-icon">💧</span>
                    {skill.manaCost || 0}
                </div>
            )}
            
            <style jsx>{`
                .skill-slot-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                }
                
                .key-label {
                    position: absolute;
                    top: -22px;
                    background: linear-gradient(135deg, #2c3e50, #1a252f);
                    border: 2px solid #34495e;
                    border-radius: 8px;
                    padding: 3px 10px;
                    font-size: 12px;
                    font-weight: bold;
                    color: #ecf0f1;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    z-index: 10;
                }
                
                .skill-slot {
                    width: 70px;
                    height: 70px;
                    border-radius: 16px;
                    background: linear-gradient(145deg, #1e272e, #0d1117);
                    border: 3px solid #2c3e50;
                    position: relative;
                    cursor: isReady ? pointer : not-allowed;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 
                        0 4px 15px rgba(0,0,0,0.4),
                        inset 0 1px 1px rgba(255,255,255,0.1);
                }
                
                .skill-slot.ready {
                    border-color: var(--skill-color);
                    box-shadow: 
                        0 0 30px var(--skill-color),
                        0 4px 20px rgba(0,0,0,0.5),
                        inset 0 1px 1px rgba(255,255,255,0.2);
                    animation: pulse 2s ease-in-out infinite;
                }
                
                .skill-slot.ready:hover {
                    transform: scale(1.1);
                    box-shadow: 
                        0 0 50px var(--skill-color),
                        0 8px 30px rgba(0,0,0,0.6);
                }
                
                .skill-slot.no-mana {
                    border-color: #e74c3c;
                    animation: shake 0.5s ease-in-out;
                }
                
                .skill-slot.locked {
                    opacity: 0.6;
                    filter: grayscale(0.8);
                }
                
                .skill-glow {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 30% 30%, var(--skill-color) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                
                .skill-slot.ready .skill-glow {
                    opacity: 0.3;
                }
                
                .skill-icon {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 36px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                    transition: transform 0.2s;
                }
                
                .skill-slot.ready:hover .skill-icon {
                    transform: scale(1.15);
                }
                
                .cooldown-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0,0,0,0.4);
                    border-radius: 16px;
                }
                
                .cooldown-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    transform: rotate(-90deg);
                }
                
                .cooldown-text {
                    font-size: 26px;
                    font-weight: bold;
                    color: #fff;
                    text-shadow: 0 2px 8px rgba(0,0,0,0.8);
                    z-index: 5;
                    font-family: 'Arial Black', sans-serif;
                }
                
                .lock-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0,0,0,0.6);
                    border-radius: 16px;
                }
                
                .lock-icon {
                    font-size: 28px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
                }
                
                .mana-warning {
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    width: 20px;
                    height: 20px;
                    background: #e74c3c;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: bold;
                    color: white;
                    box-shadow: 0 2px 8px rgba(231, 76, 60, 0.6);
                    animation: blink 1s ease-in-out infinite;
                }
                
                .skill-name {
                    margin-top: 10px;
                    font-size: 13px;
                    color: #bdc3c7;
                    font-weight: 600;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
                    white-space: nowrap;
                }
                
                .mana-cost {
                    margin-top: 4px;
                    font-size: 11px;
                    color: #3498db;
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    font-weight: 500;
                }
                
                .mana-cost.insufficient {
                    color: #e74c3c;
                }
                
                .mana-icon {
                    font-size: 10px;
                }
                
                @keyframes pulse {
                    0%, 100% { box-shadow: 0 0 30px var(--skill-color), 0 4px 20px rgba(0,0,0,0.5); }
                    50% { box-shadow: 0 0 50px var(--skill-color), 0 4px 20px rgba(0,0,0,0.5); }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-3px); }
                    75% { transform: translateX(3px); }
                }
                
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}

function SkillSlots() {
    const skills = useGameState((state) => state.skills);
    const playerMana = useGameState((state) => state.playerMana);
    const currentTime = useGameState((state) => state.currentTime) || performance.now() / 1000;

    const skillKeys = Object.keys(SKILL_CONFIG);

    return (
        <div className="skill-bar-container">
            <div className="skill-bar">
                {skillKeys.map(key => (
                    <SkillSlot
                        key={key}
                        skillKey={key}
                        skill={skills[key]}
                        playerMana={playerMana}
                        currentTime={currentTime}
                    />
                ))}
            </div>
            
            {/* 技能欄位標題 */}
            <div className="skill-bar-label">SKILLS</div>
            
            <style jsx>{`
                .skill-bar-container {
                    position: absolute;
                    bottom: 40px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    z-index: 30;
                    pointer-events: auto;
                }
                
                .skill-bar {
                    display: flex;
                    gap: 16px;
                    padding: 20px 25px;
                    background: linear-gradient(180deg, 
                        rgba(20, 25, 35, 0.95) 0%, 
                        rgba(10, 15, 25, 0.98) 100%
                    );
                    border-radius: 20px;
                    border: 2px solid rgba(100, 120, 140, 0.3);
                    box-shadow: 
                        0 10px 40px rgba(0,0,0,0.6),
                        inset 0 1px 1px rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                }
                
                .skill-bar-label {
                    margin-top: 10px;
                    font-size: 11px;
                    color: rgba(150, 170, 190, 0.6);
                    letter-spacing: 4px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
            `}</style>
        </div>
    );
}

export default SkillSlots;
