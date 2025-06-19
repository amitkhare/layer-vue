import { LayerItem } from './types'

export function findItemById(items: LayerItem[], id: string | number): LayerItem | null {
  for (const item of items) {
    if (item.id === id) {
      return item
    }
    if (item.children && item.children.length > 0) {
      const found = findItemById(item.children, id)
      if (found) return found
    }
  }
  return null
}

export function findParentItem(items: LayerItem[], childId: string | number): LayerItem | null {
  for (const item of items) {
    if (item.children && item.children.some(child => child.id === childId)) {
      return item
    }
    if (item.children && item.children.length > 0) {
      const found = findParentItem(item.children, childId)
      if (found) return found
    }
  }
  return null
}

export function removeItemFromTree(items: LayerItem[], id: string | number): LayerItem[] {
  return items.filter(item => {
    if (item.id === id) {
      return false
    }
    if (item.children) {
      item.children = removeItemFromTree(item.children, id)
    }
    return true
  })
}

export function addItemToTree(items: LayerItem[], newItem: LayerItem, targetId?: string | number, position: 'before' | 'after' | 'inside' = 'after'): LayerItem[] {
  if (!targetId) {
    return [...items, newItem]
  }

  const result = [...items]
  
  function insertItem(arr: LayerItem[], target: string | number): boolean {
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i]
      
      if (item.id === target) {
        if (position === 'before') {
          arr.splice(i, 0, newItem)
        } else if (position === 'after') {
          arr.splice(i + 1, 0, newItem)
        } else if (position === 'inside') {
          if (!item.children) {
            item.children = []
          }
          item.children.push(newItem)
          newItem.parent = item.id
        }
        return true
      }
      
      if (item.children && item.children.length > 0) {
        if (insertItem(item.children, target)) {
          return true
        }
      }
    }
    return false
  }
  
  insertItem(result, targetId)
  return result
}

export function getAllSelectedItems(items: LayerItem[]): LayerItem[] {
  const selected: LayerItem[] = []
  
  function traverse(arr: LayerItem[]) {
    for (const item of arr) {
      if (item.selected) {
        selected.push(item)
      }
      if (item.children && item.children.length > 0) {
        traverse(item.children)
      }
    }
  }
  
  traverse(items)
  return selected
}

export function updateItemInTree(items: LayerItem[], id: string | number, updates: Partial<LayerItem>): LayerItem[] {
  return items.map(item => {
    if (item.id === id) {
      return { ...item, ...updates }
    }
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: updateItemInTree(item.children, id, updates)
      }
    }
    return item
  })
}

export function clearSelection(items: LayerItem[]): LayerItem[] {
  return items.map(item => ({
    ...item,
    selected: false,
    children: item.children ? clearSelection(item.children) : undefined
  }))
}

export function getItemLevel(items: LayerItem[], id: string | number, level = 0): number {
  for (const item of items) {
    if (item.id === id) {
      return level
    }
    if (item.children && item.children.length > 0) {
      const childLevel = getItemLevel(item.children, id, level + 1)
      if (childLevel > -1) return childLevel
    }
  }
  return -1
}

export function canDropInside(draggedItem: LayerItem, targetItem: LayerItem, maxLevel: number): boolean {
  const currentLevel = getItemLevel([draggedItem], draggedItem.id)
  return currentLevel < maxLevel && !isDescendant(draggedItem, targetItem)
}

export function isDescendant(ancestor: LayerItem, descendant: LayerItem): boolean {
  if (!ancestor.children) return false
  
  for (const child of ancestor.children) {
    if (child.id === descendant.id) {
      return true
    }
    if (isDescendant(child, descendant)) {
      return true
    }
  }
  return false
}
