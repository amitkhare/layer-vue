/**
 * Simple test to verify the reverseOrder functionality
 * This is a manual test file to validate the behavior
 */

import { computed, ref } from 'vue'
import type { LayerItem } from './src/types'

// Mock data similar to what would be used in the component
const mockItems = ref<LayerItem[]>([
  { id: 1, title: 'Background', visible: true },
  { id: 2, title: 'Content', visible: true },
  { id: 3, title: 'Overlay', visible: true }
])

const reverseOrder = ref(false)

// This mimics the computed property in LayerPanel.vue
const orderedItems = computed(() => {
  if (reverseOrder.value) {
    return [...mockItems.value].reverse()
  }
  return mockItems.value
})

// Test function
function testReverseOrder() {
  console.log('=== Testing reverseOrder functionality ===')
  
  // Test normal order
  reverseOrder.value = false
  console.log('Normal order (reverseOrder: false):')
  orderedItems.value.forEach((item, index) => {
    console.log(`  ${index}: ${item.title} (id: ${item.id})`)
  })
  
  console.log('')
  
  // Test reversed order
  reverseOrder.value = true
  console.log('Reversed order (reverseOrder: true):')
  orderedItems.value.forEach((item, index) => {
    console.log(`  ${index}: ${item.title} (id: ${item.id})`)
  })
  
  console.log('')
  console.log('Expected behavior:')
  console.log('- Normal: Background(1), Content(2), Overlay(3)')
  console.log('- Reversed: Overlay(3), Content(2), Background(1)')
  console.log('- Original array should remain unchanged')
  console.log('- Original array:', mockItems.value.map(item => item.title))
}

// Export for potential use
export { testReverseOrder, orderedItems, reverseOrder, mockItems }

// If running in Node.js environment, run the test
if (typeof window === 'undefined') {
  testReverseOrder()
}
