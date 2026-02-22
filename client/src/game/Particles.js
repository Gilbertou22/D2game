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

    // --- 擊中效果 ---
    hit_impact: { geo: new THREE.RingGeometry(0.3, 1, 8), scale: 1.5 },
    hit_flash: { geo: new THREE.SphereGeometry(1, 8, 8), scale: 1.0 },
    hit_sparks: { geo: new THREE.TetrahedronGeometry(1, 0), scale: 0.5 },
    hit_ring: { geo: new THREE.RingGeometry(0.5, 1.5, 12), scale: 1.2 },
    hit_burst: { geo: new THREE.OctahedronGeometry(1, 0), scale: 0.8 },
    
    // --- 暴擊效果 ---
    crit_explosion: { geo: new THREE.OctahedronGeometry(1, 0), scale: 1.5 },
    crit_sparks: { geo: new THREE.TetrahedronGeometry(1, 0), scale: 0.8 },
    crit_flash: { geo: new THREE.SphereGeometry(1, 12, 12), scale: 1.2 },
    crit_ring: { geo: new THREE.RingGeometry(0.8, 2, 16), scale: 1.5 },
    crit_star: { geo: new THREE.OctahedronGeometry(1, 0), scale: 1.0 },

    // --- 死亡效果 ---
    death_explosion: { geo: new THREE.SphereGeometry(1, 8, 8), scale: 1.2 },
    death_smoke: { geo: new THREE.SphereGeometry(1, 6, 6), scale: 2.5 },
    death_soul: { geo: new THREE.SphereGeometry(1, 8, 8), scale: 1.0 },
    death_debris: { geo: new THREE.BoxGeometry(1, 1, 1), scale: 0.6 },
    death_flash: { geo: new THREE.SphereGeometry(1, 12, 12), scale: 2.0 },
    death_ring: { geo: new THREE.RingGeometry(1, 3, 16), scale: 1.5 },
    
    // --- 元素擊中 ---
    fire_hit: { geo: new THREE.OctahedronGeometry(1, 0), scale: 1.0 },
    ice_hit: { geo: new THREE.TetrahedronGeometry(1, 0), scale: 0.9 },
    lightning_hit: { geo: new THREE.TetrahedronGeometry(1, 0), scale: 0.8 },
    poison_hit: { geo: new THREE.SphereGeometry(1, 6, 6), scale: 0.7 },
    arcane_hit: { geo: new THREE.OctahedronGeometry(1, 0), scale: 1.1 },
    nature_hit: { geo: new THREE.SphereGeometry(1, 8, 8), scale: 0.9 },
};

const getParticleConfig = (type) => PARTICLE_CONFIG[type] || PARTICLE_CONFIG.default;

