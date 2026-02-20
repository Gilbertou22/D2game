import * as THREE from 'three';
import { createFireTexture, createIceCore, createIceShardMesh, createLightningPath } from './utils';

export class FireballEffect {
    constructor(startPos, targetPos, damage) {
        this.damage = damage;
        this.life = 4;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        const direction = targetPos.clone().sub(startPos).normalize();
        this.velocity = direction.multiplyScalar(18);
        
        this.light = new THREE.PointLight(0xff6633, 5, 15);
        this.group.add(this.light);
        
        const coreGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffcc, transparent: true, opacity: 0.9 });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.group.add(this.core);
        
        const glowGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xff8833, transparent: true, opacity: 0.6 });
        this.glow = new THREE.Mesh(glowGeo, glowMat);
        this.group.add(this.glow);
        
        this.trailParticles = [];
        this.sparkParticles = [];
        this.fireTexture = createFireTexture();
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        this.group.position.add(this.velocity.clone().multiplyScalar(delta));
        
        const pulse = 1 + Math.sin(this.time * 15) * 0.15;
        this.core.scale.setScalar(pulse);
        this.glow.scale.setScalar(pulse * 1.3);
        this.light.intensity = 5 + Math.sin(this.time * 20) * 2;
        
        this.emitTrail();
        this.emitSparks();
        this.updateParticles(delta);
        return this.life > 0;
    }
    
    emitTrail() {
        for (let i = 0; i < 3; i++) {
            const offset = new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
            this.trailParticles.push({
                position: this.group.position.clone().add(offset),
                velocity: new THREE.Vector3((Math.random() - 0.5) * 2 - this.velocity.x * 0.1, Math.random() * 2, (Math.random() - 0.5) * 2 - this.velocity.z * 0.1),
                life: 0.5 + Math.random() * 0.3,
                maxLife: 0.8,
                size: 0.8 + Math.random() * 0.4,
                color: new THREE.Color(1, 0.3 + Math.random() * 0.5, 0.1)
            });
        }
    }
    
    emitSparks() {
        if (Math.random() > 0.4) return;
        for (let i = 0; i < 2; i++) {
            this.sparkParticles.push({
                position: this.group.position.clone(),
                velocity: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 4, (Math.random() - 0.5) * 8),
                life: 0.3 + Math.random() * 0.3,
                maxLife: 0.6,
                color: new THREE.Color(1, 0.9, 0.5)
            });
        }
    }
    
    updateParticles(delta) {
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const p = this.trailParticles[i];
            p.life -= delta;
            if (p.life <= 0) { this.trailParticles.splice(i, 1); continue; }
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            p.velocity.y -= 3 * delta;
            p.velocity.multiplyScalar(0.98);
        }
        for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
            const p = this.sparkParticles[i];
            p.life -= delta;
            if (p.life <= 0) { this.sparkParticles.splice(i, 1); continue; }
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            p.velocity.y -= 15 * delta;
        }
    }
    
    getParticles() { return { trail: this.trailParticles, sparks: this.sparkParticles }; }
    explode() { return { position: this.group.position.clone(), type: 'fireball', particles: [], lights: [] }; }
    
    dispose() {
        if (this.core.geometry) this.core.geometry.dispose();
        if (this.core.material) this.core.material.dispose();
        if (this.glow.geometry) this.glow.geometry.dispose();
        if (this.glow.material) this.glow.material.dispose();
        if (this.fireTexture) this.fireTexture.dispose();
    }
}

export class FireExplosion {
    constructor(position, type = 'fireball') {
        this.position = position.clone();
        this.type = type;
        this.life = type === 'meteor' ? 2 : 1.2;
        this.maxLife = this.life;
        this.time = 0;
        this.particles = [];
        this.lights = [];
        
        const flash = new THREE.PointLight(0xffaa00, type === 'meteor' ? 20 : 10, type === 'meteor' ? 30 : 15);
        flash.position.copy(position);
        this.lights.push(flash);
        
        const count = type === 'meteor' ? 150 : 80;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const upAngle = (Math.random() - 0.3) * Math.PI;
            const speed = (type === 'meteor' ? 8 : 5) + Math.random() * (type === 'meteor' ? 12 : 8);
            this.particles.push({
                position: position.clone(),
                velocity: new THREE.Vector3(Math.cos(angle) * Math.cos(upAngle) * speed, Math.sin(upAngle) * speed * 1.5, Math.sin(angle) * Math.cos(upAngle) * speed),
                life: 0.5 + Math.random() * 0.8,
                maxLife: 1.3,
                size: (type === 'meteor' ? 1.5 : 0.8) + Math.random() * 0.8,
                type: 'fire',
                color: new THREE.Color(1, 0.3 + Math.random() * 0.5, 0.1)
            });
        }
        
