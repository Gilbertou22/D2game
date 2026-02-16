// src/utils/collision.js (新增碰撞偵測工具檔案：球體碰撞 + 玩家/怪物通用檢查)
import * as THREE from 'three';
import useGameState from '../hooks/useGameState';

export function sphereCollision(pos1, radius1, pos2, radius2) {
    return pos1.distanceTo(pos2) < radius1 + radius2;
}

// 檢查玩家與障礙物碰撞
export function checkPlayerObstacleCollision(newPos, playerRadius = 3) {
    const { obstacles } = useGameState.getState();
    return obstacles.some(obs => sphereCollision(newPos, playerRadius, obs.position, obs.radius || 5));
}

// 檢查怪物與障礙物碰撞
export function checkEnemyObstacleCollision(newPos, enemyRadius) {
    const { obstacles } = useGameState.getState();
    return obstacles.some(obs => sphereCollision(newPos, enemyRadius, obs.position, obs.radius || 5));
}

// 檢查怪物與玩家碰撞（用於推開或攻擊範圍外阻擋）
export function checkEnemyPlayerCollision(enemyPos, enemyRadius, playerRadius = 3) {
    const { playerPos } = useGameState.getState();
    return sphereCollision(enemyPos, enemyRadius, playerPos, playerRadius);
}

// 檢查怪物間碰撞（避免重疊）
export function checkEnemyCollision(newPos, enemyRadius, enemyId) {
    const { enemies } = useGameState.getState();
    return enemies.some(e => e.id !== enemyId && sphereCollision(newPos, enemyRadius, e.position, e.radius || enemyRadius));
}