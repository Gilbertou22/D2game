// src/game/Enemies/Enemy.js (完整修正版：GLTF 模型 + 死亡檢查防呆)
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import useGameState from '../../hooks/useGameState';
import useEnemyAI from './useEnemyAI';
import EnemyHealthBar from './EnemyHealthBar';
import enemyConfigs from '../../configs/enemyConfigs'; // default import
import { checkEnemyDeath } from '../../utils/gameUtils';

const enemyModelURLs = {
    melee: 'models/Soldier.glb',
    ranged: 'models/Soldier.glb',
    tank: 'models/Soldier.glb',
    flying: 'models/Soldier.glb',
    mage: 'models/Soldier.glb',
    summoner: 'models/Soldier.glb'
};

function EnemyModel({ type }) {
    const config = enemyConfigs[type] || enemyConfigs.melee;

    // 暫時使用簡單幾何體代替 GLTF 模型
    const shapes = {
        melee: <sphereGeometry args={[config.size, 16, 16]} />,
        ranged: <boxGeometry args={[config.size, config.size * 1.5, config.size]} />,
        tank: <cylinderGeometry args={[config.size * 0.8, config.size * 0.8, config.size * 1.2, 16]} />,
        flying: <coneGeometry args={[config.size, config.size * 1.5, 16]} />,
        mage: <octahedronGeometry args={[config.size]} />,
        summoner: <dodecahedronGeometry args={[config.size]} />
    };

    return (
        <mesh castShadow receiveShadow>
            {shapes[type] || shapes.melee}
            <meshStandardMaterial 
                color={config.color}
                metalness={0.3}
                roughness={0.7}
            />
        </mesh>
    );
}

function Enemy({ enemy }) {
    const mesh = useRef();
    const { removeEnemy } = useGameState();
    const { targetEnemy } = useGameState();

    // 高亮邏輯：當此 enemy 是 targetEnemy 時變色
    useEffect(() => {
        if (!mesh.current) return;

        const isTarget = targetEnemy && targetEnemy.id === enemy.id;
        const config = enemyConfigs[enemy.type] || enemyConfigs.melee;

        mesh.current.traverse((child) => {
            if (child.isMesh && child.material) {
                try {
                    child.material.color.set(isTarget ? 0xff6666 : config.color);
                    child.material.needsUpdate = true;
                } catch (error) {
                    // 忽略錯誤
                }
            }
        });
    }, [targetEnemy, enemy.id]);

    useEnemyAI(enemy, mesh);

    // 死亡檢查（防渲染中 setState）
    useEffect(() => {
        if (enemy.hp <= 0) {
            checkEnemyDeath(enemy);
            removeEnemy(enemy.id);
        }
    }, [enemy.hp]);

    if (enemy.hp <= 0) return null;

    const config = enemyConfigs[enemy.type] || enemyConfigs.melee;
    
    return (
        <group ref={mesh} position={enemy.position} scale={[1.5, 1.5, 1.5]}>
            <EnemyModel type={enemy.type} />
            <EnemyHealthBar enemy={enemy} />
            {/* 可點擊層 - 更小且更透明 */}
            <mesh 
                onPointerDown={(e) => {
                    e.stopPropagation();
                    useGameState.getState().setTargetEnemy(enemy);
                }}
                renderOrder={1} // 確保在最後渲染
            >
                <sphereGeometry args={[config.size * 0.8, 16, 16]} />
                <meshBasicMaterial 
                    color={0xffffff} 
                    transparent 
                    opacity={0} 
                    visible={true}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

export default Enemy;