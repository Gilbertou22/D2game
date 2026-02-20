import * as THREE from 'three';

export class SlashEffect {
    constructor(startPos, forwardDir, damage, range = 5) {
        this.damage = damage;
        this.life = 1.0;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        this.slashArcs = [];
        for (let i = 0; i < 3; i++) {
            const curve = new THREE.EllipseCurve(0, 0, range + i * 0.3, (range + i * 0.2) * 0.7, -Math.PI / 2, Math.PI / 2, false, 0);
            const points = curve.getPoints(30);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: new THREE.Color().setHSL(0, 0.8, 0.5 + i * 0.1), transparent: true, opacity: 1 - i * 0.2 });
            const arc = new THREE.Line(geometry, material);
            arc.position.set(0, 1.5, -1);
            arc.rotation.x = -Math.PI / 6;
            arc.userData = { delay: i * 0.05 };
            this.group.add(arc);
            this.slashArcs.push(arc);
        }
        
        this.sparks = [];
        const sparkGeo = new THREE.SphereGeometry(0.06, 4, 4);
        for (let i = 0; i < 40; i++) {
            const sparkMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.08, 1, 0.6), transparent: true, opacity: 1 });
            const spark = new THREE.Mesh(sparkGeo, sparkMat);
            const angle = (Math.random() - 0.5) * Math.PI;
            const r = range * 0.5 + Math.random() * range * 0.5;
            spark.position.set(r * Math.sin(angle), 1.5 + (Math.random() - 0.5) * 1.5, r * Math.cos(angle) - 1);
            spark.userData = { velocity: new THREE.Vector3(Math.sin(angle) * (3 + Math.random() * 3), 1 + Math.random() * 3, Math.cos(angle) * (3 + Math.random() * 3)) };
            this.group.add(spark);
            this.sparks.push(spark);
        }
        
        this.light = new THREE.PointLight(0xff6644, 3, 10);
        this.light.position.set(0, 1.5, 0);
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        this.slashArcs.forEach((arc, i) => {
            const age = this.time - arc.userData.delay;
            if (age > 0) {
                arc.material.opacity = Math.max(0, (1 - i * 0.2) * (1 - age * 3));
                const scale = 1 + age * 2;
                arc.scale.set(scale, scale, 1);
            }
        });
        
        this.sparks.forEach(s => {
            s.position.add(s.userData.velocity.clone().multiplyScalar(delta));
            s.userData.velocity.y -= delta * 15;
            s.material.opacity *= 0.95;
        });
        
        this.light.intensity *= 0.9;
        return this.life > 0;
    }
    
    dispose() {
        this.slashArcs.forEach(arc => { arc.geometry.dispose(); arc.material.dispose(); });
        this.sparks.forEach(s => { s.geometry.dispose(); s.material.dispose(); });
    }
}

export class ChargeEffect {
    constructor(startPos, targetPos, damage) {
        this.damage = damage;
        this.life = 1.5;
        this.time = 0;
        this.group = new THREE.Group();
        this.startPos = startPos.clone();
        this.targetPos = targetPos.clone();
        
        this.trail = [];
        for (let i = 0; i < 50; i++) {
            const pGeo = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 4, 4);
            const pMat = new THREE.MeshBasicMaterial({ color: 0x886644, transparent: true, opacity: 0.7 });
            const particle = new THREE.Mesh(pGeo, pMat);
            particle.position.copy(startPos);
            particle.position.x += (Math.random() - 0.5) * 2;
            particle.position.z += (Math.random() - 0.5) * 2;
            particle.userData = { delay: Math.random() * 0.5 };
            this.group.add(particle);
            this.trail.push(particle);
        }
        
        this.speedLines = [];
        for (let i = 0; i < 20; i++) {
            const lineGeo = new THREE.BufferGeometry();
            const y = 0.5 + Math.random() * 2;
            const z = (Math.random() - 0.5) * 2;
            lineGeo.setFromPoints([new THREE.Vector3(0, y, z), new THREE.Vector3(-0.5 - Math.random() * 0.5, y, z)]);
            const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
            const line = new THREE.Line(lineGeo, lineMat);
            line.userData = { delay: Math.random() * 0.3 };
            this.group.add(line);
            this.speedLines.push(line);
        }
        
