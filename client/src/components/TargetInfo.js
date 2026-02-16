// src/components/TargetInfo.js (新增目標資訊 UI：怪物名稱 + 血量條 + 高亮)
import { Html } from '@react-three/drei';
import useGameState from '../hooks/useGameState';

function TargetInfo() {
    const targetEnemy = useGameState((state) => state.targetEnemy);

    if (!targetEnemy || targetEnemy.hp <= 0) return null;

    const hpPercent = (targetEnemy.hp / targetEnemy.maxHp) * 100;
    const color = hpPercent > 60 ? '#00ff00' : hpPercent > 30 ? '#ffff00' : '#ff0000';

    return (
        <Html position={[0, 200, 0]} center> {/* 上方中間 */}
            <div style={{
                width: '400px',
                padding: '15px 25px',
                background: 'rgba(0,0,0,0.8)',
                border: '4px solid #ff4444',
                borderRadius: '20px',
                boxShadow: '0 0 40px #ff0000',
                textAlign: 'center',
                color: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                pointerEvents: 'none'
            }}>
                <div style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    textShadow: '0 0 15px #ff0000',
                    color: '#ffaaaa'
                }}>
                    ⚔️ 目標：{targetEnemy.name || targetEnemy.type}
                </div>
                <div style={{
                    height: '30px',
                    background: '#333333',
                    border: '3px solid #ff4444',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    boxShadow: '0 0 20px #ff0000'
                }}>
                    <div style={{
                        width: `${hpPercent}%`,
                        height: '100%',
                        background: `linear-gradient(to right, ${color}, ${color}dd)`,
                        transition: 'width 0.3s ease'
                    }} />
                </div>
                <div style={{
                    marginTop: '8px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    textShadow: '2px 2px 6px #000000'
                }}>
                    {Math.floor(targetEnemy.hp)} / {targetEnemy.maxHp}
                </div>
            </div>
        </Html>
    );
}

export default TargetInfo;