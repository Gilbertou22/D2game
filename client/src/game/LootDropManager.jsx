import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import useGameState from '../hooks/useGameState';
import * as THREE from 'three';

const RARITY_CONFIG = {
    common: {
        name: '普通',
        color: new THREE.Color(0x9d9d9d),
        intensity: 0.5,
        pillar: false
    },
    uncommon: {
        name: '魔法',
        color: new THREE.Color(0x1eff00),
        intensity: 0.8,
        pillar: true
    },
    rare: {
        name: '稀有',
        color: new THREE.Color(0x0070dd),
        intensity: 1.0,
        pillar: true
    },
    epic: {
        name: '史詩',
        color: new THREE.Color(0xa335ee),
        intensity: 1.3,
        pillar: true
    },
    legendary: {
        name: '傳說',
        color: new THREE.Color(0xff8000),
        intensity: 1.8,
        pillar: true,
        rainbow: true
    }
};

const ITEM_ICONS = {
    weapon: '⚔️',
    armor: '🛡️',
    helmet: '⛑️',
    ring: '💍',
    amulet: '📿',
    hp_potion: '❤️',
    mana_potion: '💙',
    gold: '💰'
};

function createHaloTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    const col = `#${color.getHexString()}`;
    gradient.addColorStop(0, col);
    gradient.addColorStop(0.3, col + '88');
    gradient.addColorStop(0.6, col + '44');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    return new THREE.CanvasTexture(canvas);
}

class DroppedItemInstance {
    constructor(item, position, onPickup) {
        this.item = item;
        this.onPickup = onPickup;
        this.lifetime = 0;
        this.state = 'falling';
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            5 + Math.random() * 3,
            (Math.random() - 0.5) * 3
        );
        
        const isEquipment = !['gold', 'hp_potion', 'mana_potion'].includes(item.type);
        this.rarity = item.rarity || (isEquipment ? 'uncommon' : 'common');
        this.config = RARITY_CONFIG[this.rarity] || RARITY_CONFIG.common;
        
        this.group = new THREE.Group();
        this.group.position.copy(position);
        this.group.position.y = 3;
        
        this.createMesh();
        this.createHalo();
        this.createGroundRune();
        this.createParticles();
        
        if (this.config.pillar) {
            this.createPillar();
        }
        
