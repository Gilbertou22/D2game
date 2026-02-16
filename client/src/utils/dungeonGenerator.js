// src/utils/dungeonGenerator.js (完整 BSP 地牢生成器)
import * as THREE from 'three';

class BSPNode {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.left = null;
        this.right = null;
        this.room = null; // 房間
    }

    split(minRoomSize = 8, maxRoomSize = 20) {
        if (this.left || this.right) return false; // 已分割

        // 隨機選擇水平或垂直分割
        const horizontal = Math.random() < 0.5;

        // 最小分割尺寸
        if (horizontal) {
            if (this.height < minRoomSize * 2) return false;
        } else {
            if (this.width < minRoomSize * 2) return false;
        }

        // 隨機分割點
        let split;
        if (horizontal) {
            split = Math.floor(Math.random() * (this.height - minRoomSize * 2)) + minRoomSize;
            this.left = new BSPNode(this.x, this.y, this.width, split);
            this.right = new BSPNode(this.x, this.y + split, this.width, this.height - split);
        } else {
            split = Math.floor(Math.random() * (this.width - minRoomSize * 2)) + minRoomSize;
            this.left = new BSPNode(this.x, this.y, split, this.height);
            this.right = new BSPNode(this.x + split, this.y, this.width - split, this.height);
        }

        // 遞迴分割
        this.left.split(minRoomSize, maxRoomSize);
        this.right.split(minRoomSize, maxRoomSize);

        return true;
    }

    createRoom(minRoomSize = 8, maxRoomSize = 20) {
        if (this.left || this.right) {
            this.left?.createRoom(minRoomSize, maxRoomSize);
            this.right?.createRoom(minRoomSize, maxRoomSize);
            return;
        }

        // 隨機房間大小（比分割區域小）
        const roomWidth = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize));
        const roomHeight = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize));

        const roomX = this.x + Math.floor(Math.random() * (this.width - roomWidth));
        const roomY = this.y + Math.floor(Math.random() * (this.height - roomHeight));

        this.room = { x: roomX, y: roomY, w: roomWidth, h: roomHeight };
    }

    getRooms() {
        const rooms = [];
        const traverse = (node) => {
            if (node.room) rooms.push(node.room);
            if (node.left) traverse(node.left);
            if (node.right) traverse(node.right);
        };
        traverse(this);
        return rooms;
    }
}

// 生成走廊連接房間
function connectRooms(rooms) {
    const corridors = [];
    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i];
        const r2 = rooms[i + 1];
        const cx1 = r1.x + r1.w / 2;
        const cy1 = r1.y + r1.h / 2;
        const cx2 = r2.x + r2.w / 2;
        const cy2 = r2.y + r2.h / 2;

        // L 形走廊
        corridors.push({ x1: cx1, y1: cy1, x2: cx2, y2: cy1 }); // 水平
        corridors.push({ x1: cx2, y1: cy1, x2: cx2, y2: cy2 }); // 垂直
    }
    return corridors;
}

// 主生成函數
export function generateDungeon(level = 1) {
    const SIZE = 60;
    const map = Array.from({ length: SIZE }, () => Array(SIZE).fill(1));

    const root = new BSPNode(0, 0, SIZE, SIZE);
    root.split();

    root.createRoom();

    const rooms = root.getRooms();

    // 連接房間
    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i];
        const r2 = rooms[i + 1];
        let x = Math.floor(r1.x + r1.w / 2);
        let y = Math.floor(r1.y + r1.h / 2);
        const x2 = Math.floor(r2.x + r2.w / 2);
        const y2 = Math.floor(r2.y + r2.h / 2);

        while (x !== x2) {
            if (y >= 0 && y < SIZE && x >= 0 && x < SIZE) map[y][x] = 0;
            x += x < x2 ? 1 : -1;
        }
        while (y !== y2) {
            if (y >= 0 && y < SIZE && x2 >= 0 && x2 < SIZE) map[y][x2] = 0;
            y += y < y2 ? 1 : -1;
        }
    }

    // 挖房間（安全邊界檢查）
    rooms.forEach(room => {
        for (let ry = Math.max(0, room.y); ry < Math.min(SIZE, room.y + room.h); ry++) {
            for (let rx = Math.max(0, room.x); rx < Math.min(SIZE, room.x + room.w); rx++) {
                map[ry][rx] = 0;
            }
        }
    });

    // 放置實體
    const entities = { monsters: [], chests: [], traps: [], stairs: null };

    rooms.forEach(room => {
        const count = 3 + level + Math.floor(Math.random() * 5);
        for (let i = 0; i < count; i++) {
            const mx = room.x + 2 + Math.floor(Math.random() * (room.w - 4));
            const my = room.y + 2 + Math.floor(Math.random() * (room.h - 4));
            if (mx >= 0 && mx < SIZE && my >= 0 && my < SIZE && map[my][mx] === 0) {
                entities.monsters.push({
                    position: new THREE.Vector3(
                        mx * 2 - SIZE,
                        3,
                        my * 2 - SIZE
                    )
                });
            }
        }

        if (Math.random() < 0.7) {
            const cx = room.x + Math.floor(room.w / 2);
            const cy = room.y + Math.floor(room.h / 2);
            if (cx >= 0 && cx < SIZE && cy >= 0 && cy < SIZE) {
                entities.chests.push({
                    position: new THREE.Vector3(
                        cx * 2 - SIZE,
                        2,
                        cy * 2 - SIZE
                    )
                });
            }
        }
    });

    if (rooms.length > 0) {
        const lastRoom = rooms[rooms.length - 1];
        const sx = lastRoom.x + Math.floor(lastRoom.w / 2);
        const sy = lastRoom.y + Math.floor(lastRoom.h / 2);
        entities.stairs = {
            position: new THREE.Vector3(
                sx * 2 - SIZE,
                1,
                sy * 2 - SIZE
            )
        };
    }

    return { map, entities };
}