        this.hasImpacted = false;
        this.impactParticles = [];
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const chargeDuration = 0.4;
        const direction = this.targetPos.clone().sub(this.startPos);
        const distance = direction.length();
        direction.normalize();
        
        if (this.time < chargeDuration) {
            const progress = this.time / chargeDuration;
            this.speedLines.forEach(line => { line.position.copy(this.startPos).add(direction.clone().multiplyScalar(progress * distance)); });
            this.trail.forEach(p => {
                if (this.time > p.userData.delay) {
                    p.position.add(direction.clone().multiplyScalar(delta * 30));
                    p.material.opacity *= 0.95;
                }
            });
        } else if (!this.hasImpacted) {
            this.hasImpacted = true;
            this.createImpact();
        }
        
        if (this.hasImpacted) {
            this.impactParticles.forEach(p => {
                p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
                p.userData.velocity.y -= delta * 10;
                p.material.opacity *= 0.94;
            });
            if (this.shockwave) {
                const age = this.time - chargeDuration;
                const scale = 1 + age * 12;
                this.shockwave.scale.set(scale, scale, 1);
                this.shockwave.material.opacity = Math.max(0, 1 - age * 1.5);
            }
        }
        
        return this.life > 0;
    }
    
    createImpact() {
        for (let i = 0; i < 40; i++) {
            const pGeo = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 6, 6);
            const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0, 0.7, 0.5), transparent: true, opacity: 1 });
            const particle = new THREE.Mesh(pGeo, pMat);
            particle.position.copy(this.targetPos);
            particle.position.y += 1.5;
            const theta = Math.random() * Math.PI * 2;
            const speed = 5 + Math.random() * 10;
            particle.userData = { velocity: new THREE.Vector3(speed * Math.cos(theta), 3 + Math.random() * 5, speed * Math.sin(theta)) };
            this.group.add(particle);
            this.impactParticles.push(particle);
        }
        
        const ringGeo = new THREE.RingGeometry(0.3, 0.8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff6644, transparent: true, opacity: 1, side: THREE.DoubleSide });
        this.shockwave = new THREE.Mesh(ringGeo, ringMat);
        this.shockwave.rotation.x = -Math.PI / 2;
        this.shockwave.position.copy(this.targetPos);
        this.shockwave.position.y += 0.1;
        this.group.add(this.shockwave);
    }
    
    dispose() {
        this.trail.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
        this.speedLines.forEach(l => { l.geometry.dispose(); l.material.dispose(); });
        this.impactParticles.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
    }
}

export class WhirlwindEffect {
    constructor(startPos, damage, radius = 4) {
        this.damage = damage;
        this.radius = radius;
        this.life = 2.5;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        this.blades = [];
        for (let i = 0; i < 6; i++) {
            const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.75, 0, Math.PI * 2, false, 0);
            const points = curve.getPoints(48);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: new THREE.Color().setHSL(0, 0.7, 0.5 + (i % 2) * 0.15), transparent: true, opacity: 0.8 });
            const blade = new THREE.Line(geometry, material);
            blade.rotation.x = Math.PI / 2;
            blade.position.y = 0.5 + i * 0.3;
            blade.userData = { speed: 8 + i * 0.5, direction: i % 2 === 0 ? 1 : -1 };
            this.group.add(blade);
            this.blades.push(blade);
        }
        
        this.innerParticles = [];
        for (let i = 0; i < 100; i++) {
            const pGeo = new THREE.SphereGeometry(0.05 + Math.random() * 0.08, 4, 4);
            const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0, 0.6, 0.4 + Math.random() * 0.3), transparent: true, opacity: 0.8 });
            const particle = new THREE.Mesh(pGeo, pMat);
            const theta = Math.random() * Math.PI * 2;
            const r = Math.random() * radius;
            particle.position.set(r * Math.cos(theta), Math.random() * 3, r * Math.sin(theta));
            particle.userData = { baseR: r, baseTheta: theta, speed: 2 + Math.random() * 3 };
            this.group.add(particle);
            this.innerParticles.push(particle);
        }
        
        this.light = new THREE.PointLight(0xff4444, 3, 15);
        this.light.position.y = 1.5;
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        this.blades.forEach(blade => {
            blade.rotation.z += delta * blade.userData.speed * blade.userData.direction;
            blade.material.opacity = 0.8 * (1 - this.time / 2.5);
        });
        
        this.innerParticles.forEach(p => {
            p.userData.baseTheta += delta * p.userData.speed;
            p.position.x = p.userData.baseR * Math.cos(p.userData.baseTheta);
            p.position.z = p.userData.baseR * Math.sin(p.userData.baseTheta);
            p.material.opacity = 0.8 * (1 - this.time / 2.5);
        });
        
        this.light.intensity = 3 * (this.life / 2.5);
        return this.life > 0;
    }
    
    dispose() {
        this.blades.forEach(b => { b.geometry.dispose(); b.material.dispose(); });
        this.innerParticles.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
    }
}

