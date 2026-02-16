// src/game/SkillEffects.jsx
import * as THREE from 'three';
import { createParticles } from './Particles';

// ------------------------------------------
// 閃電生成工具
// ------------------------------------------
function createLightningPath(start, end, segments, offset) {
    const points = [start.clone()];
    const direction = end.clone().sub(start);
    const length = direction.length();
    direction.normalize();
    for (let i = 1; i <= segments; i++) {
        const t = i / (segments + 1);
        const point = start.clone().add(direction.clone().multiplyScalar(length * t));
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        point.add(perpendicular.multiplyScalar((Math.random() - 0.5) * offset));
        point.y += (Math.random() - 0.5) * offset * 0.5;
        points.push(point);
    }
    points.push(end.clone());
    return points;
}

// ------------------------------------------
// 冰材料 (參考 ice spell.html)
// ------------------------------------------
const iceCoreMaterial = new THREE.MeshStandardMaterial({
    color: 0x88ddff,
    emissive: 0x4488cc,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.9,
    roughness: 0.1,
    metalness: 0.2,
});

const iceShardMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaddff,
    emissive: 0x66aacc,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.8,
    roughness: 0.2,
    metalness: 0.3,
});

// ------------------------------------------
// 創建冰核心 (參考 ice spell.html)
// ------------------------------------------
function createIceCore() {
    const group = new THREE.Group();

    // 主要球體
    const coreGeo = new THREE.IcosahedronGeometry(0.5, 2);
    const core = new THREE.Mesh(coreGeo, iceCoreMaterial.clone());
    group.add(core);

    // 內層發光
    const glowGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    // 外層發光
    const outerGlowGeo = new THREE.SphereGeometry(0.9, 16, 16);
    const outerGlowMat = new THREE.MeshBasicMaterial({
        color: 0x66aaee,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    group.add(outerGlow);

    // 冰刺
    for (let i = 0; i < 8; i++) {
        const spikeGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
        const spike = new THREE.Mesh(spikeGeo, iceShardMaterial.clone());
        const theta = (i / 8) * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        spike.position.setFromSpherical(new THREE.Spherical(0.5, phi, theta));
        spike.lookAt(0, 0, 0);
        spike.rotateX(Math.PI);
        group.add(spike);
    }

    return group;
}

// ------------------------------------------
// 創建冰碎片 (參考 ice spell.html)
// ------------------------------------------
function createIceShardMesh(size = 0.3) {
    const group = new THREE.Group();

    // 主要碎片
    const shardGeo = new THREE.ConeGeometry(size * 0.3, size * 1.5, 4);
    const shard = new THREE.Mesh(shardGeo, iceShardMaterial.clone());
    group.add(shard);

    // 尾跡
    const trailGeo = new THREE.ConeGeometry(size * 0.15, size * 0.8, 4);
    const trail = new THREE.Mesh(
        trailGeo,
        new THREE.MeshBasicMaterial({
            color: 0x88ddff,
            transparent: true,
            opacity: 0.4,
        }),
    );
    trail.position.y = -size * 0.8;
    trail.rotation.x = Math.PI;
    group.add(trail);

    return group;
}

// ------------------------------------------
// 創建火焰紋理
// ------------------------------------------
function createFireTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 200, 50, 0.9)');
    gradient.addColorStop(0.5, 'rgba(255, 100, 20, 0.6)');
    gradient.addColorStop(0.8, 'rgba(150, 30, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    return new THREE.CanvasTexture(canvas);
}

// ------------------------------------------
// 火球特效 (參考 fireball.html)
// ------------------------------------------
export class FireballEffect {
    constructor(startPos, targetPos, damage) {
        this.damage = damage;
        this.life = 4;
        this.time = 0;
        
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        // 計算速度
        const direction = targetPos.clone().sub(startPos).normalize();
        this.velocity = direction.multiplyScalar(18);
        
        // 核心光源
        this.light = new THREE.PointLight(0xff6633, 5, 15);
        this.group.add(this.light);
        
        // 核心網格 (亮黃色)
        const coreGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffcc,
            transparent: true,
            opacity: 0.9
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.group.add(this.core);
        
        // 外層發光 (橙色)
        const glowGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xff8833,
            transparent: true,
            opacity: 0.6
        });
        this.glow = new THREE.Mesh(glowGeo, glowMat);
        this.group.add(this.glow);
        
        // 粒子系統
        this.trailParticles = [];
        this.sparkParticles = [];
        
        // 創建粒子材質
        this.fireTexture = createFireTexture();
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        // 移動
        this.group.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // 脈衝效果
        const pulse = 1 + Math.sin(this.time * 15) * 0.15;
        this.core.scale.setScalar(pulse);
        this.glow.scale.setScalar(pulse * 1.3);
        this.light.intensity = 5 + Math.sin(this.time * 20) * 2;
        
        // 發射軌跡粒子
        this.emitTrail();
        this.emitSparks();
        
        // 更新粒子
        this.updateParticles(delta);
        
        return this.life > 0;
    }
    
    emitTrail() {
        const count = 3;
        for (let i = 0; i < count; i++) {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            
            this.trailParticles.push({
                position: this.group.position.clone().add(offset),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2 - this.velocity.x * 0.1,
                    Math.random() * 2,
                    (Math.random() - 0.5) * 2 - this.velocity.z * 0.1
                ),
                life: 0.5 + Math.random() * 0.3,
                maxLife: 0.8,
                size: 0.8 + Math.random() * 0.4,
                color: new THREE.Color(1, 0.3 + Math.random() * 0.5, 0.1)
            });
        }
    }
    
    emitSparks() {
        if (Math.random() > 0.4) return;
        
        const count = 2;
        for (let i = 0; i < count; i++) {
            this.sparkParticles.push({
                position: this.group.position.clone(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 8,
                    Math.random() * 4,
                    (Math.random() - 0.5) * 8
                ),
                life: 0.3 + Math.random() * 0.3,
                maxLife: 0.6,
                color: new THREE.Color(1, 0.9, 0.5)
            });
        }
    }
    
    updateParticles(delta) {
        // 更新軌跡粒子
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const p = this.trailParticles[i];
            p.life -= delta;
            
            if (p.life <= 0) {
                this.trailParticles.splice(i, 1);
                continue;
            }
            
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            p.velocity.y -= 3 * delta;
            p.velocity.multiplyScalar(0.98);
        }
        
        // 更新火花
        for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
            const p = this.sparkParticles[i];
            p.life -= delta;
            
            if (p.life <= 0) {
                this.sparkParticles.splice(i, 1);
                continue;
            }
            
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            p.velocity.y -= 15 * delta;
        }
    }
    
    getParticles() {
        return {
            trail: this.trailParticles,
            sparks: this.sparkParticles
        };
    }
    
    explode() {
        // 創建爆炸
        return {
            position: this.group.position.clone(),
            type: 'fireball',
            particles: [],
            lights: []
        };
    }
    
    dispose() {
        if (this.core.geometry) this.core.geometry.dispose();
        if (this.core.material) this.core.material.dispose();
        if (this.glow.geometry) this.glow.geometry.dispose();
        if (this.glow.material) this.glow.material.dispose();
        if (this.fireTexture) this.fireTexture.dispose();
    }
}

