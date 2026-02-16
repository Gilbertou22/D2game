// src/components/Hotkeys.js (修正版：Hooks 只能在頂層呼叫)
import { useEffect } from 'react';
import useGameState from '../hooks/useGameState';

function Hotkeys() {
    const consumePotion = useGameState((state) => state.consumePotion);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'q' || e.key === 'Q') {
                consumePotion('hp_potion'); // ← 普通函數呼叫
            } else if (e.key === 'e' || e.key === 'E') {
                consumePotion('mana_potion');
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [consumePotion]); // ← 依賴 usePotion

    return null;
}

export default Hotkeys;