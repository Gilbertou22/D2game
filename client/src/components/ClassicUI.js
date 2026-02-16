// src/components/ClassicUI.jsx
import useGameState from '../hooks/useGameState';
import { expPerLevel } from '../utils/levelUtils';  // ← 新增這行
import { useEffect, useState, useRef } from 'react';
import { createParticles } from '../game/Particles';

function ClassicUI() {
    const playerHP = useGameState((state) => state.playerHP);
    const playerMaxHP = useGameState((state) => state.playerMaxHP);
    const playerMana = useGameState((state) => state.playerMana);
    const playerMaxMana = useGameState((state) => state.playerMaxMana);
    const playerExp = useGameState((state) => state.playerExp);
    const playerLevel = useGameState((state) => state.playerLevel);
    const currentLevel = useGameState((state) => state.currentLevel);
    const playerGold = useGameState((state) => state.playerGold);
    const playerPos = useGameState((state) => state.playerPos);

    const [showLevelUp, setShowLevelUp] = useState(false);
    const previousLevel = useRef(playerLevel);

    const time = Date.now() / 1000; // 動態時間

    // 監聽升級
    useEffect(() => {
        if (playerLevel > previousLevel.current) {
            setShowLevelUp(true);
            createParticles(playerPos, 0xffffff, 200, 20, 4, 'levelup');
            // 可加音效
            // new Audio('/sounds/level_up.mp3').play();

            setTimeout(() => setShowLevelUp(false), 4000);
            previousLevel.current = playerLevel;
        }
    }, [playerLevel]);

    const hpPercent = (playerHP / playerMaxHP) * 100;
    const manaPercent = (playerMana / playerMaxMana) * 100;
    const expPercent = (playerExp / 100) * 100; // 假設每級 100 exp

    return (
        <div id="classicUI">
            {/* 血量球 - 極致細膩波動 */}
            <div
                style={{
                    position: 'absolute',
                    left: '140px',
                    bottom: '70px',
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '16px solid #3a1a0a',
                    boxShadow: `
            0 0 60px rgba(200,0,0,0.8),
            inset 0 0 60px rgba(120,0,0,0.9),
            inset 0 0 100px rgba(255,80,80,0.5)
          `,
                    background: '#0a0000'
                }}
            >
                <svg width="100%" height="100%">
                    <defs>
                        <clipPath id="hpClip">
                            <circle cx="70" cy="70" r="70" />
                        </clipPath>

                        {/* 高光漸層 */}
                        <radialGradient id="hpShine" cx="30%" cy="30%" r="100%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                            <stop offset="40%" stopColor="rgba(255,180,180,0.4)" />
                            <stop offset="70%" stopColor="rgba(255,100,100,0.2)" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>

                        {/* 液體漸層 */}
                        <linearGradient id="hpLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ff9999" />
                            <stop offset="30%" stopColor="#ff4444" />
                            <stop offset="60%" stopColor="#ee0000" />
                            <stop offset="90%" stopColor="#aa0000" />
                            <stop offset="100%" stopColor="#660000" />
                        </linearGradient>
                    </defs>

                    {/* 主液體填充 */}
                    <g clipPath="url(#hpClip)">
                        <rect
                            x="0"
                            y={`${100 - hpPercent}%`}
                            width="140"
                            height={`${hpPercent}%`}
                            fill="url(#hpLiquid)"
                        />
                    </g>

                    {/* 8 層極細膩波紋 */}
                    <g clipPath="url(#hpClip)" opacity="0.8">
                        {/* 極大深波 */}
                        <ellipse cx="70" cy={`${100 - hpPercent + 5 + Math.sin(time * 0.8) * 10}%`} rx="90" ry="32" fill="rgba(255,80,80,0.4)" />
                        {/* 大波 */}
                        <ellipse cx="70" cy={`${100 - hpPercent + 10 + Math.cos(time * 1.0) * 12}%`} rx="85" ry="28" fill="rgba(255,100,100,0.35)" />
                        {/* 中波 */}
                        <ellipse cx="70" cy={`${100 - hpPercent + 14 + Math.sin(time * 1.3) * 9}%`} rx="78" ry="24" fill="rgba(255,130,130,0.3)" />
                        {/* 中細波 */}
                        <ellipse cx="70" cy={`${100 - hpPercent + 18 + Math.cos(time * 1.6) * 7}%`} rx="72" ry="20" fill="rgba(255,160,160,0.28)" />
                        {/* 細波 */}
                        <ellipse cx="70" cy={`${100 - hpPercent + 21 + Math.sin(time * 2.0) * 6}%`} rx="65" ry="17" fill="rgba(255,180,180,0.25)" />
                        {/* 微波 */}
                        <ellipse cx="70" cy={`${100 - hpPercent + 24 + Math.cos(time * 2.5) * 5}%`} rx="58" ry="14" fill="rgba(255,200,200,0.22)" />
                        {/* 極細波 */}
                        <ellipse cx="70" cy={`${100 - hpPercent + 27 + Math.sin(time * 3.2) * 4}%`} rx="52" ry="11" fill="rgba(255,220,220,0.2)" />
                        {/* 超細漣漪 */}
                        <ellipse cx="70" cy={`${100 - hpPercent + 30 + Math.cos(time * 4.0) * 3}%`} rx="48" ry="9" fill="rgba(255,240,240,0.18)" />
                    </g>

                    {/* 動態高光反射 */}
                    <ellipse cx="45" cy="40" rx="60" ry="40" fill="url(#hpShine)" opacity="0.7" />

                    {/* 微小氣泡上升（5 個） */}
                    <g clipPath="url(#hpClip)">
                        {[0, 1, 2, 3, 4].map(i => (
                            <circle
                                key={i}
                                cx={30 + i * 20}
                                cy={`${100 - hpPercent + 20 + (time * 8 + i * 20) % 80}%`}
                                r={3 + i}
                                fill="rgba(255,255,255,0.4)"
                                opacity="0.6"
                            />
                        ))}
                    </g>
                </svg>

                {/* 文字 */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    textShadow: '4px 4px 12px #000, 0 0 25px #ff6666',
                    zIndex: 2
                }}>
                    {Math.floor(playerHP)} / {playerMaxHP}
                </div>
            </div>

            {/* 魔法球 - 同樣極致波動（藍色調） */}
            <div
                style={{
                    position: 'absolute',
                    right: '140px',
                    bottom: '70px',
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '16px solid #0a0a3a',
                    boxShadow: '0 0 60px rgba(0,100,255,0.8), inset 0 0 60px rgba(0,0,150,0.9)',
                    background: '#000'
                }}
            >
                <svg width="100%" height="100%">
                    <defs>
                        <clipPath id="manaClip">
                            <circle cx="70" cy="70" r="70" />
                        </clipPath>
                        <radialGradient id="manaShine" cx="30%" cy="30%" r="100%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                            <stop offset="40%" stopColor="rgba(180,180,255,0.4)" />
                            <stop offset="70%" stopColor="rgba(100,100,255,0.2)" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                        <linearGradient id="manaLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#99aaff" />
                            <stop offset="30%" stopColor="#6666ff" />
                            <stop offset="60%" stopColor="#4444ee" />
                            <stop offset="90%" stopColor="#2222aa" />
                            <stop offset="100%" stopColor="#000066" />
                        </linearGradient>
                    </defs>

                    <g clipPath="url(#manaClip)">
                        <rect x="0" y={`${100 - manaPercent}%`} width="140" height={`${manaPercent}%`} fill="url(#manaLiquid)" />
                    </g>

                    <g clipPath="url(#manaClip)" opacity="0.8">
                        <ellipse cx="70" cy={`${100 - manaPercent + 5 + Math.sin(time * 0.9) * 11}%`} rx="92" ry="34" fill="rgba(100,120,255,0.4)" />
                        <ellipse cx="70" cy={`${100 - manaPercent + 11 + Math.cos(time * 1.1) * 13}%`} rx="87" ry="30" fill="rgba(130,150,255,0.35)" />
                        <ellipse cx="70" cy={`${100 - manaPercent + 15 + Math.sin(time * 1.4) * 10}%`} rx="80" ry="26" fill="rgba(160,180,255,0.3)" />
                        <ellipse cx="70" cy={`${100 - manaPercent + 19 + Math.cos(time * 1.7) * 8}%`} rx="73" ry="22" fill="rgba(190,200,255,0.28)" />
                        <ellipse cx="70" cy={`${100 - manaPercent + 22 + Math.sin(time * 2.1) * 7}%`} rx="66" ry="19" fill="rgba(210,220,255,0.25)" />
                        <ellipse cx="70" cy={`${100 - manaPercent + 26 + Math.cos(time * 2.6) * 6}%`} rx="60" ry="16" fill="rgba(230,240,255,0.22)" />
                        <ellipse cx="70" cy={`${100 - manaPercent + 29 + Math.sin(time * 3.3) * 5}%`} rx="54" ry="13" fill="rgba(240,250,255,0.2)" />
                        <ellipse cx="70" cy={`${100 - manaPercent + 32 + Math.cos(time * 4.1) * 4}%`} rx="50" ry="10" fill="rgba(250,255,255,0.18)" />
                    </g>

                    <ellipse cx="45" cy="40" rx="65" ry="45" fill="url(#manaShine)" opacity="0.7" />

                    {/* 氣泡上升 */}
                    <g clipPath="url(#manaClip)">
                        {[0, 1, 2, 3, 4].map(i => (
                            <circle
                                key={i}
                                cx={30 + i * 20}
                                cy={`${100 - manaPercent + 20 + (time * 10 + i * 25) % 90}%`}
                                r={3 + i * 0.8}
                                fill="rgba(200,220,255,0.5)"
                                opacity="0.7"
                            />
                        ))}
                    </g>
                </svg>

                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    textShadow: '4px 4px 12px #000, 0 0 25px #6666ff',
                    zIndex: 2
                }}>
                    {Math.floor(playerMana)} / {playerMaxMana}
                </div>
            </div>

            {/* 經驗條 - 金屬雕刻風 */}
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: '35px',
                    transform: 'translateX(-50%)',
                    width: '420px',
                    height: '32px',
                    background: 'linear-gradient(#1c0f00, #3a1a00)',
                    border: '6px double #b8860b',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 20px #000, 0 0 30px #ffdd00'
                }}
            >
                <div
                    style={{
                        height: '100%',
                        width: `${expPercent}%`,
                        background: 'linear-gradient(90deg, #ffdd88, #ffaa00, #ffdd88)',
                        backgroundSize: '300% 100%',
                        animation: 'expFlow 4s linear infinite',
                        boxShadow: 'inset 0 0 25px #ffdd00'
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffdd88',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        textShadow: '3px 3px 6px #000, 0 0 15px #ffaa00',
                        letterSpacing: '1px'
                    }}
                >
                    EXP: {playerExp} / {Math.floor(expPerLevel(playerLevel))} | LV {playerLevel} | 關卡 {currentLevel}
                </div>
            </div>

            {/* 金幣 - 銅幣雕刻風 */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '30px',
                    padding: '10px 25px',
                    background: 'linear-gradient(#4a2c00, #8b5a2b)',
                    border: '4px double #b8860b',
                    borderRadius: '16px',
                    color: '#ffd700',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    textShadow: '3px 3px 8px #000, 0 0 20px #ffdd00',
                    boxShadow: '0 0 30px #ffd700, inset 0 0 15px #ffaa00'
                }}
            >
                Gold: {playerGold}
            </div>

            {/* 升級特效提示 */}
            {showLevelUp && (
                <div style={{
                    position: 'absolute',
                    top: '30%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '60px',
                    fontWeight: 'bold',
                    color: '#ffdd00',
                    textShadow: '0 0 30px #ffaa00, 4px 4px 10px #000',
                    animation: 'levelUpFlash 2s ease-out',
                    pointerEvents: 'none',
                    zIndex: 300
                }}>
                    LEVEL UP! {playerLevel}
                </div>
            )}
        </div>
    );
}

// 動畫 keyframes（放在組件內或 global CSS）
const animation = `
  @keyframes waveSlow    { 0%,100% { transform: translate(0,0); } 50% { transform: translate(25px, -12px); } }
  @keyframes waveMedium  { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-20px, 15px); } }
  @keyframes waveFast    { 0%,100% { transform: translate(0,0); } 50% { transform: translate(15px, -8px); } }
  @keyframes waveVeryFast{ 0%,100% { transform: translate(0,0); } 50% { transform: translate(-12px, 10px); } }
  @keyframes expFlow     { 0% { background-position: 0% 50%; } 100% { background-position: 300% 50%; } }
  @keyframes pulse       { 0%,100% { box-shadow: 0 0 50px #ff0000, inset 0 0 60px #880000; } 50% { box-shadow: 0 0 80px #ff4444, inset 0 0 90px #ff8888; } }
`;

// 升級閃爍動畫（加在 CSS）
const levelUpCSS = `
@keyframes levelUpFlash {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
}
`;

export default ClassicUI;