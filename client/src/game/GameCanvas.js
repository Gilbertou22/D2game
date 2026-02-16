import { Canvas } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import GameScene from './GameScene';

function GameCanvas() {
    return (
        <Canvas shadows camera={{ position: [50, 80, 100], fov: 60 }}>
            <GameScene />
        </Canvas>
    );
}

export default GameCanvas;