<template>
  <div class="layer-panel" @contextmenu.prevent>    <div 
      class="layer-list"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
    >      <LayerItem
        v-for="(item, index) in orderedItems"
        :key="item.id"
        :item="item"
        :level="0"
        :index="index"
        :original-index="reverseOrder ? localItems.length - 1 - index : index"
        :allow-nesting="allowNesting"
        :allow-multi-select="allowMultiSelect"
        :show-context-menu="showContextMenu"
        :max-nesting-level="maxNestingLevel"
        :reverse-order-groups="reverseOrderGroups"
        :selected="item.selected"
        :dragging="dragState.draggedItems.some(d => d.id === item.id)"
        @item-select="handleItemSelect"
        @item-toggle-visibility="handleToggleVisibility"
        @item-toggle-lock="handleToggleLock"        @item-drag-start="handleDragStart"
        @item-drag-end="handleDragEnd"
        @item-drag-over="handleItemDragOver"
        @context-menu="handleContextMenu"
      >
        <template #item-content="{ item: slotItem, level: slotLevel, index: slotIndex, originalIndex: slotOriginalIndex }">
          <slot name="item-content" :item="slotItem" :level="slotLevel" :index="slotIndex" :original-index="slotOriginalIndex">
            <div class="layer-item-default">
              <span class="layer-title">{{ slotItem.title }}</span>
            </div>
          </slot>
        </template>
        
        <template #item-controls="{ item: slotItem }">
          <slot name="item-controls" :item="slotItem">
            <div class="layer-controls">
              <button
                class="layer-control-btn visibility"
                :class="{ active: slotItem.visible !== false }"
                @click.stop="handleToggleVisibility(slotItem)"
                title="Toggle visibility"
              >
                👁
              </button>
              <button
                class="layer-control-btn lock"
                :class="{ active: slotItem.locked === true }"
                @click.stop="handleToggleLock(slotItem)"
                title="Toggle lock"
              >
                🔒
              </button>
            </div>
          </slot>
        </template>      </LayerItem>
    </div>
    
    <!-- Bottom drop zone for reverse order -->
    <div
      v-if="reverseOrder && dragState.isDragging"
      class="bottom-drop-zone"
      :class="{ 'active': bottomDropZone.active }"
      @dragover.prevent="handleBottomDropZoneOver"
      @drop.prevent="handleBottomDropZoneDrop"
    >
      <div class="drop-zone-indicator">Drop here to place at bottom</div>
    </div>
    
    <!-- Context Menu -->
    <div
      v-if="contextMenu.visible && showContextMenu"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="context-menu-content">
        <slot name="context-menu" :item="contextMenu.item" :selected-items="selectedItems">
          <div
            v-for="option in contextMenuOptions"
            :key="option.action"
            class="context-menu-item"
            :class="{ disabled: option.disabled, separator: option.separator }"
            @click="handleContextMenuAction(option)"
          >
            <span v-if="option.icon" class="context-menu-icon">{{ option.icon }}</span>
            <span class="context-menu-label">{{ option.label }}</span>
          </div>
        </slot>
      </div>
    </div>
    
    <!-- Drop indicator -->
    <div
      v-if="dragState.isDragging && dropIndicator.visible"
      class="drop-indicator"
      :class="dropIndicator.type"
      :style="dropIndicator.style"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import { useEventListener } from '@vueuse/core'
import LayerItem from './LayerItem.vue'
import type { LayerItem as LayerItemType, LayerPanelProps, LayerPanelEmits, DragState, ContextMenuOption } from '../types'
import { 
  getAllSelectedItems, 
  clearSelection, 
  updateItemInTree, 
  removeItemFromTree, 
  addItemToTree,
  findItemById
} from '../utils'

const props = withDefaults(defineProps<LayerPanelProps>(), {
  allowNesting: true,
  allowMultiSelect: true,
  showContextMenu: true,
  maxNestingLevel: 10,
  reverseOrder: false,
  reverseOrderGroups: false
})

const emit = defineEmits<LayerPanelEmits>()

// Local state
const localItems = ref<LayerItemType[]>([...props.items])
const dragState = ref<DragState>({
  isDragging: false,
  draggedItem: null,
  draggedItems: [],
  dropTarget: null,
  dropPosition: null
})

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  item: null as LayerItemType | null
})

const dropIndicator = ref({
  visible: false,
  type: '',
  style: {}
})

const bottomDropZone = ref({
  active: false
})

