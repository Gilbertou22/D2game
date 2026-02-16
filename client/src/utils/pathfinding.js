// client/src/utils/pathfinding.js (A* 路徑尋找工具)
import * as THREE from 'three';
import useGameState from '../hooks/useGameState';

class Node {
    constructor(x, z, parent = null) {
        this.x = x;
        this.z = z;
        this.parent = parent;
        this.g = 0;
        this.h = 0;
        this.f = 0;
    }
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.z - b.z); // 曼哈頓距離
}

export function findPath(startPos, goalPos, gridSize = 300, cellSize = 10) {
    const { obstacles } = useGameState.getState();

    const gridWidth = gridSize / cellSize;
    const gridHeight = gridSize / cellSize;

    const start = {
        x: Math.floor((startPos.x + gridSize / 2) / cellSize),
        z: Math.floor((startPos.z + gridSize / 2) / cellSize)
    };
    const goal = {
        x: Math.floor((goalPos.x + gridSize / 2) / cellSize),
        z: Math.floor((goalPos.z + gridSize / 2) / cellSize)
    };

    // 檢查是否為障礙
    const isObstacle = (x, z) => {
        const worldX = x * cellSize - gridSize / 2 + cellSize / 2;
        const worldZ = z * cellSize - gridSize / 2 + cellSize / 2;
        return obstacles.some(obs =>
            Math.hypot(worldX - obs.position.x, worldZ - obs.position.z) < obs.radius + cellSize / 2
        );
    };

    if (isObstacle(start.x, start.z) || isObstacle(goal.x, goal.z)) return [];

    const openSet = [];
    const closedSet = new Set();
    const startNode = new Node(start.x, start.z);
    openSet.push(startNode);

    while (openSet.length > 0) {
        // 找最低 f
        let lowestIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < openSet[lowestIndex].f) lowestIndex = i;
        }
        const current = openSet[lowestIndex];

        if (current.x === goal.x && current.z === goal.z) {
            // 重建路徑
            const path = [];
            let temp = current;
            while (temp.parent) {
                path.push(new THREE.Vector3(
                    temp.x * cellSize - gridSize / 2 + cellSize / 2,
                    3,
                    temp.z * cellSize - gridSize / 2 + cellSize / 2
                ));
                temp = temp.parent;
            }
            return path.reverse();
        }

        openSet.splice(lowestIndex, 1);
        closedSet.add(`${current.x},${current.z}`);

        // 鄰居 (8方向)
        const neighbors = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (dx === 0 && dz === 0) continue;
                const nx = current.x + dx;
                const nz = current.z + dz;
                if (nx >= 0 && nx < gridWidth && nz >= 0 && nz < gridHeight && !isObstacle(nx, nz)) {
                    neighbors.push(new Node(nx, nz, current));
                }
            }
        }

        neighbors.forEach(neighbor => {
            if (closedSet.has(`${neighbor.x},${neighbor.z}`)) return;

            const tentativeG = current.g + (neighbor.x !== current.x && neighbor.z !== current.z ? 1.4 : 1);

            let inOpen = openSet.find(n => n.x === neighbor.x && n.z === neighbor.z);
            if (!inOpen) {
                inOpen = neighbor;
                openSet.push(inOpen);
            } else if (tentativeG >= inOpen.g) return;

            inOpen.parent = current;
            inOpen.g = tentativeG;
            inOpen.h = heuristic(inOpen, goal);
            inOpen.f = inOpen.g + inOpen.h;
        });
    }

    return []; // 無路徑
}