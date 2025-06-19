# Layer Vue

A Vue 3 library for creating draggable/sortable list items with hierarchical structure support. 
Perfect for building complex UI with nested hierarchies, drag & drop functionality, and rich interactions.

## Features

- 🎯 **Drag & Drop Reordering**: Intuitive drag and drop to reorder items
- 🗂️ **Layer Groups/Nesting**: Create hierarchical structures with unlimited nesting
- 🔄 **Reverse Order Display**: Display items in reverse order (bottom-to-top)
- 🔄 **Reverse Order Groups**: Optionally reverse order within groups independently
- 🖱️ **Context Menus**: Right-click context menus with customizable actions
- 🔘 **Multi-Select**: Select multiple items with Ctrl/Cmd + click or Shift + click
- 🎨 **Template Slots**: Fully customizable item appearance using Vue slots
- 📍 **Item Positioning**: Access to both current and original item indices
- 🎛️ **Custom Expand/Collapse**: Customizable expand/collapse controls
- 👁️ **Visibility Toggle**: Show/hide items with visual indicators
- 🔒 **Lock/Unlock**: Prevent modifications to specific items
- ⚡ **Vue 3 + TypeScript**: Built with modern Vue 3 Composition API and full TypeScript support

## Installation

```bash
npm install @amitkhare/layer-vue
```

## Basic Usage

```vue
<template>
  <LayerPanel
    v-model:items="layers"
    :allow-nesting="true"
    :allow-multi-select="true"
    :show-context-menu="true"
    @item-select="handleItemSelect"
    @item-reorder="handleReorder"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LayerPanel, type LayerItemType } from '@amitkhare/layer-vue'

const layers = ref<LayerItemType[]>([
  {
    id: 'layer1',
    title: 'Background',
    visible: true,
    locked: false,
    selected: false
  },
  {
    id: 'group1',
    title: 'UI Group',
    visible: true,
    locked: false,
    selected: false,
    collapsed: false,
    children: [
      {
        id: 'layer2',
        title: 'Header',
        visible: true,
        locked: false,
        selected: false,
        parent: 'group1'
      }
    ]
  }
])

function handleItemSelect(item: LayerItemType, selectedItems: LayerItemType[]) {
  console.log('Selected:', item.title, 'Total selected:', selectedItems.length)
}

function handleReorder(reorderedItems: LayerItemType[]) {
  console.log('Items reordered:', reorderedItems)
}
</script>
```

## Reverse Order Display

The `reverseOrder` prop allows you to control the display order of layers, and `reverseOrderGroups` controls whether children within groups are also reversed:

```vue
<template>
  <!-- Traditional order: first item at top -->
  <LayerPanel
    v-model:items="layers"
    :reverse-order="false"
    :reverse-order-groups="false"
  />
  
  <!-- Design software order: first item at bottom -->
  <LayerPanel
    v-model:items="layers"
    :reverse-order="true"
    :reverse-order-groups="false"
  />
  
  <!-- Both top-level and groups reversed -->
  <LayerPanel
    v-model:items="layers"
    :reverse-order="true"
    :reverse-order-groups="true"
  />
  
  <!-- Dynamic controls -->
  <div>
    <label>
      <input type="checkbox" v-model="reverseOrder" />
      Reverse Order (Top Level)
    </label>
    <label>
      <input type="checkbox" v-model="reverseOrderGroups" />
      Reverse Order Groups (Children)
    </label>
    <LayerPanel
      v-model:items="layers"
      :reverse-order="reverseOrder"
      :reverse-order-groups="reverseOrderGroups"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const reverseOrder = ref(false)
const reverseOrderGroups = ref(false)

// Given this layer data:
const layers = ref([
  { id: 1, title: 'Background' },   // Index 0, Original Index 0
  { id: 2, title: 'Content' },     // Index 1, Original Index 1  
  { id: 3, title: 'Overlay' }      // Index 2, Original Index 2
])

// reverseOrder: false displays: Background, Content, Overlay
// reverseOrder: true displays:  Overlay, Content, Background
// Original indices remain constant regardless of display order
</script>
```

## Custom Item Template

