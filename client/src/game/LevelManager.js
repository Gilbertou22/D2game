// src/game/LevelManager.js (完整優化版：BOSS 死亡進關 + 防呆 + 華麗特效)
import { useEffect } from 'react';
import useGameState from '../hooks/useGameState';
import { createParticles } from './Particles';

function LevelManager() {
    const {
        enemies = [],           // 防呆預設空陣列
        currentLevel,
        isBossLevel,
        bossKilled,
        setBossKilled,
        nextLevel,
        setLevelMessage,
        resetScene
    } = useGameState();

    // BOSS 死亡檢查
    useEffect(() => {
        const enemiesArray = Array.isArray(enemies) ? enemies : [];
        const boss = enemiesArray.find(e => e.type === 'boss');

        if (isBossLevel && boss && boss.hp <= 0 && !bossKilled) {
            setBossKilled(true);
            setLevelMessage(`BOSS 已擊敗！進入關卡 ${currentLevel + 1}`);

            // BOSS 死亡華麗特效
            createParticles(boss.position, 0xff00ff, 120, 40, 6, 'boss_death_explosion');

            // 延遲進關（給玩家看特效）
            setTimeout(() => {
                nextLevel();      // 自動進下一關
                resetScene();     // 重置場景（敵人、寶箱、障礙等）
            }, 4000);
        }
    }, [enemies, isBossLevel, bossKilled, currentLevel]);

    return null;
}

export default LevelManager;