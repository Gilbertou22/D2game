import { useEffect, useRef, useState, useCallback } from 'react';
import useGameState from '../hooks/useGameState';
import { expPerLevel } from '../utils/levelUtils';
import classConfigs from '../configs/classConfigs';

const ITEM_KEYS = ['q', 'w', 'e'];

function ClassSelection() {
    const selectClass = useGameState(s => s.selectClass);
    const classes = Object.entries(classConfigs);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'linear-gradient(135deg, #0a1a0f 0%, #0d2818 50%, #0a1a0f 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <h1 style={{
                fontSize: '3rem',
                color: '#d4a853',
                marginBottom: '1rem',
                textShadow: '0 0 20px rgba(212, 168, 83, 0.5)'
            }}>
                選擇職業
            </h1>
            <p style={{ color: '#6b8f7a', marginBottom: '2rem', fontSize: '1.1rem' }}>
                Choose Your Class
            </p>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '20px',
                maxWidth: '800px'
            }}>
                {classes.map(([key, config]) => (
                    <div
                        key={key}
                        onClick={() => selectClass(key)}
                        style={{
                            background: `linear-gradient(135deg, rgba(10, 26, 15, 0.95) 0%, rgba(20, 40, 30, 0.95) 100%)`,
                            border: `2px solid ${config.color}`,
                            borderRadius: '16px',
                            padding: '24px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            minWidth: '280px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = `0 0 30px ${config.color}40`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>{config.icon}</div>
                        <h2 style={{ color: config.color, margin: '0 0 4px 0', fontSize: '1.5rem' }}>
                            {config.name}
                        </h2>
                        <p style={{ color: '#6b8f7a', fontSize: '0.8rem', margin: '0 0 12px 0' }}>
                            {config.nameEn}
                        </p>
                        <p style={{ color: '#e4f0e8', fontSize: '0.9rem', margin: 0 }}>
                            {config.description}
                        </p>
                        <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#6b8f7a' }}>
                            <span>HP: {config.baseHP} | MP: {config.baseMP} | ATK: {config.baseAttack}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function WetlandUI() {
    const classSelected = useGameState(s => s.classSelected);
    const playerClass = useGameState(s => s.playerClass);
    const playerHP = useGameState(s => s.playerHP);
    const playerMaxHP = useGameState(s => s.playerMaxHP);
    const playerMana = useGameState(s => s.playerMana);
    const playerMaxMana = useGameState(s => s.playerMaxMana);
    const playerLevel = useGameState(s => s.playerLevel);
    const playerExp = useGameState(s => s.playerExp);
    const playerGold = useGameState(s => s.playerGold);
    const playerPos = useGameState(s => s.playerPos);
    const targetEnemy = useGameState(s => s.targetEnemy);
    const enemies = useGameState(s => s.enemies);
    const skills = useGameState(s => s.skills);
    const inventory = useGameState(s => s.inventory);
    const eventLog = useGameState(s => s.eventLog);
    const currentLevel = useGameState(s => s.currentLevel);
    const castSkill = useGameState(s => s.castSkill);
    const updatePlayer = useGameState(s => s.updatePlayer);
    const addEvent = useGameState(s => s.addEvent);
    const skillKeybinds = useGameState(s => s.skillKeybinds);

    const logRef = useRef(null);
    const particlesRef = useRef(null);
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        const id = setInterval(() => forceUpdate(n => n + 1), 50);
        return () => clearInterval(id);
    }, []);
    
    useEffect(() => {
        const unsubscribe = useGameState.subscribe(
            (state) => state.skills,
            () => forceUpdate(n => n + 1)
        );
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = 0;
        }
    }, [eventLog]);

    useEffect(() => {
        if (!particlesRef.current) return;
        const el = particlesRef.current;
        const interval = setInterval(() => {
            const particle = document.createElement('div');
            const isFirefly = Math.random() > 0.7;
            particle.className = isFirefly ? 'wl-firefly' : 'wl-leaf';
            const x = Math.random() * window.innerWidth;
            const duration = 8 + Math.random() * 8;
            const drift = (Math.random() - 0.5) * 200;
            particle.style.left = `${x}px`;
            particle.style.animationDuration = `${duration}s`;
            if (!isFirefly) {
                particle.style.setProperty('--leaf-drift', `${drift}px`);
            } else {
                particle.style.top = `${20 + Math.random() * 60}%`;
                particle.style.animationDelay = `${Math.random() * 3}s`;
            }
            el.appendChild(particle);
            setTimeout(() => particle.remove(), duration * 1000);
        }, 400);
        return () => clearInterval(interval);
    }, []);

    const hpPercent = playerMaxHP > 0 ? Math.min(100, (playerHP / playerMaxHP) * 100) : 0;
    const mpPercent = playerMaxMana > 0 ? Math.min(100, (playerMana / playerMaxMana) * 100) : 0;
    const nextExp = expPerLevel(playerLevel + 1);
    const expPercent = nextExp > 0 ? Math.min(100, (playerExp / nextExp) * 100) : 0;

    const targetHpPercent = targetEnemy && targetEnemy.maxHp > 0
        ? Math.min(100, (targetEnemy.hp / targetEnemy.maxHp) * 100)
        : 0;

    const handleUseSkill = useCallback((skillKey) => {
        const key = Object.keys(skillKeybinds).find(k => skillKeybinds[k] === skillKey);
        if (key) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key }));
        }
    }, [skillKeybinds]);

    const handleUseItem = useCallback((type) => {
        const state = useGameState.getState();
        if (type === 'hp' && state.inventory.hp_potion > 0) {
            const healAmt = Math.min(state.playerMaxHP - state.playerHP, state.playerMaxHP * 0.3);
            updatePlayer({
                playerHP: Math.min(state.playerMaxHP, state.playerHP + healAmt),
                inventory: { ...state.inventory, hp_potion: state.inventory.hp_potion - 1 }
            });
            addEvent(`使用生命藥水，恢復 ${Math.floor(healAmt)} HP`, '#00ff88', 'drop_potion');
        } else if (type === 'mp' && state.inventory.mana_potion > 0) {
            const restoreAmt = Math.min(state.playerMaxMana - state.playerMana, state.playerMaxMana * 0.3);
            updatePlayer({
                playerMana: Math.min(state.playerMaxMana, state.playerMana + restoreAmt),
                inventory: { ...state.inventory, mana_potion: state.inventory.mana_potion - 1 }
            });
            addEvent(`使用魔力藥水，恢復 ${Math.floor(restoreAmt)} MP`, '#3b82f6', 'drop_potion');
        }
    }, [updatePlayer, addEvent]);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'q' || e.key === 'Q') handleUseItem('hp');
            if (e.key === 'w' || e.key === 'W') handleUseItem('mp');
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleUseItem]);

    if (!classSelected) {
        return <ClassSelection />;
    }

    const currentClass = classConfigs[playerClass] || classConfigs.mage;
    const skillSlots = Object.entries(skillKeybinds).slice(0, 6).map(([key, skillKey]) => ({
        key: skillKey,
        label: key.toUpperCase(),
        bindKey: key
    }));

    const recentLogs = eventLog.slice(-15).reverse();

    return (
        <>
            <div className="wl-particles" ref={particlesRef} />

            {/* Character Panel - Top Left */}
            <div className="wl-char-panel">
                <div className="wl-char-card">
                    <div className="wl-char-header">
                        <div className="wl-char-avatar" style={{ background: `linear-gradient(135deg, ${currentClass.color}40 0%, ${currentClass.color}80 100%)`, border: `2px solid ${currentClass.color}` }}>
                            <span style={{ fontSize: '24px' }}>{currentClass.icon}</span>
                        </div>
                        <div className="wl-char-info">
                            <h2>{currentClass.name}</h2>
                            <div className="wl-char-class">Lv.{playerLevel} {currentClass.nameEn}</div>
                        </div>
                    </div>
                    <div className="wl-stat-bars">
                        <div className="wl-stat-row">
                            <svg className="wl-stat-icon" style={{ color: '#ef4444' }} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            <div className="wl-stat-track">
                                <div className="wl-stat-fill wl-hp" style={{ width: `${hpPercent}%` }} />
                            </div>
                            <div className="wl-stat-text">{Math.floor(playerHP).toLocaleString()} / {playerMaxHP.toLocaleString()}</div>
                        </div>
                        <div className="wl-stat-row">
                            <svg className="wl-stat-icon" style={{ color: '#3b82f6' }} viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                            </svg>
                            <div className="wl-stat-track">
                                <div className="wl-stat-fill wl-mp" style={{ width: `${mpPercent}%` }} />
                            </div>
                            <div className="wl-stat-text">{Math.floor(playerMana).toLocaleString()} / {playerMaxMana.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Target Panel - Top Center */}
            {targetEnemy && targetEnemy.hp > 0 && (
                <div className="wl-target-panel">
                    <div className="wl-target-card">
                        <div className="wl-target-name">{targetEnemy.name || '未知敵人'}</div>
                        <div className="wl-target-hp-track">
                            <div className="wl-target-hp-fill" style={{ width: `${targetHpPercent}%` }} />
                        </div>
                        <div className="wl-target-hp-text">
                            {Math.floor(targetEnemy.hp).toLocaleString()} / {targetEnemy.maxHp.toLocaleString()}
                        </div>
                    </div>
                </div>
            )}

            {/* Minimap - Top Right */}
            <div className="wl-minimap-panel">
                <div className="wl-minimap-frame">
                    <div className="wl-minimap-content">
                        <div className="wl-minimap-player" />
                        {Array.isArray(enemies) && enemies.slice(0, 8).map((enemy, i) => {
                            if (!enemy || !enemy.position) return null;
                            const dx = enemy.position.x - playerPos.x;
                            const dz = enemy.position.z - playerPos.z;
                            const mapRange = 150;
                            const px = 50 + (dx / mapRange) * 40;
                            const py = 50 + (dz / mapRange) * 40;
                            if (px < 5 || px > 95 || py < 5 || py > 95) return null;
                            return <div key={i} className="wl-minimap-enemy" style={{ top: `${py}%`, left: `${px}%` }} />;
                        })}
                    </div>
                </div>
                <div className="wl-minimap-label">第 {currentLevel} 層</div>
            </div>

            {/* Quest Panel - Right Side */}
            <div className="wl-quest-panel">
                <div className="wl-quest-card">
                    <div className="wl-quest-header">
                        <span className="wl-quest-badge">每週</span>
                        <span style={{ fontSize: '0.7rem', color: '#6b8f7a' }}>任務</span>
                    </div>
                    <div className="wl-quest-title">地牢探索者</div>
                    <div className="wl-quest-desc">通關至第10層</div>
                    <div className="wl-quest-progress">
                        <div className="wl-quest-progress-track">
                            <div className="wl-quest-progress-fill" style={{ width: `${Math.min(100, (currentLevel / 10) * 100)}%` }} />
                        </div>
                        <div className="wl-quest-progress-text">{Math.min(currentLevel, 10)} / 10</div>
                    </div>
                </div>
            </div>

            {/* Combat Log - Bottom Left */}
            <div className="wl-combat-log">
                <div className="wl-log-frame" ref={logRef}>
                    {recentLogs.length === 0 && (
                        <div className="wl-log-entry wl-log-info">戰鬥開始</div>
                    )}
                    {recentLogs.map((entry, i) => {
                        const typeClass = entry.type === 'kill' || entry.type === 'boss_kill' ? 'wl-log-damage'
                            : entry.type === 'drop_potion' || entry.type === 'level_up' ? 'wl-log-heal'
                            : 'wl-log-info';
                        return (
                            <div key={i} className={`wl-log-entry ${typeClass}`}>
                                {entry.message}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* EXP Bar - Bottom */}
            <div className="wl-exp-panel">
                <div className="wl-exp-track">
                    <div className="wl-exp-fill" style={{ width: `${expPercent}%` }} />
                </div>
                <div className="wl-exp-info">
                    <span>Lv.{playerLevel}</span>
                    <span className="wl-exp-gain">EXP {playerExp.toLocaleString()} / {nextExp.toLocaleString()}</span>
                    <span>{Math.floor(expPercent)}%</span>
                </div>
            </div>

            {/* Skill Bar - Bottom Center */}
            <div className="wl-skillbar-panel">
                <div className="wl-skillbar">
                    {skillSlots.map((slot, i) => {
                        const skill = skills[slot.key];
                        const remaining = skill?.unlocked
                            ? Math.max(0, (skill.cooldown || 0))
                            : 0;
                        const onCd = remaining > 0;
                        const noMana = skill?.unlocked && playerMana < (skill.manaCost || 0);
                        return (
                            <div
                                key={slot.key}
                                className={`wl-skill-slot ${onCd ? 'wl-on-cooldown' : ''} ${noMana ? 'wl-no-mana' : ''}`}
                                onClick={() => handleUseSkill(slot.key)}
                                tabIndex={0}
                                role="button"
                                aria-label={`Skill ${slot.label}`}
                            >
                                <span className="wl-skill-icon" style={{ fontSize: '22px' }}>
                                    {skill?.icon || '?'}
                                </span>
                                <span className="wl-skill-key">{slot.label}</span>
                                {onCd && (
                                    <div className="wl-skill-cooldown">
                                        {Math.ceil(remaining)}
                                    </div>
                                )}
                                {noMana && !onCd && (
                                    <div className="wl-mana-warn">!</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Item Bar - Bottom Right */}
            <div className="wl-itembar-panel">
                <div className="wl-itembar">
                    <div className="wl-item-slot" onClick={() => handleUseItem('hp')} tabIndex={0} role="button">
                        <svg viewBox="0 0 24 24" fill="#ef4444" width="20" height="20">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span className="wl-item-count">x{inventory.hp_potion || 0}</span>
                        <span className="wl-item-key">Q</span>
                    </div>
                    <div className="wl-item-slot" onClick={() => handleUseItem('mp')} tabIndex={0} role="button">
                        <svg viewBox="0 0 24 24" fill="#3b82f6" width="20" height="20">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        <span className="wl-item-count">x{inventory.mana_potion || 0}</span>
                        <span className="wl-item-key">W</span>
                    </div>
                </div>
            </div>

            <style>{`
                :root {
                    --wl-bg-forest: #0a1a0f;
                    --wl-bg-wetland: #0d2818;
                    --wl-fg: #e4f0e8;
                    --wl-fg-muted: #6b8f7a;
                    --wl-accent-gold: #d4a853;
                    --wl-accent-emerald: #2dd4bf;
                    --wl-accent-red: #f87171;
                    --wl-panel: rgba(10, 26, 15, 0.92);
                    --wl-panel-border: rgba(45, 212, 191, 0.2);
                }

                .wl-particles {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    overflow: hidden;
                    z-index: 5;
                }

                .wl-leaf {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: rgba(74, 222, 128, 0.7);
                    border-radius: 50% 0 50% 0;
                    animation: wl-leaf-fall linear infinite;
                }

                @keyframes wl-leaf-fall {
                    0% { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(100vh) translateX(var(--leaf-drift, 100px)) rotate(720deg); opacity: 0; }
                }

                .wl-firefly {
                    position: absolute;
                    width: 3px;
                    height: 3px;
                    background: radial-gradient(circle, rgba(250, 204, 21, 0.9) 0%, rgba(250, 204, 21, 0) 70%);
                    border-radius: 50%;
                    animation: wl-firefly-glow 3s ease-in-out infinite;
                }

                @keyframes wl-firefly-glow {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.5); }
                }

                /* Character Panel */
                .wl-char-panel {
                    position: fixed;
                    top: 16px;
                    left: 16px;
                    z-index: 50;
                    pointer-events: none;
                }

                .wl-char-card {
                    background: linear-gradient(135deg, var(--wl-panel) 0%, rgba(6, 18, 12, 0.95) 100%);
                    border: 1px solid var(--wl-panel-border);
                    border-radius: 12px;
                    padding: 14px 18px;
                    min-width: 260px;
                    backdrop-filter: blur(12px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                }

                .wl-char-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .wl-char-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #134e4a 0%, #0d9488 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid var(--wl-accent-emerald);
                    box-shadow: 0 0 15px rgba(45, 212, 191, 0.3);
                    color: var(--wl-fg);
                }

                .wl-char-info h2 {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--wl-fg);
                    margin: 0 0 2px 0;
                }

                .wl-char-class {
                    font-size: 0.7rem;
                    color: var(--wl-accent-gold);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .wl-stat-bars { display: flex; flex-direction: column; gap: 8px; }

                .wl-stat-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .wl-stat-icon {
                    width: 18px;
                    height: 18px;
                    flex-shrink: 0;
                }

                .wl-stat-track {
                    flex: 1;
                    height: 14px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 7px;
                    overflow: hidden;
                    position: relative;
                }

                .wl-stat-fill {
                    height: 100%;
                    border-radius: 7px;
                    transition: width 0.4s ease;
                    position: relative;
                }

                .wl-stat-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 50%;
                    background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%);
                    border-radius: 7px 7px 0 0;
                }

                .wl-hp {
                    background: linear-gradient(90deg, #991b1b, #dc2626, #ef4444);
                    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
                }

                .wl-mp {
                    background: linear-gradient(90deg, #1e40af, #2563eb, #3b82f6);
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                }

                .wl-stat-text {
                    font-size: 0.75rem;
                    font-weight: 600;
                    min-width: 90px;
                    text-align: right;
                    color: var(--wl-fg);
                }

                /* Target Panel */
                .wl-target-panel {
                    position: fixed;
                    top: 16px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 50;
                    pointer-events: none;
                }

                .wl-target-card {
                    background: linear-gradient(135deg, rgba(30, 10, 10, 0.95) 0%, rgba(50, 15, 15, 0.92) 100%);
                    border: 1px solid rgba(248, 113, 113, 0.3);
                    border-radius: 12px;
                    padding: 12px 24px;
                    min-width: 280px;
                    text-align: center;
                    backdrop-filter: blur(12px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                }

                .wl-target-name {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--wl-accent-red);
                    margin-bottom: 8px;
                    text-shadow: 0 0 10px rgba(248, 113, 113, 0.5);
                }

                .wl-target-hp-track {
                    height: 10px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 5px;
                    overflow: hidden;
                }

                .wl-target-hp-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #7f1d1d, #b91c1c, #dc2626);
                    border-radius: 5px;
                    transition: width 0.3s ease;
                    box-shadow: 0 0 8px rgba(220, 38, 38, 0.5);
                }

                .wl-target-hp-text {
                    font-size: 0.7rem;
                    margin-top: 4px;
                    color: var(--wl-fg-muted);
                }

                /* Minimap */
                .wl-minimap-panel {
                    position: fixed;
                    top: 16px;
                    right: 16px;
                    z-index: 50;
                    pointer-events: none;
                }

                .wl-minimap-frame {
                    width: 140px;
                    height: 140px;
                    background: linear-gradient(135deg, var(--wl-panel) 0%, rgba(6, 18, 12, 0.95) 100%);
                    border: 2px solid var(--wl-panel-border);
                    border-radius: 50%;
                    overflow: hidden;
                    position: relative;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
                }

                .wl-minimap-content {
                    position: absolute;
                    inset: 8px;
                    border-radius: 50%;
                    background:
                        radial-gradient(circle at 60% 70%, rgba(74, 222, 128, 0.3) 0%, transparent 30%),
                        radial-gradient(circle at 30% 40%, rgba(34, 197, 94, 0.2) 0%, transparent 25%),
                        linear-gradient(135deg, #0a1a0f 0%, #0d2818 100%);
                }

                .wl-minimap-player {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 8px;
                    height: 8px;
                    background: var(--wl-accent-emerald);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--wl-accent-emerald);
                    animation: wl-player-pulse 1.5s ease-in-out infinite;
                }

                @keyframes wl-player-pulse {
                    0%, 100% { box-shadow: 0 0 8px var(--wl-accent-emerald); }
                    50% { box-shadow: 0 0 16px var(--wl-accent-emerald), 0 0 24px rgba(45, 212, 191, 0.5); }
                }

                .wl-minimap-enemy {
                    position: absolute;
                    width: 5px;
                    height: 5px;
                    background: var(--wl-accent-red);
                    border-radius: 50%;
                }

                .wl-minimap-label {
                    text-align: center;
                    margin-top: 8px;
                    font-size: 0.65rem;
                    color: var(--wl-fg-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                }

                /* Quest Panel */
                .wl-quest-panel {
                    position: fixed;
                    top: 170px;
                    right: 16px;
                    z-index: 50;
                    width: 240px;
                    pointer-events: none;
                }

                .wl-quest-card {
                    background: linear-gradient(135deg, var(--wl-panel) 0%, rgba(6, 18, 12, 0.95) 100%);
                    border: 1px solid var(--wl-panel-border);
                    border-radius: 10px;
                    padding: 14px;
                    backdrop-filter: blur(12px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                }

                .wl-quest-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                }

                .wl-quest-badge {
                    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
                    font-size: 0.55rem;
                    font-weight: 700;
                    padding: 3px 8px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: white;
                }

                .wl-quest-title {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--wl-fg);
                    margin-bottom: 6px;
                }

                .wl-quest-desc {
                    font-size: 0.7rem;
                    color: var(--wl-fg-muted);
                    margin-bottom: 10px;
                    line-height: 1.4;
                }

                .wl-quest-progress {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .wl-quest-progress-track {
                    flex: 1;
                    height: 6px;
                    background: rgba(0, 0, 0, 0.4);
                    border-radius: 3px;
                    overflow: hidden;
                }

                .wl-quest-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #7c3aed, #a855f7);
                    border-radius: 3px;
                    transition: width 0.4s ease;
                }

                .wl-quest-progress-text {
                    font-size: 0.65rem;
                    color: var(--wl-accent-gold);
                    font-weight: 600;
                }

                /* Combat Log */
                .wl-combat-log {
                    position: fixed;
                    bottom: 140px;
                    left: 16px;
                    z-index: 50;
                    width: 280px;
                    pointer-events: none;
                }

                .wl-log-frame {
                    background: linear-gradient(135deg, rgba(10, 26, 15, 0.85) 0%, rgba(6, 18, 12, 0.9) 100%);
                    border: 1px solid var(--wl-panel-border);
                    border-radius: 8px;
                    padding: 10px 12px;
                    max-height: 120px;
                    overflow-y: auto;
                    backdrop-filter: blur(8px);
                }

                .wl-log-entry {
                    font-size: 0.65rem;
                    padding: 3px 0;
                    border-bottom: 1px solid rgba(45, 212, 191, 0.1);
                    animation: wl-log-in 0.3s ease-out;
                }

                .wl-log-entry:last-child { border-bottom: none; }

                @keyframes wl-log-in {
                    0% { opacity: 0; transform: translateX(-10px); }
                    100% { opacity: 1; transform: translateX(0); }
                }

                .wl-log-damage { color: var(--wl-accent-red); }
                .wl-log-heal { color: var(--wl-accent-emerald); }
                .wl-log-info { color: var(--wl-fg-muted); }

                /* EXP Bar */
                .wl-exp-panel {
                    position: fixed;
                    bottom: 110px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 500px;
                    max-width: calc(100% - 40px);
                    z-index: 50;
                    pointer-events: none;
                }

                .wl-exp-track {
                    height: 8px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 4px;
                    overflow: hidden;
                    position: relative;
                }

                .wl-exp-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #581c87, #7c3aed, #a855f7);
                    border-radius: 4px;
                    transition: width 0.4s ease;
                    box-shadow: 0 0 12px rgba(168, 85, 247, 0.5);
                    position: relative;
                }

                .wl-exp-fill::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    animation: wl-exp-shine 2s infinite;
                }

                @keyframes wl-exp-shine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }

                .wl-exp-info {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 4px;
                    font-size: 0.65rem;
                    color: var(--wl-fg-muted);
                }

                .wl-exp-gain {
                    color: var(--wl-accent-gold);
                    font-weight: 600;
                }

                /* Skill Bar */
                .wl-skillbar-panel {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 50;
                }

                .wl-skillbar {
                    display: flex;
                    gap: 6px;
                    padding: 10px 14px;
                    background: linear-gradient(135deg, var(--wl-panel) 0%, rgba(6, 18, 12, 0.95) 100%);
                    border: 1px solid var(--wl-panel-border);
                    border-radius: 14px;
                    backdrop-filter: blur(12px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                }

                .wl-skill-slot {
                    width: 52px;
                    height: 52px;
                    background: linear-gradient(145deg, rgba(20, 40, 25, 0.9) 0%, rgba(10, 26, 15, 0.95) 100%);
                    border: 2px solid rgba(45, 212, 191, 0.2);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.15s ease;
                    pointer-events: auto;
                }

                .wl-skill-slot:hover {
                    border-color: var(--wl-accent-emerald);
                    transform: translateY(-3px);
                    box-shadow: 0 4px 20px rgba(45, 212, 191, 0.3);
                }

                .wl-skill-slot:active {
                    transform: scale(0.95);
                }

                .wl-skill-slot.wl-on-cooldown {
                    opacity: 0.6;
                }

                .wl-skill-slot.wl-on-cooldown::before {
                    content: '';
                    position: absolute;
                    inset: 4px;
                    background: rgba(0, 0, 0, 0.6);
                    border-radius: 8px;
                    z-index: 1;
                }

                .wl-skill-slot.wl-no-mana {
                    border-color: rgba(239, 68, 68, 0.5);
                }

                .wl-skill-icon {
                    z-index: 2;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
                }

                .wl-skill-key {
                    position: absolute;
                    bottom: 2px;
                    right: 4px;
                    font-size: 0.55rem;
                    font-weight: 700;
                    color: var(--wl-fg-muted);
                    z-index: 3;
                }

                .wl-skill-cooldown {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--wl-fg);
                    text-shadow: 0 0 10px rgba(0,0,0,0.8);
                    z-index: 5;
                }

                .wl-mana-warn {
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    width: 16px;
                    height: 16px;
                    background: #e74c3c;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                    color: white;
                    z-index: 5;
                    animation: wl-blink 1s ease-in-out infinite;
                }

                @keyframes wl-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }

                /* Item Bar */
                .wl-itembar-panel {
                    position: fixed;
                    bottom: 20px;
                    right: 16px;
                    z-index: 50;
                }

                .wl-itembar {
                    display: flex;
                    gap: 4px;
                    padding: 8px 10px;
                    background: linear-gradient(135deg, var(--wl-panel) 0%, rgba(6, 18, 12, 0.95) 100%);
                    border: 1px solid var(--wl-panel-border);
                    border-radius: 10px;
                    backdrop-filter: blur(12px);
                }

                .wl-item-slot {
                    width: 40px;
                    height: 40px;
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(45, 212, 191, 0.15);
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.15s ease;
                    pointer-events: auto;
                }

                .wl-item-slot:hover {
                    border-color: var(--wl-accent-gold);
                }

                .wl-item-count {
                    position: absolute;
                    bottom: 1px;
                    right: 3px;
                    font-size: 0.55rem;
                    font-weight: 700;
                    color: var(--wl-fg);
                }

                .wl-item-key {
                    position: absolute;
                    top: 1px;
                    left: 3px;
                    font-size: 0.5rem;
                    font-weight: 700;
                    color: var(--wl-fg-muted);
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .wl-minimap-panel { display: none; }
                    .wl-quest-panel { display: none; }
                    .wl-combat-log { display: none; }
                    .wl-char-card { min-width: 200px; padding: 10px; }
                    .wl-target-card { min-width: 200px; padding: 8px 16px; }
                    .wl-skill-slot { width: 44px; height: 44px; }
                    .wl-exp-panel { width: calc(100% - 20px); bottom: 75px; }
                }

                @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
        </>
    );
}

export default WetlandUI;
