import * as THREE from 'three';

export class WrathEffect {
    constructor(startPos, targetPos, damage) {
        this.damage = damage;
        this.life = 1.5;
        this.time = 0;
        this.group = new THREE.Group();
        this.startPos = startPos.clone();
        this.targetPos = targetPos.clone();
        
        const ballGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const ballMat = new THREE.MeshBasicMaterial({ color: 0x88dd44, transparent: true, opacity: 0.9 });
        this.ball = new THREE.Mesh(ballGeo, ballMat);
        this.ball.position.copy(startPos);
        this.group.add(this.ball);
        
        this.leaves = [];
        for (let i = 0; i < 8; i++) {
            const leafGeo = new THREE.SphereGeometry(0.1, 4, 4);
            const leafMat = new THREE.MeshBasicMaterial({ color: 0x66aa33, transparent: true, opacity: 0.8 });
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.userData = { angle: (i / 8) * Math.PI * 2, radius: 0.6, speed: 5 };
            this.group.add(leaf);
            this.leaves.push(leaf);
        }
        
        this.light = new THREE.PointLight(0x88dd44, 2, 10);
        this.ball.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const flyDuration = 0.8;
        const progress = Math.min(this.time / flyDuration, 1);
        
        this.ball.position.lerpVectors(this.startPos, this.targetPos, progress);
        this.ball.rotation.x += delta * 3;
        
        this.leaves.forEach(leaf => {
            leaf.userData.angle += delta * leaf.userData.speed;
            const angle = leaf.userData.angle;
            const r = leaf.userData.radius;
            leaf.position.copy(this.ball.position);
            leaf.position.x += Math.cos(angle) * r;
            leaf.position.z += Math.sin(angle) * r;
            leaf.position.y += Math.sin(angle * 2) * 0.3;
        });
        
        if (progress >= 1) {
            this.ball.material.opacity *= 0.9;
            this.leaves.forEach(l => l.material.opacity *= 0.85);
        }
        
        return this.life > 0;
    }
    
    dispose() {
        this.ball.geometry.dispose();
        this.ball.material.dispose();
        this.leaves.forEach(l => { l.geometry.dispose(); l.material.dispose(); });
    }
}

export class RejuvenationEffect {
    constructor(startPos, healAmount) {
        this.healAmount = healAmount;
        this.life = 3.0;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        this.particles = [];
        for (let i = 0; i < 80; i++) {
            const pGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.1, 4, 4);
            const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.3 + Math.random() * 0.1, 0.7, 0.5), transparent: true, opacity: 0.8 });
            const particle = new THREE.Mesh(pGeo, pMat);
            const theta = Math.random() * Math.PI * 2;
            const r = Math.random() * 1.5;
            particle.position.set(r * Math.cos(theta), Math.random() * 3, r * Math.sin(theta));
            particle.userData = { baseTheta: theta, baseR: r, speed: 0.8 + Math.random() * 1.2, phase: Math.random() * Math.PI * 2 };
            this.group.add(particle);
            this.particles.push(particle);
        }
        
        this.rings = [];
        for (let i = 0; i < 3; i++) {
            const ringGeo = new THREE.TorusGeometry(0.8 + i * 0.4, 0.06, 8, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x88cc55, transparent: true, opacity: 0.5 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.y = 0.5;
            ring.userData = { delay: i * 0.3, baseY: 0.5 };
            this.group.add(ring);
            this.rings.push(ring);
        }
        
        this.light = new THREE.PointLight(0x88ff66, 2, 15);
        this.light.position.y = 2;
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        this.particles.forEach(p => {
            p.position.y += delta * p.userData.speed;
            if (p.position.y > 4) p.position.y = 0;
            p.userData.baseTheta += delta;
            const r = p.userData.baseR;
            p.position.x = r * Math.cos(p.userData.baseTheta);
            p.position.z = r * Math.sin(p.userData.baseTheta);
            p.material.opacity = 0.8 * (this.life / 3);
        });
        
        this.rings.forEach(r => {
            const age = this.time - r.userData.delay;
            if (age > 0) {
                r.position.y = r.userData.baseY + (age % 1) * 3;
                r.rotation.z = age * 2;
                r.material.opacity = 0.5 * (1 - (age % 1)) * (this.life / 3);
            }
        });
        
        this.light.intensity = 2 * (this.life / 3);
        return this.life > 0;
    }
    
    dispose() {
        this.particles.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
        this.rings.forEach(r => { r.geometry.dispose(); r.material.dispose(); });
    }
}

