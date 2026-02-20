// src/App.js (修正版本：把 DamageNumbers 移到 Canvas 內)
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import GameScene from './game/GameScene';
import DamageNumbers from './components/DamageNumbers';
import Inventory from './components/Inventory';
import MobileControls from './components/MobileControls';
import FloatingNumbers from './components/FloatingNumbers';
import LootNotification from './components/LootNotification';
import GameOverScreen from './components/GameOverScreen';
import Hotkeys from './components/Hotkeys';
import TargetInfo from './components/TargetInfo';
import KeybindSettings from './components/KeybindSettings';
import LevelUpReward from './components/LevelUpReward';
import TalentTree from './components/TalentTree';
import CharacterPanel from './components/CharacterPanel';
import WetlandUI from './components/WetlandUI';
import useGameState from './hooks/useGameState';

function App() {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [keybindSettingsOpen, setKeybindSettingsOpen] = useState(false);
  const [talentTreeOpen, setTalentTreeOpen] = useState(false);
  const [characterPanelOpen, setCharacterPanelOpen] = useState(false);
  const targetEnemy = useGameState((state) => state.targetEnemy);
  const cameraMode = useGameState((state) => state.cameraMode);
  const setCameraMode = useGameState((state) => state.setCameraMode);

  const cameraLabels = {
    isometric: '📐 等軸',
    third: '👤 第三人稱',
    first: '👁️ 第一人稱'
  };

  const cycleCameraMode = () => {
    const modes = ['isometric', 'third', 'first'];
    const currentIndex = modes.indexOf(cameraMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setCameraMode(modes[nextIndex]);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas shadows camera={{ position: [50, 80, 100], fov: 60 }}>
        <GameScene />
        <DamageNumbers />
        <FloatingNumbers />
        {targetEnemy && targetEnemy.hp > 0 && <TargetInfo />}
      </Canvas>

     
      <WetlandUI />
      <LootNotification />
      
      {/* 設置按鈕 */}
      <button
        onClick={() => setKeybindSettingsOpen(true)}
        style={{
          position: 'fixed',
          top: '260px',
          right: '20px',
          zIndex: 100,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '25px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        }}
      >
        ⚙️ 按鍵設定
      </button>
      
      {/* 天賦樹按鈕 */}
      <button
        onClick={() => setTalentTreeOpen(true)}
        style={{
          position: 'fixed',
          top: '310px',
          right: '20px',
          zIndex: 100,
          background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '25px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        }}
      >
        ⭐ 天賦
      </button>

      {/* 視角切換按鈕 */}
      <button
        onClick={cycleCameraMode}
        style={{
          position: 'fixed',
          top: '360px',
          right: '20px',
          zIndex: 100,
          background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '25px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        }}
      >
        {cameraLabels[cameraMode]}
      </button>
      
      <GameOverScreen />
      <Hotkeys />
      <LevelUpReward />
      {talentTreeOpen && <TalentTree onClose={() => setTalentTreeOpen(false)} />}
      {characterPanelOpen && <CharacterPanel onClose={() => setCharacterPanelOpen(false)} />}
      <MobileControls setInventoryOpen={setInventoryOpen} />
      <Inventory open={inventoryOpen} setOpen={setInventoryOpen} />
      
      {/* 按鍵設定視窗 */}
      {keybindSettingsOpen && (
        <KeybindSettings onClose={() => setKeybindSettingsOpen(false)} />
      )}
    </div>
  );
}

export default App;