export class ShieldBashEffect {
    constructor(startPos, targetPos, damage) {
        this.damage = damage;
        this.life = 1.0;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        const shieldShape = new THREE.Shape();
        shieldShape.moveTo(0, -1.2);
        shieldShape.quadraticCurveTo(0.8, -0.8, 0.8, 0);
        shieldShape.quadraticCurveTo(0.8, 0.8, 0, 1.2);
        shieldShape.quadraticCurveTo(-0.8, 0.8, -0.8, 0);
        shieldShape.quadraticCurveTo(-0.8, -0.8, 0, -1.2);
        
        const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, { depth: 0.2, bevelEnabled: false });
        const shieldMat = new THREE.MeshBasicMaterial({ color: 0xccaa44, transparent: true, opacity: 0.9 });
        this.shield = new THREE.Mesh(shieldGeo, shieldMat);
        this.shield.position.set(-3, 1.5, 0);
        this.shield.rotation.y = Math.PI / 2;
        this.shield.scale.set(0.5, 0.5, 0.5);
        this.group.add(this.shield);
        
        this.impactParticles = [];
        for (let i = 0; i < 50; i++) {
            const pGeo = new THREE.SphereGeometry(0.05 + Math.random() * 0.1, 4, 4);
            const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.12, 0.6, 0.5 + Math.random() * 0.3), transparent: true, opacity: 1 });
            const particle = new THREE.Mesh(pGeo, pMat);
            particle.position.set(0, 1.5, 0);
            const theta = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 6;
            particle.userData = { velocity: new THREE.Vector3(speed * Math.cos(theta), (Math.random() - 0.5) * 4, speed * Math.sin(theta)) };
            this.group.add(particle);
            this.impactParticles.push(particle);
        }
        
        const ringGeo = new THREE.RingGeometry(0.5, 0.8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xddcc66, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
        this.shockwave = new THREE.Mesh(ringGeo, ringMat);
        this.shockwave.position.set(0, 1.5, 0);
        this.shockwave.rotation.y = Math.PI / 2;
        this.group.add(this.shockwave);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const bashDuration = 0.3;
        if (this.time < bashDuration) {
            const progress = this.time / bashDuration;
            this.shield.position.x = -3 + progress * 3;
        } else {
            this.shield.position.x = 0;
            this.shield.material.opacity *= 0.9;
        }
        
        this.impactParticles.forEach(p => {
            p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
            p.userData.velocity.multiplyScalar(0.95);
            p.material.opacity *= 0.96;
        });
        
        const scale = 1 + this.time * 8;
        this.shockwave.scale.set(scale, scale, 1);
        this.shockwave.material.opacity = Math.max(0, 0.8 - this.time);
        
        return this.life > 0;
    }
    
    dispose() {
        this.shield.geometry.dispose();
        this.shield.material.dispose();
        this.shockwave.geometry.dispose();
        this.shockwave.material.dispose();
        this.impactParticles.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
    }
}

