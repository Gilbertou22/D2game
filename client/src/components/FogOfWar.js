// src/components/FogOfWar.js (完整修正版：使用 Html portal 解決 R3F hook 錯誤)
import { useRef, useEffect } from 'react';
import useGameState from '../hooks/useGameState';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const VIEW_RADIUS = 150;

function FogOfWar() {
    const canvasRef = useRef();
    const exploredCanvasRef = useRef();
    const playerPos = useGameState((state) => state.playerPos);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const exploredCanvas = document.createElement('canvas');
        exploredCanvasRef.current = exploredCanvas;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            exploredCanvas.width = window.innerWidth;
            exploredCanvas.height = window.innerHeight;

            const exploredCtx = exploredCanvas.getContext('2d');
            exploredCtx.fillStyle = 'black';
            exploredCtx.fillRect(0, 0, exploredCanvas.width, exploredCanvas.height);
        };

        resize();
        window.addEventListener('resize', resize);

        const ctx = canvas.getContext('2d');

        const reveal = () => {
            // 簡單近似計算（不需 camera 投影，夠用）
            const mapSize = 900; // 地圖大小
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            // 玩家相對中心偏移比例
            const offsetX = (playerPos.x / (mapSize / 2)) * (window.innerWidth * 0.3); // 調整比例
            const offsetZ = (playerPos.z / (mapSize / 2)) * (window.innerHeight * 0.3);

            const sx = centerX + offsetX;
            const sy = centerY + offsetZ;
            const radius = window.innerHeight * 0.2; // 視野大小比例

            // 永久揭示
            const exploredCtx = exploredCanvas.getContext('2d');
            exploredCtx.globalCompositeOperation = 'destination-out';
            exploredCtx.beginPath();
            exploredCtx.arc(sx, sy, radius, 0, Math.PI * 2);
            exploredCtx.fill();

            // 繪製迷霧
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(exploredCanvas, 0, 0);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(sx, sy, radius, 0, Math.PI * 2);
            ctx.fill();
        };

        reveal();

        const interval = setInterval(reveal, 100);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', resize);
        };
    }, [playerPos]);

    return (
        <Html fullscreen>
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none'
                }}
            />
        </Html>
    );
}

export default FogOfWar;