// src/game/Particles.jsx
import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import useGameState from '../hooks/useGameState';

// ==========================================
// 1. 配置表：定義所有粒子的外觀
// ==========================================
const PARTICLE_CONFIG = {
    // 預設
    default: { geo: new THREE.SphereGeometry(1, 8, 8), scale: 1.0 },

    // --- 火系 ---
    fire_explosion: { geo: new THREE.BoxGeometry(1, 1, 1), scale: 1.0 },
    fire_core: { geo: new THREE.BoxGeometry(1, 1, 1), scale: 0.8 },
    fire_sparks: { geo: new THREE.OctahedronGeometry(1, 0), scale: 0.6 },
    fire_cast: { geo: new THREE.SphereGeometry(1, 8, 8), scale: 1.2 },
    trail: { geo: new THREE.PlaneGeometry(1.5, 1.5), scale: 1.0 },
    fire_glow: { geo: new THREE.SphereGeometry(1, 8, 8), scale: 1.2 },
    fire_embers: { geo: new THREE.OctahedronGeometry(1, 0), scale: 0.4 },
    smoke: { geo: new THREE.SphereGeometry(1, 6, 6), scale: 2.0 },
    
    // --- 隕石術 ---
    meteor_trail: { geo: new THREE.SphereGeometry(1, 6, 6), scale: 0.6 },
    meteor_explosion: { geo: new THREE.OctahedronGeometry(1, 0), scale: 1.2 },
    meteor_core: { geo: new THREE.SphereGeometry(1, 8, 8), scale: 1.0 },
    meteor_sparks: { geo: new THREE.TetrahedronGeometry(1, 0), scale: 0.5 },
    meteor_smoke: { geo: new THREE.SphereGeometry(1, 6, 6), scale: 2.5 },

    // --- 冰系 ---
    ice_explosion: { geo: new THREE.OctahedronGeometry(1, 0), scale: 1.0 },
    ice_shard: { geo: new THREE.ConeGeometry(0.6, 1.5, 4), scale: 1.0 },
    ice_cast: { geo: new THREE.OctahedronGeometry(1, 0), scale: 1.2 },
    ice_mist: { geo: new THREE.SphereGeometry(1, 8, 8), scale: 1.5 },

    // --- 閃電系 ---
    lightning_hit: { geo: new THREE.TetrahedronGeometry(1, 0), scale: 1.0 },
    lightning_spark: { geo: new THREE.TetrahedronGeometry(1, 0), scale: 0.8 },
    lightning_cast: { geo: new THREE.TetrahedronGeometry(1, 0), scale: 1.2 },

    // --- 輔助 ---
    heal_wave: { geo: new THREE.RingGeometry(0.5, 1, 6), scale: 1.5 },
    heal_sparkle: { geo: new THREE.SphereGeometry(1, 6, 6), scale: 0.8 },
    cast_flash: { geo: new THREE.SphereGeometry(1, 8, 8), scale: 0.8 },
    nova_center: { geo: new THREE.SphereGeometry(1, 16, 16), scale: 2.0 },
};

const getParticleConfig = (type) => PARTICLE_CONFIG[type] || PARTICLE_CONFIG.default;

// ==========================================
// 2. 渲染器組件 (高效能核心)
// ==========================================
function ParticleRenderer({ particles, geometry }) {
    const meshRef = useRef();
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);
    const maxCount = 500; // 降低最大數量限制
    const frameCount = useRef(0);

    useFrame((state) => {
        frameCount.current++;
        if (!meshRef.current) return;
        
        // 限制更新頻率：每2幀更新一次（30fps）
        if (frameCount.current % 2 !== 0) return;

        let instanceIndex = 0;
        const count = Math.min(particles.length, maxCount);

        for (let i = 0; i < count; i++) {
            const p = particles[i];
            const config = getParticleConfig(p.type);
            
            if (instanceIndex >= maxCount) break;

            // 位置
            tempObject.position.set(p.position.x, p.position.y, p.position.z);

            // 縮放 (根據生命週期衰減)
            const lifeRatio = Math.max(0, p.lifetime / p.maxLifetime);
            const scale = p.size * config.scale * lifeRatio;
            tempObject.scale.set(scale, scale, scale);

            // 旋轉 (面對相機或自旋)
            if (p.type.includes('flash') || p.type.includes('trail') || p.type.includes('heal_wave')) {
                // Billboard 效果
                tempObject.quaternion.copy(state.camera.quaternion);
            } else {
                tempObject.rotation.set(p.rotation.x, p.rotation.y, p.rotation.z);
            }

            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(instanceIndex, tempObject.matrix);

            // 顏色
            tempColor.setHex(p.color);
            meshRef.current.setColorAt(instanceIndex, tempColor);

            instanceIndex++;
        }

        // 更新繪製數量
        if (meshRef.current.count !== instanceIndex) {
            meshRef.current.count = instanceIndex;
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[geometry, undefined, maxCount]} frustumCulled={false}>
            <meshStandardMaterial
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                roughness={0.2}
                metalness={0.8}
            />
        </instancedMesh>
    );
}

