<template>
  <div
    class="layer-item"
    :class="{
      'selected': selected,
      'dragging': dragging,
      'has-children': hasChildren,
      'collapsed': item.collapsed,
      'locked': item.locked
    }"
    :style="{ '--level': level }"
    :draggable="!item.locked"
    @click="handleClick"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @contextmenu="handleContextMenu"
  >
    <div class="layer-item-content">
      <!-- Indentation and expand/collapse -->
      <div class="layer-indent" :style="{ width: (level * 16) + 'px' }"></div>
      
      <button
        v-if="hasChildren"
        class="layer-expand-btn"
        @click.stop="toggleCollapse"
      >
        <span class="expand-icon" :class="{ 'collapsed': item.collapsed }">▼</span>
      </button>
      
      <div v-else class="layer-expand-spacer"></div>
      
      <!-- Custom item content slot -->
      <div class="layer-content-wrapper">
        <slot name="item-content" :item="item" :level="level">
          <div class="layer-item-default">
            <span class="layer-title">{{ item.title }}</span>
          </div>
        </slot>
      </div>
      
      <!-- Custom controls slot -->
      <div class="layer-controls-wrapper">
        <slot name="item-controls" :item="item">
          <div class="layer-controls">
            <button
              class="layer-control-btn visibility"
              :class="{ active: item.visible !== false }"
              @click.stop="$emit('item-toggle-visibility', item)"
              title="Toggle visibility"
            >
              <span v-if="item.visible !== false">👁</span>
              <span v-else>👁‍🗨</span>
            </button>
            <button
              class="layer-control-btn lock"
              :class="{ active: item.locked === true }"
              @click.stop="$emit('item-toggle-lock', item)"
              title="Toggle lock"
            >
              <span v-if="item.locked">🔒</span>
              <span v-else>🔓</span>
            </button>
          </div>
        </slot>
      </div>
    </div>
    
    <!-- Drop zones -->
    <div
      class="drop-zone drop-zone-before"
      :class="{ 'active': dropZones.before }"
    ></div>
    <div
      class="drop-zone drop-zone-after"
      :class="{ 'active': dropZones.after }"
    ></div>
    <div
      v-if="allowNesting && level < maxNestingLevel"
      class="drop-zone drop-zone-inside"
      :class="{ 'active': dropZones.inside }"
    ></div>
    
    <!-- Children -->
    <div v-if="hasChildren && !item.collapsed" class="layer-children">
      <LayerItem
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        :level="level + 1"
        :allow-nesting="allowNesting"
        :allow-multi-select="allowMultiSelect"
        :show-context-menu="showContextMenu"
        :max-nesting-level="maxNestingLevel"
        :selected="child.selected"
        :dragging="dragging && draggedItems.some((d: LayerItemType) => d.id === child.id)"
        @item-select="$emit('item-select', $event)"
        @item-toggle-visibility="$emit('item-toggle-visibility', $event)"
        @item-toggle-lock="$emit('item-toggle-lock', $event)"        @item-drag-start="$emit('item-drag-start', $event, $event)"
        @item-drag-end="$emit('item-drag-end')"
        @item-drag-over="(...args) => $emit('item-drag-over', ...args)"
        @context-menu="$emit('context-menu', $event, child)"
      >
        <template #item-content="{ item: slotItem, level: slotLevel }">
          <slot name="item-content" :item="slotItem" :level="slotLevel"></slot>
        </template>
        
        <template #item-controls="{ item: slotItem }">
          <slot name="item-controls" :item="slotItem"></slot>
        </template>
      </LayerItem>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { LayerItemProps, LayerItem as LayerItemType } from '../types'

const props = withDefaults(defineProps<LayerItemProps>(), {
  level: 0,
  allowNesting: true,
  allowMultiSelect: true,
  showContextMenu: true,
  maxNestingLevel: 10,
  selected: false,
  dragging: false
})

const emit = defineEmits<{
  'item-select': [item: any, event?: MouseEvent]
  'item-toggle-visibility': [item: any]
  'item-toggle-lock': [item: any]
  'item-drag-start': [item: any, event: DragEvent]
  'item-drag-end': []
  'item-drag-over': [item: any, position: 'before' | 'after' | 'inside', rect: DOMRect]
  'context-menu': [event: MouseEvent, item: any]
}>()

// Inject drag state from parent
const dragState = inject('dragState', ref({
  isDragging: false,
  draggedItem: null as LayerItemType | null,
  draggedItems: [] as LayerItemType[],
  dropTarget: null as LayerItemType | null,
  dropPosition: null as 'before' | 'after' | 'inside' | null
}))

// Local state
const dropZones = ref({
  before: false,
  after: false,
  inside: false
})

const dragOverTimer = ref<number | null>(null)

// Computed
const hasChildren = computed(() => {
  return props.item.children && props.item.children.length > 0
})

const draggedItems = computed(() => {
  return dragState.value.draggedItems || []
})

const isDraggedItem = computed(() => {
  return draggedItems.value.some((item: LayerItemType) => item.id === props.item.id)
})

// Methods
function handleClick(event: MouseEvent) {
  if (props.item.locked) return
  emit('item-select', props.item, event)
}

function toggleCollapse() {
  if (props.item.locked) return
  // This would need to emit an event to update the item's collapsed state
  // For now, we'll assume the parent handles this
  props.item.collapsed = !props.item.collapsed
}

