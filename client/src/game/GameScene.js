// src/game/GameScene.js (添加視覺邊界提示版 + 性能優化)
import { useThree } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import Player from './Player';
import Obstacles from './Obstacles';
import EnemiesContainer from './Enemies/EnemiesContainer';
import Chests from './Chests';
import Projectiles from './Projectiles';
import Particles from './Particles';
import SkillsManager from './SkillsManager';
import LevelManager from './LevelManager';
import useGameState from '../hooks/useGameState';

const MAP_HALF_SIZE = 450;

// 預創建 Raycaster 減少垃圾回收
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function GameScene() {
    const { camera } = useThree();
    const ground = useRef();
    const { playerPos, setTargetPosition, setTargetEnemy, enemies } = useGameState();
    
    // 初始化 isometric 視角
    useEffect(() => {
        camera.position.set(0, 120, 120);
        camera.rotation.order = 'YXZ';
        camera.rotation.y = Math.PI / 4;
        camera.rotation.x = -Math.PI / 6;
        camera.zoom = 5.0;
        camera.updateProjectionMatrix();
    }, [camera]);

    // 相機跟隨 - 使用 useCallback 優化
    useFrame(() => {
        const offset = new THREE.Vector3(0, 120, 120);
        const desired = playerPos.clone().add(offset);
        camera.position.lerp(desired, 0.1);
        camera.lookAt(playerPos);
    });

    // 點擊移動 + 怪物選擇 - 優化版
    const handlePointerDown = useCallback((e) => {
        e.stopPropagation();
        const pointer = e.touches ? e.touches[0] : e;
        mouse.x = (pointer.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(pointer.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // 點怪物 - 優化遍歷
        if (enemies.length > 0) {
            const enemyMeshes = [];
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (enemy.mesh?.current) {
                    enemy.mesh.current.traverse((child) => {
                        if (child.isMesh) {
                            enemyMeshes.push(child);
                        }
                    });
                }
            }
            
            const enemyIntersects = raycaster.intersectObjects(enemyMeshes, false);
            if (enemyIntersects.length > 0) {
                const hitMesh = enemyIntersects[0].object;
                for (let i = 0; i < enemies.length; i++) {
                    const enemy = enemies[i];
                    if (enemy.mesh?.current) {
                        let found = false;
                        enemy.mesh.current.traverse((child) => {
                            if (child === hitMesh) found = true;
                        });
                        if (found) {
                            setTargetEnemy(enemy);
                            setTargetPosition(null);
                            return;
                        }
                    }
                }
            }
        }

        // 點地面
        if (ground.current) {
            const intersects = raycaster.intersectObject(ground.current);
            if (intersects.length > 0) {
                let point = intersects[0].point;
                point.y = 3;

                // 邊界限制
                point.x = Math.max(-MAP_HALF_SIZE, Math.min(MAP_HALF_SIZE, point.x));
                point.z = Math.max(-MAP_HALF_SIZE, Math.min(MAP_HALF_SIZE, point.z));

                setTargetPosition(point);
                setTargetEnemy(null);
            }
        }
    }, [camera, enemies, setTargetPosition, setTargetEnemy]);

    return (
        <>
            <ambientLight intensity={1.5} />
            <directionalLight position={[50, 100, 50]} intensity={2} castShadow />

            {/* 大地面 */}
            <mesh
                ref={ground}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
                onPointerDown={handlePointerDown}
            >
                <planeGeometry args={[900, 900]} />
                <meshStandardMaterial color="#222222" />
            </mesh>

            {/* 視覺邊界提示：4 面紅色半透明發光牆 */}
            <group>
                {/* 北牆 (Z 正向) */}
                <mesh position={[0, 30, MAP_HALF_SIZE + 10]}>
                    <planeGeometry args={[920, 60]} />
                    <meshStandardMaterial
                        color="#ff0000"
                        transparent
                        opacity={0.3}
                        emissive="#ff0000"
                        emissiveIntensity={0.8}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* 南牆 (Z 負向) */}
                <mesh position={[0, 30, -MAP_HALF_SIZE - 10]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[920, 60]} />
                    <meshStandardMaterial
                        color="#ff0000"
                        transparent
                        opacity={0.3}
                        emissive="#ff0000"
                        emissiveIntensity={0.8}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* 東牆 (X 正向) */}
                <mesh position={[MAP_HALF_SIZE + 10, 30, 0]} rotation={[0, -Math.PI / 2, 0]}>
                    <planeGeometry args={[920, 60]} />
                    <meshStandardMaterial
                        color="#ff0000"
                        transparent
                        opacity={0.3}
                        emissive="#ff0000"
                        emissiveIntensity={0.8}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* 西牆 (X 負向) */}
                <mesh position={[-MAP_HALF_SIZE - 10, 30, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[920, 60]} />
                    <meshStandardMaterial
                        color="#ff0000"
                        transparent
                        opacity={0.3}
                        emissive="#ff0000"
                        emissiveIntensity={0.8}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </group>

            <Player />
            <Obstacles />
            <EnemiesContainer />
            <Chests />
            <Projectiles />
            <Particles />
            <SkillsManager />
            <LevelManager />


        </>
    );
}

export default GameScene;