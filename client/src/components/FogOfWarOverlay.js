// src/components/FogOfWarOverlay.js (新增迷霧系統組件)
import { useRef, useEffect } from 'react';
import useGameState from '../hooks/useGameState';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

function FogOfWarOverlay() {
    const canvasRef = useRef();
    const playerPos = useGameState((state) => state.playerPos);
    const { camera, gl } = useThree();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const ctx = canvas.getContext('2d');

        const drawFog = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 全黑迷霧
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 玩家視野揭示圓（半徑 150 單位，轉螢幕座標）
            const viewRadius = 150; // 視野範圍
            const worldPos = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
            const screenPos = worldPos.project(camera);

            const sx = (screenPos.x * 0.5 + 0.5) * canvas.width;
            const sy = (-screenPos.y * 0.5 + 0.5) * canvas.height;
            const radius = (viewRadius / camera.position.distanceTo(playerPos)) * canvas.height;

            // 徑向漸變透明
            const gradient = ctx.createRadialGradient(sx, sy, radius * 0.3, sx, sy, radius);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.7, 'rgba(0,0,0,0.3)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.8)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        drawFog();

        // 每幀更新迷霧
        const renderLoop = () => {
            drawFog();
            gl.render(gl.state.scene, camera); // 可選：確保同步
        };

        // 監聽玩家移動
        const interval = setInterval(drawFog, 100); // 每 100ms 更新一次（性能好）

        // 視窗大小變化
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawFog();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, [playerPos, camera, gl]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 50 // 在 UI 之上，但低於通知
            }}
        />
    );
}

export default FogOfWarOverlay;