// ------------------------------------------
// 火焰爆炸特效 (參考 fireball.html)
// ------------------------------------------
export class FireExplosion {
    constructor(position, type = 'fireball') {
        this.position = position.clone();
        this.type = type;
        this.life = type === 'meteor' ? 2 : 1.2;
        this.maxLife = this.life;
        this.time = 0;
        
        this.particles = [];
        this.lights = [];
        
        // 閃光光源
        const flash = new THREE.PointLight(0xffaa00, type === 'meteor' ? 20 : 10, type === 'meteor' ? 30 : 15);
        flash.position.copy(position);
        this.lights.push(flash);
        
        // 核心爆炸粒子
        const count = type === 'meteor' ? 150 : 80;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const upAngle = (Math.random() - 0.3) * Math.PI;
            const speed = (type === 'meteor' ? 8 : 5) + Math.random() * (type === 'meteor' ? 12 : 8);
            
            this.particles.push({
                position: position.clone(),
                velocity: new THREE.Vector3(
                    Math.cos(angle) * Math.cos(upAngle) * speed,
                    Math.sin(upAngle) * speed * 1.5,
                    Math.sin(angle) * Math.cos(upAngle) * speed
                ),
                life: 0.5 + Math.random() * 0.8,
                maxLife: 1.3,
                size: (type === 'meteor' ? 1.5 : 0.8) + Math.random() * 0.8,
                type: 'fire',
                color: new THREE.Color(1, 0.3 + Math.random() * 0.5, 0.1)
            });
        }
        
        // 煙霧粒子
        const smokeCount = type === 'meteor' ? 40 : 25;
        for (let i = 0; i < smokeCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            
            this.particles.push({
                position: position.clone(),
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    2 + Math.random() * 3,
                    Math.sin(angle) * speed
                ),
                life: 1 + Math.random() * 1,
                maxLife: 2,
                size: 2 + Math.random() * 2,
                type: 'smoke',
                color: new THREE.Color(0.3, 0.15, 0.1)
            });
        }
        
        // 碎片
        const debrisCount = type === 'meteor' ? 20 : 12;
        for (let i = 0; i < debrisCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 10;
            
            this.particles.push({
                position: position.clone(),
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    5 + Math.random() * 8,
                    Math.sin(angle) * speed
                ),
                life: 0.8 + Math.random() * 0.5,
                maxLife: 1.3,
                size: 0.3,
                type: 'debris',
                color: new THREE.Color(0.8, 0.4, 0.1)
            });
        }
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        if (this.life <= 0) {
            return false;
        }
        
        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            
            if (p.type !== 'smoke') {
                p.velocity.y -= 12 * delta;
            } else {
                p.velocity.y += 1 * delta;
                p.velocity.multiplyScalar(0.98);
            }
            
            // 地面彈跳
            if (p.type === 'debris' && p.position.y < -1.8) {
                p.position.y = -1.8;
                p.velocity.y *= -0.4;
                p.velocity.x *= 0.7;
                p.velocity.z *= 0.7;
            }
        }
        
        // 淡出光源
        this.lights.forEach(l => {
            l.intensity *= 0.95;
        });
        
        return true;
    }
    
    getParticles() {
        return this.particles;
    }
    
    getLights() {
        return this.lights;
    }
    
    dispose() {
        this.lights.forEach(l => {
            if (l.parent) l.parent.remove(l);
        });
    }
}

// ------------------------------------------
// 閃電類 (純 Three.js)
// ------------------------------------------
export class LightningEffect {
    constructor(startPos, endPos) {
        this.life = 0.5;
        this.group = new THREE.Group();

        // 主幹
        const points = createLightningPath(startPos, endPos, 8, 3);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, linewidth: 2 });
        this.mainLine = new THREE.Line(geometry, material);
        this.group.add(this.mainLine);

        // 光源
        this.light = new THREE.PointLight(0x88aaff, 5, 15);
        this.light.position.copy(endPos);
        this.group.add(this.light);

        // 分支
        for (let i = 0; i < 2; i++) {
            const idx = Math.floor(points.length * (0.3 + Math.random() * 0.4));
            const bStart = points[idx];
            const bEnd = bStart.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 4));
            const bPoints = createLightningPath(bStart, bEnd, 4, 1);
            const bGeo = new THREE.BufferGeometry().setFromPoints(bPoints);
            const bMat = new THREE.LineBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
            this.group.add(new THREE.Line(bGeo, bMat));
        }

        createParticles(endPos, 0x88ccff, 10, 10, 0.3, 'lightning_spark');
    }

    update(delta) {
        this.life -= delta;
        if (this.mainLine.material) {
            this.mainLine.material.opacity = Math.random() > 0.3 ? 1.0 : 0.5;
            this.mainLine.material.opacity *= Math.max(0, this.life / 0.5);
        }
        return this.life > 0;
    }

    dispose() {
        this.group.children.forEach(c => {
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
        });
    }
}