// Computed
const selectedItems = computed(() => getAllSelectedItems(localItems.value))

const orderedItems = computed(() => {
  if (props.reverseOrder) {
    return [...localItems.value].reverse()
  }
  return localItems.value
})

const contextMenuOptions = computed((): ContextMenuOption[] => {
  const hasSelection = selectedItems.value.length > 0
  const hasMultipleSelection = selectedItems.value.length > 1
  
  return [
    { label: 'Duplicate', icon: '📋', action: 'duplicate', disabled: !hasSelection },
    { label: 'Delete', icon: '🗑', action: 'delete', disabled: !hasSelection },
    { label: '', action: 'separator', separator: true },
    { label: 'Group', icon: '📁', action: 'group', disabled: !hasMultipleSelection },
    { label: 'Ungroup', icon: '📂', action: 'ungroup', disabled: hasMultipleSelection || !hasSelection },
    { label: '', action: 'separator', separator: true },
    { label: 'Select All', icon: '☑', action: 'select-all' },
    { label: 'Deselect All', icon: '☐', action: 'deselect-all', disabled: !hasSelection }
  ]
})

// Watch props changes
watch(() => props.items, (newItems) => {
  localItems.value = [...newItems]
}, { deep: true })

// Provide drag state to child components
provide('dragState', dragState)

// Event handlers
function handleItemSelect(item: LayerItemType, event?: MouseEvent) {
  if (props.allowMultiSelect && event && (event.ctrlKey || event.metaKey)) {
    // Multi-select mode
    localItems.value = updateItemInTree(localItems.value, item.id, {
      selected: !item.selected
    })
  } else if (props.allowMultiSelect && event && event.shiftKey) {
    // Range select (simplified - you could implement full range selection)
    localItems.value = updateItemInTree(localItems.value, item.id, {
      selected: true
    })
  } else {
    // Single select
    localItems.value = clearSelection(localItems.value)
    localItems.value = updateItemInTree(localItems.value, item.id, {
      selected: true
    })
  }
  
  emit('item-select', item, selectedItems.value)
  emit('update:items', localItems.value)
}

function handleToggleVisibility(item: LayerItemType) {
  localItems.value = updateItemInTree(localItems.value, item.id, {
    visible: item.visible !== false ? false : true
  })
  emit('item-toggle-visibility', item)
  emit('update:items', localItems.value)
}

function handleToggleLock(item: LayerItemType) {
  localItems.value = updateItemInTree(localItems.value, item.id, {
    locked: !item.locked
  })
  emit('item-toggle-lock', item)
  emit('update:items', localItems.value)
}

function handleDragStart(item: LayerItemType, event: DragEvent) {
  console.log('LayerPanel: handleDragStart', item.title)
  if (item.locked) return
  
  dragState.value.isDragging = true
  dragState.value.draggedItem = item
  
  // If item is selected and there are multiple selections, drag all selected
  if (item.selected && selectedItems.value.length > 1) {
    dragState.value.draggedItems = selectedItems.value
  } else {
    dragState.value.draggedItems = [item]
  }
  
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', '')
  }
}

function handleDragEnd() {
  dragState.value.isDragging = false
  dragState.value.draggedItem = null
  dragState.value.draggedItems = []
  dragState.value.dropTarget = null
  dragState.value.dropPosition = null
  dropIndicator.value.visible = false
  bottomDropZone.value.active = false
}

function handleItemDragOver(item: LayerItemType, position: 'before' | 'after' | 'inside', rect: DOMRect) {
  console.log('LayerPanel: handleItemDragOver', item.title, position)
  if (!dragState.value.isDragging) return
  
  dragState.value.dropTarget = item
  dragState.value.dropPosition = position
  
  // Update drop indicator
  dropIndicator.value.visible = true
  dropIndicator.value.type = position
  
  const style: any = {
    position: 'fixed',
    left: rect.left + 'px',
    width: rect.width + 'px',
    zIndex: 1000
  }
  
  if (position === 'before') {
    style.top = rect.top + 'px'
    style.height = '2px'
    style.background = '#007acc'
  } else if (position === 'after') {
    style.top = (rect.bottom - 2) + 'px'
    style.height = '2px'
    style.background = '#007acc'
  } else if (position === 'inside') {
    style.top = rect.top + 'px'
    style.height = rect.height + 'px'
    style.border = '2px dashed #007acc'
    style.backgroundColor = 'rgba(0, 122, 204, 0.1)'
    style.borderRadius = '2px'
  }
  
  dropIndicator.value.style = style
}

