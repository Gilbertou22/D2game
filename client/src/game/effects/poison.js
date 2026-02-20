import * as THREE from 'three';

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
        
        this.direction = targetPos.clone().sub(startPos).normalize();
        this.velocity = this.direction.clone().multiplyScalar(30);
        
        const spikeGeo = new THREE.ConeGeometry(0.25, 2.5, 8);
        const spikeMat = new THREE.MeshStandardMaterial({ color: 0x003300, emissive: 0x00ff00, emissiveIntensity: 2, metalness: 0.8, roughness: 0.2 });
        this.spike = new THREE.Mesh(spikeGeo, spikeMat);
        this.spike.rotation.x = Math.PI / 2;
        this.group.add(this.spike);
        
        const ringGeo = new THREE.TorusGeometry(0.4, 0.05, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 });
        this.ring1 = new THREE.Mesh(ringGeo, ringMat);
        this.ring2 = new THREE.Mesh(ringGeo, ringMat.clone());
        this.ring1.position.z = -0.5;
        this.ring2.position.z = -1.0;
        this.group.add(this.ring1, this.ring2);
        
        this.light = new THREE.PointLight(0x45ff45, 4, 20);
        this.group.add(this.light);
        
        this.trailParticles = [];
        this.rotationSpeed = 5;
    }
    
    update(delta) {
        this.life -= delta;
        this.group.position.add(this.velocity.clone().multiplyScalar(delta));
        
        this.ring1.rotation.x += 0.1;
        this.ring1.rotation.y += 0.1;
        this.ring2.rotation.x += 0.15;
        this.ring2.rotation.y -= 0.1;
        this.spike.rotation.z += this.rotationSpeed * delta;
        
        if (Math.random() < 0.6) {
            this.trailParticles.push({
                position: this.group.position.clone(),
                life: 0.5,
                velocity: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2)
            });
        }
        
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const p = this.trailParticles[i];
            p.life -= delta;
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            if (p.life <= 0) this.trailParticles.splice(i, 1);
        }
        
        if (this.life < 1.0) {
            const fadeOpacity = this.life;
            this.spike.material.opacity = fadeOpacity;
            this.ring1.material.opacity = fadeOpacity * 0.8;
            this.ring2.material.opacity = fadeOpacity * 0.8;
        }
        
        return this.life > 0;
    }
    
    dispose() { this.trailParticles = []; }
}

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
        
        const particleCount = 800;
        const positions = new Float32Array(particleCount * 3);
        this.velocities = [];

        for (let i = 0; i < particleCount; i++) {
            const r = Math.sqrt(Math.random()) * radius;
            const theta = Math.random() * Math.PI * 2;
            positions[i * 3] = Math.cos(theta) * r;
            positions[i * 3 + 1] = Math.random() * 0.5;
            positions[i * 3 + 2] = Math.sin(theta) * r;
            this.velocities.push({ x: (Math.random() - 0.5) * 0.3, y: 0.5 + Math.random() * 1.0, z: (Math.random() - 0.5) * 0.3 });
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({ size: 2.0, color: 0x32cd32, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
        this.particles = new THREE.Points(geo, mat);
        this.group.add(this.particles);

        this.light = new THREE.PointLight(0x00ff00, 3, radius * 2);
        this.light.position.y = 2;
        this.group.add(this.light);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const posArray = this.particles.geometry.attributes.position.array;
        for (let i = 0; i < this.velocities.length; i++) {
            posArray[i * 3] += this.velocities[i].x * delta;
            posArray[i * 3 + 1] += this.velocities[i].y * delta;
            posArray[i * 3 + 2] += this.velocities[i].z * delta;
            
            if (posArray[i * 3 + 1] > 5) posArray[i * 3 + 1] = 0;
            
            const r = Math.sqrt(posArray[i * 3] ** 2 + posArray[i * 3 + 2] ** 2);
            if (r > this.radius) {
                posArray[i * 3] *= this.radius / r;
                posArray[i * 3 + 2] *= this.radius / r;
            }
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
        
        const lifeRatio = this.life / this.maxLife;
        this.particles.material.opacity = 0.6 * lifeRatio;
        this.light.intensity = 3 * lifeRatio;
        
        return this.life > 0;
    }
    
    dispose() {
        this.particles.geometry.dispose();
        this.particles.material.dispose();
    }
}

export class SerpentSweepEffect {
    constructor(playerPos, forwardDir, damage, dotDamage, dotDuration, coneAngle, range) {
        this.damage = damage;
        this.dotDamage = dotDamage;
        this.dotDuration = dotDuration;
        this.coneAngle = coneAngle;
        this.range = range;
        this.life = 1.5;
        this.time = 0;
        
        this.group = new THREE.Group();
        this.group.position.copy(playerPos);
        
        this.slashArcs = [];
        for (let i = 0; i < 3; i++) {
            const curve = new THREE.EllipseCurve(0, 0, range + i * 0.3, (range + i * 0.2) * 0.7, -coneAngle / 2, coneAngle / 2, false, 0);
            const points = curve.getPoints(30);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: new THREE.Color().setHSL(0.33, 0.8, 0.5 + i * 0.1), transparent: true, opacity: 1 - i * 0.2 });
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
            const sparkMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.33, 1, 0.6), transparent: true, opacity: 1 });
            const spark = new THREE.Mesh(sparkGeo, sparkMat);
            const angle = (Math.random() - 0.5) * coneAngle;
            const r = range * 0.5 + Math.random() * range * 0.5;
            spark.position.set(r * Math.sin(angle), 1.5 + (Math.random() - 0.5) * 1.5, r * Math.cos(angle) - 1);
            spark.userData = { velocity: new THREE.Vector3(Math.sin(angle) * (3 + Math.random() * 3), 1 + Math.random() * 3, Math.cos(angle) * (3 + Math.random() * 3)) };
            this.group.add(spark);
            this.sparks.push(spark);
        }
        
        this.light = new THREE.PointLight(0x45ff45, 3, 10);
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