// ------------------------------------------
// 冰封球類 (優化版 - 參考 ice spell.html)
// ------------------------------------------
export class FrozenOrbEffect {
    constructor(startPos, direction, damage) {
        this.startPos = startPos.clone();
        this.velocity = direction.clone().normalize().multiplyScalar(12);
        this.damage = damage;
        this.life = 4; // 秒
        this.maxLife = 4;
        this.shardTimer = 0;
        this.shardInterval = 0.08;
        this.rotationSpeed = 8;
        
        this.group = new THREE.Group();
        this.group.position.copy(startPos);

        // 創建冰核心 (參考 ice spell.html)
        this.core = createIceCore();
        this.group.add(this.core);

        // 點光源
        this.light = new THREE.PointLight(0x88ccff, 3, 10);
        this.group.add(this.light);
        
        // 冰碎片數組
        this.iceShards = [];
    }

    update(delta) {
        this.life -= delta;

        // 移動
        this.group.position.add(this.velocity.clone().multiplyScalar(delta));

        // 減速
        this.velocity.multiplyScalar(0.995);

        // 旋轉核心 (雙軸旋轉)
        this.core.rotation.y += this.rotationSpeed * delta;
        this.core.rotation.x += this.rotationSpeed * 0.7 * delta;

        // 發射碎片
        this.shardTimer += delta;
        if (this.shardTimer >= this.shardInterval && this.life > 0.5) {
            this.shardTimer = 0;
            this.emitShards();
        }
        
        // 更新冰碎片
        this.updateShards(delta);

        // 脈衝發光
        const pulse = 1 + Math.sin(this.life * 10) * 0.1;
        this.light.intensity = 3 * pulse;

        // 淡出
        if (this.life < 0.5) {
            const fade = this.life / 0.5;
            this.core.scale.setScalar(fade);
            this.light.intensity *= fade;
        }

        return this.life > 0;
    }
    
    emitShards() {
        const count = 4;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const upAngle = (Math.random() - 0.5) * Math.PI * 0.8;

            const dir = new THREE.Vector3(
                Math.cos(angle) * Math.cos(upAngle),
                Math.sin(upAngle),
                Math.sin(angle) * Math.cos(upAngle),
            );

            const speed = 5 + Math.random() * 3;
            const velocity = dir.multiplyScalar(speed);

            this.createIceShard(
                this.group.position.clone(),
                velocity,
                0.2 + Math.random() * 0.15,
            );
        }
    }
    
    createIceShard(position, velocity, size = 0.3) {
        const shard = createIceShardMesh(size);
        shard.position.copy(position);
        
        shard.userData = {
            velocity: velocity.clone(),
            life: 3,
            maxLife: 3,
        };

        // 根據速度方向定向
        if (velocity.length() > 0) {
            shard.lookAt(position.clone().add(velocity));
            shard.rotateX(Math.PI / 2);
        }

        this.group.add(shard);
        this.iceShards.push(shard);

        return shard;
    }
    
    updateShards(delta) {
        for (let i = this.iceShards.length - 1; i >= 0; i--) {
            const shard = this.iceShards[i];
            shard.userData.life -= delta;

            if (shard.userData.life <= 0) {
                this.group.remove(shard);
                this.iceShards.splice(i, 1);
                continue;
            }

            // 移動
            shard.position.add(shard.userData.velocity.clone().multiplyScalar(delta));

            // 重力
            shard.userData.velocity.y -= 8 * delta;

            // 淡出
            const fade = shard.userData.life / shard.userData.maxLife;
            shard.children.forEach((child) => {
                if (child.material) {
                    child.material.opacity = fade * (child.userData?.baseOpacity || 0.8);
                }
            });

            // 地面碰撞
            if (shard.position.y < -1.8) {
                shard.position.y = -1.8;
                shard.userData.velocity.y *= -0.3;
                shard.userData.velocity.x *= 0.8;
                shard.userData.velocity.z *= 0.8;
            }
        }
    }

    dispose() {
        // 創建爆炸效果
        this.createExplosion(this.group.position.clone());
        
        // 清理資源
        this.iceShards.forEach(shard => {
            shard.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
    }
    
    createExplosion(position) {
        // 粒子爆炸
        createParticles(position, 0x88ffff, 30, 10, 1.0, 'ice_explosion');
        
        // 創建冰塊
        for (let i = 0; i < 12; i++) {
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 8,
                (Math.random() - 0.5) * 10,
            );
            this.createIceShard(position.clone(), velocity, 0.3);
        }

        // 閃光
        const flashLight = new THREE.PointLight(0x88ddff, 10, 15);
        flashLight.position.copy(position);
        this.group.add(flashLight);

        setTimeout(() => {
            this.group.remove(flashLight);
        }, 100);
    }
}

// ------------------------------------------
// 暴風雪類 (優化版 - 參考 ice spell.html)
// ------------------------------------------
export class BlizzardEffect {
    constructor(center) {
        this.center = center.clone();
        this.life = 5;
        this.maxLife = 5;
        this.shardTimer = 0;
        
        this.group = new THREE.Group();
        
        // 範圍指示器 (環形)
        const indicatorGeo = new THREE.RingGeometry(4, 5, 32);
        const indicatorMat = new THREE.MeshBasicMaterial({
            color: 0x4488cc,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
        });
        this.indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
        this.indicator.rotation.x = -Math.PI / 2;
        this.indicator.position.copy(this.center);
        this.indicator.position.y = -1.9;
        this.group.add(this.indicator);

        // 光源
        this.light = new THREE.PointLight(0x88ccff, 5, 15);
        this.light.position.copy(this.center);
        this.light.position.y = 5;
        this.group.add(this.light);
        
        // 冰碎片
        this.iceShards = [];
    }