function handleDragOver(event: DragEvent) {
  console.log('LayerPanel: handleDragOver')
  if (!dragState.value.isDragging) return
  
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

function handleDrop(event: DragEvent) {
  console.log('LayerPanel: handleDrop called')
  console.log('isDragging:', dragState.value.isDragging)
  console.log('dropTarget:', dragState.value.dropTarget?.title)
  console.log('dropPosition:', dragState.value.dropPosition)
  
  if (!dragState.value.isDragging || !dragState.value.dropTarget || !dragState.value.dropPosition) {
    console.log('LayerPanel: Drop cancelled - missing requirements')
    return
  }
  
  event.preventDefault()
  
  const draggedItems = dragState.value.draggedItems
  const dropTarget = dragState.value.dropTarget
  let dropPosition = dragState.value.dropPosition
  
  // When reverse order is enabled, we need to invert the drop position
  // for 'before' and 'after' positions to match the visual expectation
  if (props.reverseOrder && dropPosition !== 'inside') {
    dropPosition = dropPosition === 'before' ? 'after' : 'before'
  }
  
  console.log('LayerPanel: Processing drop - moving', draggedItems.map(i => i.title), 'to', dropTarget.title, dropPosition)
  
  // Remove dragged items from their current positions
  let newItems = [...localItems.value]
  for (const draggedItem of draggedItems) {
    newItems = removeItemFromTree(newItems, draggedItem.id)
  }
  
  // Add items to their new positions
  for (let i = 0; i < draggedItems.length; i++) {
    const draggedItem = { ...draggedItems[i] }
    if (dropPosition === 'inside') {
      draggedItem.parent = dropTarget.id
    } else {
      draggedItem.parent = dropTarget.parent
    }
    newItems = addItemToTree(newItems, draggedItem, dropTarget.id, dropPosition)
  }
  
  console.log('LayerPanel: New items structure:', newItems)
  
  localItems.value = newItems
  emit('item-reorder', localItems.value)
  emit('update:items', localItems.value)
  
  handleDragEnd()
}

function handleContextMenu(event: MouseEvent, item: LayerItemType) {
  if (!props.showContextMenu) return
  
  event.preventDefault()
  event.stopPropagation()
  
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    item
  }
  
  emit('context-menu', event, item)
}

function handleContextMenuAction(option: ContextMenuOption) {
  if (option.disabled || option.separator) return
  
  contextMenu.value.visible = false
  
  switch (option.action) {
    case 'duplicate':
      handleDuplicate()
      break
    case 'delete':
      handleDelete()
      break
    case 'group':
      handleGroup()
      break
    case 'ungroup':
      handleUngroup()
      break
    case 'select-all':
      handleSelectAll()
      break
    case 'deselect-all':
      handleDeselectAll()
      break
  }
}

function handleDuplicate() {
  const selected = selectedItems.value
  if (selected.length === 0) return
  
  let newItems = [...localItems.value]
  
  for (const item of selected) {
    const duplicatedItem: LayerItemType = {
      ...item,
      id: `${item.id}_copy_${Date.now()}`,
      title: `${item.title} copy`,
      selected: false
    }
    
    newItems = addItemToTree(newItems, duplicatedItem, item.id, 'after')
  }
  
  localItems.value = newItems
  emit('item-duplicate', selected[0])
  emit('update:items', localItems.value)
}

function handleDelete() {
  const selected = selectedItems.value
  if (selected.length === 0) return
  
  let newItems = [...localItems.value]
  
  for (const item of selected) {
    newItems = removeItemFromTree(newItems, item.id)
  }
  
  localItems.value = newItems
  emit('item-delete', selected)
  emit('update:items', localItems.value)
}

function handleGroup() {
  const selected = selectedItems.value
  if (selected.length < 2) return
  
  const groupItem: LayerItemType = {
    id: `group_${Date.now()}`,
    title: 'Group',
    children: [...selected],
    selected: false,
    visible: true,
    collapsed: false
  }
  
  let newItems = [...localItems.value]
  
  // Remove selected items
  for (const item of selected) {
    newItems = removeItemFromTree(newItems, item.id)
  }
  
  // Add group at the position of the first selected item
  newItems = addItemToTree(newItems, groupItem, selected[0].id, 'after')
  
  localItems.value = newItems
  emit('item-group', selected)
  emit('update:items', localItems.value)
}