        this.createLight();
    }
    
    createMesh() {
        let geo;
        const itemType = this.item.type;
        
        if (itemType === 'gold') {
            geo = new THREE.SphereGeometry(0.15, 16, 16);
        } else if (itemType === 'hp_potion' || itemType === 'mana_potion') {
            geo = new THREE.CylinderGeometry(0.1, 0.15, 0.3, 8);
        } else {
            geo = new THREE.BoxGeometry(0.25, 0.35, 0.08);
        }
        
        const mat = new THREE.MeshStandardMaterial({
            color: this.config.color,
            emissive: this.config.color,
            emissiveIntensity: 1.5,
            metalness: 0.7,
            roughness: 0.3,
            transparent: true,
            opacity: 1
        });
        
        this.mesh = new THREE.Mesh(geo, mat);
        this.group.add(this.mesh);
    }
    
    createHalo() {
        const texture = createHaloTexture(this.config.color);
        const mat = new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.6
        });
        
        this.halo = new THREE.Sprite(mat);
        this.halo.scale.set(1.5, 1.5, 1);
        this.halo.position.y = 0.2;
        this.group.add(this.halo);
    }
    
    createGroundRune() {
        const geo = new THREE.RingGeometry(0.25, 0.35, 32);
        const mat = new THREE.MeshBasicMaterial({
            color: this.config.color,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        this.rune = new THREE.Mesh(geo, mat);
        this.rune.rotation.x = -Math.PI / 2;
        this.rune.position.y = 0.01;
        this.group.add(this.rune);
        
        const innerGeo = new THREE.RingGeometry(0.1, 0.15, 32);
        const innerRune = new THREE.Mesh(innerGeo, mat.clone());
        innerRune.rotation.x = -Math.PI / 2;
        innerRune.position.y = 0.02;
        innerRune.userData.speed = -2;
        this.rune.add(innerRune);
    }
    
    createPillar() {
        const pillarGeo = new THREE.CylinderGeometry(0.03, 0.1, 8, 16, 16, true);
        
        const pillarMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: this.config.color },
                uIntensity: { value: this.config.intensity }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPos;
                void main() {
                    vUv = uv;
                    vPos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uColor;
                uniform float uIntensity;
                varying vec2 vUv;
                varying vec3 vPos;
                
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                void main() {
                    float fade = 1.0 - smoothstep(0.0, 1.0, vUv.y);
                    float n = noise(vec2(vPos.x * 2.0 + uTime * 2.0, vPos.y * 5.0 - uTime * 10.0));
                    float edge = 1.0 - abs(vUv.x - 0.5) * 2.0;
                    edge = pow(edge, 1.5);
                    float alpha = fade * edge * (0.15 + n * 0.25);
                    vec3 finalColor = uColor;
                    gl_FragColor = vec4(finalColor, alpha * uIntensity * 0.4);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.pillar = new THREE.Mesh(pillarGeo, pillarMat);
        this.pillar.position.y = 4;
        this.group.add(this.pillar);
    }
    
    createParticles() {
        const count = 30;
        const positions = new Float32Array(count * 3);
        this.velocities = [];
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 0.2 + Math.random() * 0.5;
            positions[i * 3] = r * Math.cos(angle);
            positions[i * 3 + 1] = Math.random() * 1.5;
            positions[i * 3 + 2] = r * Math.sin(angle);
            
            this.velocities.push({
                x: (Math.random() - 0.5) * 0.1,
                y: 0.3 + Math.random() * 0.7,
                z: (Math.random() - 0.5) * 0.1
            });
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const mat = new THREE.PointsMaterial({
            color: this.config.color,
            size: 0.06,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(geo, mat);
        this.group.add(this.particles);
    }
    
    createLight() {
        this.light = new THREE.PointLight(this.config.color, this.config.intensity, 5);
        this.light.position.y = 0.5;
        this.group.add(this.light);
    }
    
    update(delta) {
        this.lifetime += delta;
        
        if (this.state === 'falling') {
            this.velocity.y -= 12 * delta;
            this.group.position.add(this.velocity.clone().multiplyScalar(delta));
            this.group.rotation.x += delta * 4;
            this.group.rotation.z += delta * 2;
            
            if (this.group.position.y <= 0.3) {
                this.group.position.y = 0.3;
                if (Math.abs(this.velocity.y) > 0.5) {
                    this.velocity.y *= -0.3;
                } else {
                    this.state = 'idle';
                    this.group.rotation.set(0, 0, 0);
                }
            }
        } else {
            const t = this.lifetime;
            
            this.group.position.y = 0.3 + Math.sin(t * 2) * 0.1;
            this.group.rotation.y = t * 0.5;
            
            const pulse = 1 + Math.sin(t * 4) * 0.2;
            this.halo.scale.set(1.5 * pulse, 1.5 * pulse, 1);
            this.light.intensity = this.config.intensity * pulse;
            
            if (this.rune) {
                this.rune.rotation.z = t * 0.5;
                if (this.rune.children[0]) {
                    this.rune.children[0].rotation.z = -t * 1.2;
                }
                const runeScale = 1 + Math.sin(t * 3) * 0.1;
                this.rune.scale.set(runeScale, runeScale, 1);
            }
            
            if (this.pillar && this.pillar.material.uniforms) {
                this.pillar.material.uniforms.uTime.value = t;
            }
            
            if (this.particles) {
                const positions = this.particles.geometry.attributes.position.array;
                for (let i = 0; i < this.velocities.length; i++) {
                    positions[i * 3] += this.velocities[i].x * delta;
                    positions[i * 3 + 1] += this.velocities[i].y * delta;
                    positions[i * 3 + 2] += this.velocities[i].z * delta;
                    
                    if (positions[i * 3 + 1] > 3) {
                        positions[i * 3 + 1] = 0;
                        const angle = Math.random() * Math.PI * 2;
                        const r = 0.2 + Math.random() * 0.5;
                        positions[i * 3] = r * Math.cos(angle);
                        positions[i * 3 + 2] = r * Math.sin(angle);
                    }
                }
                this.particles.geometry.attributes.position.needsUpdate = true;
            }
            
            if (this.config.rainbow) {
                const h = (t * 0.15) % 1;
                const c = new THREE.Color().setHSL(h, 1, 0.6);
                this.mesh.material.emissive = c;
                this.mesh.material.color = c;
                this.light.color = c;
            }
        }
    }
    
    dispose() {
        this.group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
        });
    }
}

function DroppedItem({ data, onPickup }) {
    const ref = useRef();
    const instanceRef = useRef();
    
    useEffect(() => {
        instanceRef.current = new DroppedItemInstance(data.item, data.position, onPickup);
        ref.current.add(instanceRef.current.group);
        
        return () => {
            if (instanceRef.current) {
                instanceRef.current.dispose();
            }
        };
    }, []);
    
    useFrame((_, delta) => {
        if (instanceRef.current) {
            instanceRef.current.update(delta);
        }
    });
    
    return <group ref={ref} />;
}

function LootDropManager() {
    const { scene } = useThree();
    const droppedItems = useGameState(state => state.droppedItems);
    const addDroppedItem = useGameState(state => state.addDroppedItem);
    const removeDroppedItem = useGameState(state => state.removeDroppedItem);
    const addToInventory = useGameState(state => state.addToInventory);
    const playerPos = useGameState(state => state.playerPos);
    const addFloatingNumber = useGameState(state => state.addFloatingNumber);
    const addEvent = useGameState(state => state.addEvent);
    
    const itemsRef = useRef([]);
    
    useEffect(() => {
        useGameState.setState({
            spawnDroppedItem: (item, position) => {
                const id = Date.now() + Math.random();
                addDroppedItem({ id, item, position });
            }
        });
    }, []);
    
    useFrame(() => {
        if (!playerPos || !droppedItems || droppedItems.length === 0) return;
        
        const pickupRange = 2;
        
        droppedItems.forEach(drop => {
            if (!drop.position) return;
            
            const dist = playerPos.distanceTo(new THREE.Vector3(drop.position.x, playerPos.y, drop.position.z));
            
            if (dist < pickupRange) {
                addToInventory(drop.item);
                removeDroppedItem(drop.id);
                
                const item = drop.item;
                if (item.type === 'gold') {
                    addFloatingNumber(playerPos.clone().add(new THREE.Vector3(0, 3, 0)), item.amount || item.value, 'gold');
                } else {
                    addFloatingNumber(playerPos.clone().add(new THREE.Vector3(0, 3, 0)), item.name, 'item');
                }
                
                if (item.rarity === 'legendary') {
                    addEvent(`✨ ${item.name}`, '#ff8000', 'legendary_pickup');
                }
            }
        });
    });
    
    if (!droppedItems || droppedItems.length === 0) return null;
    
    return (
        <>
            {droppedItems.map(drop => (
                <DroppedItem
                    key={drop.id}
                    data={drop}
                    onPickup={() => {}}
                />
            ))}
        </>
    );
}

export default LootDropManager;
