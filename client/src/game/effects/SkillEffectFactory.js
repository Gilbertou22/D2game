import * as THREE from 'three';
import { createLightningPath, createFireTexture } from './utils';
import { createParticles } from '../Particles';

function hexToThreeColor(hex) {
    const color = new THREE.Color();
    color.setStyle(hex);
    return color;
}

const TextureGenerator = {
    simplex2D(x, y, perm) {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;
        
        let n0, n1, n2;
        const s = (x + y) * F2;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = x - X0;
        const y0 = y - Y0;
        
        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; }
        else { i1 = 0; j1 = 1; }
        
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;
        
        const ii = i & 255;
        const jj = j & 255;
        
        const grad = (hash, gx, gy) => {
            const h = hash & 7;
            const u = h < 4 ? gx : gy;
            const v = h < 4 ? gy : gx;
            return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
        };
        
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0;
        else {
            t0 *= t0;
            n0 = t0 * t0 * grad(perm[ii + perm[jj]], x0, y0);
        }
        
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0;
        else {
            t1 *= t1;
            n1 = t1 * t1 * grad(perm[ii + i1 + perm[jj + j1]], x1, y1);
        }
        
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0;
        else {
            t2 *= t2;
            n2 = t2 * t2 * grad(perm[ii + 1 + perm[jj + 1]], x2, y2);
        }
        
        return 70 * (n0 + n1 + n2);
    },
    
    createPermutation() {
        const perm = [];
        for (let k = 0; k < 512; k++) perm[k] = Math.floor(Math.random() * 256);
        return perm;
    },
    
    createNoiseTexture(size, colors, perm) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                let noise = 0;
                noise += this.simplex2D(x * 0.02, y * 0.02, perm) * 0.5;
                noise += this.simplex2D(x * 0.05, y * 0.05, perm) * 0.3;
                noise += this.simplex2D(x * 0.1, y * 0.1, perm) * 0.2;
                noise = (noise + 1) * 0.5;
                
                const gradient = 1 - (y / size);
                const intensity = noise * gradient * gradient;
                
                data[i] = Math.min(255, intensity * colors.rMult * 255);
                data[i + 1] = Math.min(255, intensity * colors.gMult * 255);
                data[i + 2] = Math.min(255, intensity * colors.bMult * 255);
                data[i + 3] = intensity * 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    },
    
    createGlowTexture(size, colors) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, colors.core || 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.1, colors.inner || 'rgba(255, 200, 100, 0.8)');
        gradient.addColorStop(0.3, colors.mid || 'rgba(255, 100, 0, 0.4)');
        gradient.addColorStop(0.6, colors.outer || 'rgba(255, 50, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        return new THREE.CanvasTexture(canvas);
    },
    
    createSparkTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 200, 50, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        return new THREE.CanvasTexture(canvas);
    },
    
    createSmokeTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, 'rgba(80, 60, 50, 0.6)');
        gradient.addColorStop(0.3, 'rgba(60, 50, 40, 0.4)');
        gradient.addColorStop(0.6, 'rgba(40, 35, 30, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        return new THREE.CanvasTexture(canvas);
    }
};

const ELEMENT_TEXTURE_CONFIGS = {
    fire: { rMult: 3.0, gMult: 1.5, bMult: 0.3 },
    ice: { rMult: 0.5, gMult: 1.5, bMult: 2.0 },
    lightning: { rMult: 2.0, gMult: 2.0, bMult: 1.0 },
    nature: { rMult: 0.8, gMult: 2.0, bMult: 0.5 },
    arcane: { rMult: 1.5, gMult: 0.5, bMult: 2.0 },
    holy: { rMult: 2.0, gMult: 1.8, bMult: 0.5 },
    shadow: { rMult: 0.8, gMult: 0.3, bMult: 1.5 },
    poison: { rMult: 0.5, gMult: 2.0, bMult: 0.5 },
    physical: { rMult: 1.5, gMult: 1.5, bMult: 1.5 }
};

const perm = TextureGenerator.createPermutation();
const ELEMENT_NOISE_TEXTURES = {};
const SPARK_TEXTURE = TextureGenerator.createSparkTexture(32);
const SMOKE_TEXTURE = TextureGenerator.createSmokeTexture(128);

Object.keys(ELEMENT_TEXTURE_CONFIGS).forEach(element => {
    ELEMENT_NOISE_TEXTURES[element] = TextureGenerator.createNoiseTexture(256, ELEMENT_TEXTURE_CONFIGS[element], perm);
});

function generateParticleTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    
    if (type === 'fire') {
        gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 180, 50, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (type === 'smoke') {
        gradient.addColorStop(0, 'rgba(50, 40, 30, 0.6)');
        gradient.addColorStop(0.5, 'rgba(30, 20, 15, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (type === 'ice') {
        gradient.addColorStop(0, 'rgba(200, 230, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(100, 180, 255, 0.7)');
        gradient.addColorStop(0.6, 'rgba(50, 100, 200, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (type === 'lightning') {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(200, 220, 255, 0.8)');
        gradient.addColorStop(0.6, 'rgba(100, 150, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (type === 'arcane') {
        gradient.addColorStop(0, 'rgba(255, 200, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(180, 100, 255, 0.7)');
        gradient.addColorStop(0.6, 'rgba(100, 50, 150, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (type === 'nature') {
        gradient.addColorStop(0, 'rgba(200, 255, 150, 1)');
        gradient.addColorStop(0.3, 'rgba(100, 200, 50, 0.7)');
        gradient.addColorStop(0.6, 'rgba(50, 100, 30, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
}

const PARTICLE_TEXTURES = {
    fire: generateParticleTexture('fire'),
    smoke: generateParticleTexture('smoke'),
    ice: generateParticleTexture('ice'),
    lightning: generateParticleTexture('lightning'),
    arcane: generateParticleTexture('arcane'),
    nature: generateParticleTexture('nature'),
    default: generateParticleTexture('default')
};

function getTextureForElement(element) {
    const textureMap = {
        fire: 'fire',
        ice: 'ice',
        lightning: 'lightning',
        arcane: 'arcane',
        nature: 'nature',
        holy: 'fire',
        shadow: 'arcane',
        poison: 'nature',
        physical: 'default'
    };
    return PARTICLE_TEXTURES[textureMap[element] || 'default'];
}

function getNoiseTextureForElement(element) {
    return ELEMENT_NOISE_TEXTURES[element] || ELEMENT_NOISE_TEXTURES.fire;
}

const ELEMENT_HIT_COLORS = {
    fire: { primary: 0xff4400, secondary: 0xff8800, glow: 0xff2200 },
    ice: { primary: 0x88ddff, secondary: 0xaaddff, glow: 0x44aaff },
    lightning: { primary: 0xfacc15, secondary: 0xfef08a, glow: 0xffffff },
    poison: { primary: 0x22c55e, secondary: 0x4ade80, glow: 0x16a34a },
    arcane: { primary: 0xa855f7, secondary: 0xe879f9, glow: 0x7c3aed },
    nature: { primary: 0x84cc16, secondary: 0xbef264, glow: 0x65a30d },
    holy: { primary: 0xfbbf24, secondary: 0xfde68a, glow: 0xf59e0b },
    shadow: { primary: 0x6b21a8, secondary: 0xa855f7, glow: 0x581c87 },
    physical: { primary: 0x888888, secondary: 0xaaaaaa, glow: 0x666666 }
};

export function createHitEffect(position, config, isCrit = false) {
    const element = config.element || 'physical';
    const colors = ELEMENT_HIT_COLORS[element] || ELEMENT_HIT_COLORS.physical;
    const explosionConfig = config.explosion || {};
    const size = explosionConfig.size || 3;
    const particleCount = explosionConfig.particles || 50;
    
    const baseMultiplier = isCrit ? 1.8 : 1;
    const actualCount = Math.floor(particleCount * baseMultiplier);
    
    createParticles(position, colors.primary, Math.floor(actualCount * 0.4), size * 1.2, size * 0.7, 'hit_impact');
    createParticles(position, colors.secondary, Math.floor(actualCount * 0.3), size * 1.5, size * 0.5, 'hit_sparks');
    createParticles(position, colors.glow, Math.floor(actualCount * 0.2), size, size * 0.6, 'hit_flash');
    createParticles(position, 0xffffff, Math.floor(actualCount * 0.1), size * 0.8, size * 0.4, 'hit_burst');
    
    if (isCrit) {
        createParticles(position, colors.glow, Math.floor(actualCount * 0.5), size * 2, size * 1.0, 'crit_explosion');
        createParticles(position, 0xffffff, Math.floor(actualCount * 0.3), size * 1.5, size * 0.8, 'crit_flash');
        createParticles(position, colors.secondary, Math.floor(actualCount * 0.4), size * 2.5, size * 0.7, 'crit_ring');
        createParticles(position, colors.primary, Math.floor(actualCount * 0.3), size * 1.8, size * 0.6, 'crit_star');
    }
    
    createParticles(position, colors.primary, Math.floor(actualCount * 0.2), size * 0.5, size * 0.25, `${element}_hit`);
}

export function createCastEffect(position, color = 0xff6600) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.position.y = 0.1;
    
    const rings = [];
    
    for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.RingGeometry(0.1, 0.2 + i * 0.1, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8 - i * 0.2,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = i * 0.05;
        ring.userData = {
            life: 1.0 - i * 0.2,
            maxLife: 1.0,
            expandSpeed: 4 + i * 2
        };
        group.add(ring);
        rings.push(ring);
    }
    
    const light = new THREE.PointLight(color, 8, 10);
    light.position.y = 0.5;
    group.add(light);
    
    return {
        group,
        rings,
        light,
        update(delta) {
            let alive = false;
            this.rings.forEach(ring => {
                ring.userData.life -= delta * 1.5;
                if (ring.userData.life > 0) {
                    alive = true;
                    ring.scale.x += delta * ring.userData.expandSpeed;
                    ring.scale.y += delta * ring.userData.expandSpeed;
                    ring.material.opacity = ring.userData.life * 0.8;
                }
            });
            this.light.intensity *= 0.95;
            return alive || this.light.intensity > 0.1;
        },
        dispose() {
            this.rings.forEach(ring => {
                if (ring.geometry) ring.geometry.dispose();
                if (ring.material) ring.material.dispose();
            });
        }
    };
}

export class EnemyDeathEffect {
    constructor(position, options = {}) {
        const {
            isBoss = false,
            isElite = false,
            size = 2,
            color = 0xffff00
        } = options;
        
        this.position = position.clone();
        this.isBoss = isBoss;
        this.isElite = isElite;
        this.baseSize = size;
        this.life = isBoss ? 3.0 : isElite ? 2.0 : 1.5;
        this.maxLife = this.life;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(position);
        
        const scale = isBoss ? 2.0 : isElite ? 1.5 : 1.0;
        const mainColor = isBoss ? 0xff4400 : isElite ? 0xff8800 : color;
        
        this.lights = [];
        this.sprites = [];
        this.rings = [];
        this.particles = [];
        this.debris = [];
        
        // 1. 核心爆炸光源
        this.mainLight = new THREE.PointLight(mainColor, 20 * scale, 25 * scale);
        this.mainLight.position.y = 1;
        this.group.add(this.mainLight);
        this.lights.push(this.mainLight);
        
        this.coreLight = new THREE.PointLight(0xffffff, 15 * scale, 15 * scale);
        this.coreLight.position.y = 1;
        this.group.add(this.coreLight);
        this.lights.push(this.coreLight);
        
        // 2. 死亡能量球 (Shader)
        this.createEnergyOrb(mainColor, scale);
        
        // 3. 能量柱
        this.createEnergyPillar(mainColor, scale);
        
        // 4. 擴散衝擊波
        this.createShockwaves(mainColor, scale);
        
        // 5. 地面光環
        this.createGroundRings(mainColor, scale);
        
        // 6. 靈魂飛升
        this.createSoulEffect(mainColor, scale);
        
        // 7. 碎片飛散
        this.createDebris(scale);
        
        // BOSS 額外效果
        if (isBoss) {
            this.createBossEffects();
        }
    }
    
    createEnergyOrb(color, scale) {
        // 內核
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        this.energyCore = new THREE.Mesh(
            new THREE.SphereGeometry(0.3 * scale, 16, 16),
            coreMat
        );
        this.energyCore.position.y = 1;
        this.group.add(this.energyCore);
        
        // Shader 外殼
        this.energyShellMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(color) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                uniform float uTime;
                void main() {
                    vUv = uv;
                    vNormal = normal;
                    vec3 pos = position;
                    pos += normal * sin(uTime * 10.0 + position.x * 5.0) * 0.1;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uColor;
                varying vec2 vUv;
                varying vec3 vNormal;
                void main() {
                    float pulse = sin(uTime * 15.0) * 0.3 + 0.7;
                    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
                    vec3 col = mix(uColor, vec3(1.0), fresnel * 0.5);
                    gl_FragColor = vec4(col * pulse, 0.8);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        this.energyShell = new THREE.Mesh(
            new THREE.SphereGeometry(0.6 * scale, 16, 16),
            this.energyShellMat
        );
        this.energyShell.position.y = 1;
        this.group.add(this.energyShell);
    }
    
    createEnergyPillar(color, scale) {
        // 光柱
        const pillarGeo = new THREE.CylinderGeometry(0.3 * scale, 0.8 * scale, 15 * scale, 16, 1, true);
        const pillarMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        this.pillar = new THREE.Mesh(pillarGeo, pillarMat);
        this.pillar.position.y = 7.5 * scale;
        this.group.add(this.pillar);
        
        // 內層光柱
        const innerPillarGeo = new THREE.CylinderGeometry(0.15 * scale, 0.4 * scale, 12 * scale, 16, 1, true);
        const innerPillarMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        this.innerPillar = new THREE.Mesh(innerPillarGeo, innerPillarMat);
        this.innerPillar.position.y = 6 * scale;
        this.group.add(this.innerPillar);
    }
    
    createShockwaves(color, scale) {
        for (let i = 0; i < 4; i++) {
            const ringGeo = new THREE.RingGeometry(0.1, 0.3, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.1 + i * 0.1;
            ring.userData = {
                delay: i * 0.15,
                speed: 8 + i * 2,
                life: 0,
                started: false
            };
            this.group.add(ring);
            this.rings.push(ring);
        }
    }
    
    createGroundRings(color, scale) {
        // 旋轉符文環
        for (let i = 0; i < 3; i++) {
            const ringGeo = new THREE.TorusGeometry((1 + i * 0.5) * scale, 0.05 * scale, 8, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: i === 0 ? 0xffffff : color,
                transparent: true,
                opacity: 0.6 - i * 0.15,
                blending: THREE.AdditiveBlending
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.2;
            ring.userData = { rotSpeed: (3 - i) * (i % 2 === 0 ? 1 : -1) };
            this.group.add(ring);
            this.groundRings = this.groundRings || [];
            this.groundRings.push(ring);
        }
    }
    
    createSoulEffect(color, scale) {
        // 靈魂粒子
        const soulTex = this.generateSoulTexture();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const mat = new THREE.SpriteMaterial({
                map: soulTex,
                color: 0xaaddff,
                transparent: true,
                blending: THREE.AdditiveBlending,
                opacity: 0.8
            });
            const sprite = new THREE.Sprite(mat);
            sprite.position.set(
                Math.cos(angle) * 0.5 * scale,
                0.5,
                Math.sin(angle) * 0.5 * scale
            );
            sprite.scale.set(0.8 * scale, 0.8 * scale, 1);
            sprite.userData = {
                angle,
                baseY: 0.5,
                speed: 2 + Math.random(),
                riseSpeed: 3 + Math.random() * 2
            };
            this.group.add(sprite);
            this.sprites.push(sprite);
        }
    }
    
    createDebris(scale) {
        const debrisColors = [0x888888, 0x666666, 0x444444, 0xffaa00];
        
        for (let i = 0; i < 20; i++) {
            const geo = new THREE.BoxGeometry(
                0.1 + Math.random() * 0.2,
                0.1 + Math.random() * 0.2,
                0.1 + Math.random() * 0.2
            );
            const mat = new THREE.MeshBasicMaterial({
                color: debrisColors[Math.floor(Math.random() * debrisColors.length)],
                transparent: true,
                opacity: 1
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(this.position);
            mesh.position.y += 1;
            
            const angle = Math.random() * Math.PI * 2;
            const upAngle = Math.random() * Math.PI * 0.4;
            const speed = 5 + Math.random() * 10;
            
            mesh.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * Math.cos(upAngle) * speed,
                    Math.sin(upAngle) * speed + 5,
                    Math.sin(angle) * Math.cos(upAngle) * speed
                ),
                rotSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10
                ),
                life: 1 + Math.random() * 0.5
            };
            
            this.group.add(mesh);
            this.debris.push(mesh);
        }
    }
    
    createBossEffects() {
        // BOSS 專屬：額外光芒
        const raysCount = 8;
        this.rays = [];
        
        for (let i = 0; i < raysCount; i++) {
            const angle = (i / raysCount) * Math.PI * 2;
            const rayGeo = new THREE.PlaneGeometry(0.1, 10);
            const rayMat = new THREE.MeshBasicMaterial({
                color: 0xff8800,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            const ray = new THREE.Mesh(rayGeo, rayMat);
            ray.position.y = 5;
            ray.rotation.z = Math.PI / 2;
            ray.rotation.y = angle;
            ray.userData = { baseAngle: angle };
            this.group.add(ray);
            this.rays.push(ray);
        }
        
        // BOSS 額外光源
        const bossLight = new THREE.PointLight(0xff00ff, 30, 30);
        bossLight.position.y = 2;
        this.group.add(bossLight);
        this.lights.push(bossLight);
    }
    
    generateSoulTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(200, 220, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(150, 180, 255, 0.7)');
        gradient.addColorStop(0.6, 'rgba(100, 130, 200, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const lifeRatio = Math.max(0, this.life / this.maxLife);
        const fadeOut = Math.min(1, this.life * 2);
        
        // 更新 Shader
        if (this.energyShellMat && this.energyShellMat.uniforms) {
            this.energyShellMat.uniforms.uTime.value = this.time;
        }
        
        // 核心縮放
        if (this.energyCore) {
            const pulse = 1 + Math.sin(this.time * 20) * 0.3;
            this.energyCore.scale.setScalar(pulse * lifeRatio);
        }
        if (this.energyShell) {
            const pulse = 1 + Math.sin(this.time * 15) * 0.2;
            this.energyShell.scale.setScalar(pulse);
            this.energyShellMat.opacity = 0.8 * lifeRatio;
        }
        
        // 光柱
        if (this.pillar) {
            this.pillar.rotation.y += delta * 2;
            this.pillar.material.opacity = 0.3 * lifeRatio;
            this.pillar.scale.x = 1 + Math.sin(this.time * 10) * 0.1;
            this.pillar.scale.z = 1 + Math.sin(this.time * 10) * 0.1;
        }
        if (this.innerPillar) {
            this.innerPillar.rotation.y -= delta * 3;
            this.innerPillar.material.opacity = 0.5 * lifeRatio;
        }
        
        // 衝擊波
        this.rings.forEach(ring => {
            if (ring.userData.delay > 0) {
                ring.userData.delay -= delta;
                return;
            }
            if (!ring.userData.started) {
                ring.userData.started = true;
                ring.userData.life = 1.0;
            }
            
            ring.userData.life -= delta * 1.5;
            ring.scale.x += delta * ring.userData.speed;
            ring.scale.y += delta * ring.userData.speed;
            ring.material.opacity = ring.userData.life * 0.8;
        });
        
        // 地面環
        if (this.groundRings) {
            this.groundRings.forEach(ring => {
                ring.rotation.z += delta * ring.userData.rotSpeed;
                ring.material.opacity = 0.6 * lifeRatio;
            });
        }
        
        // 靈魂上升
        this.sprites.forEach(sprite => {
            sprite.userData.angle += delta * sprite.userData.speed;
            sprite.position.y += delta * sprite.userData.riseSpeed;
            sprite.position.x = Math.cos(sprite.userData.angle) * 0.5 * (1 + this.time);
            sprite.position.z = Math.sin(sprite.userData.angle) * 0.5 * (1 + this.time);
            sprite.material.opacity = 0.8 * lifeRatio;
        });
        
        // 碎片
        this.debris.forEach(d => {
            d.userData.life -= delta;
            if (d.userData.life > 0) {
                d.position.add(d.userData.velocity.clone().multiplyScalar(delta));
                d.userData.velocity.y -= delta * 20;
                d.rotation.x += d.userData.rotSpeed.x * delta;
                d.rotation.y += d.userData.rotSpeed.y * delta;
                d.rotation.z += d.userData.rotSpeed.z * delta;
                d.material.opacity = d.userData.life;
            }
        });
        
        // BOSS 光芒
        if (this.rays) {
            this.rays.forEach(ray => {
                ray.rotation.y = ray.userData.baseAngle + this.time * 2;
                ray.material.opacity = 0.6 * lifeRatio;
            });
        }
        
        // 光源
        this.mainLight.intensity = 20 * lifeRatio * (0.8 + Math.sin(this.time * 25) * 0.2);
        this.coreLight.intensity = 15 * lifeRatio * (0.9 + Math.sin(this.time * 30) * 0.1);
        
        return this.life > 0;
    }
    
    getParticles() {
        return [];
    }
    
    getLights() {
        return this.lights;
    }
    
    dispose() {
        if (this.energyCore && this.energyCore.geometry) this.energyCore.geometry.dispose();
        if (this.energyCore && this.energyCore.material) this.energyCore.material.dispose();
        if (this.energyShellMat) this.energyShellMat.dispose();
        if (this.pillar && this.pillar.geometry) this.pillar.geometry.dispose();
        if (this.pillar && this.pillar.material) this.pillar.material.dispose();
        if (this.innerPillar && this.innerPillar.geometry) this.innerPillar.geometry.dispose();
        if (this.innerPillar && this.innerPillar.material) this.innerPillar.material.dispose();
        
        this.rings.forEach(ring => {
            if (ring.geometry) ring.geometry.dispose();
            if (ring.material) ring.material.dispose();
        });
        
        if (this.groundRings) {
            this.groundRings.forEach(ring => {
                if (ring.geometry) ring.geometry.dispose();
                if (ring.material) ring.material.dispose();
            });
        }
        
        this.sprites.forEach(sprite => {
            if (sprite.material) {
                if (sprite.material.map) sprite.material.map.dispose();
                sprite.material.dispose();
            }
        });
        
        this.debris.forEach(d => {
            if (d.geometry) d.geometry.dispose();
            if (d.material) d.material.dispose();
        });
        
        if (this.rays) {
            this.rays.forEach(ray => {
                if (ray.geometry) ray.geometry.dispose();
                if (ray.material) ray.material.dispose();
            });
        }
    }
}

export class DynamicProjectileEffect {
    constructor(config, startPos, targetPos, onHit) {
        this.config = config;
        this.onHit = onHit;
        this.damage = config.damage;
        this.life = 4;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        const projConfig = config.projectile || {};
        const colors = config.colors || {};
        const element = config.element || 'fire';
        const speed = projConfig.speed || 18;
        const size = projConfig.size || 0.5;
        
        const direction = targetPos.clone().sub(startPos).normalize();
        this.velocity = direction.multiplyScalar(speed);
        this.targetPos = targetPos.clone();
        this.element = element;
        
        const primaryColor = hexToThreeColor(colors.primary || '#ff6b35');
        const glowColor = hexToThreeColor(colors.glow || '#ff4400');
        const coreColor = hexToThreeColor(colors.core || '#ffffff');
        const secondaryColor = hexToThreeColor(colors.secondary || '#ffaa00');
        
        this.primaryColorHex = primaryColor.getHex();
        this.glowColorHex = glowColor.getHex();
        this.secondaryColorHex = secondaryColor.getHex();
        
        this.lights = [];
        this.trailSprites = [];
        this.smokeSprites = [];
        this.sparkSprites = [];
        
        const coreMat = new THREE.MeshBasicMaterial({ 
            color: coreColor.getHex(),
            transparent: true,
            opacity: 1
        });
        this.core = new THREE.Mesh(new THREE.SphereGeometry(size * 0.08, 16, 16), coreMat);
        this.group.add(this.core);
        
        const noiseTexture = getNoiseTextureForElement(element);
        this.innerMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uTexture: { value: noiseTexture },
                uColor1: { value: coreColor },
                uColor2: { value: primaryColor },
                uColor3: { value: secondaryColor }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform float uTime;
                
                void main() {
                    vUv = uv;
                    vNormal = normal;
                    vPosition = position;
                    
                    vec3 pos = position;
                    float displacement = sin(pos.x * 10.0 + uTime * 5.0) * 
                                       sin(pos.y * 10.0 + uTime * 4.0) * 
                                       sin(pos.z * 10.0 + uTime * 3.0) * 0.03;
                    pos += normal * displacement;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform sampler2D uTexture;
                uniform vec3 uColor1;
                uniform vec3 uColor2;
                uniform vec3 uColor3;
                
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vec2 uv = vUv;
                    uv.y -= uTime * 0.5;
                    uv.x += sin(uv.y * 5.0 + uTime * 2.0) * 0.1;
                    
                    vec4 texColor = texture2D(uTexture, uv);
                    
                    float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
                    rim = pow(rim, 1.5);
                    
                    vec3 color = mix(uColor1, uColor2, texColor.r);
                    color = mix(color, uColor3, texColor.r * 0.5);
                    
                    float alpha = texColor.a * 0.9 + rim * 0.3;
                    float pulse = sin(uTime * 12.0) * 0.2 + 0.8;
                    
                    gl_FragColor = vec4(color * pulse, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.inner = new THREE.Mesh(new THREE.SphereGeometry(size * 0.18, 24, 24), this.innerMat);
        this.group.add(this.inner);
        
        const glowTexture = TextureGenerator.createGlowTexture(128, {
            core: `rgba(255, 255, 255, 1)`,
            inner: `rgba(${Math.floor(primaryColor.r*255)}, ${Math.floor(primaryColor.g*255)}, ${Math.floor(primaryColor.b*255)}, 0.8)`,
            mid: `rgba(${Math.floor(secondaryColor.r*255)}, ${Math.floor(secondaryColor.g*255)}, ${Math.floor(secondaryColor.b*255)}, 0.4)`,
            outer: `rgba(${Math.floor(glowColor.r*255)}, ${Math.floor(glowColor.g*255)}, ${Math.floor(glowColor.b*255)}, 0.1)`
        });
        
        this.glowMat = new THREE.SpriteMaterial({
            map: glowTexture,
            color: glowColor.getHex(),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.8
        });
        this.glowSprite = new THREE.Sprite(this.glowMat);
        this.glowSprite.scale.set(size * 1.8, size * 1.8, 1);
        this.group.add(this.glowSprite);
        
        this.outerGlowMat = new THREE.SpriteMaterial({
            map: glowTexture,
            color: secondaryColor.getHex(),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.3
        });
        this.outerGlowSprite = new THREE.Sprite(this.outerGlowMat);
        this.outerGlowSprite.scale.set(size * 3.5, size * 3.5, 1);
        this.group.add(this.outerGlowSprite);
        
        this.mainLight = new THREE.PointLight(glowColor.getHex(), 12, 20);
        this.mainLight.castShadow = false;
        this.group.add(this.mainLight);
        this.lights.push(this.mainLight);
        
        this.warmLight = new THREE.PointLight(secondaryColor.getHex(), 6, 10);
        this.group.add(this.warmLight);
        this.lights.push(this.warmLight);
        
        this.orbitParticles = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const orbitMat = new THREE.SpriteMaterial({
                map: SPARK_TEXTURE,
                color: primaryColor.getHex(),
                transparent: true,
                blending: THREE.AdditiveBlending,
                opacity: 0.9
            });
            const orbit = new THREE.Sprite(orbitMat);
            orbit.scale.set(size * 0.3, size * 0.3, 1);
            orbit.userData = { 
                angle, 
                radius: size * 0.6, 
                speed: 3 + Math.random() * 2,
                yOffset: (Math.random() - 0.5) * size * 0.3
            };
            this.group.add(orbit);
            this.orbitParticles.push(orbit);
        }
        
        this.createShapeOverlay(projConfig.shape, size, primaryColor, targetPos);
        
        this.hasHit = false;
        this.startPos = startPos.clone();
        this.prevPos = startPos.clone();
        this.size = size;
        this.glowTexture = glowTexture;
    }
    
    createShapeOverlay(shape, size, color, targetPos) {
        switch (shape) {
            case 'arrow':
                const arrowGeo = new THREE.ConeGeometry(size * 0.2, size * 1.2, 8);
                arrowGeo.rotateX(Math.PI / 2);
                const arrowMat = new THREE.MeshBasicMaterial({ 
                    color: color, 
                    transparent: true, 
                    opacity: 0.5,
                    blending: THREE.AdditiveBlending
                });
                this.shapeMesh = new THREE.Mesh(arrowGeo, arrowMat);
                this.shapeMesh.lookAt(targetPos);
                this.group.add(this.shapeMesh);
                break;
            case 'crystal':
                const crystalGeo = new THREE.OctahedronGeometry(size * 0.4, 0);
                const crystalMat = new THREE.MeshBasicMaterial({ 
                    color: color, 
                    transparent: true, 
                    opacity: 0.5,
                    blending: THREE.AdditiveBlending
                });
                this.shapeMesh = new THREE.Mesh(crystalGeo, crystalMat);
                this.group.add(this.shapeMesh);
                break;
        }
    }
    
    update(delta) {
        if (this.hasHit) return false;
        
        this.life -= delta;
        this.time += delta;
        
        this.prevPos.copy(this.group.position);
        
        const distanceToTarget = this.group.position.distanceTo(this.targetPos);
        const moveDistance = this.velocity.length() * delta;
        
        if (distanceToTarget < moveDistance + 0.5) {
            this.hasHit = true;
            if (this.onHit) {
                const hitPos = this.targetPos.clone();
                this.onHit(hitPos, this.damage);
            }
            return false;
        }
        
        this.group.position.add(this.velocity.clone().multiplyScalar(delta));
        
        if (this.innerMat && this.innerMat.uniforms) {
            this.innerMat.uniforms.uTime.value = this.time;
        }
        
        const flicker = Math.sin(this.time * 25) * 0.15 + 0.85;
        this.mainLight.intensity = 12 * flicker;
        this.warmLight.intensity = 6 * flicker;
        
        const pulse = 1 + Math.sin(this.time * 10) * 0.15;
        this.glowSprite.scale.set(this.size * 1.8 * pulse, this.size * 1.8 * pulse, 1);
        this.outerGlowSprite.scale.set(this.size * 3.5 * pulse * 1.1, this.size * 3.5 * pulse * 1.1, 1);
        
        this.orbitParticles.forEach(orbit => {
            orbit.userData.angle += delta * orbit.userData.speed;
            const radius = orbit.userData.radius * (1 + Math.sin(this.time * 5) * 0.2);
            orbit.position.x = Math.cos(orbit.userData.angle) * radius;
            orbit.position.y = orbit.userData.yOffset + Math.sin(this.time * 8 + orbit.userData.angle) * 0.1;
            orbit.position.z = Math.sin(orbit.userData.angle) * radius;
            orbit.material.opacity = 0.6 + Math.sin(this.time * 12 + orbit.userData.angle) * 0.3;
        });
        
        if (this.shapeMesh) {
            this.shapeMesh.rotation.z += delta * 3;
        }
        
        this.emitTrail();
        this.updateTrail(delta, this.time);
        
        return this.life > 0;
    }
    
    emitTrail() {
        if (Math.random() < 0.5) {
            const mat = new THREE.SpriteMaterial({
                map: PARTICLE_TEXTURES[this.element] || PARTICLE_TEXTURES.fire,
                color: this.primaryColorHex,
                transparent: true,
                blending: THREE.AdditiveBlending,
                opacity: 1.0,
                depthWrite: false
            });
            const sprite = new THREE.Sprite(mat);
            sprite.position.copy(this.group.position);
            sprite.position.x += (Math.random() - 0.5) * 0.1;
            sprite.position.y += (Math.random() - 0.5) * 0.1;
            sprite.position.z += (Math.random() - 0.5) * 0.1;
            const trailSize = this.size * (0.2 + Math.random() * 0.15);
            sprite.scale.set(trailSize, trailSize, 1);
            sprite.userData = {
                type: 'fire',
                life: 0.8,
                maxLife: 0.8,
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    0.01 + Math.random() * 0.01,
                    (Math.random() - 0.5) * 0.02
                )
            };
            this.group.parent?.add(sprite);
            this.trailSprites.push(sprite);
        }
        
        if (Math.random() < 0.15) {
            const mat = new THREE.SpriteMaterial({
                map: SMOKE_TEXTURE,
                color: new THREE.Color(0x302520),
                transparent: true,
                blending: THREE.NormalBlending,
                opacity: 0.6,
                depthWrite: false
            });
            const sprite = new THREE.Sprite(mat);
            sprite.position.copy(this.group.position);
            const smokeSize = this.size * 0.8;
            sprite.scale.set(smokeSize, smokeSize, 1);
            sprite.userData = {
                type: 'smoke',
                life: 2.5,
                maxLife: 2.5,
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    0.015 + Math.random() * 0.01,
                    (Math.random() - 0.5) * 0.02
                ),
                rotSpeed: (Math.random() - 0.5) * 0.1
            };
            this.group.parent?.add(sprite);
            this.smokeSprites.push(sprite);
        }
        
        if (Math.random() < 0.1) {
            const mat = new THREE.SpriteMaterial({
                map: SPARK_TEXTURE,
                color: new THREE.Color().setHSL(0.1, 1, 0.7),
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const spark = new THREE.Sprite(mat);
            spark.position.copy(this.group.position);
            spark.scale.set(this.size * 0.08, this.size * 0.15, 1);
            spark.userData = {
                type: 'spark',
                life: 0.3 + Math.random() * 0.3,
                maxLife: 0.6,
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.08,
                    Math.random() * 0.06,
                    (Math.random() - 0.5) * 0.08
                )
            };
            this.group.parent?.add(spark);
            this.sparkSprites.push(spark);
        }
    }
    
    updateTrail(delta, time) {
        for (let i = this.trailSprites.length - 1; i >= 0; i--) {
            const sprite = this.trailSprites[i];
            const d = sprite.userData;
            
            d.life -= delta;
            sprite.position.add(d.vel);
            
            const ratio = 1 - (d.life / d.maxLife);
            sprite.material.opacity = Math.pow(1 - ratio, 1.5);
            sprite.scale.x += delta * 0.3;
            sprite.scale.y += delta * 0.3;
            
            const hue = 0.08 - ratio * 0.06;
            sprite.material.color.setHSL(Math.max(0.02, hue), 1, 0.5 - ratio * 0.2);
            
            if (d.life <= 0) {
                sprite.parent?.remove(sprite);
                if (sprite.material.map) sprite.material.map.dispose();
                sprite.material.dispose();
                this.trailSprites.splice(i, 1);
            }
        }
        
        for (let i = this.smokeSprites.length - 1; i >= 0; i--) {
            const sprite = this.smokeSprites[i];
            const d = sprite.userData;
            
            d.life -= delta;
            sprite.position.add(d.vel);
            
            d.vel.x += Math.sin(time * 2 + sprite.position.x) * 0.0001;
            
            const ratio = 1 - (d.life / d.maxLife);
            sprite.material.opacity = 0.6 * (1 - ratio * ratio);
            sprite.scale.x += delta * 0.8;
            sprite.scale.y += delta * 0.8;
            
            sprite.material.rotation += d.rotSpeed * delta;
            
            if (d.life <= 0) {
                sprite.parent?.remove(sprite);
                if (sprite.material.map) sprite.material.map.dispose();
                sprite.material.dispose();
                this.smokeSprites.splice(i, 1);
            }
        }
        
        for (let i = this.sparkSprites.length - 1; i >= 0; i--) {
            const spark = this.sparkSprites[i];
            const d = spark.userData;
            
            d.life -= delta;
            spark.position.add(d.vel);
            d.vel.y -= 0.002;
            
            const ratio = 1 - (d.life / d.maxLife || 0.5);
            spark.material.opacity = 1 - ratio;
            
            if (d.life <= 0) {
                spark.parent?.remove(spark);
                if (spark.material.map) spark.material.map.dispose();
                spark.material.dispose();
                this.sparkSprites.splice(i, 1);
            }
        }
    }
    
    getParticles() {
        return [];
    }
    
    getLights() {
        return this.lights;
    }
    
    dispose() {
        if (this.core && this.core.geometry) this.core.geometry.dispose();
        if (this.core && this.core.material) this.core.material.dispose();
        if (this.innerMat) this.innerMat.dispose();
        if (this.glowMat) this.glowMat.dispose();
        if (this.glowTexture) this.glowTexture.dispose();
        if (this.outerGlowMat) this.outerGlowMat.dispose();
        if (this.glowSprite && this.glowSprite.material) {
            this.glowSprite.material.dispose();
        }
        if (this.outerGlowSprite && this.outerGlowSprite.material) {
            this.outerGlowSprite.material.dispose();
        }
        if (this.shapeMesh) {
            if (this.shapeMesh.geometry) this.shapeMesh.geometry.dispose();
            if (this.shapeMesh.material) this.shapeMesh.material.dispose();
        }
        
        this.orbitParticles.forEach(orbit => {
            if (orbit.material) orbit.material.dispose();
        });
        
        [...this.trailSprites, ...this.smokeSprites, ...this.sparkSprites].forEach(sprite => {
            sprite.parent?.remove(sprite);
            if (sprite.material) {
                if (sprite.material.map) sprite.material.map.dispose();
                sprite.material.dispose();
            }
        });
    }
}

export class DynamicAreaEffect {
    constructor(config, targetPos, onDamage) {
        this.config = config;
        this.onDamage = onDamage;
        this.targetPos = targetPos.clone();
        this.targetPos.y = 0;
        this.life = 3;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(this.targetPos);
        
        const colors = config.colors || {};
        const areaConfig = config.areaEffect || {};
        const radius = config.radius || 10;
        
        const primaryColor = hexToThreeColor(colors.primary || '#ff6b35');
        const glowColor = hexToThreeColor(colors.glow || '#ff4400');
        const secondaryColor = hexToThreeColor(colors.secondary || '#ffaa00');
        
        this.lights = [];
        
        this.mainLight = new THREE.PointLight(glowColor.getHex(), 15, radius * 3);
        this.mainLight.position.y = 5;
        this.group.add(this.mainLight);
        this.lights.push(this.mainLight);
        
        this.coreLight = new THREE.PointLight(primaryColor.getHex(), 10, radius * 1.5);
        this.coreLight.position.y = 2;
        this.group.add(this.coreLight);
        this.lights.push(this.coreLight);
        
        if (areaConfig.indicator) {
            const ringGeo = new THREE.RingGeometry(radius - 0.5, radius, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: primaryColor,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            this.indicator = new THREE.Mesh(ringGeo, ringMat);
            this.indicator.rotation.x = -Math.PI / 2;
            this.indicator.position.y = 0.1;
            this.group.add(this.indicator);
            
            const innerRingGeo = new THREE.RingGeometry(radius * 0.3, radius * 0.5, 32);
            const innerRingMat = new THREE.MeshBasicMaterial({
                color: secondaryColor,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            this.innerIndicator = new THREE.Mesh(innerRingGeo, innerRingMat);
            this.innerIndicator.rotation.x = -Math.PI / 2;
            this.innerIndicator.position.y = 0.15;
            this.group.add(this.innerIndicator);
            
            const pulseRingGeo = new THREE.RingGeometry(radius * 0.7, radius * 0.8, 32);
            const pulseRingMat = new THREE.MeshBasicMaterial({
                color: glowColor,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            this.pulseIndicator = new THREE.Mesh(pulseRingGeo, pulseRingMat);
            this.pulseIndicator.rotation.x = -Math.PI / 2;
            this.pulseIndicator.position.y = 0.2;
            this.group.add(this.pulseIndicator);
        }
        
        this.warningRunes = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const runeGeo = new THREE.CircleGeometry(0.5, 6);
            const runeMat = new THREE.MeshBasicMaterial({
                color: primaryColor,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            const rune = new THREE.Mesh(runeGeo, runeMat);
            rune.rotation.x = -Math.PI / 2;
            rune.position.set(
                Math.cos(angle) * radius * 0.6,
                0.3,
                Math.sin(angle) * radius * 0.6
            );
            this.group.add(rune);
            this.warningRunes.push({ mesh: rune, angle, baseScale: 1 });
        }
        
        this.particles = [];
        this.hasDamaged = false;
        this.delay = config.delay || 0;
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        if (this.time > this.delay && !this.hasDamaged) {
            this.hasDamaged = true;
            if (this.onDamage) {
                this.onDamage(this.targetPos, this.config.damage, this.config.radius);
            }
            this.createExplosion();
        }
        
        const pulse = 1 + Math.sin(this.time * 8) * 0.1;
        
        if (this.indicator && !this.hasDamaged) {
            const progress = this.time / this.delay;
            this.indicator.material.opacity = 0.3 + progress * 0.5;
            this.indicator.scale.setScalar(1 - progress * 0.3);
        }
        
        if (this.innerIndicator && !this.hasDamaged) {
            this.innerIndicator.rotation.z += delta * 2;
            this.innerIndicator.scale.setScalar(pulse);
        }
        
        if (this.pulseIndicator && !this.hasDamaged) {
            this.pulseIndicator.rotation.z -= delta * 1.5;
            this.pulseIndicator.material.opacity = 0.3 + Math.sin(this.time * 10) * 0.2;
        }
        
        this.warningRunes.forEach((rune, i) => {
            rune.mesh.rotation.z += delta * 3;
            rune.mesh.position.y = 0.3 + Math.sin(this.time * 5 + i) * 0.2;
            rune.mesh.material.opacity = 0.4 + Math.sin(this.time * 8 + i) * 0.3;
        });
        
        this.mainLight.intensity = 15 * (0.8 + Math.sin(this.time * 12) * 0.2);
        this.coreLight.intensity = 10 * (0.9 + Math.sin(this.time * 15) * 0.1);
        
        this.updateParticles(delta);
        
        if (this.hasDamaged) {
            this.mainLight.intensity *= 0.95;
            this.coreLight.intensity *= 0.92;
        }
        
        return this.life > 0;
    }
    
    createExplosion() {
        const colors = this.config.colors || {};
        const particleConfig = this.config.particles || {};
        const primaryColor = hexToThreeColor(colors.primary || '#ff6b35');
        const secondaryColor = hexToThreeColor(colors.secondary || '#ffaa00');
        const glowColor = hexToThreeColor(colors.glow || '#ff4400');
        const count = particleConfig.amount || 200;
        const radius = this.config.radius || 10;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const upAngle = (Math.random() - 0.3) * Math.PI;
            const speed = 5 + Math.random() * 10;
            const colorChoice = Math.random();
            const color = colorChoice < 0.5 ? primaryColor : colorChoice < 0.8 ? secondaryColor : glowColor;
            
            this.particles.push({
                position: this.targetPos.clone().add(new THREE.Vector3(0, 1, 0)),
                velocity: new THREE.Vector3(
                    Math.cos(angle) * Math.cos(upAngle) * speed,
                    Math.sin(upAngle) * speed * 1.5,
                    Math.sin(angle) * Math.cos(upAngle) * speed
                ),
                life: 0.5 + Math.random() * 1.0,
                maxLife: 1.5,
                size: 0.5 + Math.random() * 1.0,
                color: color.clone()
            });
        }
        
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 15 + Math.random() * 10;
            this.particles.push({
                position: this.targetPos.clone().add(new THREE.Vector3(0, 0.5, 0)),
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    5 + Math.random() * 5,
                    Math.sin(angle) * speed
                ),
                life: 0.3 + Math.random() * 0.3,
                maxLife: 0.6,
                size: 0.3 + Math.random() * 0.3,
                color: new THREE.Color(0xffffff)
            });
        }
    }
    
    updateParticles(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            p.velocity.y -= delta * 10;
        }
    }
    
    getParticles() {
        return this.particles;
    }
    
    getLights() {
        return this.lights;
    }
    
    dispose() {
        if (this.indicator && this.indicator.geometry) this.indicator.geometry.dispose();
        if (this.indicator && this.indicator.material) this.indicator.material.dispose();
        if (this.innerIndicator && this.innerIndicator.geometry) this.innerIndicator.geometry.dispose();
        if (this.innerIndicator && this.innerIndicator.material) this.innerIndicator.material.dispose();
        if (this.pulseIndicator && this.pulseIndicator.geometry) this.pulseIndicator.geometry.dispose();
        if (this.pulseIndicator && this.pulseIndicator.material) this.pulseIndicator.material.dispose();
        
        this.warningRunes.forEach(rune => {
            if (rune.mesh.geometry) rune.mesh.geometry.dispose();
            if (rune.mesh.material) rune.mesh.material.dispose();
        });
    }
}

export class DynamicLightningEffect {
    constructor(config, startPos, targetPos, onDamage) {
        this.config = config;
        this.onDamage = onDamage;
        this.life = 0.6;
        this.maxLife = 0.6;
        this.time = 0;
        this.group = new THREE.Group();
        
        this.startPos = startPos.clone();
        this.targetPos = targetPos.clone();
        
        const lightningConfig = config.lightning || {};
        const colors = config.colors || {};
        this.primaryColor = hexToThreeColor(colors.primary || '#facc15');
        this.glowColor = hexToThreeColor(colors.glow || '#fef08a');
        
        this.branchCount = lightningConfig.branchCount || 8;
        this.jitter = lightningConfig.jitterAmount || 2.0;
        this.flickerRate = lightningConfig.flickerRate || 25;
        
        this.createLightningBolt();
        
        this.light = new THREE.PointLight(this.primaryColor.getHex(), 15, 25);
        this.light.position.copy(targetPos);
        this.group.add(this.light);
        
        this.startLight = new THREE.PointLight(this.primaryColor.getHex(), 8, 15);
        this.startLight.position.copy(startPos);
        this.group.add(this.startLight);
        
        this.impactParticles = [];
        this.createImpactParticles();
        
        this.branches = [];
        this.createBranches();
        
        this.flickerTimer = 0;
        
        if (onDamage) {
            onDamage(targetPos, config.damage);
        }
    }
    
    createLightningBolt() {
        const points = createLightningPath(this.startPos, this.targetPos, this.branchCount, this.jitter);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const material = new THREE.LineBasicMaterial({
            color: this.primaryColor.getHex(),
            transparent: true,
            opacity: 1,
            linewidth: 2
        });
        this.line = new THREE.Line(geometry, material);
        this.group.add(this.line);
        
        const glowMat = new THREE.LineBasicMaterial({
            color: this.glowColor.getHex(),
            transparent: true,
            opacity: 0.6,
            linewidth: 4
        });
        this.glowLine = new THREE.Line(geometry.clone(), glowMat);
        this.group.add(this.glowLine);
        
        const coreMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            linewidth: 1
        });
        this.coreLine = new THREE.Line(geometry.clone(), coreMat);
        this.group.add(this.coreLine);
    }
    
    createImpactParticles() {
        const particleCount = 40;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const upAngle = (Math.random() - 0.3) * Math.PI;
            const speed = 5 + Math.random() * 15;
            
            this.impactParticles.push({
                position: this.targetPos.clone(),
                velocity: new THREE.Vector3(
                    Math.cos(angle) * Math.cos(upAngle) * speed,
                    Math.sin(upAngle) * speed + 3,
                    Math.sin(angle) * Math.cos(upAngle) * speed
                ),
                life: 0.3 + Math.random() * 0.4,
                maxLife: 0.7,
                size: 0.15 + Math.random() * 0.25
            });
        }
    }
    
    createBranches() {
        const branchCount = Math.min(this.config?.lightning?.chainCount || 2, 3);
        const direction = this.targetPos.clone().sub(this.startPos).normalize();
        
        for (let i = 0; i < branchCount; i++) {
            const t = 0.3 + Math.random() * 0.5;
            const branchStart = this.startPos.clone().lerp(this.targetPos, t);
            
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 6
            );
            const branchEnd = branchStart.clone().add(offset);
            
            const points = createLightningPath(branchStart, branchEnd, 4, 1.0);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            const material = new THREE.LineBasicMaterial({
                color: this.primaryColor.getHex(),
                transparent: true,
                opacity: 0.7,
                linewidth: 1
            });
            const branch = new THREE.Line(geometry, material);
            this.group.add(branch);
            this.branches.push({ line: branch, life: 0.3 + Math.random() * 0.2 });
        }
    }
    
    updateLightningPath() {
        const points = createLightningPath(this.startPos, this.targetPos, this.branchCount, this.jitter);
        this.line.geometry.setFromPoints(points);
        this.glowLine.geometry.setFromPoints(points);
        this.coreLine.geometry.setFromPoints(points);
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        this.flickerTimer += delta;
        
        const flickerInterval = 1.0 / this.flickerRate;
        if (this.flickerTimer >= flickerInterval) {
            this.flickerTimer = 0;
            this.updateLightningPath();
        }
        
        const lifeRatio = Math.max(0, this.life / this.maxLife);
        const flicker = 0.7 + Math.random() * 0.3;
        
        this.line.material.opacity = lifeRatio * flicker;
        this.glowLine.material.opacity = lifeRatio * 0.5 * flicker;
        this.coreLine.material.opacity = lifeRatio * 0.8 * flicker;
        
        this.light.intensity = 15 * lifeRatio * flicker;
        this.startLight.intensity = 8 * lifeRatio * flicker;
        
        for (let i = this.branches.length - 1; i >= 0; i--) {
            const branch = this.branches[i];
            branch.life -= delta;
            branch.line.material.opacity = Math.max(0, branch.life * 2) * flicker;
            
            if (branch.life <= 0) {
                branch.line.geometry.dispose();
                branch.line.material.dispose();
                this.group.remove(branch.line);
                this.branches.splice(i, 1);
            }
        }
        
        for (let i = this.impactParticles.length - 1; i >= 0; i--) {
            const p = this.impactParticles[i];
            p.life -= delta;
            if (p.life <= 0) {
                this.impactParticles.splice(i, 1);
                continue;
            }
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            p.velocity.y -= delta * 25;
            p.velocity.multiplyScalar(0.98);
        }
        
        return this.life > 0;
    }
    
    getParticles() {
        return this.impactParticles;
    }
    
    dispose() {
        if (this.line && this.line.geometry) this.line.geometry.dispose();
        if (this.line && this.line.material) this.line.material.dispose();
        if (this.glowLine && this.glowLine.geometry) this.glowLine.geometry.dispose();
        if (this.glowLine && this.glowLine.material) this.glowLine.material.dispose();
        if (this.coreLine && this.coreLine.geometry) this.coreLine.geometry.dispose();
        if (this.coreLine && this.coreLine.material) this.coreLine.material.dispose();
        
        this.branches.forEach(branch => {
            if (branch.line.geometry) branch.line.geometry.dispose();
            if (branch.line.material) branch.line.material.dispose();
        });
    }
}

export class DynamicHealEffect {
    constructor(config, targetPos, onHeal) {
        this.config = config;
        this.targetPos = targetPos.clone();
        this.life = 2.5;
        this.maxLife = 2.5;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(targetPos);
        
        const colors = config.colors || {};
        const primaryColor = hexToThreeColor(colors.primary || '#22c55e');
        const secondaryColor = hexToThreeColor(colors.secondary || '#86efac');
        const glowColor = hexToThreeColor(colors.glow || '#10b981');
        
        this.lights = [];
        
        this.mainLight = new THREE.PointLight(primaryColor.getHex(), 10, 20);
        this.mainLight.position.y = 3;
        this.group.add(this.mainLight);
        this.lights.push(this.mainLight);
        
        this.coreLight = new THREE.PointLight(0xffffff, 6, 10);
        this.coreLight.position.y = 2;
        this.group.add(this.coreLight);
        this.lights.push(this.coreLight);
        
        this.ambientLight = new THREE.PointLight(secondaryColor.getHex(), 4, 25);
        this.ambientLight.position.y = 4;
        this.group.add(this.ambientLight);
        this.lights.push(this.ambientLight);
        
        const ringGeo = new THREE.TorusGeometry(1.5, 0.1, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ 
            color: primaryColor, 
            transparent: true, 
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        this.ring1 = new THREE.Mesh(ringGeo, ringMat);
        this.ring1.rotation.x = Math.PI / 2;
        this.ring1.position.y = 0.5;
        this.group.add(this.ring1);
        
        const ring2Geo = new THREE.TorusGeometry(2.5, 0.08, 8, 32);
        const ring2Mat = new THREE.MeshBasicMaterial({ 
            color: secondaryColor, 
            transparent: true, 
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        this.ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
        this.ring2.rotation.x = Math.PI / 2;
        this.ring2.position.y = 0.3;
        this.group.add(this.ring2);
        
        const ring3Geo = new THREE.TorusGeometry(3.5, 0.05, 8, 32);
        const ring3Mat = new THREE.MeshBasicMaterial({ 
            color: glowColor, 
            transparent: true, 
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        this.ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
        this.ring3.rotation.x = Math.PI / 2;
        this.ring3.position.y = 0.1;
        this.group.add(this.ring3);
        
        const columnGeo = new THREE.CylinderGeometry(0.8, 1.2, 6, 16, 1, true);
        const columnMat = new THREE.MeshBasicMaterial({ 
            color: primaryColor, 
            transparent: true, 
            opacity: 0.15,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        this.column = new THREE.Mesh(columnGeo, columnMat);
        this.column.position.y = 3;
        this.group.add(this.column);
        
        this.orbParticles = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const orbGeo = new THREE.SphereGeometry(0.2, 8, 8);
            const orbMat = new THREE.MeshBasicMaterial({ 
                color: secondaryColor, 
                transparent: true, 
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            const orb = new THREE.Mesh(orbGeo, orbMat);
            orb.userData = { angle, radius: 2, speed: 2 + Math.random(), yOffset: Math.random() * 3 };
            this.group.add(orb);
            this.orbParticles.push(orb);
        }
        
        this.particles = [];
        this.healApplied = false;
        
        if (onHeal) {
            onHeal(config.healAmount);
        }
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const lifeRatio = this.life / this.maxLife;
        const pulse = 1 + Math.sin(this.time * 6) * 0.15;
        
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1.5;
            this.particles.push({
                position: new THREE.Vector3(
                    Math.cos(angle) * radius,
                    0,
                    Math.sin(angle) * radius
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    2 + Math.random() * 3,
                    (Math.random() - 0.5) * 0.5
                ),
                life: 0.8 + Math.random() * 0.7,
                maxLife: 1.5,
                size: 0.3 + Math.random() * 0.4
            });
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            p.velocity.y += delta * 0.5;
        }
        
        if (this.ring1) {
            this.ring1.rotation.z += delta * 2;
            this.ring1.scale.setScalar(pulse);
            this.ring1.material.opacity = 0.6 * lifeRatio;
        }
        if (this.ring2) {
            this.ring2.rotation.z -= delta * 1.5;
            this.ring2.scale.setScalar(pulse * 1.1);
            this.ring2.material.opacity = 0.4 * lifeRatio;
        }
        if (this.ring3) {
            this.ring3.rotation.z += delta;
            this.ring3.scale.setScalar(pulse * 1.2);
            this.ring3.material.opacity = 0.3 * lifeRatio;
        }
        
        if (this.column) {
            this.column.rotation.y += delta * 0.5;
            this.column.material.opacity = 0.15 * lifeRatio;
            this.column.scale.x = pulse;
            this.column.scale.z = pulse;
        }
        
        this.orbParticles.forEach(orb => {
            orb.userData.angle += delta * orb.userData.speed;
            const radius = orb.userData.radius + Math.sin(this.time * 3) * 0.3;
            orb.position.x = Math.cos(orb.userData.angle) * radius;
            orb.position.z = Math.sin(orb.userData.angle) * radius;
            orb.position.y = orb.userData.yOffset + Math.sin(this.time * 4 + orb.userData.angle) * 0.5;
            orb.material.opacity = 0.6 + Math.sin(this.time * 8) * 0.2;
        });
        
        this.mainLight.intensity = 10 * lifeRatio * (0.8 + Math.sin(this.time * 8) * 0.2);
        this.coreLight.intensity = 6 * lifeRatio * (0.9 + Math.sin(this.time * 10) * 0.1);
        this.ambientLight.intensity = 4 * lifeRatio;
        
        return this.life > 0;
    }
    
    getParticles() {
        return this.particles;
    }
    
    getLights() {
        return this.lights;
    }
    
    dispose() {
        if (this.ring1 && this.ring1.geometry) this.ring1.geometry.dispose();
        if (this.ring1 && this.ring1.material) this.ring1.material.dispose();
        if (this.ring2 && this.ring2.geometry) this.ring2.geometry.dispose();
        if (this.ring2 && this.ring2.material) this.ring2.material.dispose();
        if (this.ring3 && this.ring3.geometry) this.ring3.geometry.dispose();
        if (this.ring3 && this.ring3.material) this.ring3.material.dispose();
        if (this.column && this.column.geometry) this.column.geometry.dispose();
        if (this.column && this.column.material) this.column.material.dispose();
        
        this.orbParticles.forEach(orb => {
            if (orb.geometry) orb.geometry.dispose();
            if (orb.material) orb.material.dispose();
        });
    }
}

export class DynamicExplosionEffect {
    constructor(config, position) {
        this.position = position.clone();
        this.config = config;
        this.life = 1.5;
        this.maxLife = 1.5;
        this.time = 0;
        this.particles = [];
        this.lights = [];
        
        const colors = config.colors || {};
        const explosionConfig = config.explosion || {};
        const primaryColor = hexToThreeColor(colors.primary || '#ff6b35');
        const glowColor = hexToThreeColor(colors.glow || '#ff4400');
        
        const size = explosionConfig.size || 4;
        const particleCount = explosionConfig.particles || 200;
        
        const flash = new THREE.PointLight(glowColor.getHex(), 15, size * 4);
        flash.position.copy(position);
        this.lights.push(flash);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const upAngle = (Math.random() - 0.3) * Math.PI;
            const speed = size + Math.random() * size * 2;
            
            this.particles.push({
                position: position.clone(),
                velocity: new THREE.Vector3(
                    Math.cos(angle) * Math.cos(upAngle) * speed,
                    Math.sin(upAngle) * speed * 1.5,
                    Math.sin(angle) * Math.cos(upAngle) * speed
                ),
                life: 0.5 + Math.random() * 0.8,
                maxLife: 1.3,
                size: 0.8 + Math.random() * 0.8,
                type: 'fire',
                color: primaryColor.clone()
            });
        }
        
        if (explosionConfig.smoke) {
            for (let i = 0; i < 30; i++) {
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
        }
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            if (p.type === 'fire') {
                p.velocity.y -= delta * 10;
            } else if (p.type === 'smoke') {
                p.velocity.y += delta * 2;
            }
        }
        
        this.lights.forEach(light => {
            light.intensity *= 0.95;
        });
        
        return this.life > 0;
    }
    
    getParticles() {
        return this.particles;
    }
    
    getLights() {
        return this.lights;
    }
    
    dispose() {}
}

export function createSkillEffect(config, startPos, targetPos, callbacks) {
    const type = config.type;
    
    switch (type) {
        case 'projectile':
            return new DynamicProjectileEffect(
                config,
                startPos,
                targetPos,
                callbacks?.onHit
            );
            
        case 'area':
            return new DynamicAreaEffect(
                config,
                targetPos,
                callbacks?.onDamage
            );
            
        case 'lightning':
            return new DynamicLightningEffect(
                config,
                startPos,
                targetPos,
                callbacks?.onDamage
            );
            
        case 'heal':
            return new DynamicHealEffect(
                config,
                startPos,
                callbacks?.onHeal
            );
            
        case 'melee':
            return new DynamicMeleeEffect(
                config,
                startPos,
                targetPos,
                callbacks?.onDamage
            );
            
        case 'movement':
            return new DynamicMovementEffect(
                config,
                startPos,
                targetPos,
                callbacks?.onDamage
            );
            
        case 'buff':
            return new DynamicBuffEffect(
                config,
                startPos,
                callbacks?.onBuff
            );
            
        default:
            console.warn(`Unknown skill type: ${type}`);
            return null;
    }
}

// ==========================================
// 近戰技能效果
// ==========================================
export class DynamicMeleeEffect {
    constructor(config, startPos, targetPos, onDamage) {
        this.config = config;
        this.onDamage = onDamage;
        this.startPos = startPos.clone();
        this.targetPos = targetPos.clone();
        this.life = 0.5;
        this.maxLife = 0.5;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        const colors = config.colors || {};
        const subType = config.subType || 'cone';
        
        this.primaryColor = hexToThreeColor(colors.primary || '#f8fafc');
        this.secondaryColor = hexToThreeColor(colors.secondary || '#e2e8f0');
        this.glowColor = hexToThreeColor(colors.glow || '#94a3b8');
        
        this.lights = [];
        this.slashTrails = [];
        this.particles = [];
        
        this.mainLight = new THREE.PointLight(this.glowColor.getHex(), 10, 15);
        this.mainLight.position.y = 1;
        this.group.add(this.mainLight);
        this.lights.push(this.mainLight);
        
        if (subType === 'cone') {
            this.createConeSlash();
        } else if (subType === 'aoe') {
            this.createAoeSpin();
        }
        
        this.damageApplied = false;
    }
    
    createConeSlash() {
        const slashConfig = this.config.slashEffect || {};
        const coneAngle = this.config.coneAngle || 1.05;
        const range = this.config.range || 8;
        const trailLength = slashConfig.trailLength || 15;
        const width = slashConfig.width || 3;
        
        const points = [];
        for (let i = 0; i <= trailLength; i++) {
            const t = i / trailLength;
            const angle = -coneAngle / 2 + coneAngle * t;
            const r = range * Math.sin(t * Math.PI);
            points.push(new THREE.Vector3(
                Math.cos(angle) * r,
                0.5 + Math.sin(t * Math.PI) * 0.5,
                Math.sin(angle) * r - range / 2
            ));
        }
        
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 30, 0.1, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
            color: this.primaryColor.getHex(),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        this.slashTube = new THREE.Mesh(tubeGeo, tubeMat);
        this.group.add(this.slashTube);
        
        const glowGeo = new THREE.TubeGeometry(curve, 30, 0.3, 8, false);
        const glowMat = new THREE.MeshBasicMaterial({
            color: this.glowColor.getHex(),
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        this.slashGlow = new THREE.Mesh(glowGeo, glowMat);
        this.group.add(this.slashGlow);
        
        for (let i = 0; i < 30; i++) {
            const t = Math.random();
            const angle = -coneAngle / 2 + coneAngle * t;
            const r = range * Math.sin(t * Math.PI) * (0.5 + Math.random() * 0.5);
            this.particles.push({
                position: new THREE.Vector3(
                    Math.cos(angle) * r,
                    0.5 + Math.random(),
                    Math.sin(angle) * r - range / 2
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 5,
                    Math.random() * 3,
                    (Math.random() - 0.5) * 5
                ),
                life: 0.3 + Math.random() * 0.3,
                maxLife: 0.6,
                size: 0.1 + Math.random() * 0.2
            });
        }
    }
    
    createAoeSpin() {
        const spinConfig = this.config.spinEffect || {};
        const radius = this.config.radius || 12;
        const rotations = spinConfig.rotations || 2;
        this.spinDuration = spinConfig.duration || 1.0;
        this.maxLife = this.spinDuration;
        this.life = this.spinDuration;
        this.rotations = rotations;
        this.spinRadius = radius;
        
        const ringGeo = new THREE.TorusGeometry(radius, 0.2, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: this.primaryColor.getHex(),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        this.spinRing = new THREE.Mesh(ringGeo, ringMat);
        this.spinRing.rotation.x = Math.PI / 2;
        this.spinRing.position.y = 0.5;
        this.group.add(this.spinRing);
        
        const outerRingGeo = new THREE.TorusGeometry(radius * 1.2, 0.1, 8, 32);
        const outerRingMat = new THREE.MeshBasicMaterial({
            color: this.glowColor.getHex(),
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        this.outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
        this.outerRing.rotation.x = Math.PI / 2;
        this.outerRing.position.y = 0.3;
        this.group.add(this.outerRing);
        
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * radius;
            this.particles.push({
                position: new THREE.Vector3(
                    Math.cos(angle) * r,
                    Math.random() * 2,
                    Math.sin(angle) * r
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 8,
                    Math.random() * 4,
                    (Math.random() - 0.5) * 8
                ),
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1.0,
                size: 0.1 + Math.random() * 0.3
            });
        }
        
        this.mainLight.intensity = 15;
        this.mainLight.distance = radius * 2;
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const lifeRatio = Math.max(0, this.life / this.maxLife);
        const subType = this.config.subType || 'cone';
        
        if (!this.damageApplied) {
            this.damageApplied = true;
            if (this.onDamage) {
                const range = subType === 'aoe' ? this.config.radius : this.config.range;
                this.onDamage(this.startPos, this.config.damage, range);
            }
        }
        
        if (subType === 'cone') {
            if (this.slashTube) {
                this.slashTube.material.opacity = lifeRatio * 0.8;
                this.slashTube.scale.setScalar(1 + (1 - lifeRatio) * 0.5);
            }
            if (this.slashGlow) {
                this.slashGlow.material.opacity = lifeRatio * 0.4;
            }
        } else if (subType === 'aoe') {
            const progress = 1 - lifeRatio;
            const currentRotation = progress * this.rotations * Math.PI * 2;
            
            if (this.spinRing) {
                this.spinRing.rotation.z = currentRotation;
                this.spinRing.material.opacity = lifeRatio * 0.8;
                const pulse = 1 + Math.sin(this.time * 20) * 0.1;
                this.spinRing.scale.setScalar(pulse);
            }
            if (this.outerRing) {
                this.outerRing.rotation.z = -currentRotation * 0.5;
                this.outerRing.material.opacity = lifeRatio * 0.5;
            }
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            p.velocity.y -= delta * 10;
            p.velocity.multiplyScalar(0.95);
        }
        
        this.mainLight.intensity = 10 * lifeRatio;
        
        return this.life > 0;
    }
    
    getParticles() {
        return this.particles;
    }
    
    getLights() {
        return this.lights;
    }
    
    dispose() {
        if (this.slashTube) {
            if (this.slashTube.geometry) this.slashTube.geometry.dispose();
            if (this.slashTube.material) this.slashTube.material.dispose();
        }
        if (this.slashGlow) {
            if (this.slashGlow.geometry) this.slashGlow.geometry.dispose();
            if (this.slashGlow.material) this.slashGlow.material.dispose();
        }
        if (this.spinRing) {
            if (this.spinRing.geometry) this.spinRing.geometry.dispose();
            if (this.spinRing.material) this.spinRing.material.dispose();
        }
        if (this.outerRing) {
            if (this.outerRing.geometry) this.outerRing.geometry.dispose();
            if (this.outerRing.material) this.outerRing.material.dispose();
        }
    }
}

// ==========================================
// 衝鋒/移動技能效果
// ==========================================
export class DynamicMovementEffect {
    constructor(config, startPos, targetPos, onDamage) {
        this.config = config;
        this.onDamage = onDamage;
        this.startPos = startPos.clone();
        this.targetPos = targetPos.clone();
        this.life = 0.8;
        this.maxLife = 0.8;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        const colors = config.colors || {};
        const movementConfig = config.movementEffect || {};
        
        this.primaryColor = hexToThreeColor(colors.primary || '#f97316');
        this.glowColor = hexToThreeColor(colors.glow || '#ea580c');
        
        this.speed = movementConfig.speed || 60;
        this.hasTrail = movementConfig.trailParticles !== false;
        this.hasImpact = movementConfig.impactEffect !== false;
        
        this.lights = [];
        this.particles = [];
        this.trailParticles = [];
        
        this.mainLight = new THREE.PointLight(this.glowColor.getHex(), 12, 20);
        this.mainLight.position.y = 1;
        this.group.add(this.mainLight);
        this.lights.push(this.mainLight);
        
        const direction = this.targetPos.clone().sub(this.startPos).normalize();
        this.velocity = direction.multiplyScalar(this.speed);
        
        this.damageApplied = false;
        this.arrived = false;
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const lifeRatio = Math.max(0, this.life / this.maxLife);
        
        if (!this.arrived) {
            const distanceToTarget = this.group.position.distanceTo(this.targetPos);
            const moveDistance = this.velocity.length() * delta;
            
            if (distanceToTarget < moveDistance + 1) {
                this.arrived = true;
                this.group.position.copy(this.targetPos);
                
                if (!this.damageApplied && this.onDamage) {
                    this.damageApplied = true;
                    this.onDamage(this.targetPos, this.config.damage, 5);
                }
                
                if (this.hasImpact) {
                    this.createImpactEffect();
                }
            } else {
                this.group.position.add(this.velocity.clone().multiplyScalar(delta));
            }
            
            if (this.hasTrail && Math.random() < 0.5) {
                this.trailParticles.push({
                    position: this.group.position.clone(),
                    life: 0.3 + Math.random() * 0.2,
                    maxLife: 0.5,
                    size: 0.2 + Math.random() * 0.3
                });
            }
        }
        
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const p = this.trailParticles[i];
            p.life -= delta;
            if (p.life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            p.velocity.y -= delta * 15;
        }
        
        this.mainLight.intensity = 12 * lifeRatio;
        
        return this.life > 0;
    }
    
    createImpactEffect() {
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const upAngle = (Math.random() - 0.3) * Math.PI;
            const speed = 5 + Math.random() * 15;
            
            this.particles.push({
                position: this.targetPos.clone(),
                velocity: new THREE.Vector3(
                    Math.cos(angle) * Math.cos(upAngle) * speed,
                    Math.sin(upAngle) * speed + 5,
                    Math.sin(angle) * Math.cos(upAngle) * speed
                ),
                life: 0.4 + Math.random() * 0.4,
                maxLife: 0.8,
                size: 0.2 + Math.random() * 0.4
            });
        }
        
        const flashLight = new THREE.PointLight(0xffffff, 20, 15);
        flashLight.position.copy(this.targetPos);
        flashLight.position.y = 1;
        this.group.add(flashLight);
        this.lights.push(flashLight);
    }
    
    getParticles() {
        return [...this.particles, ...this.trailParticles];
    }
    
    getLights() {
        return this.lights;
    }
    
    dispose() {
        this.lights.forEach(light => {
            if (light.parent) light.parent.remove(light);
        });
    }
}

export class DynamicBuffEffect {
    constructor(config, startPos, onBuff) {
        this.config = config;
        this.startPos = startPos.clone();
        this.life = config.duration || 3;
        this.maxLife = this.life;
        this.time = 0;
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        
        const colors = config.colors || {};
        const element = config.element || 'nature';
        
        this.primaryColor = hexToThreeColor(colors.primary || '#22c55e');
        this.secondaryColor = hexToThreeColor(colors.secondary || '#86efac');
        this.glowColor = hexToThreeColor(colors.glow || '#16a34a');
        this.coreColor = hexToThreeColor(colors.core || '#ffffff');
        
        this.element = element;
        this.lights = [];
        this.particles = [];
        this.orbs = [];
        this.rings = [];
        
        this.mainLight = new THREE.PointLight(this.primaryColor.getHex(), 15, 25);
        this.mainLight.position.y = 2;
        this.group.add(this.mainLight);
        this.lights.push(this.mainLight);
        
        this.ambientLight = new THREE.PointLight(this.secondaryColor.getHex(), 8, 30);
        this.ambientLight.position.y = 4;
        this.group.add(this.ambientLight);
        this.lights.push(this.ambientLight);
        
        this.createBuffAura();
        this.createOrbitingOrbs();
        this.createRisingParticles();
        
        if (onBuff) {
            onBuff(config);
        }
    }
    
    createBuffAura() {
        const auraGeo = new THREE.SphereGeometry(2.5, 32, 32);
        this.auraMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: this.primaryColor },
                uColor2: { value: this.secondaryColor }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec2 vUv;
                uniform float uTime;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vUv = uv;
                    vec3 pos = position;
                    pos += normal * sin(uTime * 3.0 + position.y * 5.0) * 0.15;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uColor;
                uniform vec3 uColor2;
                varying vec3 vNormal;
                varying vec2 vUv;
                void main() {
                    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
                    float wave = sin(uTime * 5.0 + vUv.y * 10.0) * 0.5 + 0.5;
                    vec3 col = mix(uColor, uColor2, wave);
                    gl_FragColor = vec4(col, fresnel * 0.4);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            depthWrite: false
        });
        this.aura = new THREE.Mesh(auraGeo, this.auraMat);
        this.aura.position.y = 3;
        this.group.add(this.aura);
        
        const innerAuraGeo = new THREE.SphereGeometry(1.8, 32, 32);
        this.innerAuraMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: this.coreColor }
            },
            vertexShader: `
                varying vec3 vNormal;
                uniform float uTime;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec3 pos = position;
                    pos += normal * sin(uTime * 4.0 + position.x * 3.0) * 0.1;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uColor;
                varying vec3 vNormal;
                void main() {
                    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
                    float pulse = sin(uTime * 8.0) * 0.3 + 0.7;
                    gl_FragColor = vec4(uColor * pulse, fresnel * 0.6);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            depthWrite: false
        });
        this.innerAura = new THREE.Mesh(innerAuraGeo, this.innerAuraMat);
        this.innerAura.position.y = 3;
        this.group.add(this.innerAura);
    }
    
    createOrbitingOrbs() {
        const orbCount = 8;
        for (let i = 0; i < orbCount; i++) {
            const angle = (i / orbCount) * Math.PI * 2;
            const orbGeo = new THREE.SphereGeometry(0.2, 8, 8);
            const orbMat = new THREE.MeshBasicMaterial({
                color: i % 2 === 0 ? this.primaryColor.getHex() : this.secondaryColor.getHex(),
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending
            });
            const orb = new THREE.Mesh(orbGeo, orbMat);
            orb.userData = {
                angle,
                radius: 2.5 + Math.random() * 0.5,
                speed: 1.5 + Math.random() * 0.5,
                yOffset: 1.5 + Math.random() * 3,
                ySpeed: 2 + Math.random()
            };
            this.group.add(orb);
            this.orbs.push(orb);
        }
    }
    
    createRisingParticles() {
        this.risingParticleTimer = 0;
    }
    
    emitRisingParticle() {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 2;
        this.particles.push({
            position: new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                2 + Math.random() * 3,
                (Math.random() - 0.5) * 0.5
            ),
            life: 1 + Math.random() * 1,
            maxLife: 2,
            size: 0.1 + Math.random() * 0.2
        });
    }
    
    update(delta) {
        this.life -= delta;
        this.time += delta;
        
        const lifeRatio = Math.max(0, this.life / this.maxLife);
        const pulse = 1 + Math.sin(this.time * 6) * 0.1;
        
        if (this.auraMat && this.auraMat.uniforms) {
            this.auraMat.uniforms.uTime.value = this.time;
        }
        if (this.innerAuraMat && this.innerAuraMat.uniforms) {
            this.innerAuraMat.uniforms.uTime.value = this.time;
        }
        
        if (this.aura) {
            this.aura.scale.setScalar(pulse * lifeRatio);
        }
        if (this.innerAura) {
            this.innerAura.scale.setScalar(pulse * 0.9 * lifeRatio);
            this.innerAura.rotation.y += delta * 0.5;
        }
        
        this.orbs.forEach(orb => {
            orb.userData.angle += delta * orb.userData.speed;
            const radius = orb.userData.radius * (1 + Math.sin(this.time * 2) * 0.2);
            orb.position.x = Math.cos(orb.userData.angle) * radius;
            orb.position.z = Math.sin(orb.userData.angle) * radius;
            orb.position.y = orb.userData.yOffset + Math.sin(this.time * orb.userData.ySpeed + orb.userData.angle) * 0.5;
            orb.material.opacity = lifeRatio * 0.9;
        });
        
        this.risingParticleTimer += delta;
        if (this.risingParticleTimer > 0.05) {
            this.risingParticleTimer = 0;
            this.emitRisingParticle();
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.position.add(p.velocity.clone().multiplyScalar(delta));
            p.velocity.y += delta * 0.5;
        }
        
        this.mainLight.intensity = 15 * lifeRatio * (0.8 + Math.sin(this.time * 8) * 0.2);
        this.ambientLight.intensity = 8 * lifeRatio * (0.9 + Math.sin(this.time * 6) * 0.1);
        
        return this.life > 0;
    }
    
    getParticles() {
        return this.particles;
    }
    
    getLights() {
        return this.lights;
    }
    
    dispose() {
        if (this.auraMat) this.auraMat.dispose();
        if (this.innerAuraMat) this.innerAuraMat.dispose();
        if (this.aura && this.aura.geometry) this.aura.geometry.dispose();
        if (this.innerAura && this.innerAura.geometry) this.innerAura.geometry.dispose();
        
        this.orbs.forEach(orb => {
            if (orb.geometry) orb.geometry.dispose();
            if (orb.material) orb.material.dispose();
        });
        
        this.lights.forEach(light => {
            if (light.parent) light.parent.remove(light);
        });
    }
}
