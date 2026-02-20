// src/game/LevelManager.js (完整優化版：消滅所有敵人進下一關 + BOSS 死亡進關 + 防呆 + 華麗特效)
import { useEffect, useState } from 'react';
import useGameState from '../hooks/useGameState';
import { createParticles } from './Particles';

function LevelManager() {
    const {
        enemies = [],
        currentLevel,
        isBossLevel,
        bossKilled,
        setBossKilled,
        nextLevel,
        setLevelMessage,
        resetScene,
        addEvent
    } = useGameState();

    const [levelTransitioning, setLevelTransitioning] = useState(false);
    const [enemiesKilled, setEnemiesKilled] = useState(0);
    const [totalEnemies, setTotalEnemies] = useState(0);

    // 更新敵人統計
    useEffect(() => {
        const enemiesArray = Array.isArray(enemies) ? enemies : [];
        const aliveEnemies = enemiesArray.filter(e => e.hp > 0);
        const boss = enemiesArray.find(e => e.type === 'boss');
        
        // 記錄總敵人數
        if (enemiesArray.length > 0 && totalEnemies === 0) {
            setTotalEnemies(enemiesArray.length);
        }
        
        if (levelTransitioning) return;

        // BOSS 關卡：BOSS 死亡後進入下一關
        if (isBossLevel && boss && boss.hp <= 0 && !bossKilled) {
            setBossKilled(true);
            setLevelTransitioning(true);
            setLevelMessage(`BOSS 已擊敗！進入關卡 ${currentLevel + 1}`);
            addEvent(`🏆 BOSS 已擊敗！準備進入第 ${currentLevel + 1} 層...`, '#ff00ff', 'boss_kill');

            createParticles(boss.position, 0xff00ff, 120, 40, 6, 'boss_death_explosion');

            setTimeout(() => {
                nextLevel();
                resetScene();
                setLevelTransitioning(false);
                setBossKilled(false);
                setTotalEnemies(0);
            }, 4000);
        }
        
        // 普通關卡：所有敵人消滅後進入下一關
        if (!isBossLevel && totalEnemies > 0 && aliveEnemies.length === 0 && enemiesArray.length > 0) {
            setLevelTransitioning(true);
            setLevelMessage(`關卡 ${currentLevel} 完成！進入關卡 ${currentLevel + 1}`);
            addEvent(`✅ 所有敵人已消滅！進入第 ${currentLevel + 1} 層...`, '#00ff88', 'level_complete');

            // 慶祝特效
            const playerPos = useGameState.getState().playerPos;
            if (playerPos) {
                createParticles(playerPos.clone().add({ x: 0, y: 2, z: 0 }), 0x00ff88, 50, 20, 3, 'level_up');
            }

            setTimeout(() => {
                nextLevel();
                resetScene();
                setLevelTransitioning(false);
                setTotalEnemies(0);
            }, 2500);
        }
    }, [enemies, isBossLevel, bossKilled, currentLevel, levelTransitioning, totalEnemies]);

    // 關卡重置時清除狀態
    useEffect(() => {
        setLevelTransitioning(false);
        setTotalEnemies(0);
    }, [currentLevel]);

    return null;
}

export default LevelManager;