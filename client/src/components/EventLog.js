// src/components/EventLog.js (添加時間戳與圖示版)
import { useEffect, useRef } from 'react';
import useGameState from '../hooks/useGameState';

function EventLog() {
    const eventLog = useGameState((state) => state.eventLog);
    const logRef = useRef();

    // 自動滾動到底部
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [eventLog]);

    if (eventLog.length === 0) return null;

    // 事件圖示映射
    const icons = {
        kill: '💀',      // 擊殺怪物
        boss_kill: '👹', // BOSS 擊敗
        drop_potion: '🧪',
        drop_equip: '⚔️',
        drop_gold: '💰',
        level_up: '⬆️',
        default: '📜'
    };

    return (
        <div
            ref={logRef}
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                width: '320px',
                maxHeight: '200px',
                background: 'rgba(0,0,0,0.75)',
                borderRadius: '16px',
                padding: '20px',
                color: '#ffffff',
                fontSize: '16px',
                zIndex: 100,
                overflowY: 'auto',
                boxShadow: '0 0 30px rgba(0,0,0,0.9)',
                pointerEvents: 'none',
                fontFamily: 'monospace'
            }}
        >
            <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#ffdd00', fontSize: '10px' }}>
                📜 事件記錄
            </div>
            {eventLog.slice(-20).map((event, idx) => {
                const time = new Date(event.time).toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                const icon = icons[event.type] || icons.default;

                return (
                    <div
                        key={idx}
                        style={{
                            marginBottom: '10px',
                            opacity: 0.95,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: event.color || '#ffffff',
                            animation: 'fadeIn 0.6s ease-out'
                        }}
                    >
                        <span style={{ fontSize: '10px' }}>{icon}</span>
                        <span style={{ color: '#888888', minWidth: '70px' }}>[{time}]</span>
                        <span>{event.message}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default EventLog;