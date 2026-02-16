// client/src/components/Minimap.js
import { useRef, useEffect } from 'react';
import useGameState from '../hooks/useGameState';

function Minimap() {
    const canvasRef = useRef(null);
    const playerPos = useGameState((state) => state.playerPos);
    const playerRotation = useGameState((state) => state.playerRotation);
    const renderRef = useRef(0);
    
    const visionRadius = 80;
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const isMobile = window.innerWidth < 768;
        const size = isMobile ? 160 : 220;
        canvas.width = size;
        canvas.height = size;

        const mapSize = 300;
        const scale = size / mapSize;

        const draw = () => {
            const state = useGameState.getState();
            const pos = state.playerPos;
            const rot = state.playerRotation;
            const enemies = Array.isArray(state.enemies) ? state.enemies : [];
            const obstacles = Array.isArray(state.obstacles) ? state.obstacles : [];
            const chests = Array.isArray(state.chests) ? state.chests : [];

            // 清空畫布
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, size, size);

            // 邊框
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = isMobile ? 4 : 6;
            ctx.strokeRect(0, 0, size, size);
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 2;
            ctx.strokeRect(4, 4, size - 8, size - 8);

            const playerX = (pos.x + mapSize / 2) * scale;
            const playerZ = (pos.z + mapSize / 2) * scale;
            const visionPx = visionRadius * scale;

            // 建立可見區域遮罩（霧氣視野）
            ctx.save();
            ctx.beginPath();
            ctx.arc(playerX, playerZ, visionPx, 0, Math.PI * 2);
            ctx.clip();

            // 繪製障礙物
            ctx.fillStyle = '#444444';
            obstacles.forEach((obs) => {
                const dist = pos.distanceTo(obs.position);
                if (dist < visionRadius + (obs.radius || 5)) {
                    const x = (obs.position.x + mapSize / 2) * scale;
                    const z = (obs.position.z + mapSize / 2) * scale;
                    const r = Math.max((obs.radius || 5) * scale, 4);
                    ctx.beginPath();
                    ctx.arc(x, z, r, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // 繪製寶箱
            ctx.fillStyle = '#ffff88';
            chests.forEach((chest) => {
                if (pos.distanceTo(chest.position) < visionRadius) {
                    const x = (chest.position.x + mapSize / 2) * scale;
                    const z = (chest.position.z + mapSize / 2) * scale;
                    ctx.fillRect(x - 4, z - 4, 8, 8);
                }
            });

            // 繪製普通怪物
            ctx.fillStyle = '#ff6666';
            enemies.filter((e) => e.type !== 'boss').forEach((enemy) => {
                if (pos.distanceTo(enemy.position) < visionRadius) {
                    const x = (enemy.position.x + mapSize / 2) * scale;
                    const z = (enemy.position.z + mapSize / 2) * scale;
                    ctx.beginPath();
                    ctx.arc(x, z, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // 繪製 Boss（特殊標記）
            ctx.fillStyle = '#ff00ff';
            enemies.filter((e) => e.type === 'boss').forEach((boss) => {
                if (pos.distanceTo(boss.position) < visionRadius) {
                    const x = (boss.position.x + mapSize / 2) * scale;
                    const z = (boss.position.z + mapSize / 2) * scale;

                    // 大圓
                    ctx.beginPath();
                    ctx.arc(x, z, 12, 0, Math.PI * 2);
                    ctx.fill();

                    // 脈動外圈
                    const pulse = Math.sin(performance.now() / 200) * 3 + 12;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(x, z, pulse, 0, Math.PI * 2);
                    ctx.stroke();

                    // BOSS 文字
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('BOSS', x, z + 4);
                    ctx.fillStyle = '#ff00ff';
                }
            });

            ctx.restore();
            ctx.restore(); // 恢復 clip

            // 霧氣漸層邊緣
            const gradient = ctx.createRadialGradient(playerX, playerZ, visionPx - 20, playerX, playerZ, visionPx);
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);

            // 繪製玩家（始終在中心）
            ctx.save();
            ctx.translate(playerX, playerZ);
            if (rot) {
                ctx.rotate(-rot.y - Math.PI);
            }
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(-8, 8);
            ctx.lineTo(8, 8);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();

            renderRef.current = requestAnimationFrame(draw);
        };

        draw();
        
        return () => {
            cancelAnimationFrame(renderRef.current);
        };
    }, [playerPos, playerRotation]);

    const isMobile = window.innerWidth < 768;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: isMobile ? 10 : 20,
                left: isMobile ? '50%' : 20,
                transform: isMobile ? 'translateX(-50%)' : 'none',
                width: isMobile ? '160px' : '220px',
                height: isMobile ? '160px' : '220px',
                border: isMobile ? '4px solid #888' : '6px solid #888',
                borderRadius: '15px',
                boxShadow: '0 0 30px rgba(0,0,0,0.8)',
                zIndex: 50,
                imageRendering: 'pixelated',
                touchAction: 'none'
            }}
        />
    );
}

export default Minimap;