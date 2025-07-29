<template>
  <button 
    :class="buttonClass"
    :title="tooltip"
    @click="$emit('click')"
    :disabled="disabled"
  >
    <component 
      :is="iconComponent" 
      :size="iconSize" 
      :class="iconClass"
    />
    <span v-if="showText" class="button-text">{{ text }}</span>
  </button>
</template>

<script>
import {
  Bold, Italic, Underline, Strikethrough, Code, Code2,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Quote, List, CheckSquare, Table, Minus, Image, Download, Upload, Trash2,
  Eye, EyeOff, PaintBucket, Highlighter, FileText,
  Hash, Calculator, Plus, X, Divide, Square,
  Superscript, Subscript, RotateCcw, Sigma, 
  Pi, Infinity, Triangle, Circle, ArrowRight
} from 'lucide-vue-next'

const iconMap = {
  'bold': Bold,
  'italic': Italic,
  'underline': Underline,
  'strikethrough': Strikethrough,
  'code': Code,
  'code-block': Code2,
  'heading': Heading1,
  'heading-1': Heading1,
  'heading-2': Heading2,
  'heading-3': Heading3,
  'heading-4': Heading4,
  'heading-5': Heading5,
  'heading-6': Heading6,
  'quote': Quote,
  'list': List,
  'check-list': CheckSquare,
  'table': Table,
  'hr': Minus,
  'image': Image,
  'download': Download,
  'upload': Upload,
  'trash': Trash2,
  'eye': Eye,
  'eye-off': EyeOff,
  'paint': PaintBucket,
  'highlight': Highlighter,
  'file': FileText,
  'hash': Hash,
  'function': Calculator,
  // Math symbols - improved icons to avoid duplicates
  'plus': Plus,
  'minus': Minus,
  'times': X,
  'divide': Divide,
  'fraction': Divide, // Better icon for fractions
  'power': Superscript,
  'subscript': Subscript,
  'sqrt': Square, // Use square as placeholder for root
  'vector': ArrowRight,
  'arc': Circle,
  'derivative': Quote, // Mathematical notation style
  'sum': Sigma,
  'product': Pi,
  'limit': Infinity,
  'integral': Triangle,
  'cases': Square, // Use square for brackets placeholder
  'newline': Minus // Use minus for line break
}

export default {
  name: 'IconButton',
  components: {
    Bold, Italic, Underline, Strikethrough, Code, Code2,
    Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
    Quote, List, CheckSquare, Table, Minus, Image, Download, Upload, Trash2,
    Eye, EyeOff, PaintBucket, Highlighter, FileText,
    Hash, Calculator, Plus, X, Divide, Square,
    Superscript, Subscript, RotateCcw, Sigma, 
    Pi, Infinity, Triangle, Circle, ArrowRight
  },
  props: {
    icon: {
      type: String,
      required: true
    },
    text: {
      type: String,
      default: ''
    },
    showText: {
      type: Boolean,
      default: false
    },
    tooltip: {
      type: String,
      default: ''
    },
    variant: {
      type: String,
      default: 'invisible', // 'invisible', 'primary', 'danger'
      validator: value => ['invisible', 'primary', 'danger'].includes(value)
    },
    size: {
      type: String,
      default: 'sm',
      validator: value => ['sm', 'md', 'lg'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    iconSize: {
      type: Number,
      default: 16
    }
  },
  emits: ['click'],
  computed: {
    iconComponent() {
      return iconMap[this.icon] || Code
    },
    buttonClass() {
      const baseClasses = ['btn', 'icon-button']
      baseClasses.push(`btn-${this.variant}`)
      baseClasses.push(`btn-${this.size}`)
      if (this.showText) {
        baseClasses.push('with-text')
      }
      return baseClasses.join(' ')
    },
    iconClass() {
      return {
        'icon-only': !this.showText,
        'with-text-icon': this.showText
      }
    }
  }
}
</script>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
  min-width: 32px;
  min-height: 32px;
}

.icon-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.icon-button:active {
  transform: translateY(0);
}

.icon-only {
  flex-shrink: 0;
}

.with-text-icon {
  margin-right: 4px;
}

.button-text {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.with-text {
  padding-left: 12px;
  padding-right: 12px;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .icon-button {
    min-width: 40px;
    min-height: 40px;
  }
  
  .icon-button:hover {
    transform: none;
    box-shadow: none;
  }
  
  .with-text .button-text {
    display: none;
  }
}

/* Touch-friendly spacing */
@media (max-width: 480px) {
  .icon-button {
    min-width: 44px;
    min-height: 44px;
    margin: 2px;
  }
}
</style>