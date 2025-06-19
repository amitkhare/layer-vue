<template>
  <div class="simple-demo">
    <div class="demo-layout">
      <!-- Layers Panel Sidebar -->
      <div class="layers-sidebar">
        <div class="sidebar-header">
          <h2>🎨 Layers</h2>
          <p>Drag to reorder • Right-click for menu</p>
        </div>
        
        <div class="layers-container">
          <LayerPanel
            v-model:items="layers"
            :allow-nesting="true"
            :allow-multi-select="true"
            :show-context-menu="true"
            @item-select="handleSelect"
            @item-reorder="handleReorder"
            @item-delete="handleDelete"
          >
            <template #item-content="{ item, level }">
              <div class="simple-layer-item" :style="{ paddingLeft: (level * 16) + 'px' }">
                <span class="layer-icon">{{ getIcon(item) }}</span>
                <span class="layer-title">{{ item.title }}</span>
                <span v-if="item.data?.opacity < 100" class="opacity-badge">
                  {{ item.data.opacity }}%
                </span>
              </div>
            </template>
          </LayerPanel>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="demo-main">
        <div class="demo-header">
          <h1>Layer Vue - Simple Demo</h1>
          <p class="demo-subtitle">
            A Vue 3 component for creating Photoshop-style layer panels with drag & drop functionality.
          </p>
        </div>

        <div class="demo-controls">
          <button class="demo-btn primary" @click="addTextLayer">
            📝 Add Text Layer
          </button>
          <button class="demo-btn primary" @click="addImageLayer">
            🖼️ Add Image Layer
          </button>
          <button class="demo-btn primary" @click="addShapeLayer">
            🔶 Add Shape Layer
          </button>
          <button class="demo-btn primary" @click="addGroup">
            📁 Add Group
          </button>
          <button class="demo-btn secondary" @click="resetDemo">
            🔄 Reset Demo
          </button>
        </div>

        <div class="info-sections">
          <div class="info-card">
            <h3>✨ Key Features</h3>
            <ul class="feature-list">
              <li>🎯 <strong>Drag & Drop:</strong> Reorder layers intuitively</li>
              <li>🗂️ <strong>Nesting:</strong> Create hierarchical layer groups</li>
              <li>🖱️ <strong>Multi-Select:</strong> Ctrl+click to select multiple items</li>
              <li>🎛️ <strong>Context Menu:</strong> Right-click for actions</li>
              <li>👁️ <strong>Visibility:</strong> Toggle layer visibility</li>
              <li>🔒 <strong>Locking:</strong> Prevent layer modifications</li>
            </ul>
          </div>

          <div class="info-card">
            <h3>📊 Current Status</h3>
            <div class="status-info">
              <div class="status-row">
                <span class="status-label">Total Layers:</span>
                <span class="status-value">{{ totalLayers }}</span>
              </div>
              <div class="status-row">
                <span class="status-label">Selected:</span>
                <span class="status-value">{{ selectedCount }}</span>
              </div>
              <div class="status-row">
                <span class="status-label">Visible:</span>
                <span class="status-value">{{ visibleCount }}</span>
              </div>
              <div class="status-row">
                <span class="status-label">Locked:</span>
                <span class="status-value">{{ lockedCount }}</span>
              </div>
            </div>
            
            <div v-if="selectedLayers.length > 0" class="selected-items">
              <h4>Selected Items:</h4>
              <div class="selected-list">
                <span 
                  v-for="layer in selectedLayers" 
                  :key="layer.id" 
                  class="selected-tag"
                >
                  {{ getIcon(layer) }} {{ layer.title }}
                </span>
              </div>
            </div>
          </div>

          <div class="info-card">
            <h3>🔧 How to Use</h3>
            <div class="instructions">
              <div class="instruction">
                <span class="instruction-icon">🖱️</span>
                <div>
                  <strong>Drag & Drop:</strong> Click and drag any layer to reorder it in the list
                </div>
              </div>
              <div class="instruction">
                <span class="instruction-icon">📁</span>
                <div>
                  <strong>Nesting:</strong> Drag a layer onto a group to nest it inside
                </div>
              </div>
              <div class="instruction">
                <span class="instruction-icon">⌨️</span>
                <div>
                  <strong>Multi-Select:</strong> Hold Ctrl/Cmd and click to select multiple layers
                </div>
              </div>
              <div class="instruction">
                <span class="instruction-icon">🖱️</span>
                <div>
                  <strong>Context Menu:</strong> Right-click any layer for additional options
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import LayerPanel from '../components/LayerPanel.vue'
import type { LayerItem } from '../types'

