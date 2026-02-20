import * as THREE from 'three';

export class QuickshotEffect {
    constructor(startPos, targetPos, damage) {
        this.damage = damage;
        this.life = 1.0;
        this.time = 0;
        this.group = new THREE.Group();
        this.startPos = startPos.clone();
        this.targetPos = targetPos.clone();
        
        const direction = targetPos.clone().sub(startPos).normalize();
        
        const arrowGeo = new THREE.ConeGeometry(0.08, 1.2, 6);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0x66aa66, transparent: true, opacity: 1 });
        this.arrow = new THREE.Mesh(arrowGeo, arrowMat);
        this.arrow.position.copy(startPos);
        this.arrow.lookAt(targetPos);
        this.arrow.rotateX(Math.PI / 2);
        this.group.add(this.arrow);
        
        this.velocity = direction.multiplyScalar(25);
        
        this.trail = [];
        for (let i = 0; i < 15; i++) {
            const pGeo = new THREE.SphereGeometry(0.03 + Math.random() * 0.05, 4, 4);
            const pMat = new THREE.MeshBasicMaterial({ color: 0x88cc88, transparent: true, opacity: 0.6 });
            const particle = new THREE.Mesh(pGeo, pMat);
            this.group.add(particle);
            this.trail.push(particle);
        }
        
        this.light = new THREE.PointLight(0x88ff88, 1, 8);
        this.arrow.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        this.arrow.position.add(this.velocity.clone().multiplyScalar(delta));
        
        const distToTarget = this.arrow.position.distanceTo(this.targetPos);
        if (distToTarget < 1) this.arrow.material.opacity *= 0.8;
        
        this.trail.forEach((p, i) => {
            p.position.copy(this.arrow.position);
            p.position.x -= (i + 1) * 0.1 * (this.velocity.x / 25);
            p.position.z -= (i + 1) * 0.1 * (this.velocity.z / 25);
            p.material.opacity *= 0.95;
        });
        
        return this.life > 0;
    }
    
    dispose() {
        this.arrow.geometry.dispose();
        this.arrow.material.dispose();
        this.trail.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
    }
}

export class MultishotEffect {
    constructor(startPos, targetPos, damage, arrowCount = 5) {
        this.damage = damage;
        this.life = 1.2;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        const direction = targetPos.clone().sub(startPos).normalize();
        const baseAngle = Math.atan2(direction.x, direction.z);
        
        this.arrows = [];
        for (let i = 0; i < arrowCount; i++) {
            const arrowGeo = new THREE.ConeGeometry(0.06, 0.8, 6);
            const arrowMat = new THREE.MeshBasicMaterial({ color: 0x55aa55, transparent: true, opacity: 1 });
            const arrow = new THREE.Mesh(arrowGeo, arrowMat);
            
            const angleOffset = ((i / (arrowCount - 1)) - 0.5) * (Math.PI / 3);
            const angle = baseAngle + angleOffset;
            arrow.userData = { velocity: new THREE.Vector3(Math.sin(angle) * 20, 0, Math.cos(angle) * 20) };
            this.group.add(arrow);
            this.arrows.push(arrow);
        }
        
        this.flash = new THREE.PointLight(0x88ff88, 3, 10);
        this.group.add(this.flash);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        this.arrows.forEach(arrow => {
            arrow.position.add(arrow.userData.velocity.clone().multiplyScalar(delta));
            arrow.material.opacity *= 0.98;
        });
        
        this.flash.intensity *= 0.9;
        return this.life > 0;
    }
    
    dispose() {
        this.arrows.forEach(a => { a.geometry.dispose(); a.material.dispose(); });
    }
}