function handleDragStart(event: DragEvent) {
  console.log('LayerItem: handleDragStart', props.item.title)
  if (props.item.locked) return
  
  event.stopPropagation()
  emit('item-drag-start', props.item, event)
}

function handleDragEnd(event: DragEvent) {
  event.stopPropagation()
  clearDropZones()
  emit('item-drag-end')
}

function handleDragOver(event: DragEvent) {
  if (!dragState.value.isDragging || isDraggedItem.value) return
  
  event.preventDefault()
  event.stopPropagation()
  
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const y = event.clientY - rect.top
  const height = rect.height
  
  clearDropZones()
  
  let position: 'before' | 'after' | 'inside'
  if (y < height * 0.25) {
    position = 'before'
    dropZones.value.before = true
  } else if (y > height * 0.75) {
    position = 'after'
    dropZones.value.after = true
  } else if (props.allowNesting && props.level < props.maxNestingLevel) {
    position = 'inside'
    dropZones.value.inside = true
  } else {
    position = 'after'
    dropZones.value.after = true
  }
  
  console.log('LayerItem: handleDragOver', props.item.title, position)
  emit('item-drag-over', props.item, position, rect)
}

function handleDragEnter(event: DragEvent) {
  if (!dragState.value.isDragging || isDraggedItem.value) return
  
  event.preventDefault()
  event.stopPropagation()
  
  // Auto-expand collapsed items when hovering
  if (hasChildren.value && props.item.collapsed) {
    if (dragOverTimer.value) {
      clearTimeout(dragOverTimer.value)
    }
    
    dragOverTimer.value = window.setTimeout(() => {
      if (dropZones.value.inside) {
        props.item.collapsed = false
      }
    }, 1000)
  }
}

function handleDragLeave(event: DragEvent) {
  if (!dragState.value.isDragging) return
  
  event.preventDefault()
  event.stopPropagation()
  
  if (dragOverTimer.value) {
    clearTimeout(dragOverTimer.value)
    dragOverTimer.value = null
  }
  
  // Only clear if we're actually leaving the item
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    clearDropZones()
  }
}

function handleDrop(event: DragEvent) {
  console.log('LayerItem: handleDrop', props.item.title)
  if (!dragState.value.isDragging || isDraggedItem.value) return
  
  event.preventDefault()
  event.stopPropagation()
  
  // The actual drop handling is done by the parent component
  // We just need to trigger the parent's drop handler
  const parentElement = (event.currentTarget as HTMLElement).closest('.layer-list')
  if (parentElement) {
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      clientX: event.clientX,
      clientY: event.clientY
    })
    parentElement.dispatchEvent(dropEvent)
  }
  
  clearDropZones()
}

function handleContextMenu(event: MouseEvent) {
  if (!props.showContextMenu) return
  emit('context-menu', event, props.item)
}

function clearDropZones() {
  dropZones.value.before = false
  dropZones.value.after = false
  dropZones.value.inside = false
}
</script>

<style scoped>
.layer-item {
  position: relative;
  border-radius: 2px;
  transition: background-color 0.15s ease;
}

.layer-item:hover:not(.dragging) {
  background: rgba(255, 255, 255, 0.05);
}

.layer-item.selected {
  background: #007acc;
}

.layer-item.selected:hover {
  background: #0a84d1;
}

.layer-item.dragging {
  opacity: 0.5;
}

.layer-item.locked {
  opacity: 0.7;
}

.layer-item-content {
  display: flex;
  align-items: center;
  min-height: 22px;
  position: relative;
  z-index: 1;
}

.layer-indent {
  flex-shrink: 0;
}

.layer-expand-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  margin-right: 2px;
}

.layer-expand-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.layer-expand-spacer {
  width: 18px;
  flex-shrink: 0;
}

.expand-icon {
  font-size: 10px;
  transition: transform 0.15s ease;
}

.expand-icon.collapsed {
  transform: rotate(-90deg);
}

.layer-content-wrapper {
  flex: 1;
  min-width: 0;
}

.layer-item-default {
  display: flex;
  align-items: center;
  padding: 2px 4px;
}

.layer-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.layer-controls-wrapper {
  flex-shrink: 0;
  margin-left: 4px;
}

.layer-controls {
  display: flex;
  gap: 1px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.layer-item:hover .layer-controls,
.layer-item.selected .layer-controls {
  opacity: 1;
}

.layer-control-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 1px 3px;
  border-radius: 2px;
  font-size: 11px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.layer-control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.layer-control-btn.active {
  color: #fff;
}

.layer-children {
  position: relative;
}

/* Drop zones */
.drop-zone {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 0;
}

.drop-zone-before {
  top: -2px;
  height: 4px;
}

.drop-zone-after {
  bottom: -2px;
  height: 4px;
}

.drop-zone-inside {
  top: 0;
  bottom: 0;
}

.drop-zone.active::before {
  content: '';
  position: absolute;
  left: calc(var(--level, 0) * 16px + 8px);
  right: 8px;
}

.drop-zone-before.active::before,
.drop-zone-after.active::before {
  top: 1px;
  height: 2px;
  background: #007acc;
}

.drop-zone-inside.active::before {
  top: 0;
  bottom: 0;
  border: 2px dashed #007acc;
  background: rgba(0, 122, 204, 0.1);
  border-radius: 2px;
}

/* Prevent text selection during drag */
.layer-item * {
  user-select: none;
}
</style>
