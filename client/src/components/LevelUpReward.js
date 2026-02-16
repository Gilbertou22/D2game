// src/components/LevelUpReward.js - 升級獎勵選擇組件
import React from 'react';
import useGameState from '../hooks/useGameState';
import './LevelUpReward.css';

function LevelUpReward() {
    const pendingLevelUpRewards = useGameState((state) => state.pendingLevelUpRewards);
    const playerLevel = useGameState((state) => state.playerLevel);
    const selectLevelUpReward = useGameState((state) => state.selectLevelUpReward);
    const skipLevelUpReward = useGameState((state) => state.skipLevelUpReward);

    if (!pendingLevelUpRewards || pendingLevelUpRewards.length === 0) {
        return null;
    }

    return (
        <div className="level-up-overlay">
            <div className="level-up-container">
                <div className="level-up-header">
                    <h2>⬆️ 等級提升！</h2>
                    <p>恭喜達到等級 {playerLevel}！</p>
                    <p className="subtitle">選擇一項獎勵繼續</p>
                </div>

                <div className="rewards-grid">
                    {pendingLevelUpRewards.map((reward) => (
                        <button
                            key={reward.id}
                            className="reward-card"
                            onClick={() => selectLevelUpReward(reward)}
                            style={{ borderColor: reward.color }}
                        >
                            <div className="reward-icon" style={{ backgroundColor: reward.color }}>
                                {reward.icon}
                            </div>
                            <div className="reward-info">
                                <h3 style={{ color: reward.color }}>{reward.name}</h3>
                                <p>{reward.description}</p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="level-up-footer">
                    <button className="skip-btn" onClick={skipLevelUpReward}>
                        隨機選擇
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LevelUpReward;
