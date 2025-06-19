<template>
  <div class="demo-container">
    <div class="demo-sidebar">
      <LayerPanel
        v-model:items="layers"
        :allow-nesting="true"
        :allow-multi-select="true"
        :show-context-menu="true"
        :max-nesting-level="5"
        class="demo-layer-panel"
        @item-select="handleItemSelect"
        @item-toggle-visibility="handleToggleVisibility"
        @item-toggle-lock="handleToggleLock"
        @item-reorder="handleReorder"
        @item-group="handleGroup"
        @item-ungroup="handleUngroup"
        @item-duplicate="handleDuplicate"
        @item-delete="handleDelete"
        @context-menu="handleContextMenu"
      >
        <template #item-content="{ item, level }">
          <div class="custom-layer-item" :style="{ paddingLeft: (level * 12) + 'px' }">
            <div class="layer-icon">
              <span v-if="item.children && item.children.length > 0">📁</span>
              <span v-else-if="item.data?.type === 'text'">📝</span>
              <span v-else-if="item.data?.type === 'image'">🖼️</span>
              <span v-else-if="item.data?.type === 'shape'">🔶</span>
              <span v-else>📄</span>
            </div>
            <span class="layer-title">{{ item.title }}</span>
            <div class="layer-badges">
              <span v-if="item.data?.blendMode" class="badge blend-mode">{{ item.data.blendMode }}</span>
              <span v-if="item.data?.opacity && item.data.opacity < 100" class="badge opacity">{{ item.data.opacity }}%</span>
            </div>
          </div>
        </template>
      </LayerPanel>
    </div>
    
    <div class="demo-content">
      <div class="demo-title">Layer Vue Demo</div>
      
      <div class="demo-section">
        <h3>Features</h3>
        <div class="demo-info">
          <p><strong>✨ Drag & Drop Reordering:</strong> Drag layers to reorder them or nest them inside groups</p>
          <p><strong>🗂️ Layer Groups/Nesting:</strong> Create hierarchical layer structures with unlimited nesting</p>
          <p><strong>🖱️ Context Menus:</strong> Right-click for context actions like duplicate, delete, group, etc.</p>
          <p><strong>🔘 Multi Select:</strong> Hold Ctrl/Cmd to select multiple layers, Shift for range selection</p>
          <p><strong>🎨 Template Slots:</strong> Customize layer appearance with Vue slots</p>
        </div>
      </div>
      
      <div class="demo-section">
        <h3>Controls</h3>
        <div class="demo-controls">
          <button class="demo-btn" @click="addTextLayer">Add Text Layer</button>
          <button class="demo-btn" @click="addImageLayer">Add Image Layer</button>
          <button class="demo-btn" @click="addShapeLayer">Add Shape Layer</button>
          <button class="demo-btn" @click="addGroup">Add Group</button>
          <button class="demo-btn" @click="clearAll">Clear All</button>
          <button class="demo-btn" @click="resetDemo">Reset Demo</button>
        </div>
      </div>
      
      <div class="demo-section">
        <h3>Selected Layers</h3>
        <div class="demo-info">
          <div v-if="selectedLayers.length === 0">No layers selected</div>
          <div v-else>
            <div v-for="layer in selectedLayers" :key="layer.id" class="selected-layer">
              {{ layer.title }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="demo-section">
        <h3>Events</h3>
        <div class="demo-info">
          <div class="event-log">
            <div v-for="(event, index) in eventLog" :key="index" class="event-item">
              <span class="event-time">{{ event.time }}</span>
              <span class="event-type">{{ event.type }}</span>
              <span class="event-details">{{ event.details }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import LayerPanel from './components/LayerPanel.vue'
import type { LayerItem } from './types'

// Demo data
const layers = ref<LayerItem[]>([
  {
    id: 'bg',
    title: 'Background',
    visible: true,
    locked: false,
    selected: false,
    data: {
      type: 'image',
      blendMode: 'Normal',
      opacity: 100
    }
  },
  {
    id: 'ui-group',
    title: 'UI Elements',
    visible: true,
    locked: false,
    selected: false,
    collapsed: false,
    children: [
      {
        id: 'header',
        title: 'Header',
        visible: true,
        locked: false,
        selected: false,
        parent: 'ui-group',
        data: {
          type: 'shape',
          blendMode: 'Normal',
          opacity: 90
        }
      },
      {
        id: 'nav',
        title: 'Navigation',
        visible: true,
        locked: false,
        selected: false,
        parent: 'ui-group',
        data: {
          type: 'text',
          blendMode: 'Normal',
          opacity: 100
        }
      }
    ],
    data: {
      type: 'group'
    }
  },
  {
    id: 'content-group',
    title: 'Content',
    visible: true,
    locked: false,
    selected: false,
    collapsed: false,
    children: [
      {
        id: 'hero',
        title: 'Hero Section',
        visible: true,
        locked: false,
        selected: false,
        parent: 'content-group',
        data: {
          type: 'image',
          blendMode: 'Screen',
          opacity: 85
        }
      },
      {
        id: 'text-content',
        title: 'Main Text',
        visible: true,
        locked: false,
        selected: false,
        parent: 'content-group',
        data: {
          type: 'text',
          blendMode: 'Normal',
          opacity: 100
        }
      }
    ],
    data: {
      type: 'group'
    }
  },
  {
    id: 'footer',
    title: 'Footer',
    visible: false,
    locked: true,
    selected: false,
    data: {
      type: 'shape',
      blendMode: 'Multiply',
      opacity: 75
    }
  }
])

const selectedLayers = computed(() => {
  const getAllSelected = (items: LayerItem[]): LayerItem[] => {
    const selected: LayerItem[] = []
    for (const item of items) {
      if (item.selected) {
        selected.push(item)
      }
      if (item.children) {
        selected.push(...getAllSelected(item.children))
      }
    }
    return selected
  }
  return getAllSelected(layers.value)
})

const eventLog = ref<Array<{ time: string, type: string, details: string }>>([])

// Event handlers
function handleItemSelect(item: LayerItem, selectedItems: LayerItem[]) {
  addEvent('SELECT', `Selected "${item.title}" (${selectedItems.length} total selected)`)
}

function handleToggleVisibility(item: LayerItem) {
  addEvent('VISIBILITY', `Toggled visibility of "${item.title}" to ${item.visible ? 'visible' : 'hidden'}`)
}

function handleToggleLock(item: LayerItem) {
  addEvent('LOCK', `Toggled lock of "${item.title}" to ${item.locked ? 'locked' : 'unlocked'}`)
}

function handleReorder(_reorderedLayers: LayerItem[]) {
  addEvent('REORDER', 'Layers reordered via drag & drop')
}

function handleGroup(groupedItems: LayerItem[]) {
  addEvent('GROUP', `Grouped ${groupedItems.length} layers`)
}

function handleUngroup(ungroupedItem: LayerItem) {
  addEvent('UNGROUP', `Ungrouped "${ungroupedItem.title}"`)
}

function handleDuplicate(duplicatedItem: LayerItem) {
  addEvent('DUPLICATE', `Duplicated "${duplicatedItem.title}"`)
}

function handleDelete(deletedItems: LayerItem[]) {
  addEvent('DELETE', `Deleted ${deletedItems.length} layer(s)`)
}

function handleContextMenu(_event: MouseEvent, item: LayerItem) {
  addEvent('CONTEXT_MENU', `Opened context menu for "${item.title}"`)
}

// Demo controls
function addTextLayer() {
  const newLayer: LayerItem = {
    id: `text-${Date.now()}`,
    title: 'New Text Layer',
    visible: true,
    locked: false,
    selected: true,
    data: {
      type: 'text',
      blendMode: 'Normal',
      opacity: 100
    }
  }
  
  // Clear other selections
  clearSelections(layers.value)
  layers.value.push(newLayer)
  addEvent('ADD', `Added text layer "${newLayer.title}"`)
}

function addImageLayer() {
  const newLayer: LayerItem = {
    id: `image-${Date.now()}`,
    title: 'New Image Layer',
    visible: true,
    locked: false,
    selected: true,
    data: {
      type: 'image',
      blendMode: 'Normal',
      opacity: 100
    }
  }
  
  clearSelections(layers.value)
  layers.value.push(newLayer)
  addEvent('ADD', `Added image layer "${newLayer.title}"`)
}

function addShapeLayer() {
  const newLayer: LayerItem = {
    id: `shape-${Date.now()}`,
    title: 'New Shape Layer',
    visible: true,
    locked: false,
    selected: true,
    data: {
      type: 'shape',
      blendMode: 'Normal',
      opacity: 100
    }
  }
  
  clearSelections(layers.value)
  layers.value.push(newLayer)
  addEvent('ADD', `Added shape layer "${newLayer.title}"`)
}

function addGroup() {
  const newGroup: LayerItem = {
    id: `group-${Date.now()}`,
    title: 'New Group',
    visible: true,
    locked: false,
    selected: true,
    collapsed: false,
    children: [],
    data: {
      type: 'group'
    }
  }
  
  clearSelections(layers.value)
  layers.value.push(newGroup)
  addEvent('ADD', `Added group "${newGroup.title}"`)
}

function clearAll() {
  layers.value = []
  addEvent('CLEAR', 'Cleared all layers')
}

function resetDemo() {
  // Reset to initial demo data
  layers.value = [
    {
      id: 'bg',
      title: 'Background',
      visible: true,
      locked: false,
      selected: false,
      data: {
        type: 'image',
        blendMode: 'Normal',
        opacity: 100
      }
    },
    {
      id: 'ui-group',
      title: 'UI Elements',
      visible: true,
      locked: false,
      selected: false,
      collapsed: false,
      children: [
        {
          id: 'header',
          title: 'Header',
          visible: true,
          locked: false,
          selected: false,
          parent: 'ui-group',
          data: {
            type: 'shape',
            blendMode: 'Normal',
            opacity: 90
          }
        },
        {
          id: 'nav',
          title: 'Navigation',
          visible: true,
          locked: false,
          selected: false,
          parent: 'ui-group',
          data: {
            type: 'text',
            blendMode: 'Normal',
            opacity: 100
          }
        }
      ],
      data: {
        type: 'group'
      }
    },
    {
      id: 'content-group',
      title: 'Content',
      visible: true,
      locked: false,
      selected: false,
      collapsed: false,
      children: [
        {
          id: 'hero',
          title: 'Hero Section',
          visible: true,
          locked: false,
          selected: false,
          parent: 'content-group',
          data: {
            type: 'image',
            blendMode: 'Screen',
            opacity: 85
          }
        },
        {
          id: 'text-content',
          title: 'Main Text',
          visible: true,
          locked: false,
          selected: false,
          parent: 'content-group',
          data: {
            type: 'text',
            blendMode: 'Normal',
            opacity: 100
          }
        }
      ],
      data: {
        type: 'group'
      }
    },
    {
      id: 'footer',
      title: 'Footer',
      visible: false,
      locked: true,
      selected: false,
      data: {
        type: 'shape',
        blendMode: 'Multiply',
        opacity: 75
      }
    }
  ]
  
  eventLog.value = []
  addEvent('RESET', 'Reset demo to initial state')
}

// Utility functions
function clearSelections(items: LayerItem[]) {
  for (const item of items) {
    item.selected = false
    if (item.children) {
      clearSelections(item.children)
    }
  }
}

function addEvent(type: string, details: string) {
  const time = new Date().toLocaleTimeString()
  eventLog.value.unshift({ time, type, details })
  
  // Keep only last 10 events
  if (eventLog.value.length > 10) {
    eventLog.value = eventLog.value.slice(0, 10)
  }
}
</script>

<style scoped>
.custom-layer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  min-height: 20px;
}

.layer-icon {
  font-size: 12px;
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

.layer-badges {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.badge {
  background: rgba(255, 255, 255, 0.1);
  color: #ccc;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  font-weight: 500;
}

.badge.blend-mode {
  background: rgba(0, 122, 204, 0.2);
  color: #5dade2;
}

.badge.opacity {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.selected-layer {
  padding: 4px 8px;
  background: rgba(0, 122, 204, 0.2);
  border-radius: 2px;
  margin-bottom: 2px;
  font-size: 13px;
}

.event-log {
  max-height: 200px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
}

.event-item {
  display: flex;
  gap: 8px;
  padding: 2px 0;
  font-size: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.event-time {
  color: #888;
  flex-shrink: 0;
  width: 70px;
}

.event-type {
  color: #007acc;
  font-weight: bold;
  flex-shrink: 0;
  width: 80px;
}

.event-details {
  color: #ccc;
  flex: 1;
}
</style>
