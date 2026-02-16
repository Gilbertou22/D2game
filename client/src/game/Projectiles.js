// src/game/Projectiles.jsx
import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import useGameState from '../hooks/useGameState';
import { createParticles } from './Particles';

// ==========================================
// 1. 工具函數
// ==========================================
function getBezierPoint(t, p0, p1, p2, p3) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return p0.clone().multiplyScalar(uuu)
        .add(p1.clone().multiplyScalar(3 * uu * t))
        .add(p2.clone().multiplyScalar(3 * u * tt))
        .add(p3.clone().multiplyScalar(ttt));
}

// 預計算紋理，避免重複創建
function createTrailTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,100,0,0.5)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

const trailTexture = createTrailTexture();

// ==========================================
// 2. 投射物組件
// ==========================================
function Projectile({ proj, removeProjectile }) {
    const groupRef = useRef();
    const progress = useRef(0);
    
    // 火球動畫 refs
    const fireballCore = useRef();
    const fireballInner = useRef();
    const fireballOuter = useRef();
    const fireballGlow = useRef();

    // --- 高效能軌跡系統 (預分配記憶體) ---
    const MAX_TRAIL_COUNT = 30;
    const trailIndex = useRef(0);

    // 使用 useRef 保存持久化的數據，避免 useState 觸發重渲染
    const trailData = useRef({
        positions: new Float32Array(MAX_TRAIL_COUNT * 3),
        colors: new Float32Array(MAX_TRAIL_COUNT * 3),
        geometry: null // 將在 useMemo 中賦值
    });

    const trailMaterial = useMemo(() => new THREE.PointsMaterial({
        size: 1.2,
        map: trailTexture,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }), []);

    const trailGeometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        // 初始化空的 Buffer，後續只更新數據
        geo.setAttribute('position', new THREE.BufferAttribute(trailData.current.positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(trailData.current.colors, 3));
        geo.setDrawRange(0, 0); // 初始不繪製
        trailData.current.geometry = geo;
        return geo;
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        const dt = Math.min(delta, 0.1);
        const { enemies, updateEnemy } = useGameState.getState();

        // 1. 更新位置
        progress.current += dt * proj.speed * 1.5;
        let pos;
        if (proj.type === 'icebolt') {
            pos = proj.startPos.clone().lerp(proj.targetPos, progress.current);
        } else {
            pos = getBezierPoint(progress.current, proj.startPos, proj.control1, proj.control2, proj.targetPos);
        }

        // 2. 碰撞檢測（使用平方距離避免開方運算）
        const isFinished = progress.current >= 1;
        let hitEnemy = null;
        if (!isFinished) {
            for (let enemy of enemies) {
                // 使用平方距離比較（性能優化）
                const distSq = pos.distanceToSquared(enemy.position);
                const thresholdSq = enemy.type === 'boss' ? 25 : 6.25; // 5^2 = 25, 2.5^2 = 6.25
                if (distSq < thresholdSq) {
                    hitEnemy = enemy; break;
                }
            }
        }

        if (isFinished || hitEnemy) {
            const impactPos = hitEnemy ? hitEnemy.position.clone() : pos;
            handleExplosion(impactPos, proj.type, enemies, updateEnemy);
            removeProjectile(proj.id);
            return;
        }

        // 3. 更新網格
        groupRef.current.position.copy(pos);
        if (proj.type !== 'icebolt') {
            const nextPos = getBezierPoint(Math.min(progress.current + 0.01, 1), proj.startPos, proj.control1, proj.control2, proj.targetPos);
            groupRef.current.lookAt(nextPos);
        } else {
            groupRef.current.lookAt(pos.clone().add(new THREE.Vector3(0, -1, 0)));
        }

        // 4. 動畫
        const time = state.clock.elapsedTime;
        
        // 火球脈動動畫 (參考 fireball.html)
        if (proj.type === 'fireball') {
            const pulse = 1 + Math.sin(time * 15) * 0.15;
            const pulseFast = 1 + Math.sin(time * 20) * 0.1;
            
            if (fireballCore.current) {
                fireballCore.current.scale.setScalar(pulseFast);
            }
            if (fireballInner.current) {
                fireballInner.current.scale.setScalar(pulse);
            }
            if (fireballOuter.current) {
                fireballOuter.current.scale.setScalar(pulse * 1.1);
            }
            if (fireballGlow.current) {
                fireballGlow.current.scale.setScalar(pulse * 1.3);
            }
        }
        
        if (proj.type === 'icebolt' && groupRef.current.children[2]) {
            groupRef.current.children[2].rotation.y += dt * 4;
        }

        // 5. 更新軌跡 (高效能版：直接修改 Buffer)
        const idx = trailIndex.current % MAX_TRAIL_COUNT;
        const i3 = idx * 3;

        trailData.current.positions[i3] = pos.x;
        trailData.current.positions[i3 + 1] = pos.y;
        trailData.current.positions[i3 + 2] = pos.z;

        // 簡單顏色設定
        if (proj.type === 'fireball') {
            trailData.current.colors[i3] = 1;
            trailData.current.colors[i3 + 1] = 0.5;
            trailData.current.colors[i3 + 2] = 0.1;
        } else {
            trailData.current.colors[i3] = 0.6;
            trailData.current.colors[i3 + 1] = 0.9;
            trailData.current.colors[i3 + 2] = 1;
        }

        trailIndex.current++;

        // 更新繪製範圍
        const drawCount = Math.min(trailIndex.current, MAX_TRAIL_COUNT);
        trailGeometry.setDrawRange(0, drawCount);

        // 標記更新 (關鍵優化：只設 needsUpdate，不創建新對象)
        trailGeometry.attributes.position.needsUpdate = true;
        trailGeometry.attributes.color.needsUpdate = true;
    });

    const handleExplosion = (pos, type, enemies, updateEnemy) => {
        switch (type) {
            case 'fireball':
                // 參考 fireball.html - 多層爆炸效果
                createParticles(pos, 0xffff00, 20, 12, 2, 'fire_glow');      // 亮黃核心
                createParticles(pos, 0xff6600, 25, 10, 1.8, 'fire_core');     // 橙色核心
                createParticles(pos, 0xff4400, 30, 8, 1.5, 'fire_explosion'); // 紅色爆炸
                createParticles(pos, 0xff2200, 20, 6, 1.2, 'fire_sparks');   // 火花
                createParticles(pos, 0xaa1100, 15, 4, 0.8, 'fire_embers');    // 余燼
                // 延遲煙霧效果
                setTimeout(() => {
                    createParticles(pos.clone().add(new THREE.Vector3(0, 2, 0)), 0x331100, 15, 3, 2.5, 'smoke');
                }, 100);
                enemies.forEach(e => { if (pos.distanceTo(e.position) < 8) updateEnemy(e.id, { hp: e.hp - proj.damage }); });
                break;
            case 'icebolt':
                createParticles(pos, 0x88ddff, 30, 6, 1.2, 'ice_explosion');
                enemies.forEach(e => { if (pos.distanceTo(e.position) < 6) updateEnemy(e.id, { hp: e.hp - proj.damage }); });
                break;
            case 'chainlightning':
                createParticles(pos, 0xaaddff, 20, 10, 1.0, 'lightning_hit');
                enemies.forEach(e => { if (pos.distanceTo(e.position) < 8) updateEnemy(e.id, { hp: e.hp - proj.damage }); });
                break;
        }
    };

    const config = useMemo(() => {
        switch (proj.type) {
            case 'fireball': return { color: 0xff4400, lightColor: 0xff6633, intensity: 3 };
            case 'icebolt': return { color: 0x88ddff, lightColor: 0x44aaff, intensity: 2 };
            default: return { color: 0xffffff, lightColor: 0x6666ff, intensity: 5 };
        }
    }, [proj.type]);

    return (
        <group ref={groupRef} position={proj.startPos}>
            <pointLight color={config.lightColor} intensity={config.intensity} distance={12} decay={2} />

            {proj.type === 'fireball' && (
                <group>
                    {/* 核心 - 明亮白光 */}
                    <mesh ref={fireballCore}>
                        <sphereGeometry args={[0.35, 16, 16]} />
                        <meshBasicMaterial color={0xffffcc} />
                    </mesh>
                    {/* 內層火焰 - 橙色 */}
                    <mesh ref={fireballInner}>
                        <sphereGeometry args={[0.5, 16, 16]} />
                        <meshBasicMaterial color={0xff8833} transparent opacity={0.8} />
                    </mesh>
                    {/* 外層火焰 - 紅色 */}
                    <mesh ref={fireballOuter}>
                        <sphereGeometry args={[0.75, 16, 16]} />
                        <meshBasicMaterial color={config.color} transparent opacity={0.5} />
                    </mesh>
                    {/* 光暈效果 */}
                    <mesh ref={fireballGlow}>
                        <sphereGeometry args={[1.2, 12, 12]} />
                        <meshBasicMaterial color={0xff4400} transparent opacity={0.2} />
                    </mesh>
                </group>
            )}

            {proj.type === 'icebolt' && (
                <group>
                    <mesh>
                        <icosahedronGeometry args={[0.5, 1]} />
                        <meshStandardMaterial color={0x88ddff} emissive={0x00ddff} emissiveIntensity={2} transparent opacity={0.8} />
                    </mesh>
                    <group>{[...Array(4)].map((_, i) => (
                        <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 0.8, 0, Math.sin(i * Math.PI / 2) * 0.8]}>
                            <coneGeometry args={[0.2, 0.6, 4]} /><meshBasicMaterial color={0xaaddff} />
                        </mesh>
                    ))}</group>
                </group>
            )}

            {proj.type === 'chainlightning' && (
                <mesh>
                    <octahedronGeometry args={[0.4]} />
                    <meshBasicMaterial color={0xffffff} />
                </mesh>
            )}

            {/* 軌跡渲染 */}
            <points geometry={trailGeometry} material={trailMaterial} />
        </group>
    );
}

// ==========================================
// 3. 容器與工廠
// ==========================================
function Projectiles() {
    const projectiles = useGameState(state => state.projectiles || []);
    const removeProjectile = useGameState(state => state.removeProjectile);

    return (
        <>
            {projectiles.map((proj) => (
                <Projectile key={proj.id} proj={proj} removeProjectile={removeProjectile} />
            ))}
        </>
    );
}

export const createProjectile = (type, startPos, targetPos, customDamage = null) => {
    const midPoint = startPos.clone().lerp(targetPos, 0.5);
    const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        Math.random() * 10 + 5,
        (Math.random() - 0.5) * 20
    );
    const control1 = midPoint.clone().add(offset);
    const control2 = midPoint.clone().add(offset.clone().negate());

    const projectileData = {
        type,
        startPos: startPos.clone(),
        targetPos: targetPos.clone(),
        control1, control2,
        speed: type === 'chainlightning' ? 1.5 : type === 'icebolt' ? 0.8 : 1.0,
        damage: customDamage || (type === 'chainlightning' ? 60 : 40),
        id: Math.random().toString(36).substr(2, 9)
    };

    useGameState.getState().addProjectile(projectileData);
};

export default Projectiles;