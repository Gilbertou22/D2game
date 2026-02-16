// src/App.js (修正版本：把 DamageNumbers 移到 Canvas 內)
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import GameScene from './game/GameScene'; // 直接匯入 GameScene（包含所有 3D 內容）
import DamageNumbers from './components/DamageNumbers'; // 匯入
import ClassicUI from './components/ClassicUI';
import Minimap from './components/Minimap';
import Inventory from './components/Inventory';
import MobileControls from './components/MobileControls';
import FloatingNumbers from './components/FloatingNumbers';
import SkillSlots from './components/SkillSlots';
import LootNotification from './components/LootNotification';
import EventLog from './components/EventLog';
import GameOverScreen from './components/GameOverScreen';
import Hotkeys from './components/Hotkeys';
import MainUI from './components/MainUI';
import TargetInfo from './components/TargetInfo';
import KeybindSettings from './components/KeybindSettings';
import LevelUpReward from './components/LevelUpReward';
import useGameState from './hooks/useGameState';

function App() {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [keybindSettingsOpen, setKeybindSettingsOpen] = useState(false);
  const targetEnemy = useGameState((state) => state.targetEnemy);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas shadows camera={{ position: [50, 80, 100], fov: 60 }}>
        <GameScene />
        <DamageNumbers />
        <FloatingNumbers />
        {targetEnemy && targetEnemy.hp > 0 && <TargetInfo />}
      </Canvas>

     
      <MainUI />
      <SkillSlots />
      <EventLog />
      <LootNotification />
      <Minimap />
      
      {/* 設置按鈕 */}
      <button
        onClick={() => setKeybindSettingsOpen(true)}
        style={{
          position: 'fixed',
          top: '20px',
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
      
      <GameOverScreen />
      <Hotkeys />
      <LevelUpReward />
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