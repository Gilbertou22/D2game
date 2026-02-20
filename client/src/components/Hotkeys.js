// src/components/Hotkeys.js (修正版：Hooks 只能在頂層呼叫)
import { useEffect } from 'react';
import useGameState from '../hooks/useGameState';

function Hotkeys() {
    const consumePotion = useGameState((state) => state.consumePotion);
    const setCameraMode = useGameState((state) => state.setCameraMode);
    const cameraMode = useGameState((state) => state.cameraMode);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'q' || e.key === 'Q') {
                consumePotion('hp_potion'); // ← 普通函數呼叫
            } else if (e.key === 'e' || e.key === 'E') {
                consumePotion('mana_potion');
            } else if (e.key === 'v' || e.key === 'V') {
                // 切換視角
                const modes = ['isometric', 'third', 'first'];
                const currentIndex = modes.indexOf(cameraMode);
                const nextIndex = (currentIndex + 1) % modes.length;
                setCameraMode(modes[nextIndex]);
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [consumePotion, setCameraMode, cameraMode]); // ← 依賴 usePotion

    return null;
}

export default Hotkeys;