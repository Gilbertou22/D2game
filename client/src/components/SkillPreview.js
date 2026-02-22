import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';

function hexToThreeColor(hex) {
    const color = new THREE.Color();
    color.setStyle(hex);
    return color;
}

function SkillPreview({ config }) {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const animationRef = useRef(null);
    const effectsRef = useRef([]);
    const timeRef = useRef(0);
    const cameraDistanceRef = useRef(18);
    const cameraAngleHRef = useRef(0);
    const cameraAngleVRef = useRef(0.5);
    const isDraggingRef = useRef(false);
    const lastMouseRef = useRef({ x: 0, y: 0 });

    const previewConfig = useMemo(() => config, [config]);

    const updateCameraPosition = useCallback(() => {
        if (!cameraRef.current) return;
        const camera = cameraRef.current;
        const dist = cameraDistanceRef.current;
        const hAngle = cameraAngleHRef.current;
        const vAngle = cameraAngleVRef.current;
        
        const x = Math.sin(hAngle) * Math.cos(vAngle) * dist;
        const y = Math.sin(vAngle) * dist + 2;
        const z = Math.cos(hAngle) * Math.cos(vAngle) * dist;
        
        camera.position.set(x, y, z);
        camera.lookAt(0, 1, 0);
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0a);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        cameraRef.current = camera;
        updateCameraPosition();

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 20, 10);
        scene.add(directionalLight);

        const gridHelper = new THREE.GridHelper(24, 24, 0x444444, 0x333333);
        scene.add(gridHelper);

        const groundGeo = new THREE.PlaneGeometry(24, 24);
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        scene.add(ground);

        const dummyGeo = new THREE.CapsuleGeometry(0.6, 1.8, 8, 16);
        const dummyMat = new THREE.MeshStandardMaterial({ 
            color: 0x4a90d9, 
            transparent: true, 
            opacity: 0.7,
            emissive: 0x4a90d9,
            emissiveIntensity: 0.2
        });
        const dummy = new THREE.Mesh(dummyGeo, dummyMat);
        dummy.position.set(-5, 1.5, 0);
        scene.add(dummy);

        const targetGeo = new THREE.SphereGeometry(0.7, 16, 16);
        const targetMat = new THREE.MeshStandardMaterial({ 
            color: 0xd94a4a, 
            transparent: true, 
            opacity: 0.7,
            emissive: 0xd94a4a,
            emissiveIntensity: 0.2
        });
        const target = new THREE.Mesh(targetGeo, targetMat);
        target.position.set(5, 1.5, 0);
        scene.add(target);

        // 鼠标滚轮缩放
        const handleWheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 2 : -2;
            cameraDistanceRef.current = Math.max(8, Math.min(40, cameraDistanceRef.current + delta));
            updateCameraPosition();
        };

        // 鼠标拖拽旋转
        const handleMouseDown = (e) => {
            isDraggingRef.current = true;
            lastMouseRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseMove = (e) => {
            if (!isDraggingRef.current) return;
            const dx = e.clientX - lastMouseRef.current.x;
            const dy = e.clientY - lastMouseRef.current.y;
            
            cameraAngleHRef.current += dx * 0.01;
            cameraAngleVRef.current = Math.max(0.1, Math.min(1.4, cameraAngleVRef.current + dy * 0.005));
            
            lastMouseRef.current = { x: e.clientX, y: e.clientY };
            updateCameraPosition();
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
        };

        const animate = () => {
            animationRef.current = requestAnimationFrame(animate);
            timeRef.current += 0.016;
            updateEffects();
            renderer.render(scene, cameraRef.current);
        };
        animate();

        const handleResize = () => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('resize', handleResize);

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationRef.current);
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [updateCameraPosition]);

    const updateEffects = () => {
        const delta = 0.016;
        
        for (let i = effectsRef.current.length - 1; i >= 0; i--) {
            const effect = effectsRef.current[i];
            effect.life -= delta;
            effect.time += delta;

            if (effect.type === 'projectile' && effect.group) {
                const progress = Math.min(effect.time / effect.duration, 1);
                effect.group.position.lerpVectors(effect.startPos, effect.endPos, progress);
                
                const pulse = 1 + Math.sin(effect.time * 10) * 0.15;
                effect.glowSprite.scale.set(effect.size * 2 * pulse, effect.size * 2 * pulse, 1);
                effect.outerGlow.scale.set(effect.size * 4 * pulse * 1.1, effect.size * 4 * pulse * 1.1, 1);
                
                const flicker = Math.sin(effect.time * 25) * 0.15 + 0.85;
                effect.light.intensity = 5 * flicker;
                
                effect.particles.forEach(p => {
                    p.life -= delta;
                    p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
                    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
                    if (p.life <= 0 && p.mesh.parent) {
                        p.mesh.parent.remove(p.mesh);
                    }
                });

                if (progress < 1 && Math.random() > 0.6) {
                    const trailGeo = new THREE.SphereGeometry(effect.size * 0.1, 6, 6);
                    const trailMat = new THREE.MeshBasicMaterial({
                        color: effect.trailColor || 0xff6b35,
                        transparent: true,
                        opacity: 0.8
                    });
                    const trailMesh = new THREE.Mesh(trailGeo, trailMat);
                    trailMesh.position.copy(effect.group.position);
                    trailMesh.position.x += (Math.random() - 0.5) * 0.2;
                    trailMesh.position.y += (Math.random() - 0.5) * 0.2;
                    trailMesh.position.z += (Math.random() - 0.5) * 0.2;
                    sceneRef.current.add(trailMesh);
                    effect.particles.push({
                        mesh: trailMesh,
                        life: 0.5,
                        maxLife: 0.5,
                        velocity: new THREE.Vector3(
                            (Math.random() - 0.5) * 0.5,
                            Math.random() * 0.3,
                            (Math.random() - 0.5) * 0.5
                        )
                    });
                }
            }

            if (effect.type === 'explosion') {
                effect.particles.forEach(p => {
                    p.life -= delta;
                    p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
                    p.velocity.y -= 15 * delta;
                    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
                    const scale = p.life / p.maxLife;
                    p.mesh.scale.setScalar(scale);
                    if (p.life <= 0 && p.mesh.parent) {
                        p.mesh.parent.remove(p.mesh);
                    }
                });
            }

            if (effect.type === 'lightning') {
                effect.flickerTimer += delta;
                if (effect.flickerTimer > 0.05) {
                    effect.flickerTimer = 0;
                    updateLightning(effect);
                }
                effect.line.material.opacity = Math.max(0, effect.life / effect.maxLife);
                effect.glowLine.material.opacity = effect.line.material.opacity * 0.5;
            }

            if (effect.type === 'area') {
                if (effect.indicator) {
                    effect.indicator.material.opacity = Math.max(0, 0.3 * (effect.life / effect.maxLife));
                }
                effect.particles.forEach(p => {
                    p.life -= delta;
                    p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
                    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
                    if (p.life <= 0 && p.mesh.parent) {
                        p.mesh.parent.remove(p.mesh);
                    }
                });
            }

            if (effect.type === 'melee') {
                if (effect.mesh) {
                    effect.mesh.material.opacity = Math.max(0, effect.life / effect.maxLife * 0.8);
                }
                effect.particles.forEach(p => {
                    p.life -= delta;
                    p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
                    p.velocity.y -= delta * 10;
                    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
                    if (p.life <= 0 && p.mesh.parent) {
                        p.mesh.parent.remove(p.mesh);
                    }
                });
                if (effect.spinSpeed && effect.mesh) {
                    effect.mesh.rotation.z += delta * effect.spinSpeed;
                }
            }

            if (effect.type === 'movement') {
                if (effect.mesh) {
                    effect.mesh.material.opacity = Math.max(0, effect.life / effect.maxLife * 0.6);
                }
                effect.particles.forEach(p => {
                    p.life -= delta;
                    p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
                    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
                    if (p.life <= 0 && p.mesh.parent) {
                        p.mesh.parent.remove(p.mesh);
                    }
                });
            }

            if (effect.type === 'heal') {
                effect.particles.forEach(p => {
                    p.life -= delta;
                    p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
                    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
                    if (p.life <= 0 && p.mesh.parent) {
                        p.mesh.parent.remove(p.mesh);
                    }
                });
                if (effect.ring) {
                    effect.ring.scale.setScalar(1 + (1 - effect.life / effect.maxLife) * 2);
                    effect.ring.material.opacity = Math.max(0, effect.life / effect.maxLife * 0.5);
                }
            }

            if (effect.type === 'buff') {
                effect.time += delta;
                effect.particles.forEach(p => {
                    p.life -= delta;
                    p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
                    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
                    if (p.life <= 0 && p.mesh.parent) {
                        p.mesh.parent.remove(p.mesh);
                    }
                });
                if (effect.aura) {
                    const pulse = 1 + Math.sin(effect.time * 4) * 0.1;
                    effect.aura.scale.setScalar(pulse * (effect.life / effect.maxLife));
                }
                if (effect.innerAura) {
                    effect.innerAura.scale.setScalar(0.9 * (effect.life / effect.maxLife));
                    effect.innerAura.rotation.y += delta * 0.5;
                }
                effect.orbs.forEach(orb => {
                    orb.userData.angle += delta * orb.userData.speed;
                    orb.position.x = -5 + Math.cos(orb.userData.angle) * orb.userData.radius;
                    orb.position.z = Math.sin(orb.userData.angle) * orb.userData.radius;
                    orb.position.y = orb.userData.yOffset + Math.sin(effect.time * 2 + orb.userData.angle) * 0.3;
                });
            }

            if (effect.life <= 0) {
                effectsRef.current.splice(i, 1);
            }
        }
    };

    const updateLightning = (effect) => {
        const points = [];
        const start = effect.startPos.clone();
        const end = effect.endPos.clone();
        const segments = 12;
        const jitter = previewConfig.lightning?.jitterAmount || 0.8;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = start.clone().lerp(end, t);
            if (i > 0 && i < segments) {
                point.x += (Math.random() - 0.5) * jitter;
                point.y += (Math.random() - 0.5) * jitter * 0.5;
                point.z += (Math.random() - 0.5) * jitter;
            }
            points.push(point);
        }
        
        effect.line.geometry.setFromPoints(points);
        effect.glowLine.geometry.setFromPoints(points);
    };

    useEffect(() => {
        if (!sceneRef.current) return;
        triggerPreview();
    }, [previewConfig]);

    const triggerPreview = () => {
        if (!sceneRef.current) return;

        effectsRef.current.forEach(e => {
            if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh);
            if (e.group && e.group.parent) e.group.parent.remove(e.group);
            if (e.line && e.line.parent) e.line.parent.remove(e.line);
            if (e.glowLine && e.glowLine.parent) e.glowLine.parent.remove(e.glowLine);
            if (e.indicator && e.indicator.parent) e.indicator.parent.remove(e.indicator);
            if (e.ring && e.ring.parent) e.ring.parent.remove(e.ring);
            if (e.aura && e.aura.parent) e.aura.parent.remove(e.aura);
            if (e.innerAura && e.innerAura.parent) e.innerAura.parent.remove(e.innerAura);
            if (e.orbs) {
                e.orbs.forEach(orb => {
                    if (orb.parent) orb.parent.remove(orb);
                });
            }
            if (e.light && e.light.parent) e.light.parent.remove(e.light);
            e.particles.forEach(p => {
                if (p.mesh && p.mesh.parent) p.mesh.parent.remove(p.mesh);
            });
        });
        effectsRef.current = [];

        const type = previewConfig.type;
        const colors = previewConfig.colors || {};
        const primaryColor = hexToThreeColor(colors.primary || '#ff6b35');
        const secondaryColor = hexToThreeColor(colors.secondary || '#ffaa00');
        const glowColor = hexToThreeColor(colors.glow || '#ff4400');
        const coreColor = hexToThreeColor(colors.core || '#ffffff');

        const startPos = new THREE.Vector3(-5, 2, 0);
        const endPos = new THREE.Vector3(5, 2, 0);

        if (type === 'projectile') {
            const projConfig = previewConfig.projectile || {};
            const size = projConfig.size || 0.5;
            const speed = projConfig.speed || 18;
            const distance = startPos.distanceTo(endPos);
            const duration = distance / speed;
            
            const group = new THREE.Group();
            group.position.copy(startPos);
            
            const coreGeo = new THREE.SphereGeometry(size * 0.08, 16, 16);
            const coreMat = new THREE.MeshBasicMaterial({
                color: coreColor,
                transparent: true,
                opacity: 1
            });
            const core = new THREE.Mesh(coreGeo, coreMat);
            group.add(core);
            
            const innerGeo = new THREE.SphereGeometry(size * 0.2, 16, 16);
            const innerMat = new THREE.MeshBasicMaterial({
                color: primaryColor,
                transparent: true,
                opacity: 0.9
            });
            const inner = new THREE.Mesh(innerGeo, innerMat);
            group.add(inner);
            
            const glowCanvas = document.createElement('canvas');
            glowCanvas.width = 64;
            glowCanvas.height = 64;
            const glowCtx = glowCanvas.getContext('2d');
            const gradient = glowCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.2, `rgba(${Math.floor(primaryColor.r*255)}, ${Math.floor(primaryColor.g*255)}, ${Math.floor(primaryColor.b*255)}, 0.8)`);
            gradient.addColorStop(0.5, `rgba(${Math.floor(secondaryColor.r*255)}, ${Math.floor(secondaryColor.g*255)}, ${Math.floor(secondaryColor.b*255)}, 0.4)`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            glowCtx.fillStyle = gradient;
            glowCtx.fillRect(0, 0, 64, 64);
            const glowTexture = new THREE.CanvasTexture(glowCanvas);
            
            const glowSpriteMat = new THREE.SpriteMaterial({
                map: glowTexture,
                color: glowColor.getHex(),
                transparent: true,
                blending: THREE.AdditiveBlending,
                opacity: 0.8
            });
            const glowSprite = new THREE.Sprite(glowSpriteMat);
            glowSprite.scale.set(size * 2, size * 2, 1);
            group.add(glowSprite);
            
            const outerGlowMat = new THREE.SpriteMaterial({
                map: glowTexture,
                color: secondaryColor.getHex(),
                transparent: true,
                blending: THREE.AdditiveBlending,
                opacity: 0.4
            });
            const outerGlow = new THREE.Sprite(outerGlowMat);
            outerGlow.scale.set(size * 4, size * 4, 1);
            group.add(outerGlow);
            
            const light = new THREE.PointLight(glowColor.getHex(), 5, 15);
            group.add(light);
            
            sceneRef.current.add(group);

            const effect = {
                type: 'projectile',
                group,
                core,
                inner,
                glowSprite,
                outerGlow,
                light,
                startPos: startPos.clone(),
                endPos: endPos.clone(),
                duration,
                life: duration + 0.5,
                maxLife: duration + 0.5,
                time: 0,
                particles: [],
                size,
                trailColor: primaryColor.getHex()
            };
            effectsRef.current.push(effect);

            setTimeout(() => {
                if (previewConfig.explosion?.enabled) {
                    createExplosion(endPos);
                }
            }, duration * 1000);
        }

        if (type === 'area') {
            const radius = previewConfig.radius || 5;
            const delay = previewConfig.delay || 0;

            const indicatorGeo = new THREE.RingGeometry(radius - 0.3, radius, 32);
            const indicatorMat = new THREE.MeshBasicMaterial({
                color: primaryColor,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
            indicator.rotation.x = -Math.PI / 2;
            indicator.position.set(5, 0.1, 0);
            sceneRef.current.add(indicator);

            const effect = {
                type: 'area',
                indicator,
                particles: [],
                life: Math.max(2, delay + 1),
                maxLife: Math.max(2, delay + 1),
                time: 0,
                triggerTime: delay
            };
            effectsRef.current.push(effect);

            setTimeout(() => {
                createExplosion(endPos);
            }, delay * 1000 + 500);
        }

        if (type === 'lightning') {
            const lightningConfig = previewConfig.lightning || {};
            const segments = 12;
            const jitter = lightningConfig.jitterAmount || 0.8;
            const points = [];

            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const point = startPos.clone().lerp(endPos, t);
                if (i > 0 && i < segments) {
                    point.x += (Math.random() - 0.5) * jitter;
                    point.y += (Math.random() - 0.5) * jitter * 0.5;
                    point.z += (Math.random() - 0.5) * jitter;
                }
                points.push(point);
            }

            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({
                color: primaryColor,
                transparent: true,
                opacity: 1
            });
            const line = new THREE.Line(lineGeo, lineMat);
            sceneRef.current.add(line);

            const glowMat = new THREE.LineBasicMaterial({
                color: primaryColor,
                transparent: true,
                opacity: 0.5,
                linewidth: 3
            });
            const glowLine = new THREE.Line(lineGeo.clone(), glowMat);
            sceneRef.current.add(glowLine);

            const light = new THREE.PointLight(primaryColor.getHex(), 5, 15);
            light.position.copy(endPos);
            sceneRef.current.add(light);

            const effect = {
                type: 'lightning',
                line,
                glowLine,
                light,
                startPos: startPos.clone(),
                endPos: endPos.clone(),
                life: 0.5,
                maxLife: 0.5,
                time: 0,
                flickerTimer: 0,
                particles: []
            };
            effectsRef.current.push(effect);
        }

        if (type === 'heal') {
            const healColor = hexToThreeColor(colors.primary || '#22c55e');
            
            const ringGeo = new THREE.RingGeometry(0.5, 1, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: healColor,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.set(-5, 0.1, 0);
            sceneRef.current.add(ring);

            const particles = [];
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 2;
                const pGeo = new THREE.SphereGeometry(0.1, 8, 8);
                const pMat = new THREE.MeshBasicMaterial({
                    color: healColor,
                    transparent: true,
                    opacity: 0.8
                });
                const pMesh = new THREE.Mesh(pGeo, pMat);
                pMesh.position.set(
                    -5 + Math.cos(angle) * radius,
                    0.5,
                    Math.sin(angle) * radius
                );
                sceneRef.current.add(pMesh);
                particles.push({
                    mesh: pMesh,
                    life: 1 + Math.random() * 0.5,
                    maxLife: 1.5,
                    velocity: new THREE.Vector3(0, 2 + Math.random() * 2, 0)
                });
            }

            const light = new THREE.PointLight(healColor.getHex(), 3, 10);
            light.position.set(-5, 3, 0);
            sceneRef.current.add(light);

            const effect = {
                type: 'heal',
                ring,
                particles,
                light,
                life: 2,
                maxLife: 2,
                time: 0
            };
            effectsRef.current.push(effect);
        }

        if (type === 'melee') {
            const subType = previewConfig.subType || 'cone';
            const range = previewConfig.range || 8;
            const coneAngle = previewConfig.coneAngle || 1.05;
            
            if (subType === 'cone') {
                const slashPoints = [];
                const segments = 15;
                for (let i = 0; i <= segments; i++) {
                    const t = i / segments;
                    const angle = -coneAngle / 2 + coneAngle * t;
                    const r = range * 0.5 * Math.sin(t * Math.PI);
                    slashPoints.push(new THREE.Vector3(
                        -5 + Math.cos(angle) * r,
                        1.5 + Math.sin(t * Math.PI) * 0.5,
                        Math.sin(angle) * r
                    ));
                }
                
                const curve = new THREE.CatmullRomCurve3(slashPoints);
                const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.15, 8, false);
                const tubeMat = new THREE.MeshBasicMaterial({
                    color: primaryColor,
                    transparent: true,
                    opacity: 0.8
                });
                const slashMesh = new THREE.Mesh(tubeGeo, tubeMat);
                sceneRef.current.add(slashMesh);
                
                const particles = [];
                for (let i = 0; i < 30; i++) {
                    const t = Math.random();
                    const angle = -coneAngle / 2 + coneAngle * t;
                    const r = range * 0.5 * Math.sin(t * Math.PI) * (0.5 + Math.random() * 0.5);
                    const pGeo = new THREE.SphereGeometry(0.1, 6, 6);
                    const pMat = new THREE.MeshBasicMaterial({
                        color: glowColor,
                        transparent: true,
                        opacity: 0.8
                    });
                    const pMesh = new THREE.Mesh(pGeo, pMat);
                    pMesh.position.set(
                        -5 + Math.cos(angle) * r,
                        1.5 + Math.random(),
                        Math.sin(angle) * r
                    );
                    sceneRef.current.add(pMesh);
                    particles.push({
                        mesh: pMesh,
                        life: 0.3 + Math.random() * 0.3,
                        maxLife: 0.6,
                        velocity: new THREE.Vector3(
                            (Math.random() - 0.5) * 5,
                            Math.random() * 3,
                            (Math.random() - 0.5) * 5
                        )
                    });
                }
                
                const light = new THREE.PointLight(glowColor.getHex(), 5, 15);
                light.position.set(-5, 2, 0);
                sceneRef.current.add(light);
                
                effectsRef.current.push({
                    type: 'melee',
                    mesh: slashMesh,
                    particles,
                    light,
                    life: 0.5,
                    maxLife: 0.5,
                    time: 0
                });
            } else if (subType === 'aoe') {
                const radius = previewConfig.radius || 12;
                const spinConfig = previewConfig.spinEffect || {};
                const rotations = spinConfig.rotations || 2;
                
                const ringGeo = new THREE.TorusGeometry(radius * 0.5, 0.15, 8, 32);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: primaryColor,
                    transparent: true,
                    opacity: 0.8
                });
                const spinRing = new THREE.Mesh(ringGeo, ringMat);
                spinRing.rotation.x = Math.PI / 2;
                spinRing.position.set(-5, 0.5, 0);
                sceneRef.current.add(spinRing);
                
                const particles = [];
                for (let i = 0; i < 40; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * radius * 0.5;
                    const pGeo = new THREE.SphereGeometry(0.1, 6, 6);
                    const pMat = new THREE.MeshBasicMaterial({
                        color: glowColor,
                        transparent: true,
                        opacity: 0.7
                    });
                    const pMesh = new THREE.Mesh(pGeo, pMat);
                    pMesh.position.set(
                        -5 + Math.cos(angle) * r,
                        Math.random() * 2,
                        Math.sin(angle) * r
                    );
                    sceneRef.current.add(pMesh);
                    particles.push({
                        mesh: pMesh,
                        life: 0.5 + Math.random() * 0.5,
                        maxLife: 1.0,
                        velocity: new THREE.Vector3(
                            (Math.random() - 0.5) * 8,
                            Math.random() * 4,
                            (Math.random() - 0.5) * 8
                        )
                    });
                }
                
                const light = new THREE.PointLight(glowColor.getHex(), 8, 20);
                light.position.set(-5, 2, 0);
                sceneRef.current.add(light);
                
                effectsRef.current.push({
                    type: 'melee',
                    mesh: spinRing,
                    particles,
                    light,
                    life: 1.0,
                    maxLife: 1.0,
                    time: 0,
                    spinSpeed: rotations * Math.PI * 2
                });
            }
        }

        if (type === 'movement') {
            const moveConfig = previewConfig.movementEffect || {};
            const range = Math.min(previewConfig.range || 25, 10);
            
            const trailPoints = [];
            const segments = 20;
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                trailPoints.push(new THREE.Vector3(
                    -5 + t * range,
                    1.5 + Math.sin(t * Math.PI) * 0.3,
                    (Math.random() - 0.5) * 0.5
                ));
            }
            
            const trailCurve = new THREE.CatmullRomCurve3(trailPoints);
            const trailGeo = new THREE.TubeGeometry(trailCurve, 20, 0.1, 8, false);
            const trailMat = new THREE.MeshBasicMaterial({
                color: primaryColor,
                transparent: true,
                opacity: 0.6
            });
            const trailMesh = new THREE.Mesh(trailGeo, trailMat);
            sceneRef.current.add(trailMesh);
            
            const particles = [];
            for (let i = 0; i < 30; i++) {
                const t = Math.random();
                const pGeo = new THREE.SphereGeometry(0.08, 6, 6);
                const pMat = new THREE.MeshBasicMaterial({
                    color: glowColor,
                    transparent: true,
                    opacity: 0.7
                });
                const pMesh = new THREE.Mesh(pGeo, pMat);
                pMesh.position.set(
                    -5 + t * range,
                    1.5,
                    (Math.random() - 0.5) * 2
                );
                sceneRef.current.add(pMesh);
                particles.push({
                    mesh: pMesh,
                    life: 0.3 + Math.random() * 0.3,
                    maxLife: 0.6,
                    velocity: new THREE.Vector3(
                        (Math.random() - 0.5) * 3,
                        Math.random() * 2,
                        (Math.random() - 0.5) * 3
                    )
                });
            }
            
            const impactLight = new THREE.PointLight(0xffffff, 10, 15);
            impactLight.position.set(-5 + range, 1.5, 0);
            sceneRef.current.add(impactLight);
            
            const effect = {
                type: 'movement',
                mesh: trailMesh,
                particles,
                light: impactLight,
                life: 0.8,
                maxLife: 0.8,
                time: 0
            };
            effectsRef.current.push(effect);
            
            setTimeout(() => {
                createExplosion(new THREE.Vector3(-5 + range, 1.5, 0));
            }, 300);
        }

        if (type === 'buff') {
            const buffConfig = previewConfig.buffEffect || {};
            const duration = previewConfig.duration || 5;
            const auraSize = buffConfig.auraSize || 2.5;
            const orbCount = buffConfig.orbCount || 8;
            
            const auraGeo = new THREE.SphereGeometry(auraSize, 32, 32);
            const auraMat = new THREE.MeshBasicMaterial({
                color: primaryColor,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide
            });
            const aura = new THREE.Mesh(auraGeo, auraMat);
            aura.position.set(-5, 3, 0);
            sceneRef.current.add(aura);
            
            const innerAuraGeo = new THREE.SphereGeometry(auraSize * 0.7, 32, 32);
            const innerAuraMat = new THREE.MeshBasicMaterial({
                color: coreColor,
                transparent: true,
                opacity: 0.4,
                side: THREE.BackSide
            });
            const innerAura = new THREE.Mesh(innerAuraGeo, innerAuraMat);
            innerAura.position.set(-5, 3, 0);
            sceneRef.current.add(innerAura);
            
            const orbs = [];
            for (let i = 0; i < orbCount; i++) {
                const angle = (i / orbCount) * Math.PI * 2;
                const orbGeo = new THREE.SphereGeometry(0.15, 8, 8);
                const orbMat = new THREE.MeshBasicMaterial({
                    color: i % 2 === 0 ? primaryColor.getHex() : secondaryColor.getHex(),
                    transparent: true,
                    opacity: 0.9
                });
                const orb = new THREE.Mesh(orbGeo, orbMat);
                orb.userData = {
                    angle,
                    radius: auraSize + 0.5,
                    speed: 1.5 + Math.random() * 0.5,
                    yOffset: 1.5 + Math.random() * 3
                };
                sceneRef.current.add(orb);
                orbs.push(orb);
            }
            
            const particles = [];
            for (let i = 0; i < 40; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * auraSize;
                const pGeo = new THREE.SphereGeometry(0.08, 6, 6);
                const pMat = new THREE.MeshBasicMaterial({
                    color: glowColor,
                    transparent: true,
                    opacity: 0.7
                });
                const pMesh = new THREE.Mesh(pGeo, pMat);
                pMesh.position.set(
                    -5 + Math.cos(angle) * radius,
                    Math.random() * 2,
                    Math.sin(angle) * radius
                );
                sceneRef.current.add(pMesh);
                particles.push({
                    mesh: pMesh,
                    life: 1 + Math.random() * 1,
                    maxLife: 2,
                    velocity: new THREE.Vector3(0, 2 + Math.random() * 2, 0)
                });
            }
            
            const light = new THREE.PointLight(glowColor.getHex(), 10, 20);
            light.position.set(-5, 3, 0);
            sceneRef.current.add(light);
            
            const effect = {
                type: 'buff',
                aura,
                innerAura,
                orbs,
                particles,
                light,
                life: Math.min(duration, 3),
                maxLife: Math.min(duration, 3),
                time: 0
            };
            effectsRef.current.push(effect);
        }
    };

    const createExplosion = (position) => {
        if (!sceneRef.current) return;

        const colors = previewConfig.colors || {};
        const primaryColor = hexToThreeColor(colors.primary || '#ff6b35');
        const explosionConfig = previewConfig.explosion || {};
        const size = explosionConfig.size || 4;
        const particleCount = Math.min(explosionConfig.particles || 100, 50);

        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const upAngle = (Math.random() - 0.3) * Math.PI;
            const speed = size * (1 + Math.random() * 2);

            const pGeo = new THREE.SphereGeometry(0.15, 6, 6);
            const pMat = new THREE.MeshBasicMaterial({
                color: primaryColor,
                transparent: true,
                opacity: 0.8
            });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.position.copy(position);
            sceneRef.current.add(pMesh);

            particles.push({
                mesh: pMesh,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1,
                velocity: new THREE.Vector3(
                    Math.cos(angle) * Math.cos(upAngle) * speed,
                    Math.sin(upAngle) * speed * 1.5 + 3,
                    Math.sin(angle) * Math.cos(upAngle) * speed
                )
            });
        }

        const light = new THREE.PointLight(primaryColor.getHex(), 8, 20);
        light.position.copy(position);
        sceneRef.current.add(light);

        const effect = {
            type: 'explosion',
            particles,
            light,
            life: 1.5,
            maxLife: 1.5,
            time: 0
        };
        effectsRef.current.push(effect);

        setTimeout(() => {
            if (light.parent) light.parent.remove(light);
        }, 500);
    };

    return (
        <div className="se-preview-container">
            <div className="se-preview-header">
                <span>預覽</span>
                <button className="se-preview-btn" onClick={triggerPreview}>
                    重播
                </button>
            </div>
            <div className="se-preview-canvas" ref={containerRef} />
            <div className="se-preview-info">
                <div className="se-preview-info-row">
                    <span className="se-preview-type">{previewConfig.type}</span>
                    <span className={`se-preview-element ${previewConfig.element || 'physical'}`}>
                        {previewConfig.element || 'physical'}
                    </span>
                </div>
                <span className="se-preview-hint">拖曳旋轉 | 滾輪縮放</span>
            </div>
        </div>
    );
}

export default SkillPreview;