        const smokeCount = type === 'meteor' ? 40 : 25;
        for (let i = 0; i < smokeCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                position: position.clone(),
                velocity: new THREE.Vector3(Math.cos(angle) * speed, 2 + Math.random() * 3, Math.sin(angle) * speed),
                life: 1 + Math.random() * 1,
                maxLife: 2,
                size: 2 + Math.random() * 2,
                type: 'smoke',
                color: new THREE.Color(0.3, 0.15, 0.1)
            });
        }
        
        const debrisCount = type === 'meteor' ? 20 : 12;
        for (let i = 0; i < debrisCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 10;
            this.particles.push({
                position: position.clone(),
                velocity: new THREE.Vector3(Math.cos(angle) * speed, 5 + Math.random() * 8, Math.sin(angle) * speed),
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
        const lifeRatio = this.life / this.maxLife;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;
            if (p.life <= 0) { this.particles.splice(i, 1); continue; }
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            if (p.type === 'fire') p.velocity.y -= delta * 10;
            else if (p.type === 'debris') p.velocity.y -= delta * 15;
            else p.velocity.y += delta * 2;
        }
        
        this.lights.forEach(light => { light.intensity *= 0.95; });
        return this.life > 0;
    }
    
    getParticles() { return this.particles; }
    getLights() { return this.lights; }
    dispose() {}
}

export class LightningEffect {
    constructor(startPos, targetPos) {
        this.life = 0.5;
        this.time = 0;
        this.group = new THREE.Group();
        
        const points = createLightningPath(startPos, targetPos, 12, 3);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x88ddff, transparent: true, opacity: 1, linewidth: 2 });
        this.line = new THREE.Line(geometry, material);
        this.group.add(this.line);
        
        const glowMat = new THREE.LineBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.5, linewidth: 4 });
        this.glow = new THREE.Line(geometry.clone(), glowMat);
        this.group.add(this.glow);
        
        this.light = new THREE.PointLight(0x88ddff, 5, 15);
        this.light.position.copy(targetPos);
        this.group.add(this.light);
        
        this.impactParticles = [];
        for (let i = 0; i < 30; i++) {
            this.impactParticles.push({
                position: targetPos.clone(),
                velocity: new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 5, (Math.random() - 0.5) * 10),
                life: 0.3 + Math.random() * 0.3,
                size: 0.1 + Math.random() * 0.2
            });
        }
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        this.line.material.opacity = Math.max(0, this.life * 2);
        this.glow.material.opacity = Math.max(0, this.life);
        this.light.intensity = 5 * (this.life / 0.5);
        
        for (let i = this.impactParticles.length - 1; i >= 0; i--) {
            const p = this.impactParticles[i];
            p.life -= delta;
            if (p.life <= 0) { this.impactParticles.splice(i, 1); continue; }
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            p.velocity.y -= delta * 20;
        }
        return this.life > 0;
    }
    
    dispose() {
        this.line.geometry.dispose();
        this.line.material.dispose();
        this.glow.geometry.dispose();
        this.glow.material.dispose();
    }
}

export class FrozenOrbEffect {
    constructor(startPos, direction, damage) {
        this.damage = damage;
        this.life = 3;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        this.velocity = direction.clone().multiplyScalar(12);
        
        this.core = createIceCore();
        this.group.add(this.core);
        
        this.light = new THREE.PointLight(0x88ddff, 3, 12);
        this.group.add(this.light);
        
        this.trail = [];
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        this.group.position.add(this.velocity.clone().multiplyScalar(delta));
        this.core.rotation.x += delta * 3;
        this.core.rotation.y += delta * 2;
        
        this.light.intensity = 3 + Math.sin(this.time * 10) * 1;
        return this.life > 0;
    }
    
    dispose() {}
}

export class BlizzardEffect {
    constructor(targetPos) {
        this.life = 5;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(targetPos);
        this.group.position.y = 0;
        
        this.snowflakes = [];
        for (let i = 0; i < 200; i++) {
            this.snowflakes.push({
                position: new THREE.Vector3((Math.random() - 0.5) * 15, Math.random() * 10, (Math.random() - 0.5) * 15),
                velocity: new THREE.Vector3((Math.random() - 0.5) * 2, -2 - Math.random() * 2, (Math.random() - 0.5) * 2),
                size: 0.1 + Math.random() * 0.2,
                rotation: Math.random() * Math.PI * 2
            });
        }
        
        this.light = new THREE.PointLight(0x88ddff, 2, 20);
        this.light.position.y = 5;
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        this.snowflakes.forEach(flake => {
            flake.position.add(flake.velocity.clone().multiplyScalar(delta));
            flake.rotation += delta * 5;
            if (flake.position.y < 0) {
                flake.position.y = 10;
                flake.position.x = (Math.random() - 0.5) * 15;
                flake.position.z = (Math.random() - 0.5) * 15;
            }
        });
        
        this.light.intensity = 2 * (this.life / 5);
        return this.life > 0;
    }
    
