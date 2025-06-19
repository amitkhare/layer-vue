<template>
  <div class="demo-container">
    <div class="demo-sidebar">
      <div class="demo-controls">
        <h3>Controls</h3>
        <label>
          <input type="checkbox" v-model="reverseOrder" />
          Reverse Order (Top Level)
        </label>
        <label>
          <input type="checkbox" v-model="reverseOrderGroups" />
          Reverse Order Groups (Children)
        </label>
      </div>
      
      <LayerPanel
        v-model:items="layers"
        :allow-nesting="true"
        :allow-multi-select="true"
        :show-context-menu="true"
        :max-nesting-level="5"
        :reverse-order="reverseOrder"
        :reverse-order-groups="reverseOrderGroups"
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
      >         <template #item-content="{ item, level, originalIndex }">
          <div :style="{ paddingLeft: (level * 12) + 'px' }">
            <h4>{{ item.title }} | {{ originalIndex }}</h4>
          </div>
        </template>
      </LayerPanel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LayerPanel from '../components/LayerPanel.vue'
import type { LayerItem } from '../types'

// Demo controls
const reverseOrder = ref(true)
const reverseOrderGroups = ref(false)

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


// Utility functions
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
.demo-controls {
  padding: 1rem;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.demo-controls h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.demo-controls label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.demo-controls input[type="checkbox"] {
  margin: 0;
}
</style>
