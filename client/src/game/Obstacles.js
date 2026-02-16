import { useEffect } from 'react';
import useGameState from '../hooks/useGameState';

function Obstacles() {
    const { obstacles, setObstacles } = useGameState();

    useEffect(() => {
        // 生成邏輯...
        const newObs = [];
        // ... 生成 60 個
        setObstacles(newObs);
    }, []);

    return (
        <>
            {obstacles.map((obs, i) => (
                <mesh key={i} position={obs.position} castShadow>
                    <cylinderGeometry args={[obs.radius, obs.radius + 2, obs.height, 8]} />
                    <meshStandardMaterial color="#666666" />
                </mesh>
            ))}
        </>
    );
}

export default Obstacles;