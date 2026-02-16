// 已正確使用 useFrame，現在放在 Canvas 內就不會報錯
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useGameState from '../hooks/useGameState';

function DamageNumber({ number }) {
    return (
        <Html position={number.position} center>
            <div style={{
                color: number.isCrit ? '#ffff00' : '#ffffff',
                fontSize: number.isCrit ? '32px' : '24px',
                fontWeight: 'bold',
                textShadow: '3px 3px 6px #000',
                animation: 'floatUp 1.5s ease-out forwards',
                pointerEvents: 'none'
            }}>
                {number.value}
                {number.isCrit && ' !'}
            </div>
        </Html>
    );
}

function DamageNumbers() {
    const damageNumbers = useGameState((state) => state.damageNumbers);
    const updateDamageNumbers = useGameState((state) => state.updateDamageNumbers);

    useFrame((state, delta) => {
        updateDamageNumbers(delta);
    });

    return (
        <>
            {Array.isArray(damageNumbers) && damageNumbers.map(number => (
                <DamageNumber key={number.id} number={number} />
            ))}
        </>
    );
}

export default DamageNumbers;