// ==========================================
// 3. 粒子系統主控制器
// ==========================================
function ParticleSystem() {
    const particles = useGameState(state => state.particles || []);
    const removeParticles = useGameState(state => state.removeParticles);
    const frameCount = useRef(0);
    
    // 性能優化：將粒子按幾何體類型分組，避免每幀重複計算
    const particlesByGeometry = useMemo(() => {
        const grouped = new Map();
        particles.forEach(p => {
            const config = getParticleConfig(p.type);
            const geo = config.geo;
            if (!grouped.has(geo)) {
                grouped.set(geo, []);
            }
            grouped.get(geo).push(p);
        });
        return grouped;
    }, [particles]);

    // 獲取所有唯一的幾何體
    const uniqueGeometries = useMemo(() => {
        const geos = new Set();
        Object.values(PARTICLE_CONFIG).forEach(c => geos.add(c.geo));
        return Array.from(geos);
    }, []);

    useFrame((state, delta) => {
        frameCount.current++;
        
        // 限制更新頻率：每2幀更新一次物理（30fps）
        if (frameCount.current % 2 !== 0) return;
        
        const toRemove = [];

        // 物理更新循環
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            p.lifetime -= delta;
            if (p.lifetime <= 0) {
                toRemove.push(p.id);
                continue;
            }

            // 速度更新
            p.velocity.y += p.gravity * delta;
            p.position.x += p.velocity.x * delta;
            p.position.y += p.velocity.y * delta;
            p.position.z += p.velocity.z * delta;

            // 旋轉更新
            if (p.rotationSpeed) {
                p.rotation.x += p.rotationSpeed.x * delta;
                p.rotation.y += p.rotationSpeed.y * delta;
            }
        }

        // 批次移除（每5幀執行一次以提升性能）
        if (toRemove.length > 0 && frameCount.current % 5 === 0) {
            removeParticles(toRemove);
        }
    });

    return (
        <>
            {uniqueGeometries.map((geo, index) => (
                <ParticleRenderer
                    key={index}
                    particles={particlesByGeometry.get(geo) || []}
                    geometry={geo}
                />
            ))}
        </>
    );
}

// ==========================================
// 4. 創建粒子的工廠函數
// ==========================================
// 最大粒子數量限制
const MAX_TOTAL_PARTICLES = 200;

export const createParticles = (position, color, count, speed, size, type) => {
    const { addParticle, particles } = useGameState.getState();
    
    // 檢查當前粒子總數，如果超過限制則不創建新粒子
    const currentCount = particles?.length || 0;
    if (currentCount >= MAX_TOTAL_PARTICLES) {
        return; // 跳過創建以避免性能問題
    }
    
    // 限制本次創建數量
    const actualCount = Math.min(count, MAX_TOTAL_PARTICLES - currentCount);

    for (let i = 0; i < actualCount; i++) {
        let velocity, lifetime = 1.0, particleSize = size;
        let gravity = -9.8;

        // 根據類型定義行為
        if (type.includes('fire')) {
            gravity = -2.0;
            const angle = Math.random() * Math.PI * 2;
            velocity = new THREE.Vector3(
                Math.cos(angle) * speed * Math.random(),
                Math.random() * speed,
                Math.sin(angle) * speed * Math.random()
            );
            lifetime = 0.5 + Math.random() * 0.5;
        } else if (type.includes('ice') || type.includes('frost')) {
            gravity = -1.5; // 冰系輕重力，有飄浮感
            const angle = Math.random() * Math.PI * 2;
            velocity = new THREE.Vector3(
                Math.cos(angle) * speed * Math.random(),
                Math.random() * speed * 0.5,
                Math.sin(angle) * speed * Math.random()
            );
            lifetime = 0.8 + Math.random() * 0.6;
        } else if (type.includes('lightning')) {
            gravity = 0; // 電光懸浮
            velocity = new THREE.Vector3(
                (Math.random() - 0.5) * speed * 2,
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed * 2
            );
            lifetime = 0.2 + Math.random() * 0.3;
        } else if (type.includes('heal')) {
            gravity = 0.5; // 治療向上飄
            velocity = new THREE.Vector3(
                (Math.random() - 0.5) * speed,
                Math.random() * speed,
                (Math.random() - 0.5) * speed
            );
            lifetime = 1.0 + Math.random() * 0.5;
        } else if (type.includes('smoke')) {
            gravity = 1.0; // 煙霧上升
            velocity = new THREE.Vector3(
                (Math.random() - 0.5) * speed * 0.5,
                speed * 0.8,
                (Math.random() - 0.5) * speed * 0.5
            );
            lifetime = 1.5 + Math.random() * 1.0;
            particleSize = size * 1.5;
        } else if (type.includes('meteor')) {
            gravity = -3.0; // 較輕重力
            const angle = Math.random() * Math.PI * 2;
            velocity = new THREE.Vector3(
                Math.cos(angle) * speed * Math.random(),
                Math.random() * speed * 0.8,
                Math.sin(angle) * speed * Math.random()
            );
            lifetime = 0.6 + Math.random() * 0.5;
            particleSize = size;
        } else {
            // 預設
            const angle = Math.random() * Math.PI * 2;
            velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.random() * speed * 0.5,
                Math.sin(angle) * speed
            );
        }

        addParticle({
            id: `${type}-${Date.now()}-${i}-${Math.random()}`,
            position: position.clone(),
            velocity,
            color,
            size: particleSize,
            lifetime,
            maxLifetime: lifetime,
            type,
            gravity,
            rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
            rotationSpeed: new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, 0)
        });
    }
};

export default ParticleSystem;