// Sample layer data
const layers = ref<LayerItem[]>([
  {
    id: 'bg',
    title: 'Background Image',
    visible: true,
    locked: false,
    selected: false,
    data: { type: 'image', opacity: 100 }
  },
  {
    id: 'ui-elements',
    title: 'UI Elements',
    visible: true,
    locked: false,
    selected: false,
    collapsed: false,
    children: [
      {
        id: 'header',
        title: 'Page Header',
        visible: true,
        locked: false,
        selected: false,
        parent: 'ui-elements',
        data: { type: 'shape', opacity: 95 }
      },
      {
        id: 'nav',
        title: 'Navigation Menu',
        visible: true,
        locked: false,
        selected: false,
        parent: 'ui-elements',
        data: { type: 'text', opacity: 100 }
      },
      {
        id: 'sidebar',
        title: 'Sidebar',
        visible: false,
        locked: false,
        selected: false,
        parent: 'ui-elements',
        data: { type: 'shape', opacity: 80 }
      }
    ],
    data: { type: 'group' }
  },
  {
    id: 'content',
    title: 'Main Content',
    visible: true,
    locked: false,
    selected: false,
    data: { type: 'text', opacity: 90 }
  },
  {
    id: 'footer',
    title: 'Footer Section',
    visible: true,
    locked: true,
    selected: false,
    data: { type: 'shape', opacity: 75 }
  }
])

// Computed properties
const selectedLayers = computed(() => {
  const getSelected = (items: LayerItem[]): LayerItem[] => {
    let selected: LayerItem[] = []
    for (const item of items) {
      if (item.selected) selected.push(item)
      if (item.children) selected.push(...getSelected(item.children))
    }
    return selected
  }
  return getSelected(layers.value)
})

const totalLayers = computed(() => {
  const count = (items: LayerItem[]): number => {
    let total = 0
    for (const item of items) {
      total++
      if (item.children) total += count(item.children)
    }
    return total
  }
  return count(layers.value)
})

const selectedCount = computed(() => selectedLayers.value.length)

const visibleCount = computed(() => {
  const count = (items: LayerItem[]): number => {
    let total = 0
    for (const item of items) {
      if (item.visible !== false) total++
      if (item.children) total += count(item.children)
    }
    return total
  }
  return count(layers.value)
})

const lockedCount = computed(() => {
  const count = (items: LayerItem[]): number => {
    let total = 0
    for (const item of items) {
      if (item.locked) total++
      if (item.children) total += count(item.children)
    }
    return total
  }
  return count(layers.value)
})

// Helper functions
function getIcon(item: LayerItem): string {
  if (item.children && item.children.length > 0) return '📁'
  if (item.data?.type === 'text') return '📝'
  if (item.data?.type === 'image') return '🖼️'
  if (item.data?.type === 'shape') return '🔶'
  return '📄'
}

function clearSelection() {
  const clear = (items: LayerItem[]) => {
    items.forEach(item => {
      item.selected = false
      if (item.children) clear(item.children)
    })
  }
  clear(layers.value)
}

// Event handlers
function addTextLayer() {
  clearSelection()
  layers.value.push({
    id: `text-${Date.now()}`,
    title: 'New Text Layer',
    visible: true,
    locked: false,
    selected: true,
    data: { type: 'text', opacity: 100 }
  })
}

function addImageLayer() {
  clearSelection()
  layers.value.push({
    id: `image-${Date.now()}`,
    title: 'New Image Layer',
    visible: true,
    locked: false,
    selected: true,
    data: { type: 'image', opacity: 100 }
  })
}

function addShapeLayer() {
  clearSelection()
  layers.value.push({
    id: `shape-${Date.now()}`,
    title: 'New Shape Layer',
    visible: true,
    locked: false,
    selected: true,
    data: { type: 'shape', opacity: 100 }
  })
}

function addGroup() {
  clearSelection()
  layers.value.push({
    id: `group-${Date.now()}`,
    title: 'New Group',
    visible: true,
    locked: false,
    selected: true,
    collapsed: false,
    children: [],
    data: { type: 'group' }
  })
}

