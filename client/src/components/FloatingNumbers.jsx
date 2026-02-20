// src/components/FloatingNumbers.jsx - 優化美化版：浮動傷害數字 (Unity 風格)
import { Html } from '@react-three/drei';
import { useRef, useState, useEffect, useCallback } from 'react';
import useGameState from '../hooks/useGameState';

// 動畫關鍵幀樣式
const animationStyles = `
  @keyframes floatUp {
    0% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-30px) scale(1.1); }
    100% { transform: translateY(-60px) scale(0.8); opacity: 0; }
  }
  @keyframes critPulse {
    0% { transform: scale(1) rotate(-5deg); }
    25% { transform: scale(1.3) rotate(5deg); }
    50% { transform: scale(1.2) rotate(-3deg); }
    75% { transform: scale(1.1) rotate(2deg); }
    100% { transform: scale(0.9) rotate(0deg); }
  }
  @keyframes healFloat {
    0% { transform: translateY(0); }
    50% { transform: translateY(-25px); }
    100% { transform: translateY(-50px); }
  }
  @keyframes goldShine {
    0% { transform: translateY(0) scale(1); filter: brightness(1); }
    50% { transform: translateY(-20px) scale(1.15); filter: brightness(1.3); }
    100% { transform: translateY(-40px) scale(0.9); filter: brightness(0.8); }
  }
  @keyframes missFloat {
    0% { transform: scale(0.5); opacity: 0; }
    30% { transform: scale(1.2); opacity: 1; }
    70% { transform: scale(1); opacity: 1; }
    100% { transform: scale(0.8); opacity: 0; }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
    20%, 40%, 60%, 80% { transform: translateX(3px); }
  }
  @keyframes popIn {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.4); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes driftRight {
    0% { transform: translateX(0); }
    100% { transform: translateX(40px); }
  }
`;

