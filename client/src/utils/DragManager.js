// src/utils/DragManager.js - 拖拽管理單例
class DragManagerClass {
    constructor() {
        this.draggedItem = null;
        this.draggedIndex = null;
        this.sourceContainer = null; // 'backpack' | 'equipment'
        this.dragElement = null;
        this.dragOffset = { x: 0, y: 0 };
        this.listeners = new Set();
    }

    startDrag(item, index, sourceContainer, event) {
        this.draggedItem = item;
        this.draggedIndex = index;
        this.sourceContainer = sourceContainer;
        
        // 計算拖拽偏移
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        
        const target = event.target.closest('.inventory-slot') || event.target;
        const rect = target.getBoundingClientRect();
        this.dragOffset = {
            x: clientX - rect.left - rect.width / 2,
            y: clientY - rect.top - rect.height / 2
        };

        // 創建拖拽元素
        this.createDragElement(item);
        
        // 通知監聽器
        this.notifyListeners('dragStart', { item, index, sourceContainer });
    }

    createDragElement(item) {
        this.dragElement = document.createElement('div');
        this.dragElement.className = 'drag-ghost';
        this.dragElement.innerHTML = `
            <div class="drag-icon" style="border-color: ${item.rarityColor || '#fff'}">
                ${item.icon || '📦'}
            </div>
            ${item.quantity > 1 ? `<div class="drag-quantity">${item.quantity}</div>` : ''}
        `;
        document.body.appendChild(this.dragElement);
        this.updateDragPosition(this.lastPointerPos || { x: 0, y: 0 });
    }

    updateDragPosition(pos) {
        this.lastPointerPos = pos;
        if (this.dragElement) {
            this.dragElement.style.left = `${pos.x - this.dragOffset.x}px`;
            this.dragElement.style.top = `${pos.y - this.dragOffset.y}px`;
        }
    }

    moveDrag(event) {
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        this.updateDragPosition({ x: clientX, y: clientY });
        this.notifyListeners('dragMove', { x: clientX, y: clientY });
    }

    endDrag(targetIndex, targetContainer) {
        const result = {
            item: this.draggedItem,
            fromIndex: this.draggedIndex,
            fromContainer: this.sourceContainer,
            toIndex: targetIndex,
            toContainer: targetContainer
        };

        // 移除拖拽元素
        if (this.dragElement) {
            this.dragElement.remove();
            this.dragElement = null;
        }

        // 重置狀態
        this.draggedItem = null;
        this.draggedIndex = null;
        this.sourceContainer = null;

        // 通知監聽器
        this.notifyListeners('dragEnd', result);

        return result;
    }

    cancelDrag() {
        if (this.dragElement) {
            this.dragElement.remove();
            this.dragElement = null;
        }
        
        const result = {
            item: this.draggedItem,
            fromIndex: this.draggedIndex,
            fromContainer: this.sourceContainer,
            cancelled: true
        };

        this.draggedItem = null;
        this.draggedIndex = null;
        this.sourceContainer = null;

        this.notifyListeners('dragEnd', result);
        return result;
    }

    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(event, data) {
        this.listeners.forEach(cb => cb(event, data));
    }

    getDragState() {
        return {
            isDragging: !!this.draggedItem,
            item: this.draggedItem,
            index: this.draggedIndex,
            sourceContainer: this.sourceContainer
        };
    }
}

export const DragManager = new DragManagerClass();
