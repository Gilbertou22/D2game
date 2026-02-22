import * as THREE from 'three';

export function createLightningPath(start, end, segments, offset) {
    const points = [start.clone()];
    const direction = end.clone().sub(start);
    const length = direction.length();
    direction.normalize();
    
    const perpX = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    const perpY = new THREE.Vector3(0, 1, 0);
    
    for (let i = 1; i <= segments; i++) {
        const t = i / (segments + 1);
        const point = start.clone().add(direction.clone().multiplyScalar(length * t));
        
        const jitterScale = Math.sin(t * Math.PI) * offset;
        const offsetX = (Math.random() - 0.5) * 2 * jitterScale;
        const offsetY = (Math.random() - 0.5) * jitterScale * 0.5;
        const offsetZ = (Math.random() - 0.5) * 2 * jitterScale;
        
        point.add(perpX.clone().multiplyScalar(offsetX));
        point.y += offsetY;
        point.add(direction.clone().cross(perpX).multiplyScalar(offsetZ));
        
        points.push(point);
    }
    points.push(end.clone());
    return points;
}

export const iceCoreMaterial = new THREE.MeshStandardMaterial({
    color: 0x88ddff,
    emissive: 0x4488cc,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.9,
    roughness: 0.1,
    metalness: 0.2,
});

export const iceShardMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaddff,
    emissive: 0x66aacc,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.8,
    roughness: 0.2,
    metalness: 0.3,
});

export function createIceCore() {
    const group = new THREE.Group();
    const coreGeo = new THREE.IcosahedronGeometry(0.5, 2);
    const core = new THREE.Mesh(coreGeo, iceCoreMaterial.clone());
    group.add(core);

    const glowGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.3, side: THREE.BackSide });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    const outerGlowGeo = new THREE.SphereGeometry(0.9, 16, 16);
    const outerGlowMat = new THREE.MeshBasicMaterial({ color: 0x66aaee, transparent: true, opacity: 0.15, side: THREE.BackSide });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    group.add(outerGlow);

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

export function createIceShardMesh(size = 0.3) {
    const group = new THREE.Group();
    const shardGeo = new THREE.ConeGeometry(size * 0.3, size * 1.5, 4);
    const shard = new THREE.Mesh(shardGeo, iceShardMaterial.clone());
    group.add(shard);

    const trailGeo = new THREE.ConeGeometry(size * 0.15, size * 0.8, 4);
    const trail = new THREE.Mesh(trailGeo, new THREE.MeshBasicMaterial({ color: 0x88ddff, transparent: true, opacity: 0.4 }));
    trail.position.y = -size * 0.8;
    trail.rotation.x = Math.PI;
    group.add(trail);
    return group;
}

export function createFireTexture() {
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

export function createWindTexture() {
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