function handleUngroup() {
  const selected = selectedItems.value
  if (selected.length !== 1 || !selected[0].children) return
  
  const groupItem = selected[0]
  const children = groupItem.children || []
  
  let newItems = removeItemFromTree(localItems.value, groupItem.id)
  
  // Add children at the group's position
  for (let i = 0; i < children.length; i++) {
    const child = { ...children[i], parent: groupItem.parent }
    if (i === 0) {
      newItems = addItemToTree(newItems, child, groupItem.id, 'after')
    } else {
      newItems = addItemToTree(newItems, child, children[i - 1].id, 'after')
    }
  }
  
  localItems.value = newItems
  emit('item-ungroup', groupItem)
  emit('update:items', localItems.value)
}

function handleSelectAll() {
  function selectAllItems(items: LayerItemType[]): LayerItemType[] {
    return items.map(item => ({
      ...item,
      selected: true,
      children: item.children ? selectAllItems(item.children) : undefined
    }))
  }
  
  localItems.value = selectAllItems(localItems.value)
  emit('update:items', localItems.value)
}

function handleDeselectAll() {
  localItems.value = clearSelection(localItems.value)
  emit('update:items', localItems.value)
}

function handleBottomDropZoneOver(event: DragEvent) {
  if (!dragState.value.isDragging) return
  
  event.preventDefault()
  bottomDropZone.value.active = true
}

function handleBottomDropZoneDrop(event: DragEvent) {
  if (!dragState.value.isDragging) return
  
  event.preventDefault()
  bottomDropZone.value.active = false
  
  const draggedItems = dragState.value.draggedItems
  
  // Remove dragged items from their current positions
  let newItems = [...localItems.value]
  for (const draggedItem of draggedItems) {
    newItems = removeItemFromTree(newItems, draggedItem.id)
  }
  
  // Add items to the beginning of the array (which appears at bottom in reverse order)
  for (let i = draggedItems.length - 1; i >= 0; i--) {
    const draggedItem = { ...draggedItems[i], parent: null }
    newItems.unshift(draggedItem)
  }
  
  localItems.value = newItems
  emit('item-reorder', localItems.value)
  emit('update:items', localItems.value)
  
  handleDragEnd()
}

// Close context menu on outside click
useEventListener('click', () => {
  contextMenu.value.visible = false
})

// Expose methods for external access
defineExpose({
  selectItem: (id: string | number) => {
    const item = findItemById(localItems.value, id)
    if (item) {
      handleItemSelect(item)
    }
  },
  deselectAll: handleDeselectAll,
  deleteSelected: handleDelete,
  duplicateSelected: handleDuplicate,
  groupSelected: handleGroup,
  ungroupSelected: handleUngroup
})
</script>

<style scoped>
.layer-panel {
  position: relative;
  background: #2d2d2d;
  color: #ffffff;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  user-select: none;
  height: 100%;
  overflow: hidden;
}

.layer-list {
  height: 100%;
  overflow-y: auto;
  padding: 4px 0;
}

.layer-item-default {
  display: flex;
  align-items: center;
  padding: 4px 8px;
}

.layer-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layer-controls {
  display: flex;
  gap: 2px;
}

.layer-control-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 12px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.layer-control-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

.layer-control-btn.active {
  color: #ffffff;
  opacity: 1;
}

.context-menu {
  position: fixed;
  background: #3e3e3e;
  border: 1px solid #555;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  min-width: 120px;
}

.context-menu-content {
  padding: 4px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  gap: 8px;
}

.context-menu-item:hover:not(.disabled):not(.separator) {
  background: #007acc;
}

.context-menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.context-menu-item.separator {
  height: 1px;
  background: #555;
  margin: 4px 0;
  padding: 0;
}

.context-menu-icon {
  width: 16px;
  text-align: center;
}

.drop-indicator {
  position: fixed;
  height: 2px;
  background: #007acc;
  pointer-events: none;
  z-index: 1000;
}

.drop-indicator.before,
.drop-indicator.after {
  height: 2px;
  background: #007acc;
}

.drop-indicator.inside {
  background: transparent !important;
}

.bottom-drop-zone {
  height: 40px;
  margin: 8px;
  border: 2px dashed #555;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  transition: all 0.2s ease;
}

.bottom-drop-zone.active {
  border-color: #007acc;
  background: rgba(0, 122, 204, 0.1);
  color: #007acc;
}

.drop-zone-indicator {
  font-size: 12px;
  pointer-events: none;
}
</style>