```vue
<template>
  <LayerPanel v-model:items="layers">
    <!-- Custom content with index information -->
    <template #item-content="{ item, level, index, originalIndex }">
      <div class="custom-layer" :style="{ paddingLeft: (level * 20) + 'px' }">
        <div class="layer-icon">
          <i :class="getIconClass(item)"></i>
        </div>
        <span class="layer-name">{{ item.title }}</span>
        <div class="layer-info">
          <span class="index-info">{{ index }} ({{ originalIndex }})</span>
          <span v-if="item.data?.opacity" class="opacity">
            {{ item.data.opacity }}%
          </span>
        </div>
      </div>
    </template>
    
    <!-- Custom expand/collapse controls -->
    <template #item-expand="{ hasChildren, collapsed, toggleCollapse }">
      <div v-if="hasChildren">
        <button @click.stop="toggleCollapse" class="custom-expand">
          {{ collapsed ? '📁' : '📂' }}
        </button>
      </div>
      <div v-else class="expand-spacer"></div>
    </template>
    
    <!-- Custom controls -->
    <template #item-controls="{ item }">
      <div class="custom-controls">
        <button @click="duplicateItem(item)">📋</button>
        <button @click="deleteItem(item)">🗑️</button>
      </div>
    </template>
  </LayerPanel>
</template>
```

## Props

### LayerPanel Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `LayerItem[]` | `[]` | Array of layer items |
| `allowNesting` | `boolean` | `true` | Enable drag & drop nesting |
| `allowMultiSelect` | `boolean` | `true` | Enable multi-selection |
| `showContextMenu` | `boolean` | `true` | Show right-click context menu |
| `maxNestingLevel` | `number` | `10` | Maximum nesting depth |
| `reverseOrder` | `boolean` | `false` | Reverse the display order of top-level items |
| `reverseOrderGroups` | `boolean` | `false` | Reverse the display order within groups/children |

### LayerItem Interface

```typescript
interface LayerItem {
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
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:items` | `LayerItem[]` | Emitted when items array changes |
| `item-select` | `(item: LayerItem, selectedItems: LayerItem[])` | Item selection changed |
| `item-toggle-visibility` | `LayerItem` | Item visibility toggled |
| `item-toggle-lock` | `LayerItem` | Item lock state toggled |
| `item-reorder` | `LayerItem[]` | Items reordered via drag & drop |
| `item-group` | `LayerItem[]` | Items grouped together |
| `item-ungroup` | `LayerItem` | Group ungrouped |
| `item-duplicate` | `LayerItem` | Item duplicated |
| `item-delete` | `LayerItem[]` | Items deleted |
| `context-menu` | `(event: MouseEvent, item: LayerItem)` | Context menu opened |

## Slots

### `item-content`

Customize the main content area of each item.

**Slot Props:**
- `item: LayerItem` - The layer item data
- `level: number` - Nesting level (0-based)
- `index: number` - Current display index (affected by reverse order)
- `originalIndex: number` - Original index in the array (unaffected by reverse order)

### `item-expand`

Customize the expand/collapse button for items with children.

**Slot Props:**
- `item: LayerItem` - The layer item data
- `level: number` - Nesting level (0-based) 
- `hasChildren: boolean` - Whether the item has children
- `collapsed: boolean` - Whether the item is collapsed
- `toggleCollapse: () => void` - Function to toggle collapse state

### `item-controls`

Customize the controls area (right side) of each item.

**Slot Props:**
- `item: LayerItem` - The layer item data

### `context-menu`

Customize the context menu content.

**Slot Props:**
- `item: LayerItem` - The clicked item
- `selectedItems: LayerItem[]` - All selected items

## Keyboard Shortcuts

- **Ctrl/Cmd + Click**: Multi-select items
- **Shift + Click**: Range select (simplified)
- **Right Click**: Open context menu
- **Drag**: Reorder items
- **Drag to Group**: Nest items inside groups

## Styling

The component uses scoped styles and CSS custom properties for theming. You can override the default styles by targeting the component classes:

```css
.layer-panel {
  --layer-bg: #2d2d2d;
  --layer-text: #ffffff;
  --layer-selected: #007acc;
  --layer-hover: rgba(255, 255, 255, 0.05);
}

.layer-item.selected {
  background: var(--layer-selected);
}

.layer-item:hover {
  background: var(--layer-hover);
}
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build library
npm run build-lib

# Build demo
npm run build
```

## Publishing

To publish to NPM:

```bash
# 1. Build the library
npm run build-lib

# 2. Login to NPM (if not already logged in)
npm login

# 3. Publish to NPM
npm publish
```

The `prepublishOnly` script will automatically build the library before publishing.

### Demo Structure

The project includes comprehensive demos showcasing all features:

**Available Demos:**

**Demo Files:**
- `src/demo/Demo.vue` - Feature-rich demo component
- `src/demo/SimpleDemo.vue` - Minimal demo component  
- `src/demo/demo.ts` - Entry point for full demo
- `src/demo/simple-demo.ts` - Entry point for simple demo

**Running Demos:**
- Demo: `http://localhost:5173/` (default)

All demo files are organized in the `src/demo/` directory for better project structure.

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