export class ThornsEffect {
    constructor(startPos, damage) {
        this.damage = damage;
        this.life = 2.5;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        this.thorns = [];
        for (let i = 0; i < 12; i++) {
            const thornGeo = new THREE.ConeGeometry(0.15, 1.2, 4);
            const thornMat = new THREE.MeshBasicMaterial({ color: 0x668844, transparent: true, opacity: 0.9 });
            const thorn = new THREE.Mesh(thornGeo, thornMat);
            const angle = (i / 12) * Math.PI * 2;
            thorn.position.set(Math.cos(angle) * 2, 0.6, Math.sin(angle) * 2);
            thorn.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
            thorn.rotation.y = angle;
            thorn.userData = { baseAngle: angle, delay: Math.random() * 0.3 };
            this.group.add(thorn);
            this.thorns.push(thorn);
        }
        
        this.auraParticles = [];
        for (let i = 0; i < 50; i++) {
            const pGeo = new THREE.OctahedronGeometry(0.08 + Math.random() * 0.08, 0);
            const pMat = new THREE.MeshBasicMaterial({ color: 0x88aa55, transparent: true, opacity: 0.7 });
            const particle = new THREE.Mesh(pGeo, pMat);
            const theta = Math.random() * Math.PI * 2;
            const r = 1.5 + Math.random() * 1.5;
            particle.position.set(r * Math.cos(theta), Math.random() * 2.5, r * Math.sin(theta));
            particle.userData = { baseTheta: theta, baseR: r, speed: 1 + Math.random() * 2, spinSpeed: 2 + Math.random() * 4 };
            this.group.add(particle);
            this.auraParticles.push(particle);
        }
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        this.thorns.forEach(thorn => {
            const age = this.time - thorn.userData.delay;
            if (age > 0) {
                const scale = 1 + Math.sin(this.time * 6) * 0.15;
                thorn.scale.setScalar(scale);
            }
            thorn.material.opacity = 0.9 * (this.life / 2.5);
        });
        
        this.auraParticles.forEach(p => {
            p.userData.baseTheta += delta * p.userData.speed;
            p.position.x = p.userData.baseR * Math.cos(p.userData.baseTheta);
            p.position.z = p.userData.baseR * Math.sin(p.userData.baseTheta);
            p.rotation.x += delta * p.userData.spinSpeed;
            p.material.opacity = 0.7 * (this.life / 2.5);
        });
        
        return this.life > 0;
    }
    
    dispose() {
        this.thorns.forEach(t => { t.geometry.dispose(); t.material.dispose(); });
        this.auraParticles.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
    }
}

export class SunfireEffect {
    constructor(startPos, damage, radius = 8) {
        this.damage = damage;
        this.radius = radius;
        this.life = 2.5;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        const sunGeo = new THREE.SphereGeometry(0.6, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 1 });
        this.sun = new THREE.Mesh(sunGeo, sunMat);
        this.sun.position.y = 2;
        this.group.add(this.sun);
        
        this.flares = [];
        for (let i = 0; i < 150; i++) {
            const pGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.15, 4, 4);
            const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.1 + Math.random() * 0.05, 1, 0.5 + Math.random() * 0.3), transparent: true, opacity: 0.9 });
            const particle = new THREE.Mesh(pGeo, pMat);
            
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = 0.7 + Math.random() * 0.5;
            particle.position.set(r * Math.sin(phi) * Math.cos(theta), 2 + r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
            
            const speed = 2 + Math.random() * 4;
            particle.userData = { velocity: new THREE.Vector3(speed * Math.sin(phi) * Math.cos(theta), speed * Math.cos(phi), speed * Math.sin(phi) * Math.sin(theta)) };
            this.group.add(particle);
            this.flares.push(particle);
        }
        
        this.light = new THREE.PointLight(0xffaa00, 5, 20);
        this.light.position.y = 2;
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const scale = 1 + Math.sin(this.time * 8) * 0.2;
        this.sun.scale.setScalar(scale);
        this.sun.material.opacity = this.life / 2.5;
        
        this.flares.forEach(f => {
            f.position.add(f.userData.velocity.clone().multiplyScalar(delta));
            f.userData.velocity.multiplyScalar(0.98);
            f.material.opacity *= 0.98;
        });
        
        this.light.intensity = 5 * (1 + Math.sin(this.time * 10) * 0.3) * (this.life / 2.5);
        return this.life > 0;
    }
    
    dispose() {
        this.sun.geometry.dispose();
        this.sun.material.dispose();
        this.flares.forEach(f => { f.geometry.dispose(); f.material.dispose(); });
    }
}