export class ArrowrainEffect {
    constructor(targetPos, damage, radius = 10) {
        this.damage = damage;
        this.radius = radius;
        this.life = 3.0;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(targetPos);
        this.group.position.y = 0;
        
        this.arrows = [];
        for (let i = 0; i < 60; i++) {
            const arrowGeo = new THREE.ConeGeometry(0.04, 0.6, 4);
            const arrowMat = new THREE.MeshBasicMaterial({ color: 0x66aa66, transparent: true, opacity: 0.8 });
            const arrow = new THREE.Mesh(arrowGeo, arrowMat);
            arrow.rotation.x = Math.PI;
            arrow.position.set((Math.random() - 0.5) * radius * 2, 15 + Math.random() * 8, (Math.random() - 0.5) * radius * 2);
            arrow.userData = { speed: 15 + Math.random() * 10, delay: Math.random() * 1.5, fallen: false };
            this.group.add(arrow);
            this.arrows.push(arrow);
        }
        
        this.impacts = [];
        
        const targetGeo = new THREE.RingGeometry(radius * 0.8, radius, 32);
        const targetMat = new THREE.MeshBasicMaterial({ color: 0x44aa44, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        this.target = new THREE.Mesh(targetGeo, targetMat);
        this.target.rotation.x = -Math.PI / 2;
        this.target.position.y = 0.05;
        this.group.add(this.target);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        this.arrows.forEach(arrow => {
            if (this.time > arrow.userData.delay && !arrow.userData.fallen) {
                arrow.position.y -= delta * arrow.userData.speed;
                if (arrow.position.y <= 0) {
                    arrow.userData.fallen = true;
                    arrow.visible = false;
                    this.createImpact(arrow.position.x, arrow.position.z);
                }
            }
        });
        
        this.impacts.forEach(p => {
            p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
            p.userData.velocity.y -= delta * 10;
            p.material.opacity *= 0.95;
        });
        
        if (this.time > 2) this.target.material.opacity *= 0.95;
        return this.life > 0;
    }
    
    createImpact(x, z) {
        for (let i = 0; i < 5; i++) {
            const pGeo = new THREE.SphereGeometry(0.05 + Math.random() * 0.08, 4, 4);
            const pMat = new THREE.MeshBasicMaterial({ color: 0x88aa66, transparent: true, opacity: 0.8 });
            const particle = new THREE.Mesh(pGeo, pMat);
            particle.position.set(x, 0.2, z);
            const theta = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            particle.userData = { velocity: new THREE.Vector3(speed * Math.cos(theta), 2 + Math.random() * 2, speed * Math.sin(theta)) };
            this.group.add(particle);
            this.impacts.push(particle);
        }
    }
    
    dispose() {
        this.arrows.forEach(a => { a.geometry.dispose(); a.material.dispose(); });
        this.impacts.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
        this.target.geometry.dispose();
        this.target.material.dispose();
    }
}

export class EvasionEffect {
    constructor(startPos) {
        this.life = 1.5;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        this.afterimages = [];
        for (let i = 0; i < 8; i++) {
            const silhouetteGeo = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
            const silhouetteMat = new THREE.MeshBasicMaterial({ color: 0x88dd88, transparent: true, opacity: 0.4 });
            const silhouette = new THREE.Mesh(silhouetteGeo, silhouetteMat);
            const angle = (i / 8) * Math.PI * 2;
            silhouette.position.set(Math.cos(angle) * 2, 1, Math.sin(angle) * 2);
            silhouette.userData = { angle };
            this.group.add(silhouette);
            this.afterimages.push(silhouette);
        }
        
        this.wind = [];
        for (let i = 0; i < 60; i++) {
            const pGeo = new THREE.SphereGeometry(0.03 + Math.random() * 0.05, 4, 4);
            const pMat = new THREE.MeshBasicMaterial({ color: 0xaaddaa, transparent: true, opacity: 0.6 });
            const particle = new THREE.Mesh(pGeo, pMat);
            const theta = Math.random() * Math.PI * 2;
            const r = 1 + Math.random() * 3;
            particle.position.set(r * Math.cos(theta), Math.random() * 2.5, r * Math.sin(theta));
            particle.userData = { baseTheta: theta, baseR: r, speed: 3 + Math.random() * 3 };
            this.group.add(particle);
            this.wind.push(particle);
        }
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        this.afterimages.forEach(s => {
            s.userData.angle += delta * 4;
            s.position.x = Math.cos(s.userData.angle) * 2;
            s.position.z = Math.sin(s.userData.angle) * 2;
            s.material.opacity = 0.4 * (this.life / 1.5);
        });
        
        this.wind.forEach(p => {
            p.userData.baseTheta += delta * p.userData.speed;
            p.position.x = p.userData.baseR * Math.cos(p.userData.baseTheta);
            p.position.z = p.userData.baseR * Math.sin(p.userData.baseTheta);
            p.material.opacity = 0.6 * (this.life / 1.5);
        });
        
        return this.life > 0;
    }
    
    dispose() {
        this.afterimages.forEach(s => { s.geometry.dispose(); s.material.dispose(); });
        this.wind.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
    }
}

export class SnipeEffect {
    constructor(startPos, targetPos, damage) {
        this.damage = damage;
        this.life = 1.5;
        this.time = 0;
        this.group = new THREE.Group();
        this.startPos = startPos.clone();
        this.targetPos = targetPos.clone();
        
        this.chargeParticles = [];
        for (let i = 0; i < 40; i++) {
            const pGeo = new THREE.SphereGeometry(0.05 + Math.random() * 0.08, 4, 4);
            const pMat = new THREE.MeshBasicMaterial({ color: 0x88ff88, transparent: true, opacity: 0.8 });
            const particle = new THREE.Mesh(pGeo, pMat);
            const theta = Math.random() * Math.PI * 2;
            const r = 2 + Math.random() * 3;
            particle.position.set(startPos.x + r * Math.cos(theta), startPos.y + (Math.random() - 0.5) * 1.5, startPos.z + r * Math.sin(theta));
            particle.userData = { targetX: startPos.x, speed: 3 + Math.random() * 3 };
            this.group.add(particle);
            this.chargeParticles.push(particle);
        }
        
        this.arrow = null;
        this.hasFired = false;
        this.trail = [];
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const chargeTime = 0.6;
        
        if (this.time < chargeTime) {
            this.chargeParticles.forEach(p => {
                p.position.x += (p.userData.targetX - p.position.x) * delta * 3;
                p.material.opacity *= 0.98;
            });
        } else if (!this.hasFired) {
            this.hasFired = true;
            this.fireArrow();
        }
        
        if (this.arrow) {
            const direction = this.targetPos.clone().sub(this.startPos).normalize();
            this.arrow.position.add(direction.multiplyScalar(delta * 40));
            this.arrow.material.opacity *= 0.97;
        }
        
        this.trail.forEach(p => { p.material.opacity *= 0.9; });
        return this.life > 0;
    }
    
    fireArrow() {
        this.chargeParticles.forEach(p => p.visible = false);
        
        const arrowGeo = new THREE.ConeGeometry(0.12, 1.5, 6);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
        this.arrow = new THREE.Mesh(arrowGeo, arrowMat);
        this.arrow.position.copy(this.startPos);
        
        const direction = this.targetPos.clone().sub(this.startPos).normalize();
        this.arrow.lookAt(this.targetPos);
        this.arrow.rotateX(Math.PI / 2);
        this.group.add(this.arrow);
        
        this.flash = new THREE.PointLight(0x88ff88, 5, 15);
        this.flash.position.copy(this.arrow.position);
        this.group.add(this.flash);
    }
    
    dispose() {
        this.chargeParticles.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
        if (this.arrow) { this.arrow.geometry.dispose(); this.arrow.material.dispose(); }
        this.trail.forEach(p => { p.geometry.dispose(); p.material.dispose(); });
    }
}
