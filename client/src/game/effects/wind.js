import * as THREE from 'three';
import { createWindTexture } from './utils';

export class WindBladesEffect {
    constructor(startPos, targetPos, damage, bladeCount, spreadAngle) {
        this.damage = damage;
        this.bladeCount = bladeCount;
        this.life = 2;
        this.time = 0;
        this.group = new THREE.Group();
        this.startPos = startPos.clone();
        this.targetPos = targetPos.clone();
        
        const direction = targetPos.clone().sub(startPos).normalize();
        this.velocity = direction.multiplyScalar(30);
        
        this.blades = [];
        for (let i = 0; i < bladeCount; i++) {
            const bladeGroup = new THREE.Group();
            const angle = ((i / (bladeCount - 1)) - 0.5) * spreadAngle;
            
            const bladeGeo = new THREE.ConeGeometry(0.15, 1.5, 6);
            const bladeMat = new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.8 });
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.rotation.x = Math.PI / 2;
            bladeGroup.add(blade);
            
            bladeGroup.position.copy(startPos);
            bladeGroup.rotation.y = angle;
            bladeGroup.userData = { velocity: new THREE.Vector3(Math.sin(angle) * 30, 0, Math.cos(angle) * 30), angle };
            this.group.add(bladeGroup);
            this.blades.push(bladeGroup);
        }
        
        this.light = new THREE.PointLight(0xaaccff, 3, 15);
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        this.blades.forEach(blade => {
            blade.position.add(blade.userData.velocity.clone().multiplyScalar(delta));
        });
        
        this.light.intensity = 3 * (this.life / 2);
        return this.life > 0;
    }
    
    dispose() {
        this.blades.forEach(blade => {
            blade.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
    }
}

export class TornadoEffect {
    constructor(targetPos, damage, dotDamage, dotDuration, radius, duration, moveSpeed) {
        this.damage = damage;
        this.dotDamage = dotDamage;
        this.dotDuration = dotDuration;
        this.radius = radius;
        this.duration = duration;
        this.moveSpeed = moveSpeed;
        this.life = duration;
        this.time = 0;
        
        this.group = new THREE.Group();
        this.group.position.copy(targetPos);
        this.group.position.y = 0;
        
        const particleCount = 500;
        const positions = new Float32Array(particleCount * 3);
        this.rotations = [];
        
        for (let i = 0; i < particleCount; i++) {
            const r = 0.5 + Math.random() * radius;
            const h = Math.random() * 8;
            const a = Math.random() * Math.PI * 2;
            positions[i * 3] = Math.cos(a) * r;
            positions[i * 3 + 1] = h;
            positions[i * 3 + 2] = Math.sin(a) * r;
            this.rotations.push({ r, h, a, speed: 2 + Math.random() * 3, rise: 0.5 + Math.random() * 0.5 });
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const mat = new THREE.PointsMaterial({
            size: 0.8,
            color: 0xaaddff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.NormalBlending,
            depthWrite: false
        });
        
        this.particles = new THREE.Points(geo, mat);
        this.group.add(this.particles);
        
        this.light = new THREE.PointLight(0xaaccff, 5, 30);
        this.light.position.y = 3;
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const posArray = this.particles.geometry.attributes.position.array;
        for (let i = 0; i < this.rotations.length; i++) {
            const rot = this.rotations[i];
            rot.a += delta * rot.speed;
            rot.h += delta * rot.rise;
            if (rot.h > 8) rot.h = 0;
            rot.r += 0.01;
            
            posArray[i * 3] = Math.cos(rot.a) * rot.r;
            posArray[i * 3 + 1] = rot.h;
            posArray[i * 3 + 2] = Math.sin(rot.a) * rot.r;
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
        
        if (this.life < 1.0) {
            const opacity = this.life;
            this.particles.material.opacity = opacity * 0.9;
            this.light.intensity = 5 * this.life;
        }
        
        return this.life > 0;
    }
    
    dispose() {
        this.particles.geometry.dispose();
        this.particles.material.dispose();
    }
}

export class TornadoRingEffect {
    constructor(startPos, forwardDir, damage, radius, duration) {
        this.damage = damage;
        this.radius = radius;
        this.duration = duration;
        this.life = duration;
        this.time = 0;
        
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        this.group.position.y = 0;
        
        this.tornadoes = [];
        const tornadoCount = 5;
        
        for (let t = 0; t < tornadoCount; t++) {
            const angle = (t / tornadoCount) * Math.PI * 2;
            const tornadoData = {
                pos: new THREE.Vector3(Math.cos(angle) * 2, 0, Math.sin(angle) * 2),
                velocity: new THREE.Vector3(Math.cos(angle) * 5, 0, Math.sin(angle) * 5),
                rotations: []
            };
            
            const particleCount = 100;
            const positions = new Float32Array(particleCount * 3);
            
            for (let i = 0; i < particleCount; i++) {
                const r = 0.3 + Math.random() * 1.5;
                const h = Math.random() * 4;
                const a = Math.random() * Math.PI * 2;
                positions[i * 3] = Math.cos(a) * r;
                positions[i * 3 + 1] = h;
                positions[i * 3 + 2] = Math.sin(a) * r;
                tornadoData.rotations.push({ r, h, a, speed: 3 + Math.random() * 4, rise: 0.8 + Math.random() * 0.5 });
            }
            
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const mat = new THREE.PointsMaterial({
                size: 0.6,
                color: 0xaaddff,
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
        
        this.light = new THREE.PointLight(0xaaccff, 5, 30);
        this.light.position.y = 3;
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        for (const tornado of this.tornadoes) {
            tornado.pos.add(tornado.velocity);
            tornado.velocity.multiplyScalar(0.99);
            
            const posArray = tornado.particles.geometry.attributes.position.array;
            for (let i = 0; i < tornado.rotations.length; i++) {
                const rot = tornado.rotations[i];
                rot.a += delta * rot.speed;
                rot.h += delta * rot.rise;
                if (rot.h > 2.5) rot.h = 0;
                rot.r += 0.01;
                
                posArray[i * 3] = tornado.pos.x + Math.cos(rot.a) * rot.r;
                posArray[i * 3 + 1] = rot.h;
                posArray[i * 3 + 2] = tornado.pos.z + Math.sin(rot.a) * rot.r;
            }
            tornado.particles.geometry.attributes.position.needsUpdate = true;
        }
        
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