export class BattlecryEffect {
    constructor(startPos) {
        this.life = 2.0;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        this.waves = [];
        for (let i = 0; i < 5; i++) {
            const ringGeo = new THREE.TorusGeometry(0.5, 0.1, 8, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.8 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.y = 1.5;
            ring.userData = { delay: i * 0.2 };
            this.group.add(ring);
            this.waves.push(ring);
        }
        
        this.auraParticles = [];
        for (let i = 0; i < 60; i++) {
            const pGeo = new THREE.SphereGeometry(0.08 + Math.random() * 0.1, 4, 4);
            const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0, 0.8, 0.5 + Math.random() * 0.2), transparent: true, opacity: 0.8 });
            const particle = new THREE.Mesh(pGeo, pMat);
            const theta = Math.random() * Math.PI * 2;
            const r = 1 + Math.random() * 2;
            particle.position.set(r * Math.cos(theta), Math.random() * 3, r * Math.sin(theta));
            particle.userData = { baseTheta: theta, baseR: r, speed: 1 + Math.random() * 2, phase: Math.random() * Math.PI * 2 };
            this.group.add(particle);
            this.auraParticles.push(particle);
        }
        
        this.light = new THREE.PointLight(0xff3333, 3, 15);
        this.light.position.y = 1.5;
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        this.waves.forEach(wave => {
            const age = this.time - wave.userData.delay;
            if (age > 0) {
                const scale = 1 + age * 8;
                wave.scale.set(scale, scale, 1);
                wave.rotation.y = age * 2;
                wave.material.opacity = Math.max(0, 0.8 - age * 0.5);
            }
        });
        
        this.auraParticles.forEach(p => {
            p.position.y += delta * p.userData.speed;
            p.position.x = p.userData.baseR * Math.cos(p.userData.baseTheta + this.time);
            p.position.z = p.userData.baseR * Math.sin(p.userData.baseTheta + this.time);
            if (p.position.y > 4) p.position.y = 0;
            p.material.opacity = 0.8 * (1 - this.time / 2);
        });
        
        this.light.intensity = 3 * (this.life / 2);
        return this.life > 0;
    }
    
    dispose() {
        this.waves.forEach(w => { w.geometry.dispose(); w.material.dispose(); });
        this.auraParticles.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
    }
}

export class ExecuteEffect {
    constructor(startPos, targetPos, damage) {
        this.damage = damage;
        this.life = 1.5;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(targetPos);
        
        this.blades = [];
        const bladeCurve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 0, -3),
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, 3)
        );
        
        for (let i = 0; i < 5; i++) {
            const points = [];
            for (let t = 0; t <= 1; t += 0.05) {
                const point = bladeCurve.getPoint(t);
                point.x += Math.sin(t * Math.PI) * (3 + i * 0.5);
                points.push(point);
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: new THREE.Color().setHSL(0, 0, 0.3 + i * 0.1), transparent: true, opacity: 1 });
            const blade = new THREE.Line(geometry, material);
            blade.rotation.x = Math.PI / 2;
            blade.position.y = 8;
            blade.userData = { delay: i * 0.03, startY: 8 };
            this.group.add(blade);
            this.blades.push(blade);
        }
        
        this.particles = [];
        for (let i = 0; i < 80; i++) {
            const pGeo = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 4, 4);
            const pMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0, 0.8, 0.2 + Math.random() * 0.2), transparent: true, opacity: 1 });
            const particle = new THREE.Mesh(pGeo, pMat);
            particle.position.set((Math.random() - 0.5) * 4, 1.5 + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 6);
            particle.userData = { velocity: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 5, (Math.random() - 0.5) * 8), delay: 0.3 + Math.random() * 0.2 };
            this.group.add(particle);
            this.particles.push(particle);
        }
        
        this.light = new THREE.PointLight(0x330000, 5, 15);
        this.light.position.y = 1.5;
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        this.blades.forEach(blade => {
            const age = this.time - blade.userData.delay;
            if (age > 0) {
                blade.position.y = Math.max(0.5, blade.userData.startY - age * 15);
                blade.material.opacity = Math.max(0, 1 - age);
            }
        });
        
        this.particles.forEach(p => {
            if (this.time > p.userData.delay) {
                p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
                p.userData.velocity.y -= delta * 10;
                p.material.opacity *= 0.96;
            }
        });
        
        return this.life > 0;
    }
    
    dispose() {
        this.blades.forEach(b => { b.geometry.dispose(); b.material.dispose(); });
        this.particles.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
    }
}
