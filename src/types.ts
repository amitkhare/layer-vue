export interface LayerItem {
  id: string | number
  title: string
  visible?: boolean
  locked?: boolean
  selected?: boolean
  collapsed?: boolean
  children?: LayerItem[]
  parent?: string | number | null
  data?: any
}

export interface DragState {
  isDragging: boolean
  draggedItem: LayerItem | null
  draggedItems: LayerItem[]
  dropTarget: LayerItem | null
  dropPosition: 'before' | 'after' | 'inside' | null
}

export interface LayerPanelProps {
  items: LayerItem[]
  allowNesting?: boolean
  allowMultiSelect?: boolean
  showContextMenu?: boolean
  maxNestingLevel?: number
  reverseOrder?: boolean
  reverseOrderGroups?: boolean
}

export interface LayerItemProps {
  item: LayerItem
  level?: number
  index?: number
  originalIndex?: number
  allowNesting?: boolean
  allowMultiSelect?: boolean
  showContextMenu?: boolean
  maxNestingLevel?: number
  selected?: boolean
  dragging?: boolean
  reverseOrderGroups?: boolean
}

export interface ContextMenuOption {
  label: string
  icon?: string
  action: string
  disabled?: boolean
  separator?: boolean
}

export interface LayerPanelEmits {
  'update:items': [items: LayerItem[]]
  'item-select': [item: LayerItem, items: LayerItem[]]
  'item-toggle-visibility': [item: LayerItem]
  'item-toggle-lock': [item: LayerItem]
  'item-reorder': [items: LayerItem[]]
  'item-group': [items: LayerItem[]]
  'item-ungroup': [item: LayerItem]
  'item-duplicate': [item: LayerItem]
  'item-delete': [items: LayerItem[]]
  'context-menu': [event: MouseEvent, item: LayerItem]
}
