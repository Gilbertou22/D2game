// src/game/GameScene.js (深度性能優化版)
import { useThree } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, useCallback, useMemo } from 'react';
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

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const _tempVec = new THREE.Vector3();
const _offsetVec = new THREE.Vector3();
const _desiredVec = new THREE.Vector3();

function GameScene() {
    const { camera } = useThree();
    const ground = useRef();
    const { playerPos, playerRotation, setTargetPosition, setTargetEnemy, enemies, cameraMode } = useGameState();
    
    // 視角配置
    const cameraConfigs = {
        // 等軸視角 (預設)
        isometric: {
            offset: new THREE.Vector3(0, 120, 120),
            rotation: { x: -Math.PI / 6, y: Math.PI / 4 },
            zoom: 5.0,
            fov: 60
        },
        // 第三人稱
        third: {
            offset: new THREE.Vector3(0, 25, 35),
            rotation: { x: -Math.PI / 8, y: 0 },
            zoom: 1.0,
            fov: 75
        },
        // 第一人稱
        first: {
            offset: new THREE.Vector3(0, 8, 2),
            rotation: { x: 0, y: 0 },
            zoom: 1.0,
            fov: 90
        }
    };

    // 初始化相機
    useEffect(() => {
        const config = cameraConfigs[cameraMode] || cameraConfigs.isometric;
        
        camera.position.set(
            playerPos.x + config.offset.x,
            playerPos.y + config.offset.y,
            playerPos.z + config.offset.z
        );
        camera.rotation.order = 'YXZ';
        camera.rotation.x = config.rotation.x;
        camera.rotation.y = config.rotation.y;
        camera.zoom = config.zoom;
        camera.fov = config.fov;
        camera.updateProjectionMatrix();
    }, [camera, cameraMode]);

    // 相機跟隨 - 優化版：預分配對象，避免 GC
    useFrame(() => {
        const config = cameraConfigs[cameraMode] || cameraConfigs.isometric;
        _offsetVec.copy(config.offset);
        
        if (cameraMode === 'third') {
            _offsetVec.applyEuler(playerRotation);
        } else if (cameraMode === 'first') {
            camera.rotation.order = 'YXZ';
            camera.rotation.y = playerRotation.y;
            camera.rotation.x = 0;
        }
        
        _desiredVec.copy(playerPos).add(_offsetVec);
        
        if (cameraMode === 'first') {
            camera.position.set(playerPos.x, playerPos.y + config.offset.y, playerPos.z);
        } else {
            camera.position.lerp(_desiredVec, 0.1);
            camera.lookAt(playerPos);
        }
    });

    // 點擊移動 + 怪物選擇 - 優化版
    const handlePointerDown = useCallback((e) => {
        e.stopPropagation();
        const pointer = e.touches ? e.touches[0] : e;
        mouse.x = (pointer.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(pointer.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // 點怪物 - 優化遍歷，提前退出
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy.mesh?.current) continue;
            
            const intersects = raycaster.intersectObject(enemy.mesh.current, true);
            if (intersects.length > 0) {
                setTargetEnemy(enemy);
                setTargetPosition(null);
                return;
            }
        }

        // 點地面
        if (ground.current) {
            const intersects = raycaster.intersectObject(ground.current);
            if (intersects.length > 0) {
                const point = intersects[0].point;
                point.y = 3;
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
            <SkillsManager />
            <Particles />           
            <LevelManager />
        </>
    );
}

export default GameScene;