export class BearformEffect {
    constructor(startPos) {
        this.life = 3.0;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        this.transformParticles = [];
        for (let i = 0; i < 150; i++) {
            const pGeo = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 4, 4);
            const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.08 + Math.random() * 0.04, 0.5, 0.3 + Math.random() * 0.2), transparent: true, opacity: 0.8 });
            const particle = new THREE.Mesh(pGeo, pMat);
            const theta = Math.random() * Math.PI * 2;
            const r = 3 + Math.random() * 3;
            particle.position.set(r * Math.cos(theta), Math.random() * 4, r * Math.sin(theta));
            particle.userData = { targetR: 0.5 + Math.random() * 0.5, targetTheta: Math.random() * Math.PI * 2, targetY: 0.5 + Math.random() * 2, speed: 2 + Math.random() * 3 };
            this.group.add(particle);
            this.transformParticles.push(particle);
        }
        
        const bearGeo = new THREE.CapsuleGeometry(0.8, 1.5, 8, 16);
        const bearMat = new THREE.MeshBasicMaterial({ color: 0x665533, transparent: true, opacity: 0 });
        this.bear = new THREE.Mesh(bearGeo, bearMat);
        this.bear.position.y = 1.3;
        this.group.add(this.bear);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const convergeTime = 1;
        if (this.time < convergeTime) {
            this.transformParticles.forEach(p => {
                p.position.x += (p.userData.targetR * Math.cos(p.userData.targetTheta) - p.position.x) * delta * p.userData.speed;
                p.position.y += (p.userData.targetY - p.position.y) * delta * p.userData.speed;
                p.position.z += (p.userData.targetR * Math.sin(p.userData.targetTheta) - p.position.z) * delta * p.userData.speed;
            });
            this.bear.material.opacity = (this.time / convergeTime) * 0.9;
        } else {
            this.bear.material.opacity = 0.9;
        }
        
        if (this.time > 2) {
            this.transformParticles.forEach(p => p.material.opacity *= 0.95);
            this.bear.material.opacity *= 0.95;
        }
        
        return this.life > 0;
    }
    
    dispose() {
        this.transformParticles.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
        this.bear.geometry.dispose();
        this.bear.material.dispose();
    }
}

export class TranquilityEffect {
    constructor(startPos, healAmount, radius = 15) {
        this.healAmount = healAmount;
        this.radius = radius;
        this.life = 4.0;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        this.petals = [];
        for (let i = 0; i < 60; i++) {
            const petalGeo = new THREE.SphereGeometry(0.08, 4, 4);
            const petalMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.9 + Math.random() * 0.1, 0.5, 0.7 + Math.random() * 0.2), transparent: true, opacity: 0.8 });
            const petal = new THREE.Mesh(petalGeo, petalMat);
            const theta = Math.random() * Math.PI * 2;
            const r = Math.random() * 5;
            petal.position.set(r * Math.cos(theta), 5 + Math.random() * 5, r * Math.sin(theta));
            petal.userData = { fallSpeed: 0.5 + Math.random() * 0.5, swayPhase: Math.random() * Math.PI * 2, swaySpeed: 1 + Math.random() * 2, swayAmount: 0.5 + Math.random() * 0.5 };
            this.group.add(petal);
            this.petals.push(petal);
        }
        
        this.healingEnergy = [];
        for (let i = 0; i < 100; i++) {
            const pGeo = new THREE.SphereGeometry(0.05 + Math.random() * 0.08, 4, 4);
            const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.35 + Math.random() * 0.1, 0.7, 0.6), transparent: true, opacity: 0.7 });
            const particle = new THREE.Mesh(pGeo, pMat);
            const theta = Math.random() * Math.PI * 2;
            const r = Math.random() * 4;
            particle.position.set(r * Math.cos(theta), Math.random() * 3, r * Math.sin(theta));
            particle.userData = { baseTheta: theta, baseR: r, speed: 0.5 + Math.random() * 1 };
            this.group.add(particle);
            this.healingEnergy.push(particle);
        }
        
        this.light = new THREE.PointLight(0x88ff66, 2, 15);
        this.light.position.y = 2;
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        this.petals.forEach(petal => {
            petal.position.y -= delta * petal.userData.fallSpeed;
            petal.position.x += Math.sin(this.time * petal.userData.swaySpeed + petal.userData.swayPhase) * delta * petal.userData.swayAmount;
            petal.position.z += Math.cos(this.time * petal.userData.swaySpeed + petal.userData.swayPhase) * delta * petal.userData.swayAmount;
            if (petal.position.y < 0) {
                petal.position.y = 8;
                const theta = Math.random() * Math.PI * 2;
                const r = Math.random() * 5;
                petal.position.x = r * Math.cos(theta);
                petal.position.z = r * Math.sin(theta);
            }
            petal.material.opacity = 0.8 * (this.life / 4);
        });
        
        this.healingEnergy.forEach(p => {
            p.position.y += delta * p.userData.speed;
            if (p.position.y > 4) p.position.y = 0;
            p.userData.baseTheta += delta;
            p.position.x = p.userData.baseR * Math.cos(p.userData.baseTheta);
            p.position.z = p.userData.baseR * Math.sin(p.userData.baseTheta);
            p.material.opacity = 0.7 * (this.life / 4);
        });
        
        this.light.intensity = 2 * (this.life / 4);
        return this.life > 0;
    }
    
    dispose() {
        this.petals.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
        this.healingEnergy.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
    }
}