    update(delta) {
        this.life -= delta;

        this.shardTimer += delta;
        if (this.shardTimer >= 0.05) {
            this.shardTimer = 0;
            this.emitShards();
        }
        
        // 更新冰碎片
        this.updateShards(delta);

        // 脈衝指示器
        const pulse = 1 + Math.sin(this.life * 5) * 0.2;
        this.indicator.scale.setScalar(pulse);
        this.light.intensity = 5 * (this.life / this.maxLife);

        if (this.life < 1) {
            this.indicator.material.opacity = 0.3 * this.life;
        }

        return this.life > 0;
    }
    
    emitShards() {
        const count = 3;
        for (let i = 0; i < count; i++) {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                10 + Math.random() * 5,
                (Math.random() - 0.5) * 8,
            );
            const pos = this.center.clone().add(offset);
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                -15 - Math.random() * 5,
                (Math.random() - 0.5) * 2,
            );
            this.createIceShard(pos, velocity, 0.25);
        }
    }
    
    createIceShard(position, velocity, size = 0.3) {
        const shard = createIceShardMesh(size);
        shard.position.copy(position);
        
        shard.userData = {
            velocity: velocity.clone(),
            life: 3,
            maxLife: 3,
        };

        // 根據速度方向定向
        if (velocity.length() > 0) {
            shard.lookAt(position.clone().add(velocity));
            shard.rotateX(Math.PI / 2);
        }

        this.group.add(shard);
        this.iceShards.push(shard);

        return shard;
    }
    
    updateShards(delta) {
        for (let i = this.iceShards.length - 1; i >= 0; i--) {
            const shard = this.iceShards[i];
            shard.userData.life -= delta;

            if (shard.userData.life <= 0) {
                this.group.remove(shard);
                this.iceShards.splice(i, 1);
                continue;
            }

            // 移動
            shard.position.add(shard.userData.velocity.clone().multiplyScalar(delta));

            // 淡出
            const fade = shard.userData.life / shard.userData.maxLife;
            shard.children.forEach((child) => {
                if (child.material) {
                    child.material.opacity = fade * 0.8;
                }
            });

            // 地面碰撞
            if (shard.position.y < -1.8) {
                shard.position.y = -1.8;
                shard.userData.velocity.y *= -0.3;
                shard.userData.velocity.x *= 0.8;
                shard.userData.velocity.z *= 0.8;
            }
        }
    }

    dispose() {
        this.iceShards.forEach(shard => {
            shard.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
        
        if (this.indicator.geometry) this.indicator.geometry.dispose();
        if (this.indicator.material) this.indicator.material.dispose();
    }
}

// ------------------------------------------
// 冰新星類 (新增 - 參考 ice spell.html)
// ------------------------------------------
export class IceNovaEffect {
    constructor(position, damage) {
        this.center = position.clone();
        this.damage = damage;
        this.life = 1;
        this.maxLife = 1;
        
        this.group = new THREE.Group();
        this.iceShards = [];
        
        // 創建環形碎片
        const count = 24;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
            
            const shard = this.createIceShard(
                position.clone(),
                dir.multiplyScalar(15),
                0.35,
            );
            shard.userData.isNova = true;
        }

        // 閃光
        this.light = new THREE.PointLight(0xaaeeff, 10, 20);
        this.light.position.copy(position);
        this.group.add(this.light);
    }
    
    createIceShard(position, velocity, size = 0.3) {
        const shard = createIceShardMesh(size);
        shard.position.copy(position);
        
        shard.userData = {
            velocity: velocity.clone(),
            life: 3,
            maxLife: 3,
        };

        // 根據速度方向定向
        if (velocity.length() > 0) {
            shard.lookAt(position.clone().add(velocity));
            shard.rotateX(Math.PI / 2);
        }

        this.group.add(shard);
        this.iceShards.push(shard);

        return shard;
    }

    update(delta) {
        this.life -= delta;
        
        // 更新冰碎片
        for (let i = this.iceShards.length - 1; i >= 0; i--) {
            const shard = this.iceShards[i];
            shard.userData.life -= delta;

            if (shard.userData.life <= 0) {
                this.group.remove(shard);
                this.iceShards.splice(i, 1);
                continue;
            }

            // 移動
            shard.position.add(shard.userData.velocity.clone().multiplyScalar(delta));

            // 淡出
            const fade = shard.userData.life / shard.userData.maxLife;
            shard.children.forEach((child) => {
                if (child.material) {
                    child.material.opacity = fade * 0.8;
                }
            });

            // 地面碰撞
            if (shard.position.y < -1.8) {
                shard.position.y = -1.8;
                shard.userData.velocity.y *= -0.3;
                shard.userData.velocity.x *= 0.8;
                shard.userData.velocity.z *= 0.8;
            }
        }

        // 淡出光源
        this.light.intensity = 10 * (this.life / this.maxLife);

        return this.life > 0;
    }

    dispose() {
        this.iceShards.forEach(shard => {
            shard.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
    }
}

// ------------------------------------------
// 隕石術類 (優化版 - 參考 fireball.html)
// ------------------------------------------
export class MeteorEffect {
    constructor(targetPos, damage, radius) {
        this.target = targetPos.clone();
        this.target.y = -1.5;
        this.damage = damage;
        this.radius = radius;
        this.life = 10; // 最大生命週期
        this.time = 0;
        this.exploded = false;
        
        this.group = new THREE.Group();
        
        // 起始位置（從天而降）
        this.startPos = targetPos.clone();
        this.startPos.y = 60;
        this.startPos.x += (Math.random() - 0.5) * 20;
        this.startPos.z += (Math.random() - 0.5) * 20;
        this.group.position.copy(this.startPos);
        
        // 速度向量
        const direction = this.target.clone().sub(this.startPos);
        this.velocity = direction.normalize().multiplyScalar(35);
        
        // 1. 火核心 (參考 fireball.html)
        const coreGeo = new THREE.SphereGeometry(0.8, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({ 
            color: 0xffaa33,
            transparent: true,
            opacity: 0.9
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.group.add(this.core);
        
        // 光源
        this.light = new THREE.PointLight(0xff4400, 8, 25);
        this.group.add(this.light);
        
        // 尾跡粒子
        this.trailParticles = [];
        
        // 預警指示器
        this.warning = new THREE.Mesh(
            new THREE.RingGeometry(2, 3, 32),
            new THREE.MeshBasicMaterial({ 
                color: 0xff3300, 
                transparent: true, 
                opacity: 0.5,
                side: THREE.DoubleSide
            })
        );
        this.warning.rotation.x = -Math.PI / 2;
        this.warning.position.copy(this.target);
        this.warning.position.y = -1.9;
        this.group.add(this.warning);
        
        // 爆炸效果容器
        this.explosion = null;
    }
    
    update(delta) {
        if (this.exploded) {
            // 更新爆炸效果
            if (this.explosion) {
                return this.explosion.update(delta);
            }
            return false;
        }
        
        this.time += delta;
        
        // 移動隕石
        this.group.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // 檢查是否到達目標
        if (this.group.position.y <= this.target.y + 1) {
            this.explode();
            return true;
        }
        
        // 預警指示器脈動
        this.warning.scale.setScalar(1 + Math.sin(this.time * 10) * 0.3);
        
        // 發射尾跡粒子
        for (let i = 0; i < 5; i++) {
            this.trailParticles.push({
                position: this.group.position.clone().add(new THREE.Vector3(
                    (Math.random() - 0.5) * 1,
                    (Math.random() - 0.5) * 1,
                    (Math.random() - 0.5) * 1
                )),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5
                ),
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1,
                color: new THREE.Color(1, 0.4 + Math.random() * 0.4, 0.2)
            });
        }
        
        // 更新尾跡
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const p = this.trailParticles[i];
            p.life -= delta;
            if (p.life <= 0) {
                this.trailParticles.splice(i, 1);
                continue;
            }
            p.position.add(p.velocity.clone().multiplyScalar(delta));
        }
        
        return true;
    }
    
    explode() {
        this.exploded = true;
        
        // 隱藏隕石本體
        this.core.visible = false;
        this.warning.visible = false;
        
        // 創建爆炸效果
        this.explosion = new FireExplosion(this.group.position.clone(), 'meteor');
        
        // 添加爆炸光源到場景
        this.explosion.getLights().forEach(light => {
            this.group.add(light);
        });
    }
    
    getParticles() {
        if (this.explosion) {
            return this.explosion.getParticles();
        }
        return this.trailParticles;
    }
    
    dispose() {
        if (this.explosion) {
            this.explosion.dispose();
        }
        if (this.core.geometry) this.core.geometry.dispose();
        if (this.core.material) this.core.material.dispose();
        if (this.warning.geometry) this.warning.geometry.dispose();
        if (this.warning.material) this.warning.material.dispose();
    }
}

// ------------------------------------------
// 毒系法術效果
// ------------------------------------------

// 瘟疫釘刺 - 投射物 (強化版)
export class PlagueSpikeEffect {
    constructor(startPos, targetPos, damage, dotDamage, dotDuration) {
        this.startPos = startPos.clone();
        this.targetPos = targetPos.clone();
        this.damage = damage;
        this.dotDamage = dotDamage;
        this.dotDuration = dotDuration;
        this.life = 4;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        // 方向
        this.direction = targetPos.clone().sub(startPos).normalize();
        this.velocity = this.direction.clone().multiplyScalar(30);
        
        // 強化版釘刺主體
        const spikeGeo = new THREE.ConeGeometry(0.25, 2.5, 8);
        const spikeMat = new THREE.MeshStandardMaterial({ 
            color: 0x003300, 
            emissive: 0x00ff00, 
            emissiveIntensity: 2,
            metalness: 0.8,
            roughness: 0.2
        });
        this.spike = new THREE.Mesh(spikeGeo, spikeMat);
        this.spike.rotation.x = Math.PI / 2;
        this.group.add(this.spike);
        
        // 環繞能量環
        const ringGeo = new THREE.TorusGeometry(0.4, 0.05, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 });
        this.ring1 = new THREE.Mesh(ringGeo, ringMat);
        this.ring2 = new THREE.Mesh(ringGeo, ringMat.clone());
        this.ring1.position.z = -0.5;
        this.ring2.position.z = -1.0;
        this.group.add(this.ring1, this.ring2);
        
        // 綠色光源
        this.light = new THREE.PointLight(0x45ff45, 4, 20);
        this.group.add(this.light);
        
        // 拖尾粒子
        this.trailParticles = [];
        
        // 旋轉
        this.rotationSpeed = 5;
    }
    
    update(delta) {
        this.life -= delta;
        this.group.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // 環繞能量環動畫
        this.ring1.rotation.x += 0.1;
        this.ring1.rotation.y += 0.1;
        this.ring2.rotation.x += 0.15;
        this.ring2.rotation.y -= 0.1;
        
        this.spike.rotation.z += this.rotationSpeed * delta;
        
        // 添加拖尾粒子
        if (Math.random() < 0.6) {
            this.trailParticles.push({
                position: this.group.position.clone(),
                life: 0.5,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                )
            });
        }
        
        // 更新拖尾
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const p = this.trailParticles[i];
            p.life -= delta;
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            if (p.life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }
        
        // 軌跡淡出
        if (this.life < 1.0) {
            const fadeOpacity = this.life;
            this.spike.material.opacity = fadeOpacity;
            this.ring1.material.opacity = fadeOpacity * 0.8;
            this.ring2.material.opacity = fadeOpacity * 0.8;
        }
        
        return this.life > 0;
    }
    
    dispose() {
        this.trailParticles = [];
    }
}

// 腐敗瘴氣 - AOE 毒雲 (強化版)
export class PoisonCloudEffect {
    constructor(centerPos, damage, dotDamage, dotDuration, radius, duration) {
        this.centerPos = centerPos.clone();
        this.damage = damage;
        this.dotDamage = dotDamage;
        this.dotDuration = dotDuration;
        this.radius = radius;
        this.duration = duration;
        this.life = duration;
        this.maxLife = duration;
        this.time = 0;
        
        this.group = new THREE.Group();
        this.group.position.copy(centerPos);
        
        // 大量粒子 (800個)
        const particleCount = 800;
        const positions = new Float32Array(particleCount * 3);
        this.velocities = [];

        for(let i = 0; i < particleCount; i++) {
            // 圓形分佈
            const r = Math.sqrt(Math.random()) * radius;
            const theta = Math.random() * Math.PI * 2;
            
            positions[i * 3] = Math.cos(theta) * r;
            positions[i * 3 + 1] = Math.random() * 0.5;
            positions[i * 3 + 2] = Math.sin(theta) * r;
            
            this.velocities.push({
                x: (Math.random() - 0.5) * 0.3,
                y: 0.5 + Math.random() * 1.0,
                z: (Math.random() - 0.5) * 0.3
            });
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            size: 2.0,
            color: 0x32cd32,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geo, mat);
        this.particles.userData = { type: 'cloud', velocities: this.velocities };
        this.group.add(this.particles);
        
        // 地面腐蝕環
        const ringGeo = new THREE.RingGeometry(0.1, radius, 32);
        const ringMat = new THREE.MeshBasicMaterial({ 
            color: 0x003300, 
            transparent: true, 
            opacity: 0.5, 
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        this.groundRing = new THREE.Mesh(ringGeo, ringMat);
        this.groundRing.rotation.x = -Math.PI / 2;
        this.groundRing.position.y = 0.01;
        this.group.add(this.groundRing);
        
        // 綠色光源
        this.light = new THREE.PointLight(0x45ff45, 3, radius * 3);
        this.light.position.y = 3;
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        // 更新粒子上升
        const positions = this.particles.geometry.attributes.position.array;
        
        for(let j = 0; j < this.velocities.length; j++) {
            positions[j * 3] += this.velocities[j].x * delta;
            positions[j * 3 + 1] += this.velocities[j].y * delta;
            positions[j * 3 + 2] += this.velocities[j].z * delta;
            
            // 循環：如果粒子飛太高，回到地面
            if(positions[j * 3 + 1] > 8.0) {
                positions[j * 3 + 1] = 0.1;
            }
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
        
        // 整體淡出
        const fadeStart = this.maxLife / 2;
        if (this.life < fadeStart) {
            this.particles.material.opacity = (this.life / fadeStart) * 0.6;
            this.light.intensity = 3 * (this.life / fadeStart);
        }
        
        // 地面環擴展
        const scale = 1 + (1 - this.life / this.maxLife) * 2;
        this.groundRing.scale.set(scale, scale, scale);
        this.groundRing.material.opacity = (this.life / this.maxLife) * 0.5;
        
        return this.life > 0;
    }
    
    dispose() {
        this.particles.geometry.dispose();
        this.particles.material.dispose();
        this.groundRing.geometry.dispose();
        this.groundRing.material.dispose();
    }
}

// 蛇信橫掃 - 扇形攻擊 (強化版)
export class SerpentSweepEffect {
    constructor(centerPos, direction, damage, dotDamage, dotDuration, coneAngle, range) {
        this.centerPos = centerPos.clone();
        this.direction = direction.clone().normalize();
        this.damage = damage;
        this.dotDamage = dotDamage;
        this.dotDuration = dotDuration;
        this.coneAngle = coneAngle;
        this.range = range;
        this.life = 2.0;
        
        this.group = new THREE.Group();
        this.group.position.copy(centerPos);
        
        // 大量粒子 (1000個)
        const particleCount = 1000;
        this.positions = new Float32Array(particleCount * 3);
        this.colors = new Float32Array(particleCount * 3);
        this.velocities = [];
        
        const baseColor = new THREE.Color(0x00ff00);
        const accentColor = new THREE.Color(0x90ee90);
        
        for (let i = 0; i < particleCount; i++) {
            this.positions[i * 3] = 0;
            this.positions[i * 3 + 1] = 1;
            this.positions[i * 3 + 2] = 0;
            
            // 扇形分佈 + 隨機擴散
            const angle = (Math.random() - 0.5) * coneAngle;
            const speed = 0.6 + Math.random() * 0.8;
            
            this.velocities.push({
                x: Math.sin(angle) * speed,
                y: Math.random() * 0.3,
                z: -Math.cos(angle) * speed,
                gravity: 0.015 + Math.random() * 0.01
            });
            
            // 顏色變化
            const c = Math.random() > 0.5 ? baseColor : accentColor;
            this.colors[i * 3] = c.r;
            this.colors[i * 3 + 1] = c.g;
            this.colors[i * 3 + 2] = c.b;
        }
        
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        
        this.material = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.particles = new THREE.Points(this.geometry, this.material);
        this.group.add(this.particles);
        
        // 光源
        this.light = new THREE.PointLight(0x45ff45, 6, 25);
        this.light.position.y = 1;
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        
        for (let i = 0; i < this.velocities.length; i++) {
            this.positions[i * 3] += this.velocities[i].x * delta * 60;
            this.positions[i * 3 + 1] += this.velocities[i].y * delta * 60;
            this.positions[i * 3 + 2] += this.velocities[i].z * delta * 60;
            
            // 重力
            this.velocities[i].y -= this.velocities[i].gravity * delta * 60;
        }
        
        this.geometry.attributes.position.needsUpdate = true;
        
        // 淡出
        if (this.life < 1.0) {
            this.material.opacity = this.life;
            this.light.intensity = 6 * this.life;
        }
        
        return this.life > 0;
    }
    
    dispose() {
        this.geometry.dispose();
        this.material.dispose();
    }
}

// ==========================================
// 風系法術效果
// ==========================================

// 風之極刑 - 三連發風刃
export class WindBladesEffect {
    constructor(startPos, targetPos, damage, bladeCount, spreadAngle) {
        this.startPos = startPos.clone();
        this.targetPos = targetPos.clone();
        this.damage = damage;
        this.bladeCount = bladeCount || 3;
        this.spreadAngle = spreadAngle || 0.15;
        this.blades = [];
        this.trails = [];
        this.life = 3;
        
        this.group = new THREE.Group();
        
        // 風刃貼圖生成
        const windTexture = this.createWindTexture();
        
        // 創建多個風刃
        for (let i = 0; i < this.bladeCount; i++) {
            const bladeGroup = new THREE.Group();
            
            // 風刃核心
            const bladeGeo = new THREE.ConeGeometry(0.15, 3, 4);
            const bladeMat = new THREE.MeshBasicMaterial({ 
                color: 0xffffff, 
                transparent: true, 
                opacity: 0.9, 
                side: THREE.DoubleSide
            });
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.rotation.x = Math.PI / 2;
            bladeGroup.add(blade);
            
            // 扇形分佈偏移
            const offset = (i - (this.bladeCount - 1) / 2) * this.spreadAngle;
            
            // 方向
            const direction = targetPos.clone().sub(startPos).normalize();
            const directionWithOffset = new THREE.Vector3(
                direction.x + offset,
                0,
                direction.z
            ).normalize();
            
            // 拖尾粒子
            const trailCount = 50;
            const trailPositions = new Float32Array(trailCount * 3);
            const trailGeo = new THREE.BufferGeometry();
            trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
            
            const trailMat = new THREE.PointsMaterial({
                size: 0.2,
                map: windTexture,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                color: 0xaaccff
            });
            const trail = new THREE.Points(trailGeo, trailMat);
            
            this.trails.push({
                mesh: trail,
                positions: trailPositions,
                velocities: Array(trailCount).fill(0).map(() => ({
                    x: (Math.random() - 0.5) * 0.5,
                    y: (Math.random() - 0.5) * 0.5,
                    z: Math.random() * 0.5,
                    life: Math.random() * 0.2
                })),
                startPos: startPos.clone()
            });
            
            this.blades.push({
                group: bladeGroup,
                mesh: blade,
                velocity: directionWithOffset.multiplyScalar(30),
                position: startPos.clone()
            });
            
            this.group.add(bladeGroup);
        }
        
        // 風系光源
        this.light = new THREE.PointLight(0xaaccff, 3, 20);
        this.group.add(this.light);
    }
    
    createWindTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(200,200,220,0.8)');
        gradient.addColorStop(0.5, 'rgba(150,150,170,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }
    
    update(delta) {
        this.life -= delta;
        
        // 更新每個風刃
        for (let i = 0; i < this.blades.length; i++) {
            const blade = this.blades[i];
            blade.position.add(blade.velocity.clone().multiplyScalar(delta));
            blade.group.position.copy(blade.position);
            blade.group.lookAt(blade.position.clone().add(blade.velocity));
            
            // 更新拖尾
            const trail = this.trails[i];
            const positions = trail.mesh.geometry.attributes.position.array;
            
            for (let j = 0; j < trail.velocities.length; j++) {
                const vel = trail.velocities[j];
                positions[j * 3] += vel.x;
                positions[j * 3 + 1] += vel.y;
                positions[j * 3 + 2] += vel.z;
                
                vel.life -= delta;
                if (vel.life <= 0) {
                    positions[j * 3] = blade.position.x + (Math.random() - 0.5);
                    positions[j * 3 + 1] = blade.position.y + (Math.random() - 0.5);
                    positions[j * 3 + 2] = blade.position.z;
                    vel.life = 0.1;
                }
            }
            trail.mesh.geometry.attributes.position.needsUpdate = true;
        }
        
        // 淡出
        if (this.life < 1.0) {
            this.light.intensity = 3 * this.life;
        }
        
        return this.life > 0;
    }
    
    dispose() {
        for (const trail of this.trails) {
            trail.mesh.geometry.dispose();
            trail.mesh.material.dispose();
        }
    }
}

// 狂怒塵魔 - 持續範圍龍捲風
export class TornadoEffect {
    constructor(centerPos, damage, dotDamage, dotDuration, radius, duration, moveSpeed) {
        this.centerPos = centerPos.clone();
        this.damage = damage;
        this.dotDamage = dotDamage;
        this.dotDuration = dotDuration;
        this.radius = radius;
        this.duration = duration;
        this.moveSpeed = moveSpeed || 4;
        this.life = duration;
        this.maxLife = duration;
        
        this.group = new THREE.Group();
        this.group.position.copy(centerPos);
        
        // 目標移動位置
        this.targetPos = centerPos.clone();
        
        // 粒子系統
        const particleCount = 800;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        this.rotations = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 0.5 + Math.random() * 1.5;
            const height = Math.random() * 8;
            
            positions[i * 3] = Math.cos(angle) * r;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * r;
            
            this.rotations.push({
                r: r,
                a: angle,
                h: height,
                speed: 0.05 + Math.random() * 0.05,
                rise: 0.02 + Math.random() * 0.02
            });
            
            const c = 0.6 + Math.random() * 0.4;
            colors[i * 3] = c;
            colors[i * 3 + 1] = c;
            colors[i * 3 + 2] = c;
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const mat = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.NormalBlending,
            depthWrite: false
        });
        
        this.particles = new THREE.Points(geo, mat);
        this.group.add(this.particles);
        
        // 光源
        this.light = new THREE.PointLight(0xaaccff, 4, 25);
        this.light.position.y = 4;
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        
        // 隨機移動
        if (Math.random() < 0.02) {
            this.targetPos.set(
                this.centerPos.x + (Math.random() - 0.5) * 15,
                0,
                this.centerPos.z + (Math.random() - 0.5) * 15
            );
        }
        
        // 移動向目標
        const dir = this.targetPos.clone().sub(this.group.position);
        dir.y = 0;
        if (dir.length() > 0.5) {
            dir.normalize().multiplyScalar(this.moveSpeed * delta);
            this.group.position.add(dir);
        }
        
        // 更新粒子旋轉
        const posArray = this.particles.geometry.attributes.position.array;
        
        for (let i = 0; i < this.rotations.length; i++) {
            const rot = this.rotations[i];
            rot.a += rot.speed;
            rot.h += rot.rise;
            if (rot.h > 8) rot.h = 0;
            
            posArray[i * 3] = this.group.position.x + Math.cos(rot.a) * rot.r;
            posArray[i * 3 + 1] = rot.h;
            posArray[i * 3 + 2] = this.group.position.z + Math.sin(rot.a) * rot.r;
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
        
        // 淡出
        if (this.life < 2.0) {
            this.particles.material.opacity = this.life / 2.0 * 0.8;
            this.light.intensity = 4 * (this.life / 2.0);
        }
        
        return this.life > 0;
    }
    
    dispose() {
        this.particles.geometry.dispose();
        this.particles.material.dispose();
    }
}

// 塵魔之環 - 向四周發射龍捲風
export class TornadoRingEffect {
    constructor(centerPos, damage, tornadoCount, spreadRadius, duration) {
        this.centerPos = centerPos.clone();
        this.damage = damage;
        this.tornadoCount = tornadoCount || 6;
        this.spreadRadius = spreadRadius || 25;
        this.duration = duration || 4;
        this.life = duration;
        
        this.group = new THREE.Group();
        this.group.position.copy(centerPos);
        
        this.tornadoes = [];
        
        // 風刃貼圖
        const windTexture = this.createWindTexture();
        
        // 創建多個徑向龍捲
        for (let t = 0; t < this.tornadoCount; t++) {
            const angle = (t / this.tornadoCount) * Math.PI * 2;
            
            const particleCount = 150;
            const positions = new Float32Array(particleCount * 3);
            
            const tornadoData = {
                pos: centerPos.clone(),
                velocity: new THREE.Vector3(
                    Math.sin(angle) * 0.3,
                    0,
                    Math.cos(angle) * 0.3
                ),
                rotations: []
            };
            
            for (let i = 0; i < particleCount; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = Math.random() * 0.8;
                const h = Math.random() * 2;
                
                positions[i * 3] = Math.cos(a) * r;
                positions[i * 3 + 1] = h;
                positions[i * 3 + 2] = Math.sin(a) * r;
                
                tornadoData.rotations.push({
                    r: r,
                    a: a,
                    h: h,
                    speed: 0.15,
                    rise: 0.05
                });
            }
            
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const mat = new THREE.PointsMaterial({
                size: 0.3,
                map: windTexture,
                color: 0xaaaaaa,
                transparent: true,
                opacity: 0.9,
                blending: THREE.NormalBlending,
                depthWrite: false
            });
            
            const particles = new THREE.Points(geo, mat);
            tornadoData.particles = particles;
            
            this.tornadoes.push(tornadoData);
            this.group.add(particles);
        }
        
        // 光源
        this.light = new THREE.PointLight(0xaaccff, 5, 30);
        this.light.position.y = 3;
        this.group.add(this.light);
    }
    
    createWindTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(200,200,220,0.8)');
        gradient.addColorStop(0.5, 'rgba(150,150,170,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }
    
    update(delta) {
        this.life -= delta;
        
        // 更新每個龍捲
        for (const tornado of this.tornadoes) {
            // 向外移動
            tornado.pos.add(tornado.velocity);
            
            // 速度遞減
            tornado.velocity.multiplyScalar(0.99);
            
            // 更新粒子
            const posArray = tornado.particles.geometry.attributes.position.array;
            
            for (let i = 0; i < tornado.rotations.length; i++) {
                const rot = tornado.rotations[i];
                rot.a += rot.speed;
                rot.h += rot.rise;
                
                if (rot.h > 2.5) rot.h = 0;
                rot.r += 0.01;
                
                posArray[i * 3] = tornado.pos.x + Math.cos(rot.a) * rot.r;
                posArray[i * 3 + 1] = rot.h;
                posArray[i * 3 + 2] = tornado.pos.z + Math.sin(rot.a) * rot.r;
            }
            
            tornado.particles.geometry.attributes.position.needsUpdate = true;
        }
        
        // 淡出
        if (this.life < 1.0) {
            const opacity = this.life;
            for (const tornado of this.tornadoes) {
                tornado.particles.material.opacity = opacity * 0.9;
            }
            this.light.intensity = 5 * this.life;
        }
        
        return this.life > 0;
    }
    
    dispose() {
        for (const tornado of this.tornadoes) {
            tornado.particles.geometry.dispose();
            tornado.particles.material.dispose();
        }
    }
}

export default {
    FireballEffect,
    FireExplosion,
    LightningEffect,
    FrozenOrbEffect,
    BlizzardEffect,
    IceNovaEffect,
    MeteorEffect,
    PlagueSpikeEffect,
    PoisonCloudEffect,
    SerpentSweepEffect,
    WindBladesEffect,
    TornadoEffect,
    TornadoRingEffect
};