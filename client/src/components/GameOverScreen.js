// src/components/GameOverScreen.js (完整版：點擊重新開始正常運作)
import useGameState from '../hooks/useGameState';

function GameOverScreen() {
    const isDead = useGameState((state) => state.isDead);
    const revivePlayer = useGameState((state) => state.revivePlayer);
    const currentLevel = useGameState((state) => state.currentLevel);

    if (!isDead) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.95)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#ff4444',
                fontSize: '72px',
                fontWeight: 'bold',
                textShadow: '0 0 20px #ff0000',
                zIndex: 1000,
                pointerEvents: 'auto' // 確保可點擊
            }}
        >
            <div style={{ marginBottom: '50px' }}>
                GAME OVER
            </div>

            <div style={{ fontSize: '36px', marginBottom: '60px', color: '#ffffff' }}>
                你在第 {currentLevel} 層陣亡
            </div>

            <button
                onClick={revivePlayer} // ← 正確呼叫 revivePlayer
                style={{
                    padding: '20px 80px',
                    fontSize: '36px',
                    background: '#660000',
                    color: '#ffaaaa',
                    border: '4px solid #ff0000',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    boxShadow: '0 0 40px #ff0000',
                    transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.target.style.background = '#aa0000'}
                onMouseOut={(e) => e.target.style.background = '#660000'}
            >
                重新開始（損失金幣與經驗）
            </button>
        </div>
    );
}

export default GameOverScreen;