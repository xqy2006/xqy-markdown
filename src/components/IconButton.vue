<template>
  <button 
    class="btn btn-invisible btn-sm icon-button"
    :class="{ active: isActive }"
    @click="$emit('click', $event)"
    :title="tooltip"
  >
    <component :is="iconComponent" :size="16" />
  </button>
</template>

<script>
import {
  Bold, Italic, Strikethrough, Underline, Code, Quote, List, CheckSquare,
  Heading1, Heading2, Heading3, Hash, Calculator, Image, Download, Upload, Trash2,
  Eye, EyeOff, PaintBucket, Highlighter, FileText, Minus, Table,
  Plus, X, Divide, Square, ChevronUp, ChevronDown, MoreHorizontal,
  RotateCcw, ArrowUp, Circle, Type, Zap
} from 'lucide-vue-next'

const iconMap = {
  // Basic formatting
  'bold': Bold,
  'italic': Italic,
  'strikethrough': Strikethrough,
  'underline': Underline,
  'code': Code,
  'quote': Quote,
  'list': List,
  'check': CheckSquare,
  'heading': Hash,
  'heading1': Heading1,
  'heading2': Heading2,
  'heading3': Heading3,
  'function': Calculator,
  'image': Image,
  'download': Download,
  'upload': Upload,
  'trash': Trash2,
  'eye': Eye,
  'eye-off': EyeOff,
  'paint': PaintBucket,
  'highlight': Highlighter,
  'file': FileText,
  'minus': Minus,
  'table': Table,
  
  // TEX Math symbols - using available icons
  'plus': Plus,
  'times': X,
  'divide': Divide,
  'fraction': Type,
  'power': ChevronUp,
  'subscript': ChevronDown,
  'sqrt': RotateCcw,
  'vector': ArrowUp,
  'arc': Circle,
  'derivative': Quote,
  'sum': Square, // fallback
  'product': Circle, // fallback
  'limit': MoreHorizontal, // fallback
  'integral': Type, // fallback
  'cases': MoreHorizontal
}

export default {
  name: 'IconButton',
  components: {
    Bold, Italic, Strikethrough, Underline, Code, Quote, List, CheckSquare,
    Heading1, Heading2, Heading3, Hash, Calculator, Image, Download, Upload, Trash2,
    Eye, EyeOff, PaintBucket, Highlighter, FileText, Minus, Table,
    Plus, X, Divide, Square, ChevronUp, ChevronDown, MoreHorizontal,
    RotateCcw, ArrowUp, Circle, Type, Zap
  },
  props: {
    icon: {
      type: String,
      required: true
    },
    tooltip: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    iconComponent() {
      return iconMap[this.icon] || Hash
    }
  },
  emits: ['click']
}
</script>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 32px;
  padding: 4px 8px;
  border-radius: 3px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.icon-button:hover {
  background-color: #f6f8fa;
  border-color: #d1d9e0;
}

.icon-button.active {
  background-color: #0969da;
  color: white;
  border-color: #0969da;
}

/* Mobile responsive design */
@media (max-width: 480px) {
  .icon-button {
    min-width: 44px !important;
    min-height: 44px !important;
    padding: 8px !important;
  }
}
</style>