// 單個浮動數字組件
function FloatingNumberItem({ initialData, onComplete }) {
    const [data, setData] = useState(initialData);
    const frameRef = useRef();
    const startTimeRef = useRef(performance.now());
    const onCompleteRef = useRef(onComplete);
    
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    // 根據動畫類型計算位置 (Unity 風格：Pop + Drift + Fade)
    const getAnimationStyle = useCallback((progress) => {
        const { animation } = data;
        
        // 根據時間段計算動畫
        const punchPhase = 0.15; // 前 15% 時間為彈出效果
        const flyPhase = 0.6;    // 中間 60% 時間為飛翔
        const fadePhase = 0.25;  // 後 25% 時間為消失
        
        let translateY = 0;
        let translateX = 0;
        let scale = 1;
        
        if (progress < punchPhase) {
            // 彈出階段 (Pop!)
            const punchProgress = progress / punchPhase;
            scale = 1 + 0.4 * Math.sin(punchProgress * Math.PI);
            translateY = -10 * punchProgress;
        } else if (progress < punchPhase + flyPhase) {
            // 飛翔階段 (Fly up + drift right)
            const flyProgress = (progress - punchPhase) / flyPhase;
            translateY = -10 - (80 * flyProgress);
            translateX = 40 * flyProgress; // 向右飄動
            scale = 1.4 - 0.4 * flyProgress;
        } else {
            // 消失階段 (Fade out)
            const fadeProgress = (progress - punchPhase - flyPhase) / fadePhase;
            translateY = -90 - (30 * fadeProgress);
            translateX = 40;
            scale = 1 - fadeProgress;
        }
        
        switch (animation) {
            case 'crit':
                return {
                    translateY: translateY * 1.2,
                    translateX: translateX * 1.1,
                    scale: scale * (1 + 0.2 * Math.sin(progress * Math.PI * 4)),
                    rotate: Math.sin(progress * Math.PI * 6) * 6 * (1 - progress)
                };
            case 'elemental':
                // Elemental damage: fire/lightning/ice - faster float with slight wobble
                return {
                    translateY: translateY * 0.9,
                    translateX: translateX * 1.3,
                    scale: scale * (1 + 0.15 * Math.sin(progress * Math.PI * 5)),
                    rotate: Math.sin(progress * Math.PI * 8) * 4 * (1 - progress)
                };
            case 'dot':
                // Damage over time - slower float, lingering
                return {
                    translateY: translateY * 0.7,
                    translateX: translateX * 0.8,
                    scale: scale * (1 - 0.05 * progress)
                };
            case 'heal':
                return {
                    translateY: translateY * 0.9,
                    translateX: translateX * 0.8,
                    scale: scale * (1 + 0.08 * Math.sin(progress * Math.PI * 3))
                };
            case 'gold':
            case 'exp':
                return {
                    translateY: translateY * 0.75,
                    translateX: translateX * 0.7,
                    scale: scale * (1 - 0.1 * progress)
                };
            case 'miss':
            case 'dodge':
                return {
                    translateY: -50 * progress,
                    translateX: translateX * 0.5,
                    scale: progress < 0.3 ? 0.5 + 0.7 * (progress / 0.3) : 1 - 0.2 * ((progress - 0.3) / 0.7)
                };
            default: // damage
                return {
                    translateY,
                    translateX,
                    scale
                };
        }
    }, [data.animation, data.life]);
    
    useEffect(() => {
        let lastTime = performance.now();
        let isComplete = false;
        
        const animate = (currentTime) => {
            const elapsed = (currentTime - startTimeRef.current) / 1000;
            const progress = Math.min(elapsed / data.life, 1);
            lastTime = currentTime;
            
            if (progress >= 1 && !isComplete) {
                isComplete = true;
                setTimeout(() => {
                    onCompleteRef.current?.(initialData.id);
                }, 0);
                return;
            }
            
            const animStyle = getAnimationStyle(progress);
            
            setData(prev => ({
                ...prev,
                progress,
                opacity: 1 - progress * 0.7,
                translateY: animStyle.translateY,
                translateX: animStyle.translateX || 0,
                scale: (initialData.scale || 1) * animStyle.scale,
                rotation: (prev.rotation || 0) + (data.shake ? Math.sin(currentTime * 0.05) * 3 : 0)
            }));
            
            frameRef.current = requestAnimationFrame(animate);
        };
        
        frameRef.current = requestAnimationFrame(animate);
        
        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [initialData.id, data.life, data.shake, getAnimationStyle, initialData.scale]);
    
    if (data.opacity <= 0) return null;
    
    // 根據類型添加額外樣式
    const getExtraStyles = () => {
        switch (data.animation) {
            case 'crit':
                return {
                    textShadow: `
                        0 0 10px ${data.glowColor},
                        0 0 20px ${data.glowColor},
                        0 0 30px ${data.glowColor},
                        2px 2px 0 #000,
                        -2px -2px 0 #000,
                        2px -2px 0 #000,
                        -2px 2px 0 #000
                    `
                };
            case 'heal':
                return {
                    textShadow: `
                        0 0 8px ${data.glowColor},
                        0 0 15px ${data.glowColor},
                        2px 2px 4px rgba(0,0,0,0.8)
                    `
                };
            case 'gold':
            case 'exp':
                return {
                    textShadow: `
                        0 0 6px ${data.glowColor},
                        0 0 12px ${data.glowColor},
                        2px 2px 3px rgba(0,0,0,0.8)
                    `
                };
            default:
                return {
                    textShadow: `
                        0 0 5px ${data.glowColor || data.color},
                        2px 2px 4px rgba(0,0,0,0.9)
                    `
                };
        }
    };
    
    return (
        <Html 
            position={[data.position.x, data.position.y, data.position.z]} 
            center
            style={{ pointerEvents: 'none' }}
        >
            <style>{animationStyles}</style>
            <div style={{
                color: data.color,
                fontSize: data.fontSize,
                fontWeight: data.animation === 'crit' ? '900' : 'bold',
                fontFamily: data.animation === 'crit' ? '"Impact", "Arial Black", sans-serif' : '"Patrick Hand", "Comic Sans MS", sans-serif',
                transform: `
                    translateY(${data.translateY || 0}px) 
                    translateX(${data.translateX || 0}px)
                    scale(${data.scale || 1})
                    rotate(${data.rotation || 0}deg)
                `,
                opacity: data.opacity,
                whiteSpace: 'nowrap',
                ...getExtraStyles(),
                animation: data.animation === 'crit' ? 'critPulse 0.5s ease-out' : 'none',
                letterSpacing: data.animation === 'crit' ? '2px' : '1px'
            }}>
                {data.prefix}{data.value}{data.suffix}
            </div>
        </Html>
    );
}

function FloatingNumbers() {
    const floatingNumbers = useGameState((state) => state.floatingNumbers);
    const removeFloatingNumber = useGameState((state) => state.removeFloatingNumber);
    const [activeNumbers, setActiveNumbers] = useState([]);
    const processedIdsRef = useRef(new Set());
    
    useEffect(() => {
        const newNumbers = floatingNumbers.filter(n => !processedIdsRef.current.has(n.id));
        
        if (newNumbers.length > 0) {
            newNumbers.forEach(n => processedIdsRef.current.add(n.id));
            
            setActiveNumbers(prev => {
                const combined = [...prev, ...newNumbers];
                if (combined.length > 35) {
                    return combined.slice(combined.length - 35);
                }
                return combined;
            });
        }
    }, [floatingNumbers]);
    
    const handleComplete = useCallback((id) => {
        setActiveNumbers(prev => prev.filter(n => n.id !== id));
        processedIdsRef.current.delete(id);
        setTimeout(() => {
            removeFloatingNumber(id);
        }, 0);
    }, [removeFloatingNumber]);
    
    return (
        <>
            {activeNumbers.map(number => (
                <FloatingNumberItem 
                    key={number.id} 
                    initialData={number}
                    onComplete={handleComplete}
                />
            ))}
        </>
    );
}

export default FloatingNumbers;