function resetDemo() {
  layers.value = [
    {
      id: 'bg',
      title: 'Background Image',
      visible: true,
      locked: false,
      selected: false,
      data: { type: 'image', opacity: 100 }
    },
    {
      id: 'ui-elements',
      title: 'UI Elements',
      visible: true,
      locked: false,
      selected: false,
      collapsed: false,
      children: [
        {
          id: 'header',
          title: 'Page Header',
          visible: true,
          locked: false,
          selected: false,
          parent: 'ui-elements',
          data: { type: 'shape', opacity: 95 }
        },
        {
          id: 'nav',
          title: 'Navigation Menu',
          visible: true,
          locked: false,
          selected: false,
          parent: 'ui-elements',
          data: { type: 'text', opacity: 100 }
        },
        {
          id: 'sidebar',
          title: 'Sidebar',
          visible: false,
          locked: false,
          selected: false,
          parent: 'ui-elements',
          data: { type: 'shape', opacity: 80 }
        }
      ],
      data: { type: 'group' }
    },
    {
      id: 'content',
      title: 'Main Content',
      visible: true,
      locked: false,
      selected: false,
      data: { type: 'text', opacity: 90 }
    },
    {
      id: 'footer',
      title: 'Footer Section',
      visible: true,
      locked: true,
      selected: false,
      data: { type: 'shape', opacity: 75 }
    }
  ]
}

function handleSelect(item: LayerItem, selectedItems: LayerItem[]) {
  console.log(`Selected: ${item.title} (${selectedItems.length} total selected)`)
}

function handleReorder(reorderedItems: LayerItem[]) {
  console.log('Layers reordered via drag & drop')
}

function handleDelete(deletedItems: LayerItem[]) {
  console.log(`Deleted ${deletedItems.length} layer(s)`)
}
</script>

<style scoped>
.simple-demo {
  height: 100vh;
  background: #1a1a1a;
  color: #ffffff;
  font-family: system-ui, -apple-system, sans-serif;
}

.demo-layout {
  display: flex;
  height: 100%;
}

.layers-sidebar {
  width: 300px;
  background: #2d2d2d;
  border-right: 1px solid #404040;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  background: #333333;
  border-bottom: 1px solid #404040;
}

.sidebar-header h2 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.sidebar-header p {
  margin: 0;
  font-size: 12px;
  color: #aaa;
}

.layers-container {
  flex: 1;
  overflow: hidden;
}

.demo-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.demo-header {
  margin-bottom: 32px;
}

.demo-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #ffffff;
}

.demo-subtitle {
  margin: 0;
  font-size: 16px;
  color: #aaa;
  line-height: 1.5;
}

.demo-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.demo-btn {
  border: none;
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.demo-btn.primary {
  background: #007acc;
  color: white;
}

.demo-btn.primary:hover {
  background: #0d7ad6;
  transform: translateY(-1px);
}

.demo-btn.secondary {
  background: #555;
  color: white;
}

.demo-btn.secondary:hover {
  background: #666;
}

.info-sections {
  display: grid;
  gap: 24px;
}

.info-card {
  background: #2a2a2a;
  border: 1px solid #404040;
  border-radius: 8px;
  padding: 20px;
}

.info-card h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #ffffff;
}

.info-card h4 {
  margin: 16px 0 8px 0;
  font-size: 14px;
  color: #cccccc;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  padding: 6px 0;
  color: #cccccc;
  font-size: 14px;
  line-height: 1.4;
}

.status-info {
  display: grid;
  gap: 8px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #333;
}

.status-row:last-child {
  border-bottom: none;
}

.status-label {
  color: #aaa;
  font-size: 14px;
}

.status-value {
  color: #007acc;
  font-weight: 600;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-tag {
  background: rgba(0, 122, 204, 0.2);
  color: #5dade2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.instructions {
  display: grid;
  gap: 12px;
}

.instruction {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.instruction-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.instruction div {
  color: #cccccc;
  font-size: 14px;
  line-height: 1.4;
}

/* Custom layer item styles */
.simple-layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  min-height: 24px;
}

.layer-icon {
  font-size: 14px;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.layer-title {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.opacity-badge {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .demo-layout {
    flex-direction: column;
  }
  
  .layers-sidebar {
    width: 100%;
    height: 300px;
  }
  
  .demo-controls {
    justify-content: center;
  }
}
</style>