    dispose() {}
}

export class IceNovaEffect {
    constructor(startPos, damage, radius = 15) {
        this.damage = damage;
        this.radius = radius;
        this.life = 1.5;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        this.ring = new THREE.Mesh(
            new THREE.RingGeometry(0.5, 1, 32),
            new THREE.MeshBasicMaterial({ color: 0x88ddff, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
        );
        this.ring.rotation.x = -Math.PI / 2;
        this.group.add(this.ring);
        
        this.particles = [];
        for (let i = 0; i < 100; i++) {
            const angle = (i / 100) * Math.PI * 2;
            this.particles.push({
                angle,
                distance: 0,
                speed: 15 + Math.random() * 5,
                size: 0.2 + Math.random() * 0.3
            });
        }
        
        this.light = new THREE.PointLight(0x88ddff, 5, 20);
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const scale = 1 + this.time * 10;
        this.ring.scale.set(scale, scale, 1);
        this.ring.material.opacity = Math.max(0, this.life / 1.5);
        
        this.particles.forEach(p => { p.distance += delta * p.speed; });
        this.light.intensity = 5 * (this.life / 1.5);
        return this.life > 0;
    }
    
    dispose() {}
}

export class MeteorEffect {
    constructor(startPos, targetPos, damage) {
        this.damage = damage;
        this.life = 4;
        this.time = 0;
        this.startPos = startPos.clone();
        this.targetPos = targetPos.clone();
        this.targetPos.y = 0;
        
        this.group = new THREE.Group();
        
        this.meteor = new THREE.Group();
        const coreGeo = new THREE.DodecahedronGeometry(1.2, 1);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0.95 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        this.meteor.add(core);
        
        const innerGeo = new THREE.SphereGeometry(0.8, 16, 16);
        const innerMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 1 });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        this.meteor.add(inner);
        
        this.meteor.position.copy(startPos);
        this.group.add(this.meteor);
        
        this.light = new THREE.PointLight(0xff4400, 5, 30);
        this.meteor.add(this.light);
        
        this.hasImpacted = false;
        this.impactParticles = [];
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const fallDuration = 1.5;
        if (this.time < fallDuration) {
            const progress = this.time / fallDuration;
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            this.meteor.position.y = this.startPos.y - easeProgress * (this.startPos.y - this.targetPos.y);
            this.meteor.position.x = this.startPos.x + easeProgress * (this.targetPos.x - this.startPos.x);
            this.meteor.position.z = this.startPos.z + easeProgress * (this.targetPos.z - this.startPos.z);
            this.meteor.rotation.x += delta * 2;
            this.meteor.rotation.z += delta * 1.5;
        } else if (!this.hasImpacted) {
            this.hasImpacted = true;
            this.createImpact();
        }
        
        if (this.hasImpacted) {
            this.meteor.visible = false;
            this.impactParticles.forEach(p => {
                p.position.add(p.velocity.clone().multiplyScalar(delta));
                p.velocity.y -= delta * 15;
                p.material.opacity *= 0.96;
            });
            if (this.shockwave) {
                const scale = 1 + (this.time - fallDuration) * 12;
                this.shockwave.scale.set(scale, scale, 1);
                this.shockwave.material.opacity = Math.max(0, 1 - (this.time - fallDuration));
            }
        }
        
        return this.life > 0;
    }
    
    createImpact() {
        for (let i = 0; i < 100; i++) {
            const geo = new THREE.SphereGeometry(0.15 + Math.random() * 0.25, 6, 6);
            const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.05 + Math.random() * 0.05, 1, 0.5 + Math.random() * 0.3), transparent: true, opacity: 1 });
            const particle = new THREE.Mesh(geo, mat);
            particle.position.copy(this.targetPos);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI / 2;
            const speed = 8 + Math.random() * 12;
            particle.userData = { velocity: new THREE.Vector3(speed * Math.sin(phi) * Math.cos(theta), speed * Math.cos(phi) + 5, speed * Math.sin(phi) * Math.sin(theta)) };
            particle.velocity = particle.userData.velocity;
            this.group.add(particle);
            this.impactParticles.push(particle);
        }
        
        const ringGeo = new THREE.RingGeometry(0.5, 1.5, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 1, side: THREE.DoubleSide });
        this.shockwave = new THREE.Mesh(ringGeo, ringMat);
        this.shockwave.rotation.x = -Math.PI / 2;
        this.shockwave.position.copy(this.targetPos);
        this.shockwave.position.y = 0.1;
        this.group.add(this.shockwave);
    }
    
    dispose() {
        this.impactParticles.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
    }
}
