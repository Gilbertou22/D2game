// client/src/game/Enemies/EnemyHealthBar.js (完整通用血條組件)
import { Html } from '@react-three/drei';
import enemyConfigs from '../../configs/enemyConfigs'; // 修正路徑

function EnemyHealthBar({ enemy }) {
    const hpPercent = enemy.hp / enemy.maxHp;

    if (enemy.hp <= 0) return null;

    const isBoss = enemy.type === 'boss';

    if (isBoss) {
        // Boss 多階段血條
        let currentPhaseIndex = 0;
        const phases = enemyConfigs.boss.phases;
        for (let i = phases.length - 1; i >= 0; i--) {
            if (hpPercent > phases[i].threshold) {
                currentPhaseIndex = i;
                break;
            }
        }

        const phase = phases[currentPhaseIndex];
        const phaseColors = ['#ff00ff', '#ff88ff', '#ff0000'];
        const phaseNames = phases.map(p => p.name);

        return (
            <Html position={[0, enemy.size + 8, 0]} center>
                {/* 名字 */}
                <div style={{
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px #000',
                    marginBottom: '5px'
                }}>
                    {enemy.name || enemy.type}
                </div>
                {/* 階段名稱 */}
                <div style={{
                    color: phaseColors[currentPhaseIndex],
                    fontSize: '28px',
                    fontWeight: 'bold',
                    textShadow: '0 0 20px #000, 3px 3px 8px #000',
                    marginBottom: '10px',
                    textAlign: 'center'
                }}>
                    {phaseNames[currentPhaseIndex]}
                </div>

                {/* 多層血條 */}
                <div style={{
                    width: '300px',
                    height: '35px',
                    background: '#222',
                    border: '6px solid #ff00ff',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    boxShadow: '0 0 30px #ff00ff'
                }}>
                    {/* Phase 3 */}
                    <div style={{
                        width: `${Math.max(0, hpPercent / phases[2].threshold * 100)}%`,
                        height: '100%',
                        background: '#ff0000',
                        float: 'left',
                        transition: 'width 0.5s ease'
                    }} />
                    {/* Phase 2 */}
                    <div style={{
                        width: `${Math.max(0, (hpPercent - phases[2].threshold) / (phases[1].threshold - phases[2].threshold) * 100)}%`,
                        height: '100%',
                        background: '#ff88ff',
                        float: 'left',
                        transition: 'width 0.5s ease'
                    }} />
                    {/* Phase 1 */}
                    <div style={{
                        width: `${Math.max(0, (hpPercent - phases[1].threshold) / (1 - phases[1].threshold) * 100)}%`,
                        height: '100%',
                        background: '#ff00ff',
                        float: 'left',
                        transition: 'width 0.5s ease'
                    }} />
                </div>

                {/* HP 文字 */}
                <div style={{
                    marginTop: '10px',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    textShadow: '3px 3px 6px #000',
                    textAlign: 'center'
                }}>
                    {Math.floor(enemy.hp)} / {enemy.maxHp}
                </div>
            </Html>
        );
    }

    // 普通敵人血條
    const barColor = hpPercent > 0.6 ? '#00ff00' : hpPercent > 0.3 ? '#ffff00' : '#ff0000';

    return (
        <Html position={[0, enemy.size + 3, 0]} center>
            {/* 名字 */}
            <div style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px #000',
                marginBottom: '5px'
            }}>
                {enemy.name || enemy.type}
            </div>
            <div style={{
                width: '80px',
                height: '10px',
                background: '#333',
                border: '2px solid #fff',
                borderRadius: '5px',
                overflow: 'hidden',
                boxShadow: '0 0 5px #000'
            }}>
                <div style={{
                    width: `${hpPercent * 100}%`,
                    height: '100%',
                    background: barColor,
                    transition: 'width 0.3s ease'
                }} />
            </div>
            <div style={{
                marginTop: '2px',
                color: 'white',
                fontSize: '12px',
                textShadow: '1px 1px 2px #000',
                textAlign: 'center'
            }}>
                {Math.floor(enemy.hp)} / {enemy.maxHp}
            </div>
        </Html>
    );
}

export default EnemyHealthBar;