// ==========================================
// 2. 渲染器組件 (高效能核心)
// ==========================================
function ParticleRenderer({ particles, geometry }) {
    const meshRef = useRef();
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);
    const maxCount = 800;
    const frameCount = useRef(0);

    useFrame((state) => {
        frameCount.current++;
        if (!meshRef.current) return;
        
        if (frameCount.current % 2 !== 0) return;

        let instanceIndex = 0;
        const count = Math.min(particles.length, maxCount);

        for (let i = 0; i < count; i++) {
            const p = particles[i];
            const config = getParticleConfig(p.type);
            
            if (instanceIndex >= maxCount) break;

            tempObject.position.set(p.position.x, p.position.y, p.position.z);

            const lifeRatio = Math.max(0, p.lifetime / p.maxLifetime);
            const scale = p.size * config.scale * lifeRatio;
            tempObject.scale.set(scale, scale, scale);

            if (p.type.includes('flash') || p.type.includes('trail') || p.type.includes('heal_wave')) {
                tempObject.quaternion.copy(state.camera.quaternion);
            } else {
                tempObject.rotation.set(p.rotation.x, p.rotation.y, p.rotation.z);
            }

            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(instanceIndex, tempObject.matrix);

            tempColor.setHex(p.color);
            meshRef.current.setColorAt(instanceIndex, tempColor);

            instanceIndex++;
        }

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
    
    const particlesByGeometry = useMemo(() => {
        const grouped = new Map();
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const config = getParticleConfig(p.type);
            const geo = config.geo;
            if (!grouped.has(geo)) grouped.set(geo, []);
            grouped.get(geo).push(p);
        }
        return grouped;
    }, [particles]);

    const uniqueGeometries = useMemo(() => {
        const geos = new Set();
        Object.values(PARTICLE_CONFIG).forEach(c => geos.add(c.geo));
        return Array.from(geos);
    }, []);

    useFrame((state, delta) => {
        frameCount.current++;
        
        if (frameCount.current % 2 !== 0) return;
        
        const toRemove = [];

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            p.lifetime -= delta;
            if (p.lifetime <= 0) {
                toRemove.push(p.id);
                continue;
            }

            p.velocity.y += p.gravity * delta;
            p.position.x += p.velocity.x * delta;
            p.position.y += p.velocity.y * delta;
            p.position.z += p.velocity.z * delta;

            if (p.rotationSpeed) {
                p.rotation.x += p.rotationSpeed.x * delta;
                p.rotation.y += p.rotationSpeed.y * delta;
            }
        }

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
// 4. 創建粒子的工廠函數 (優化版：批量添加，預分配對象)
// ==========================================
const MAX_TOTAL_PARTICLES = 600;

const _tempVel = new THREE.Vector3();
const _tempPos = new THREE.Vector3();

export const createParticles = (position, color, count, speed, size, type) => {
    const state = useGameState.getState();
    const particles = state.particles || [];
    
    // Debug: log ALL particle creation
    //console.log('Creating particles:', type, 'at', position, 'count:', count, 'currentTotal:', particles.length);
    
    const currentCount = particles.length;
    if (currentCount >= MAX_TOTAL_PARTICLES) return;
    
    const actualCount = Math.min(count, MAX_TOTAL_PARTICLES - currentCount);
    const newParticles = [];
    const now = Date.now();
    
    for (let i = 0; i < actualCount; i++) {
        let lifetime = 1.0;
        let particleSize = size;
        let gravity = -9.8;
        let vx, vy, vz;
        const rand = Math.random;

        if (type.includes('fire')) {
            gravity = -2.0;
            const angle = rand() * Math.PI * 2;
            const r = rand();
            vx = Math.cos(angle) * speed * r;
            vy = rand() * speed;
            vz = Math.sin(angle) * speed * r;
            lifetime = 0.5 + rand() * 0.5;
        } else if (type.includes('ice') || type.includes('frost')) {
            gravity = -1.5;
            const angle = rand() * Math.PI * 2;
            const r = rand();
            vx = Math.cos(angle) * speed * r;
            vy = rand() * speed * 0.5;
            vz = Math.sin(angle) * speed * r;
            lifetime = 0.8 + rand() * 0.6;
        } else if (type.includes('lightning')) {
            gravity = 0;
            vx = (rand() - 0.5) * speed * 2;
            vy = (rand() - 0.5) * speed;
            vz = (rand() - 0.5) * speed * 2;
            lifetime = 0.2 + rand() * 0.3;
        } else if (type.includes('heal')) {
            gravity = 0.5;
            vx = (rand() - 0.5) * speed;
            vy = rand() * speed;
            vz = (rand() - 0.5) * speed;
            lifetime = 1.0 + rand() * 0.5;
        } else if (type.includes('smoke')) {
            gravity = 1.0;
            vx = (rand() - 0.5) * speed * 0.5;
            vy = speed * 0.8;
            vz = (rand() - 0.5) * speed * 0.5;
            lifetime = 1.5 + rand() * 1.0;
            particleSize = size * 1.5;
        } else if (type.includes('meteor')) {
            gravity = -3.0;
            const angle = rand() * Math.PI * 2;
            const r = rand();
            vx = Math.cos(angle) * speed * r;
            vy = rand() * speed * 0.8;
            vz = Math.sin(angle) * speed * r;
            lifetime = 0.6 + rand() * 0.5;
        } else if (type.includes('hit')) {
            gravity = -5.0;
            const angle = rand() * Math.PI * 2;
            const r = rand();
            vx = Math.cos(angle) * speed * r;
            vy = rand() * speed * 0.8 + speed * 0.3;
            vz = Math.sin(angle) * speed * r;
            lifetime = 0.3 + rand() * 0.4;
            particleSize = size * (0.8 + rand() * 0.4);
        } else if (type.includes('crit')) {
            gravity = -8.0;
            const angle = rand() * Math.PI * 2;
            const r = rand() * 0.8 + 0.5;
            vx = Math.cos(angle) * speed * r;
            vy = rand() * speed * 1.2 + speed * 0.5;
            vz = Math.sin(angle) * speed * r;
            lifetime = 0.4 + rand() * 0.5;
            particleSize = size * (1.0 + rand() * 0.5);
        } else if (type.includes('death')) {
            gravity = -2.0;
            const angle = rand() * Math.PI * 2;
            const r = rand();
            if (type.includes('soul')) {
                gravity = 1.5;
                vx = (rand() - 0.5) * speed * 0.3;
                vy = speed * 1.5;
                vz = (rand() - 0.5) * speed * 0.3;
                lifetime = 1.5 + rand() * 1.0;
                particleSize = size * 0.8;
            } else if (type.includes('debris')) {
                gravity = -15.0;
                vx = Math.cos(angle) * speed * r;
                vy = rand() * speed * 1.5;
                vz = Math.sin(angle) * speed * r;
                lifetime = 0.6 + rand() * 0.4;
                particleSize = size * (0.5 + rand() * 0.5);
            } else if (type.includes('ring')) {
                gravity = 0;
                vx = Math.cos(angle) * speed * r;
                vy = 0;
                vz = Math.sin(angle) * speed * r;
                lifetime = 0.5 + rand() * 0.3;
                particleSize = size * 1.2;
            } else {
                vx = Math.cos(angle) * speed * r;
                vy = rand() * speed * 0.8;
                vz = Math.sin(angle) * speed * r;
                lifetime = 0.8 + rand() * 0.6;
            }
        } else {
            const angle = rand() * Math.PI * 2;
            vx = Math.cos(angle) * speed;
            vy = rand() * speed * 0.5;
            vz = Math.sin(angle) * speed;
        }

        newParticles.push({
            id: `${type}-${now}-${i}`,
            position: { x: position.x, y: position.y, z: position.z },
            velocity: { x: vx, y: vy, z: vz },
            color,
            size: particleSize,
            lifetime,
            maxLifetime: lifetime,
            type,
            gravity,
            rotation: { x: rand() * Math.PI, y: rand() * Math.PI, z: 0 },
            rotationSpeed: { x: (rand() - 0.5) * 5, y: (rand() - 0.5) * 5, z: 0 }
        });
    }
    
    if (newParticles.length > 0) {
        useGameState.setState({ particles: [...particles, ...newParticles] });
    }
};

export default ParticleSystem;