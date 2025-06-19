# Reverse Order Feature

## Overview
The LayerPanel component now supports a `reverseOrder` prop that allows you to reverse the display order of layers.

## Usage

```vue
<LayerPanel
  :items="layers"
  :reverse-order="true"
  @update:items="updateLayers"
/>
```

## Behavior

### Default Order (reverseOrder: false)
- Index 0 → Top of the list
- Index 1 → Second from top
- Index n → Bottom of the list

This mimics the traditional layer panel where:
- First item in array = Top layer
- Last item in array = Bottom layer

### Reversed Order (reverseOrder: true)
- Index 0 → Bottom of the list  
- Index 1 → Second from bottom
- Index n → Top of the list

## Example

Given layers array:
```typescript
const layers = [
  { id: 1, title: 'Background' },
  { id: 2, title: 'Content' },
  { id: 3, title: 'Overlay' }
]
```

### Normal order display:
1. Background (index 0)
2. Content (index 1)  
3. Overlay (index 2)

### Reversed order display:
1. Overlay (index 2)
2. Content (index 1)
3. Background (index 0)

## Implementation Details

- The `reverseOrder` prop is optional and defaults to `false`
- The reversal is handled by a computed property that creates a shallow copy and reverses it
- The original `localItems` array is never modified, ensuring data integrity
- All layer operations (selection, visibility, locking, etc.) continue to work normally
