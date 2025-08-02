<template>
  <div class="wysiwyg-editor">
    <!-- WYSIWYG Toolbar - Complete replication of split mode -->
    <div class="wysiwyg-toolbar vditor-toolbar">
      <!-- First row - exact match with split mode -->
      <div class="toolbar-row">
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="cycleHeading()" 
                  aria-label="标题">
            <Heading :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertCodeBlock()" 
                  aria-label="代码块">
            <Code :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertInlineCode()" 
                  aria-label="单行代码">
            <Code2 :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertImage()" 
                  aria-label="图片">
            <Image :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertQuote()" 
                  aria-label="引用">
            <Quote :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertList('ul')" 
                  aria-label="无序列表">
            <List :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTaskList()" 
                  aria-label="任务列表">
            <CheckSquare :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTOC()" 
                  aria-label="目录">
            <BookOpen :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertHorizontalRule()" 
                  aria-label="分割线">
            <Minus :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexFormula()" 
                  aria-label="Tex公式">
            <Sigma :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="toggleTexToolbox()" 
                  :aria-label="showTexToolbox ? '隐藏Tex工具箱' : '显示Tex工具箱'">
            <Eye v-if="!showTexToolbox" :size="16" />
            <EyeOff v-else :size="16" />
          </button>
        </div>
      </div>

      <!-- Second row - formatting buttons -->
      <div class="toolbar-row">
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="formatText('bold')" 
                  aria-label="粗体 (Ctrl+B)">
            <Bold :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="formatText('italic')" 
                  aria-label="斜体 (Ctrl+I)">
            <Italic :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="formatText('underline')" 
                  aria-label="下划线 (Ctrl+U)">
            <Underline :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="formatColor('red')" 
                  aria-label="标红">
            <Type :size="16" style="color: #d73a49;" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="formatHighlight()" 
                  aria-label="高亮">
            <Highlighter :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="formatText('strikethrough')" 
                  aria-label="删除线 (Ctrl+D)">
            <Strikethrough :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertLink()" 
                  aria-label="链接 (Ctrl+K)">
            <Link :size="16" />
          </button>
        </div>
      </div>

      <!-- Third row - Tex toolbox (when enabled) -->
      <div v-if="showTexToolbox" class="toolbar-row tex-toolbar">
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('+')" 
                  aria-label="加号">
            <Plus :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('-')" 
                  aria-label="减号">
            <Minus :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('\\cdot')" 
                  aria-label="点乘">
            <CircleDot :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('\\times')" 
                  aria-label="叉乘">
            <X :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('\\div')" 
                  aria-label="除法">
            <Divide :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('\\\\')" 
                  aria-label="换行">
            <RotateCcw :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('\\frac{', '}{}')" 
                  aria-label="分数">
            <span style="font-size: 12px; font-weight: bold;">a/b</span>
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('^{', '}')" 
                  aria-label="上标">
            <ArrowUp :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('_{', '}')" 
                  aria-label="下标">
            <ArrowDown :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('\\sqrt[]{', '}')" 
                  aria-label="根号">
            <SquareRadical :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('\\overrightarrow{', '}')" 
                  aria-label="向量">
            <ArrowRight :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('\\overset{\\frown}{', '}')" 
                  aria-label="弧">
            <span style="font-size: 12px;">⌒</span>
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('\'')" 
                  aria-label="导数">
            <span style="font-size: 12px;">f'</span>
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('\\sum_{', '}^{} {}')" 
                  aria-label="求和">
            <Sigma :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('\\prod_{', '}^{} {}')" 
                  aria-label="求积">
            <span style="font-size: 12px;">∏</span>
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('\\lim_{n \\to \\infty}{', '}')" 
                  aria-label="极限">
            <span style="font-size: 10px;">lim</span>
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('\\int_{}^{} {', '}\\, dx')" 
                  aria-label="积分">
            <FunctionSquare :size="16" />
          </button>
        </div>
        <div class="vditor-toolbar__item">
          <button class="vditor-tooltipped vditor-tooltipped--n" 
                  @mousedown="handleToolbarMouseDown"
                  @click="insertTexSymbol('\\begin{cases}line1', '\\\\line2\\end{cases}')" 
                  aria-label="大括号">
            <Braces :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- WYSIWYG Content Area with vditor-style markdown indicator visibility -->
    <div 
      ref="editorContent"
      class="vditor-wysiwyg"
      contenteditable="true"
      spellcheck="false"
      @input="handleInput"
      @paste="handlePaste"
      @keydown="handleKeydown"
      @keyup="handleKeyup"
      @focus="handleFocus"
      @blur="handleBlur"
      @click="handleClick"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
      v-html="htmlContent"
    >
    </div>
  </div>
</template>

<script>
import { 
  Bold, Italic, Underline, Strikethrough, Heading, 
  List, ListOrdered, Link, Image, Code, Code2, Quote, 
  CheckSquare, BookOpen, Minus, Sigma, Eye, EyeOff,
  Type, Highlighter, Plus, Divide, X, SquareRadical, 
  ArrowRight, ArrowUp, ArrowDown, FunctionSquare, Braces,
  CircleDot, RotateCcw
} from 'lucide-vue-next'

export default {
  name: 'WysiwygEditor',
  components: {
    Bold, Italic, Underline, Strikethrough, Heading,
    List, ListOrdered, Link, Image, Code, Code2, Quote,
    CheckSquare, BookOpen, Minus, Sigma, Eye, EyeOff,
    Type, Highlighter, Plus, Divide, X, SquareRadical,
    ArrowRight, ArrowUp, ArrowDown, FunctionSquare, Braces,
    CircleDot, RotateCcw
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      htmlContent: '',
      isConverting: false,
      debounceTimer: null,
      composingLock: false,
      preventInput: false,
      savedSelection: null, // Store selection when focus is lost
      showTexToolbox: false, // Toggle for Tex toolbox
      markdownIndicatorsVisible: false, // Track if markdown indicators are shown
      currentCursorPosition: null, // Track cursor for indicator visibility
      headingLevel: 1 // Current heading level for cycling
    }
  },
  watch: {
    modelValue: {
      handler(newValue, oldValue) {
        if (!this.isConverting) {
          // Check if content was cleared (empty value from parent)
          if (!newValue && oldValue && this.htmlContent) {
            // Clear the editor content when parent clears
            this.htmlContent = '<p><br></p>'
            this.$refs.editorContent.innerHTML = '<p><br></p>'
            
            // Position cursor at start
            setTimeout(() => {
              const range = document.createRange()
              const selection = window.getSelection()
              range.setStart(this.$refs.editorContent.firstChild, 0)
              range.collapse(true)
              selection.removeAllRanges()
              selection.addRange(range)
            }, 10)
          } else {
            // Normal content update
            this.htmlContent = this.markdownToHtml(newValue)
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    // Toggle Tex toolbox visibility
    toggleTexToolbox() {
      this.showTexToolbox = !this.showTexToolbox
      this.restoreSavedSelection()
    },

    // Cycle through heading levels (like split mode) - including normal text
    cycleHeading() {
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      let blockElement = this.getClosestBlockElement(range.startContainer)
      
      if (!blockElement) {
        // Create a new heading if no block element
        this.formatHeading(1)
        return
      }
      
      // Check current heading level or paragraph
      const currentTag = blockElement.tagName.toLowerCase()
      
      if (currentTag.match(/^h[1-6]$/)) {
        const currentLevel = parseInt(currentTag.charAt(1))
        if (currentLevel < 6) {
          // H1-H5 -> next heading level
          this.formatHeading(currentLevel + 1)
        } else {
          // H6 -> normal paragraph
          this.convertToNormal(blockElement, range)
        }
      } else {
        // Currently normal text (P, DIV, etc) -> convert to H1
        this.formatHeading(1)
      }
    },

    // Convert block element to normal paragraph
    convertToNormal(blockElement, range) {
      const paragraph = document.createElement('p')
      paragraph.setAttribute('data-block', '0')
      
      // Preserve content or ensure it has content
      const content = blockElement.textContent.trim()
      if (content) {
        paragraph.textContent = content
      } else {
        paragraph.innerHTML = '<br>'
      }
      
      // Replace the block element
      if (blockElement.parentNode) {
        blockElement.parentNode.replaceChild(paragraph, blockElement)
        
        // Position cursor appropriately
        const newRange = document.createRange()
        if (content) {
          newRange.selectNodeContents(paragraph)
          newRange.collapse(false)
        } else {
          newRange.setStart(paragraph, 0)
          newRange.collapse(true)
        }
        
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
      
      this.debouncedConvertToMarkdown()
    },

    // Insert blockquote
    insertQuote() {
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      let blockElement = this.getClosestBlockElement(range.startContainer)
      
      if (blockElement && blockElement !== this.$refs.editorContent) {
        // Save cursor position
        range.insertNode(document.createElement('wbr'))
        
        // Check if already a blockquote
        if (blockElement.tagName.toLowerCase() === 'blockquote') {
          // Convert blockquote back to paragraph
          const p = document.createElement('p')
          p.innerHTML = blockElement.innerHTML
          blockElement.parentNode.replaceChild(p, blockElement)
        } else {
          // Convert to blockquote
          const blockquote = document.createElement('blockquote')
          blockquote.innerHTML = blockElement.innerHTML || '引用内容<wbr>'
          blockElement.parentNode.replaceChild(blockquote, blockElement)
        }
        
        // Restore cursor position
        this.restoreCursorPosition()
        this.debouncedConvertToMarkdown()
      }
    },

    // Insert task list
    insertTaskList() {
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      let blockElement = this.getClosestBlockElement(range.startContainer)
      
      // Create task list structure
      const list = document.createElement('ul')
      list.className = 'task-list'
      const listItem = document.createElement('li')
      listItem.className = 'task-list-item'
      
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.className = 'task-list-item-checkbox'
      
      const textSpan = document.createElement('span')
      textSpan.textContent = '任务项目'
      
      listItem.appendChild(checkbox)
      listItem.appendChild(textSpan)
      list.appendChild(listItem)
      
      if (blockElement && blockElement !== this.$refs.editorContent) {
        blockElement.parentNode.replaceChild(list, blockElement)
      } else {
        range.insertNode(list)
      }
      
      // Position cursor after checkbox
      const newRange = document.createRange()
      newRange.setStart(textSpan, 0)
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      this.debouncedConvertToMarkdown()
    },

    // Insert Table of Contents
    insertTOC() {
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      
      // Create TOC placeholder
      const tocDiv = document.createElement('div')
      tocDiv.className = 'toc-placeholder'
      tocDiv.textContent = '[TOC]'
      tocDiv.style.cssText = 'background: #f6f8fa; padding: 8px; border-radius: 4px; margin: 16px 0; font-family: monospace;'
      
      let blockElement = this.getClosestBlockElement(range.startContainer)
      if (blockElement && blockElement !== this.$refs.editorContent) {
        blockElement.parentNode.insertBefore(tocDiv, blockElement.nextSibling)
      } else {
        range.insertNode(tocDiv)
      }
      
      // Position cursor after TOC
      const newRange = document.createRange()
      newRange.setStartAfter(tocDiv)
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      this.debouncedConvertToMarkdown()
    },

    // Insert horizontal rule
    insertHorizontalRule() {
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      
      // Create horizontal rule
      const hr = document.createElement('hr')
      
      let blockElement = this.getClosestBlockElement(range.startContainer)
      if (blockElement && blockElement !== this.$refs.editorContent) {
        blockElement.parentNode.insertBefore(hr, blockElement.nextSibling)
      } else {
        range.insertNode(hr)
      }
      
      // Create new paragraph after HR
      const newP = document.createElement('p')
      newP.innerHTML = '<br>'
      hr.parentNode.insertBefore(newP, hr.nextSibling)
      
      // Position cursor in new paragraph
      const newRange = document.createRange()
      newRange.setStart(newP, 0)
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      this.debouncedConvertToMarkdown()
    },

    // Insert Tex formula
    insertTexFormula() {
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      const selectedText = selection.toString()
      
      const formula = selectedText || prompt('请输入Tex公式:', 'E = mc^2') || 'E = mc^2'
      
      // Create inline tex span
      const texSpan = document.createElement('span')
      texSpan.className = 'tex-formula'
      texSpan.textContent = `$ ${formula} $`
      texSpan.style.cssText = 'background: #f6f8fa; padding: 2px 4px; border-radius: 3px; font-family: monospace;'
      
      if (selectedText) {
        range.deleteContents()
      }
      
      range.insertNode(texSpan)
      
      // Position cursor after formula
      const newRange = document.createRange()
      newRange.setStartAfter(texSpan)
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      this.debouncedConvertToMarkdown()
    },

    // Insert Tex symbol
    insertTexSymbol(startSymbol, endSymbol = '') {
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      const selectedText = selection.toString()
      
      const texSpan = document.createElement('span')
      texSpan.className = 'tex-symbol'
      texSpan.style.cssText = 'background: #f6f8fa; padding: 2px 4px; border-radius: 3px; font-family: monospace;'
      
      if (selectedText) {
        texSpan.textContent = `${startSymbol}${selectedText}${endSymbol}`
        range.deleteContents()
      } else {
        texSpan.textContent = `${startSymbol}${endSymbol}`
      }
      
      range.insertNode(texSpan)
      
      // Position cursor appropriately
      const newRange = document.createRange()
      if (!selectedText && endSymbol) {
        // Position cursor between start and end symbols
        const textNode = texSpan.firstChild
        const cursorPos = startSymbol.length
        newRange.setStart(textNode, cursorPos)
        newRange.collapse(true)
      } else {
        newRange.setStartAfter(texSpan)
        newRange.collapse(true)
      }
      
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      this.debouncedConvertToMarkdown()
    },

    // Format text color
    formatColor(color) {
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      const selectedText = selection.toString()
      
      const fontElement = document.createElement('font')
      fontElement.setAttribute('color', color)
      
      if (selectedText) {
        fontElement.textContent = selectedText
        range.deleteContents()
        range.insertNode(fontElement)
        
        // Select the new element
        const newRange = document.createRange()
        newRange.selectNodeContents(fontElement)
        selection.removeAllRanges()
        selection.addRange(newRange)
      } else {
        fontElement.textContent = '\u200b' // Zero-width space
        range.insertNode(fontElement)
        
        // Position cursor inside the element
        const newRange = document.createRange()
        newRange.setStart(fontElement.firstChild, 1)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
      
      this.debouncedConvertToMarkdown()
    },

    // Format text with highlight
    formatHighlight() {
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      const selectedText = selection.toString()
      
      const markElement = document.createElement('mark')
      
      if (selectedText) {
        markElement.textContent = selectedText
        range.deleteContents()
        range.insertNode(markElement)
        
        // Select the new element
        const newRange = document.createRange()
        newRange.selectNodeContents(markElement)
        selection.removeAllRanges()
        selection.addRange(newRange)
      } else {
        markElement.textContent = '\u200b' // Zero-width space
        range.insertNode(markElement)
        
        // Position cursor inside the element
        const newRange = document.createRange()
        newRange.setStart(markElement.firstChild, 1)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
      
      this.debouncedConvertToMarkdown()
    },

    // Handle click events for markdown indicator visibility
    handleClick(event) {
      setTimeout(() => {
        this.updateMarkdownIndicatorVisibility()
      }, 10)
    },

    // Update markdown indicator visibility based on cursor position (vditor-style)
    updateMarkdownIndicatorVisibility() {
      const selection = window.getSelection()
      if (!selection.rangeCount) return
      
      const range = selection.getRangeAt(0)
      if (!range.collapsed) return // Only for cursor position, not selection
      
      const container = range.startContainer
      
      // Check if cursor is inside formatted elements
      const formattedElement = this.getClosestFormattedElement(container)
      
      if (formattedElement) {
        this.showMarkdownIndicators(formattedElement)
      } else {
        this.hideMarkdownIndicators()
      }
    },

    // Get closest formatted element (bold, italic, etc.)
    getClosestFormattedElement(node) {
      let current = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
      
      while (current && current !== this.$refs.editorContent) {
        const tagName = current.tagName.toLowerCase()
        if (['strong', 'b', 'em', 'i', 'u', 's', 'code', 'mark', 'font'].includes(tagName)) {
          return current
        }
        current = current.parentElement
      }
      
      return null
    },

    // Show markdown indicators for a formatted element (vditor-style)
    showMarkdownIndicators(element) {
      if (element.dataset.indicatorsShown) return
      
      const tagName = element.tagName.toLowerCase()
      let startIndicator = ''
      let endIndicator = ''
      
      switch (tagName) {
        case 'strong':
        case 'b':
          startIndicator = '**'
          endIndicator = '**'
          break
        case 'em':
        case 'i':
          startIndicator = '*'
          endIndicator = '*'
          break
        case 's':
          startIndicator = '~~'
          endIndicator = '~~'
          break
        case 'code':
          startIndicator = '`'
          endIndicator = '`'
          break
        case 'u':
          startIndicator = '<u>'
          endIndicator = '</u>'
          break
        case 'mark':
          startIndicator = '<mark>'
          endIndicator = '</mark>'
          break
        case 'font':
          const color = element.getAttribute('color') || 'red'
          startIndicator = `<font color="${color}">`
          endIndicator = '</font>'
          break
      }
      
      if (startIndicator && endIndicator) {
        // Create indicator spans
        const startSpan = document.createElement('span')
        startSpan.className = 'markdown-indicator markdown-indicator-start'
        startSpan.textContent = startIndicator
        startSpan.style.cssText = 'color: #999; font-size: 0.9em; user-select: none; opacity: 0.6;'
        
        const endSpan = document.createElement('span')
        endSpan.className = 'markdown-indicator markdown-indicator-end'  
        endSpan.textContent = endIndicator
        endSpan.style.cssText = 'color: #999; font-size: 0.9em; user-select: none; opacity: 0.6;'
        
        // Insert indicators
        element.insertBefore(startSpan, element.firstChild)
        element.appendChild(endSpan)
        
        element.dataset.indicatorsShown = 'true'
      }
    },

    // Hide markdown indicators
    hideMarkdownIndicators() {
      const indicators = this.$refs.editorContent.querySelectorAll('.markdown-indicator')
      indicators.forEach(indicator => {
        indicator.remove()
        // Remove the flag from parent element
        if (indicator.parentElement) {
          delete indicator.parentElement.dataset.indicatorsShown
        }
      })
    },

    // Show markdown indicators at cursor position after input
    showMarkdownIndicatorsAtCursor() {
      const selection = window.getSelection()
      if (!selection.rangeCount) return
      
      const range = selection.getRangeAt(0)
      if (!range.collapsed) return // Only show for cursor position, not selection
      
      // Find the formatted element at cursor position
      let element = range.startContainer
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement
      }
      
      // Check if cursor is inside a formatted element
      const formattedElement = this.getClosestFormattedElement(element)
      if (formattedElement) {
        this.showMarkdownIndicators(formattedElement)
      }
    },

    // Convert Markdown to HTML using parent's markdown renderer
    markdownToHtml(markdown) {
      if (!markdown) return '<p><br></p>'
      
      // Use the parent component's markdown renderer for consistency
      if (this.$parent && this.$parent.get_md) {
        const html = this.$parent.get_md(markdown)
        return this.cleanHtmlForWysiwyg(html)
      }
      
      // Fallback: basic conversion
      return this.basicMarkdownToHtml(markdown)
    },

    // Clean HTML for WYSIWYG editing (vditor-inspired)
    cleanHtmlForWysiwyg(html) {
      if (!html) return '<p><br></p>'
      
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      
      // Process elements to make them suitable for contenteditable
      this.processElementsForWysiwyg(tempDiv)
      
      // Ensure there's always content with proper block structure
      if (!tempDiv.innerHTML.trim() || tempDiv.innerHTML === '<br>') {
        return '<p><br></p>'
      }
      
      // Wrap orphaned text nodes in paragraphs
      let result = tempDiv.innerHTML
      
      // If content doesn't start with a block element, wrap it
      if (!tempDiv.firstElementChild || !this.isBlockElement(tempDiv.firstElementChild)) {
        result = `<p>${result}</p>`
      }
      
      return result
    },

    // Check if element is a block element
    isBlockElement(element) {
      if (!element || !element.tagName) return false
      const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'HR', 'TABLE']
      return blockTags.includes(element.tagName)
    },

    // Process elements recursively for WYSIWYG editing
    processElementsForWysiwyg(container) {
      const elements = Array.from(container.children)
      
      for (const element of elements) {
        const tagName = element.tagName.toLowerCase()
        
        switch (tagName) {
          case 'p':
            // Ensure paragraphs have content or a br
            if (!element.textContent.trim() && !element.querySelector('br, img')) {
              element.innerHTML = '<br>'
            }
            break
            
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            // Ensure headings have some content
            if (!element.textContent.trim()) {
              element.textContent = `标题 ${tagName.charAt(1)}`
            }
            break
            
          case 'pre':
            // Handle code blocks
            const code = element.querySelector('code')
            if (code) {
              // Preserve code formatting
              code.style.whiteSpace = 'pre-wrap'
            }
            break
            
          case 'ul':
          case 'ol':
            // Ensure lists have list items
            if (!element.querySelector('li')) {
              const li = document.createElement('li')
              li.innerHTML = '<br>'
              element.appendChild(li)
            }
            break
            
          case 'li':
            // Ensure list items have content
            if (!element.textContent.trim() && !element.querySelector('br, img')) {
              element.innerHTML = '<br>'
            }
            break
            
          case 'blockquote':
            // Ensure blockquotes have content
            if (!element.textContent.trim()) {
              element.innerHTML = '<p><br></p>'
            }
            break
        }
        
        // Recursively process children
        if (element.children.length > 0) {
          this.processElementsForWysiwyg(element)
        }
      }
    },

    // Basic Markdown to HTML conversion (fallback)
    basicMarkdownToHtml(markdown) {
      return markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/!\[([^\]]*)\]\(([^\)]+)\)/gim, '<img alt="$1" src="$2" style="max-width: 100%; height: auto;">')
        .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>')
        .replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/gim, '<code>$1</code>')
        .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
        .replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>')
        .replace(/\n/gim, '<br>')
    },

    // Convert HTML back to Markdown (vditor-inspired approach)
    convertToMarkdown() {
      const content = this.$refs.editorContent
      if (!content) return ''
      
      // Clean up the content before conversion
      this.cleanupWbrElements()
      
      let markdown = ''
      const children = Array.from(content.children)
      
      for (const child of children) {
        if (child.tagName === 'WBR') continue
        
        const blockMarkdown = this.elementToMarkdown(child)
        if (blockMarkdown) {
          markdown += blockMarkdown + '\n\n'
        }
      }
      
      // Handle case where content has no block elements (direct text content)
      if (children.length === 0 && content.textContent.trim()) {
        markdown = content.textContent.trim()
      }
      
      return markdown.trim()
    },

    // Convert individual element to Markdown (enhanced)
    elementToMarkdown(element) {
      if (!element || element.tagName === 'WBR') return ''
      
      const tagName = element.tagName.toLowerCase()
      
      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          const level = parseInt(tagName.charAt(1))
          return '#'.repeat(level) + ' ' + this.processInlineMarkdown(element)
          
        case 'p':
          const content = this.processInlineMarkdown(element)
          return content || ''
          
        case 'ul':
          // Check if it's a task list
          if (element.className.includes('task-list')) {
            return this.processTaskListMarkdown(element)
          }
          return this.processListMarkdown(element, false)
          
        case 'ol':
          return this.processListMarkdown(element, true)
          
        case 'pre':
          const code = element.querySelector('code')
          if (code) {
            const language = this.extractLanguageFromClass(code.className)
            const codeContent = code.textContent || ''
            return `\`\`\`${language}\n${codeContent}\n\`\`\``
          }
          return `\`\`\`\n${element.textContent || ''}\n\`\`\``
          
        case 'blockquote':
          const lines = this.processInlineMarkdown(element).split('\n')
          return lines.map(line => `> ${line}`).join('\n')
          
        case 'hr':
          return '---'
          
        case 'table':
          return this.processTableMarkdown(element)
          
        case 'div':
          // Handle special div elements
          if (element.className.includes('toc-placeholder')) {
            return '[[TOC]]'
          }
          // For other divs, process as block content
          return this.processInlineMarkdown(element)
          
        default:
          // Handle inline elements and other content
          return this.processInlineMarkdown(element)
      }
    },

    // Extract language from className (e.g., "language-javascript" -> "javascript")
    extractLanguageFromClass(className) {
      if (!className) return ''
      const match = className.match(/(?:language|lang)-(\w+)/)
      return match ? match[1] : ''
    },

    // Process table elements to Markdown
    processTableMarkdown(table) {
      const rows = Array.from(table.querySelectorAll('tr'))
      if (rows.length === 0) return ''
      
      let markdown = ''
      
      // Process header row
      const headerRow = rows[0]
      const headerCells = Array.from(headerRow.querySelectorAll('th, td'))
      const headers = headerCells.map(cell => this.processInlineMarkdown(cell))
      markdown += '| ' + headers.join(' | ') + ' |\n'
      
      // Add separator row
      const separators = headers.map(() => '---')
      markdown += '| ' + separators.join(' | ') + ' |\n'
      
      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const cells = Array.from(row.querySelectorAll('td, th'))
        const cellContents = cells.map(cell => this.processInlineMarkdown(cell))
        markdown += '| ' + cellContents.join(' | ') + ' |\n'
      }
      
      return markdown.trim()
    },

    // Process inline formatting (bold, italic, etc.) - enhanced
    processInlineMarkdown(element) {
      let result = ''
      
      const processNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          // Remove zero-width spaces
          return (node.textContent || '').replace(/\u200b/g, '')
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase()
          
          switch (tagName) {
            case 'strong':
            case 'b':
              const strongText = this.getTextContent(node).replace(/\u200b/g, '')
              return strongText ? `**${strongText}**` : ''
            case 'em':
            case 'i':
              const emText = this.getTextContent(node).replace(/\u200b/g, '')
              return emText ? `*${emText}*` : ''
            case 'u':
              const uText = this.getTextContent(node).replace(/\u200b/g, '')
              return uText ? `<u>${uText}</u>` : ''
            case 's':
            case 'strike':
            case 'del':
              const strikeText = this.getTextContent(node).replace(/\u200b/g, '')
              return strikeText ? `~~${strikeText}~~` : ''
            case 'code':
              const codeText = this.getTextContent(node).replace(/\u200b/g, '')
              return codeText ? `\`${codeText}\`` : ''
            case 'mark':
              const markText = this.getTextContent(node).replace(/\u200b/g, '')
              return markText ? `<mark>${markText}</mark>` : ''
            case 'font':
              const fontText = this.getTextContent(node).replace(/\u200b/g, '')
              const color = node.getAttribute('color') || 'red'
              return fontText ? `<font color="${color}">${fontText}</font>` : ''
            case 'span':
              // Handle special span elements (tex formulas, etc.)
              if (node.className.includes('tex-formula') || node.className.includes('tex-symbol')) {
                return node.textContent || ''
              }
              // Skip markdown indicators 
              if (node.className.includes('markdown-indicator')) {
                return ''
              }
              // For other spans, process their children
              return Array.from(node.childNodes).map(child => processNode(child)).join('')
            case 'a':
              const href = node.getAttribute('href') || ''
              const linkText = this.getTextContent(node).replace(/\u200b/g, '')
              return linkText ? `[${linkText}](${href})` : ''
            case 'img':
              const src = node.getAttribute('src') || ''
              const alt = node.getAttribute('alt') || ''
              return `![${alt}](${src})`
            case 'input':
              // Handle task list checkboxes - these are processed at the list level
              return ''
            case 'br':
              return '\n'
            case 'wbr':
              return ''
            default:
              // For other elements, process their children
              return Array.from(node.childNodes).map(child => processNode(child)).join('')
          }
        }
        return ''
      }
      
      return Array.from(element.childNodes).map(child => processNode(child)).join('')
    },

    // Get text content recursively
    getTextContent(element) {
      if (!element) return ''
      
      if (element.nodeType === Node.TEXT_NODE) {
        return (element.textContent || '').replace(/\u200b/g, '')
      }
      
      let result = ''
      for (const child of element.childNodes) {
        result += this.getTextContent(child)
      }
      return result
    },

    // Process task list elements to Markdown
    processTaskListMarkdown(element) {
      const items = element.querySelectorAll('li.task-list-item')
      let result = ''
      
      items.forEach((item) => {
        const checkbox = item.querySelector('input[type="checkbox"]')
        const checked = checkbox ? checkbox.checked : false
        const checkmark = checked ? 'x' : ' '
        
        // Get text content excluding the checkbox
        const textSpan = item.querySelector('span') || item
        const text = textSpan.textContent || ''
        
        result += `- [${checkmark}] ${text}\n`
      })
      
      return result.trim()
    },

    // Process list elements to Markdown
    processListMarkdown(element, ordered = false) {
      const items = element.querySelectorAll('li')
      let result = ''
      
      items.forEach((item, index) => {
        const prefix = ordered ? `${index + 1}. ` : '- '
        const text = this.processInlineMarkdown(item)
        result += `${prefix}${text}\n`
      })
      
      return result.trim()
    },

    // Handle toolbar button mousedown to prevent focus loss
    handleToolbarMouseDown(event) {
      // Prevent the button from stealing focus from the editor
      event.preventDefault()
      // Save current selection
      this.saveCurrentSelection()
    },

    // Save current editor selection
    saveCurrentSelection() {
      const selection = window.getSelection()
      if (selection.rangeCount > 0 && this.$refs.editorContent && this.$refs.editorContent.contains(selection.anchorNode)) {
        this.savedSelection = {
          startContainer: selection.anchorNode,
          startOffset: selection.anchorOffset,
          endContainer: selection.focusNode,
          endOffset: selection.focusOffset,
          collapsed: selection.isCollapsed
        }
      }
    },

    // Restore saved selection
    restoreSavedSelection() {
      if (this.savedSelection && this.$refs.editorContent) {
        try {
          const selection = window.getSelection()
          const range = document.createRange()
          
          range.setStart(this.savedSelection.startContainer, this.savedSelection.startOffset)
          range.setEnd(this.savedSelection.endContainer, this.savedSelection.endOffset)
          
          selection.removeAllRanges()
          selection.addRange(range)
          
          // Ensure editor has focus
          this.$refs.editorContent.focus()
        } catch (e) {
          // If selection restoration fails, just focus the editor
          this.$refs.editorContent.focus()
        }
      }
    },

    // Handle input events (debounced conversion) - vditor inspired
    handleInput(event) {
      if (this.composingLock || this.preventInput) {
        return
      }
      
      // Process real-time markdown conversion first
      this.processMarkdownInput(event)
      
      // Save cursor position before processing
      this.saveCursorPosition()
      
      // Clean up any wbr elements from previous operations
      this.cleanupWbrElements()

      this.debouncedConvertToMarkdown()
      
      // Show markdown indicators after input processing
      setTimeout(() => {
        this.showMarkdownIndicatorsAtCursor()
      }, 100)
    },

    // Process markdown input for real-time conversion
    processMarkdownInput(event) {
      const selection = window.getSelection()
      if (!selection.rangeCount) return
      
      const range = selection.getRangeAt(0)
      if (!range.collapsed) return // Only process when no selection
      
      const textNode = range.startContainer
      if (textNode.nodeType !== Node.TEXT_NODE) return
      
      const text = textNode.textContent
      const offset = range.startOffset
      
      // Get the text before cursor
      const beforeCursor = text.substring(0, offset)
      const afterCursor = text.substring(offset)
      
      // Check for inline patterns first (higher priority as they're more specific)
      if (this.convertInlineMarkdownPatterns(textNode, beforeCursor, afterCursor, range)) {
        return // If inline pattern was processed, don't check block patterns
      }
      
      // Check for block-level patterns
      this.convertBlockMarkdownPatterns(textNode, beforeCursor, afterCursor, range)
    },

    // Convert inline markdown patterns in real-time
    convertInlineMarkdownPatterns(textNode, beforeCursor, afterCursor, range) {
      const patterns = [
        // Bold: **text** or __text__
        {
          regex: /\*\*([^*]+)\*\*$/,
          replacement: (match, content) => this.createInlineElement('strong', content),
          removeLength: match => match[0].length
        },
        {
          regex: /__([^_]+)__$/,
          replacement: (match, content) => this.createInlineElement('strong', content),
          removeLength: match => match[0].length
        },
        // Italic: *text* or _text_ (but not when part of bold)
        {
          regex: /(?:^|[^*])\*([^*]+)\*$/,
          replacement: (match, content) => this.createInlineElement('em', content),
          removeLength: match => match[0].includes('*' + match[1] + '*') ? match[1].length + 2 : match[0].length
        },
        {
          regex: /(?:^|[^_])_([^_]+)_$/,
          replacement: (match, content) => this.createInlineElement('em', content),
          removeLength: match => match[0].includes('_' + match[1] + '_') ? match[1].length + 2 : match[0].length
        },
        // Inline code: `text`
        {
          regex: /`([^`]+)`$/,
          replacement: (match, content) => this.createInlineElement('code', content),
          removeLength: match => match[0].length
        },
        // Strikethrough: ~~text~~
        {
          regex: /~~([^~]+)~~$/,
          replacement: (match, content) => this.createInlineElement('s', content),
          removeLength: match => match[0].length
        }
      ]
      
      for (const pattern of patterns) {
        const match = beforeCursor.match(pattern.regex)
        if (match) {
          // Create the replacement element
          const element = pattern.replacement(match, match[1])
          
          // Calculate positions
          const removeLength = pattern.removeLength(match)
          const startPos = beforeCursor.length - removeLength
          
          // Update text node content
          const newTextBefore = beforeCursor.substring(0, startPos)
          const newTextAfter = afterCursor
          
          // Create new text nodes if needed
          const newTextContent = newTextBefore + newTextAfter
          
          // Replace content
          if (newTextContent.trim()) {
            textNode.textContent = newTextContent
          } else {
            // If no text remains, replace the text node with just the element
            textNode.textContent = ''
          }
          
          // Insert the formatted element
          const newRange = document.createRange()
          newRange.setStart(textNode, newTextBefore.length)
          newRange.insertNode(element)
          
          // Position cursor after the element
          newRange.setStartAfter(element)
          newRange.collapse(true)
          
          const selection = window.getSelection()
          selection.removeAllRanges()
          selection.addRange(newRange)
          
          return true // Pattern was processed
        }
      }
      
      return false // No pattern was processed
    },

    // Convert block-level markdown patterns
    convertBlockMarkdownPatterns(textNode, beforeCursor, afterCursor, range) {
      const blockElement = this.getClosestBlockElement(textNode)
      if (!blockElement || blockElement.tagName.toLowerCase() !== 'p') return
      
      const fullText = blockElement.textContent.trim()
      
      // Only process if we're at the end of the text (or after a space)
      const atEndOfText = beforeCursor.length === fullText.length || beforeCursor.endsWith(' ')
      if (!atEndOfText) return
      
      // Blockquote patterns: > text
      const blockquoteMatch = fullText.match(/^>\s+(.+)$/)
      if (blockquoteMatch) {
        const content = blockquoteMatch[1] || '引用内容'
        
        // Create blockquote element
        const blockquote = document.createElement('blockquote')
        const p = document.createElement('p')
        p.textContent = content
        blockquote.appendChild(p)
        
        // Replace paragraph with blockquote
        if (blockElement.parentNode) {
          blockElement.parentNode.replaceChild(blockquote, blockElement)
          
          // Position cursor at end of blockquote content
          const newRange = document.createRange()
          newRange.selectNodeContents(p)
          newRange.collapse(false)
          
          const selection = window.getSelection()
          selection.removeAllRanges()
          selection.addRange(newRange)
          
          // Prevent the debounced conversion from interfering
          setTimeout(() => {
            this.debouncedConvertToMarkdown()
          }, 100)
        }
        return
      }
      
      // Code block patterns: ``` language
      const codeBlockMatch = fullText.match(/^```(\w*)\s*$/)
      if (codeBlockMatch) {
        const language = codeBlockMatch[1] || ''
        
        // Create code block structure
        const pre = document.createElement('pre')
        const code = document.createElement('code')
        
        if (language) {
          code.className = `language-${language}`
        }
        code.textContent = 'console.log("Hello World")'
        pre.appendChild(code)
        
        // Replace paragraph with code block
        if (blockElement.parentNode) {
          blockElement.parentNode.replaceChild(pre, blockElement)
          
          // Position cursor inside code block
          const newRange = document.createRange()
          newRange.selectNodeContents(code)
          newRange.collapse(false)
          
          const selection = window.getSelection()
          selection.removeAllRanges()
          selection.addRange(newRange)
          
          // Prevent the debounced conversion from interfering
          setTimeout(() => {
            this.debouncedConvertToMarkdown()
          }, 100)
        }
        return
      }
      
      // Heading patterns: # text, ## text, etc.
      const headingMatch = fullText.match(/^(#{1,6})\s+(.+)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const content = headingMatch[2] || `标题 ${level}`
        
        // Create heading element
        const heading = document.createElement(`h${level}`)
        heading.textContent = content
        
        // Replace paragraph with heading
        if (blockElement.parentNode) {
          blockElement.parentNode.replaceChild(heading, blockElement)
          
          // Position cursor at end of heading
          const newRange = document.createRange()
          newRange.selectNodeContents(heading)
          newRange.collapse(false)
          
          const selection = window.getSelection()
          selection.removeAllRanges()
          selection.addRange(newRange)
          
          // Prevent the debounced conversion from interfering
          setTimeout(() => {
            this.debouncedConvertToMarkdown()
          }, 100)
        }
        return
      }
      
      // List patterns: - text, * text, + text
      const unorderedListMatch = fullText.match(/^[-*+]\s+(.+)$/)
      if (unorderedListMatch) {
        const content = unorderedListMatch[1] || '列表项'
        this.convertParagraphToList(blockElement, 'ul', content)
        return
      }
      
      // Ordered list patterns: 1. text, 2. text, etc.
      const orderedListMatch = fullText.match(/^(\d+)\.\s+(.+)$/)
      if (orderedListMatch) {
        const content = orderedListMatch[2] || '列表项'
        this.convertParagraphToList(blockElement, 'ol', content)
        return
      }
      
      // Task list patterns: - [ ] text, - [x] text
      const taskListMatch = fullText.match(/^-\s+\[([ x])\]\s+(.+)$/)
      if (taskListMatch) {
        const checked = taskListMatch[1] === 'x'
        const content = taskListMatch[2] || '任务项目'
        this.convertParagraphToTaskList(blockElement, content, checked)
        return
      }
    },

    // Create inline element with content
    createInlineElement(tagName, content) {
      const element = document.createElement(tagName)
      element.textContent = content
      return element
    },

    // Convert paragraph to task list item
    convertParagraphToTaskList(paragraph, content, checked = false) {
      const list = document.createElement('ul')
      list.className = 'task-list'
      const listItem = document.createElement('li')
      listItem.className = 'task-list-item'
      
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.className = 'task-list-item-checkbox'
      checkbox.checked = checked
      
      const textSpan = document.createElement('span')
      textSpan.textContent = content
      
      listItem.appendChild(checkbox)
      listItem.appendChild(textSpan)
      list.appendChild(listItem)
      
      if (paragraph.parentNode) {
        paragraph.parentNode.replaceChild(list, paragraph)
        
        // Position cursor at end of task item text
        const newRange = document.createRange()
        newRange.selectNodeContents(textSpan)
        newRange.collapse(false)
        
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(newRange)
        
        // Prevent the debounced conversion from interfering
        setTimeout(() => {
          this.debouncedConvertToMarkdown()
        }, 100)
      }
    },

    // Convert paragraph to list item
    convertParagraphToList(paragraph, listType, content) {
      const list = document.createElement(listType)
      const listItem = document.createElement('li')
      listItem.textContent = content
      list.appendChild(listItem)
      
      if (paragraph.parentNode) {
        paragraph.parentNode.replaceChild(list, paragraph)
        
        // Position cursor at end of list item
        const newRange = document.createRange()
        newRange.selectNodeContents(listItem)
        newRange.collapse(false)
        
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(newRange)
        
        // Prevent the debounced conversion from interfering
        setTimeout(() => {
          this.debouncedConvertToMarkdown()
        }, 100)
      }
    },

    // Handle composition start (IME input)
    handleCompositionStart() {
      this.composingLock = true
    },

    // Handle composition end (IME input)
    handleCompositionEnd() {
      this.composingLock = false
      this.handleInput()
    },

    // Save cursor position using wbr element (vditor pattern)
    saveCursorPosition() {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        
        // Remove existing wbr elements
        this.cleanupWbrElements()
        
        // Insert wbr element at cursor position
        const wbr = document.createElement('wbr')
        range.insertNode(wbr)
      }
    },

    // Clean up wbr elements
    cleanupWbrElements() {
      const content = this.$refs.editorContent
      if (content) {
        const wbrElements = content.querySelectorAll('wbr')
        wbrElements.forEach(wbr => wbr.remove())
      }
    },

    // Restore cursor position from wbr element (vditor pattern)
    restoreCursorPosition() {
      const content = this.$refs.editorContent
      if (!content) return
      
      const wbr = content.querySelector('wbr')
      if (wbr) {
        const selection = window.getSelection()
        const range = document.createRange()
        
        range.setStartAfter(wbr)
        range.collapse(true)
        
        selection.removeAllRanges()
        selection.addRange(range)
        
        wbr.remove()
      }
    },

    // Handle paste events
    handlePaste(event) {
      event.preventDefault()
      
      const clipboardData = event.clipboardData || window.clipboardData
      const htmlData = clipboardData.getData('text/html')
      const textData = clipboardData.getData('text/plain')
      
      if (htmlData) {
        // Process HTML content
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = htmlData
        const cleanHtml = this.cleanHtmlForWysiwyg(tempDiv.innerHTML)
        
        this.insertContent(cleanHtml)
      } else if (textData) {
        // Insert plain text
        this.insertContent(textData)
      }
      
      this.debouncedConvertToMarkdown()
    },

    // Insert content at cursor position
    insertContent(content) {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        
        if (typeof content === 'string') {
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = content
          const fragment = document.createDocumentFragment()
          let child
          while (child = tempDiv.firstChild) {
            fragment.appendChild(child)
          }
          range.insertNode(fragment)
        } else {
          range.insertNode(content)
        }
      }
    },

    // Handle keydown events - enhanced with more shortcuts
    handleKeydown(event) {
      // Handle keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'b':
            event.preventDefault()
            this.formatText('bold')
            break
          case 'i':
            event.preventDefault()
            this.formatText('italic')
            break
          case 'u':
            event.preventDefault()
            this.formatText('underline')
            break
          case 'd':
            event.preventDefault()
            this.formatText('strikethrough')
            break
          case 'k':
            event.preventDefault()
            this.insertLink()
            break
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
            event.preventDefault()
            this.formatHeading(parseInt(event.key))
            break
          case '`':
            event.preventDefault()
            this.insertInlineCode()
            break
        }
      }
      
      // Handle special keys
      switch (event.key) {
        case 'Enter':
          this.handleEnterKey(event)
          break
        case 'Backspace':
          this.handleBackspaceKey(event)
          break
        case 'Tab':
          this.handleTabKey(event)
          break
        case ' ':
          // Trigger markdown processing on space
          setTimeout(() => {
            this.processMarkdownOnTrigger()
          }, 10)
          break
      }
    },

    // Process markdown on specific triggers (space, enter, etc.)
    processMarkdownOnTrigger() {
      const selection = window.getSelection()
      if (!selection.rangeCount) return
      
      const range = selection.getRangeAt(0)
      if (!range.collapsed) return
      
      const textNode = range.startContainer
      if (textNode.nodeType !== Node.TEXT_NODE) return
      
      const text = textNode.textContent
      const offset = range.startOffset
      
      // Get the text before cursor
      const beforeCursor = text.substring(0, offset)
      const afterCursor = text.substring(offset)
      
      // Only check block patterns on trigger
      this.convertBlockMarkdownPatterns(textNode, beforeCursor, afterCursor, range)
    },

    // Insert inline code
    insertInlineCode() {
      // Restore selection first
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      const selectedText = selection.toString()
      
      const code = document.createElement('code')
      
      if (selectedText) {
        // Has selection - wrap it
        code.textContent = selectedText
        range.deleteContents()
        range.insertNode(code)
        
        // Set cursor after code element
        const newRange = document.createRange()
        newRange.setStartAfter(code)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      } else {
        // No selection - create with ZWSP placeholder
        code.textContent = '\u200b' // Zero-width space
        range.insertNode(code)
        
        // Position cursor inside the code element
        const newRange = document.createRange()
        newRange.setStart(code.firstChild, 1)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
      
      this.debouncedConvertToMarkdown()
    },

    // Handle backspace key for better behavior
    handleBackspaceKey(event) {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        
        // Check if we're at the beginning of a block element
        if (range.collapsed && range.startOffset === 0) {
          const blockElement = this.getClosestBlockElement(range.startContainer)
          
          if (blockElement && blockElement.tagName.match(/^H[1-6]$/)) {
            // Convert heading to paragraph
            event.preventDefault()
            const p = document.createElement('p')
            p.innerHTML = blockElement.innerHTML
            blockElement.parentNode.replaceChild(p, blockElement)
            
            // Set cursor at beginning of new paragraph
            const newRange = document.createRange()
            newRange.setStart(p, 0)
            newRange.collapse(true)
            selection.removeAllRanges()
            selection.addRange(newRange)
            
            this.debouncedConvertToMarkdown()
          }
        }
      }
    },

    // Handle tab key for indentation
    handleTabKey(event) {
      event.preventDefault()
      
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const listItem = this.getClosestElement(range.startContainer, 'LI')
        
        if (listItem) {
          // Handle list indentation
          if (event.shiftKey) {
            this.outdentListItem(listItem)
          } else {
            this.indentListItem(listItem)
          }
        } else {
          // Insert tab character
          const tabText = document.createTextNode('\t')
          range.insertNode(tabText)
          range.setStartAfter(tabText)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        }
        
        this.debouncedConvertToMarkdown()
      }
    },

    // Get closest block element
    getClosestBlockElement(node) {
      if (!node) return null
      
      const blockElements = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'BLOCKQUOTE', 'PRE', 'LI', 'UL', 'OL']
      
      // Start from the node itself if it's an element
      let currentNode = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement
      
      while (currentNode && currentNode !== this.$refs.editorContent) {
        if (blockElements.includes(currentNode.tagName)) {
          return currentNode
        }
        currentNode = currentNode.parentElement
      }
      
      return null
    },

    // Get closest element of specific tag
    getClosestElement(node, tagName) {
      while (node && node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === tagName) {
          return node
        }
        node = node.parentNode
      }
      return null
    },

    // Indent list item
    indentListItem(listItem) {
      const parentList = listItem.parentNode
      const prevItem = listItem.previousElementSibling
      
      if (prevItem) {
        let subList = prevItem.querySelector('ul, ol')
        if (!subList) {
          subList = document.createElement(parentList.tagName.toLowerCase())
          prevItem.appendChild(subList)
        }
        subList.appendChild(listItem)
      }
    },

    // Outdent list item
    outdentListItem(listItem) {
      const parentList = listItem.parentNode
      const grandParentList = parentList.parentNode
      
      if (grandParentList && grandParentList.tagName.match(/^(UL|OL)$/i)) {
        const parentListItem = parentList.parentNode
        grandParentList.insertBefore(listItem, parentListItem.nextSibling)
        
        // Remove empty sublists
        if (parentList.children.length === 0) {
          parentList.remove()
        }
      }
    },

    // Handle Enter key for better list and block behavior - vditor inspired
    handleEnterKey(event) {
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      const listItem = this.getClosestElement(range.startContainer, 'LI')
      
      if (listItem) {
        // Handle list items
        event.preventDefault()
        
        if (listItem.textContent.trim() === '') {
          // Empty list item - exit list
          this.exitList(listItem)
        } else {
          // Create new list item
          this.createNewListItem(listItem, range)
        }
      } else {
        // Handle other block elements
        const blockElement = this.getClosestBlockElement(range.startContainer)
        
        if (blockElement && blockElement.tagName.match(/^H[1-6]$/)) {
          // After heading, create paragraph
          event.preventDefault()
          this.createParagraphAfterHeading(blockElement, range)
        }
      }
    },

    // Exit from list
    exitList(listItem) {
      const list = listItem.parentNode
      const newP = document.createElement('p')
      newP.innerHTML = '<br>'
      
      list.parentNode.insertBefore(newP, list.nextSibling)
      
      // Remove empty list item
      listItem.remove()
      
      // Remove empty list
      if (list.children.length === 0) {
        list.remove()
      }
      
      // Set cursor in new paragraph
      const selection = window.getSelection()
      const range = document.createRange()
      range.setStart(newP, 0)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      
      this.debouncedConvertToMarkdown()
    },

    // Create new list item
    createNewListItem(listItem, range) {
      const newListItem = document.createElement('li')
      newListItem.innerHTML = '<br>'
      
      // Split content at cursor position
      if (range.startOffset < range.startContainer.textContent.length) {
        const remainingContent = range.extractContents()
        newListItem.innerHTML = ''
        newListItem.appendChild(remainingContent)
      }
      
      listItem.parentNode.insertBefore(newListItem, listItem.nextSibling)
      
      // Set cursor in new list item
      const selection = window.getSelection()
      const newRange = document.createRange()
      newRange.setStart(newListItem, 0)
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      this.debouncedConvertToMarkdown()
    },

    // Create paragraph after heading
    createParagraphAfterHeading(heading, range) {
      const newP = document.createElement('p')
      newP.innerHTML = '<br>'
      
      heading.parentNode.insertBefore(newP, heading.nextSibling)
      
      // Set cursor in new paragraph
      const selection = window.getSelection()
      const newRange = document.createRange()
      newRange.setStart(newP, 0)
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      this.debouncedConvertToMarkdown()
    },

    // Handle keyup events
    handleKeyup() {
      this.debouncedConvertToMarkdown()
    },

    // Handle focus events
    handleFocus() {
      // Clear any saved selection when editor is focused
      this.savedSelection = null
    },

    // Handle blur events
    handleBlur() {
      // Save selection when losing focus (but not if it's due to toolbar interaction)
      setTimeout(() => {
        if (document.activeElement && !this.isToolbarElement(document.activeElement)) {
          this.saveCurrentSelection()
        }
      }, 50)
    },

    // Check if element is part of toolbar
    isToolbarElement(element) {
      return element.closest('.wysiwyg-toolbar') !== null
    },

    // Debounced conversion to prevent too frequent updates
    debouncedConvertToMarkdown() {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }
      
      this.debounceTimer = setTimeout(() => {
        this.convertAndEmit()
      }, 300)
    },

    // Convert content and emit to parent - enhanced
    convertAndEmit() {
      this.isConverting = true
      const markdown = this.convertToMarkdown()
      this.$emit('update:modelValue', markdown)
      
      // Restore cursor position after a short delay
      setTimeout(() => {
        this.restoreCursorPosition()
        this.isConverting = false
      }, 50)
    },

    // Format text (bold, italic, etc.) - vditor inspired
    formatText(command) {
      // Restore selection first
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      const selectedText = selection.toString()
      
      let element
      switch (command) {
        case 'bold':
          element = document.createElement('strong')
          break
        case 'italic':
          element = document.createElement('em')
          break
        case 'underline':
          element = document.createElement('u')
          break
        case 'strikethrough':
          element = document.createElement('s')
          break
        default:
          return
      }
      
      if (selectedText) {
        // Has selection - wrap the selected text
        element.textContent = selectedText
        range.deleteContents()
        range.insertNode(element)
        
        // Restore selection
        const newRange = document.createRange()
        newRange.selectNodeContents(element)
        selection.removeAllRanges()
        selection.addRange(newRange)
      } else {
        // No selection - create element with ZWSP placeholder (vditor pattern)
        element.textContent = '\u200b' // Zero-width space
        range.insertNode(element)
        
        // Position cursor inside the element
        const newRange = document.createRange()
        newRange.setStart(element.firstChild, 1)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
      
      this.debouncedConvertToMarkdown()
    },

    // Format heading - vditor inspired
    formatHeading(level) {
      // Restore selection first
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      let blockElement = this.getClosestBlockElement(range.startContainer)
      
      // If no block element found, look at the offset child
      if (!blockElement) {
        const container = range.startContainer
        if (container.nodeType === Node.ELEMENT_NODE && container.childNodes[range.startOffset]) {
          blockElement = container.childNodes[range.startOffset]
        } else if (container.parentElement) {
          blockElement = this.getClosestBlockElement(container.parentElement)
        }
      }
      
      // If still no block element, create one in the editor
      if (!blockElement && this.$refs.editorContent.children.length === 0) {
        this.$refs.editorContent.innerHTML = '<p><br></p>'
        blockElement = this.$refs.editorContent.firstChild
        const newRange = document.createRange()
        newRange.setStart(blockElement, 0)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
      
      if (blockElement && blockElement !== this.$refs.editorContent) {
        // Save cursor position with wbr
        range.insertNode(document.createElement('wbr'))
        
        // Get current content, removing wbr for clean content
        let content = blockElement.innerHTML
        const wbr = blockElement.querySelector('wbr')
        if (wbr) {
          // Remember wbr position before removing it
          wbr.remove()
        }
        
        // Create new heading
        const heading = document.createElement(`h${level}`)
        // Preserve content or set default text
        heading.innerHTML = content.trim() || `标题 ${level}<wbr>`
        
        // Replace the old element with the new heading
        if (blockElement.parentNode) {
          blockElement.parentNode.replaceChild(heading, blockElement)
        }
        
        // Restore cursor position
        this.restoreCursorPosition()
        
        this.debouncedConvertToMarkdown()
      }
    },

    // Insert list - vditor inspired
    insertList(type) {
      // Restore selection first
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      let blockElement = this.getClosestBlockElement(range.startContainer)
      
      // If no block element, try to find from cursor position
      if (!blockElement && range.startContainer.nodeType === Node.ELEMENT_NODE) {
        blockElement = range.startContainer.childNodes[range.startOffset]
      }
      
      // Create the list structure
      const list = document.createElement(type)
      const listItem = document.createElement('li')
      
      if (blockElement && blockElement !== this.$refs.editorContent) {
        // Convert existing block to list item
        listItem.innerHTML = blockElement.innerHTML || '列表项<wbr>'
        list.appendChild(listItem)
        
        // Replace the block element with the list
        if (blockElement.parentNode) {
          blockElement.parentNode.replaceChild(list, blockElement)
        }
      } else {
        // Create new list
        listItem.innerHTML = '列表项<wbr>'
        list.appendChild(listItem)
        
        if (this.$refs.editorContent.children.length === 0) {
          this.$refs.editorContent.appendChild(list)
        } else {
          range.insertNode(list)
        }
      }
      
      // Restore cursor position
      this.restoreCursorPosition()
      this.debouncedConvertToMarkdown()
    },

    // Insert link - vditor inspired
    insertLink() {
      // Restore selection first
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      const selectedText = selection.toString()
      
      const url = prompt('请输入链接地址:')
      if (!url) return
      
      const link = document.createElement('a')
      link.href = url
      
      if (selectedText) {
        // Has selection - use selected text as link text
        link.textContent = selectedText
        range.deleteContents()
        range.insertNode(link)
        
        // Set cursor after link
        const newRange = document.createRange()
        newRange.setStartAfter(link)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      } else {
        // No selection - prompt for link text or use ZWSP
        const linkText = prompt('请输入链接文本:') || '\u200b'
        link.textContent = linkText
        range.insertNode(link)
        
        if (linkText === '\u200b') {
          // Position cursor inside the link
          const newRange = document.createRange()
          newRange.setStart(link.firstChild, 1)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        } else {
          // Set cursor after link
          const newRange = document.createRange()
          newRange.setStartAfter(link)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      }
      
      this.debouncedConvertToMarkdown()
    },

    // Insert image - vditor inspired
    insertImage() {
      // Restore selection first
      this.restoreSavedSelection()
      
      const url = prompt('请输入图片地址:')
      if (!url) return
      
      const alt = prompt('请输入图片描述:') || '图片'
      const img = document.createElement('img')
      img.src = url
      img.alt = alt
      img.style.maxWidth = '100%'
      img.style.height = 'auto'
      
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.insertNode(img)
        
        // Set cursor after image
        const newRange = document.createRange()
        newRange.setStartAfter(img)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
      
      this.debouncedConvertToMarkdown()
    },

    // Insert code block - vditor inspired
    // Insert code block - vditor style without browser dialogs
    insertCodeBlock() {
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      let blockElement = this.getClosestBlockElement(range.startContainer)
      
      // Create code block structure
      const pre = document.createElement('pre')
      pre.setAttribute('data-type', 'code-block')
      const codeElement = document.createElement('code')
      
      // Default placeholder content that user can edit
      codeElement.textContent = 'console.log("Hello World")'
      codeElement.setAttribute('contenteditable', 'true')
      codeElement.style.cssText = `
        display: block;
        background: #f6f8fa;
        padding: 16px;
        border-radius: 6px;
        font-family: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', Consolas, 'Courier New', monospace;
        font-size: 85%;
        line-height: 1.45;
        white-space: pre;
        overflow-x: auto;
        color: #24292f;
        border: 1px solid #d0d7de;
        min-height: 60px;
      `
      pre.appendChild(codeElement)
      
      if (blockElement && blockElement !== this.$refs.editorContent) {
        // Replace current block
        blockElement.parentNode.replaceChild(pre, blockElement)
      } else {
        // Insert at cursor position  
        range.insertNode(pre)
      }
      
      // Position cursor inside code block and select all content for easy editing
      const newRange = document.createRange()
      newRange.selectNodeContents(codeElement)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      // Focus the code element for immediate editing
      codeElement.focus()
      
      this.debouncedConvertToMarkdown()
    }
  }
}
</script>

<style scoped>
.wysiwyg-editor {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  overflow: hidden;
  background: #ffffff;
}

.wysiwyg-toolbar {
  background: #f6f8fa;
  border-bottom: 1px solid #d0d7de;
  padding: 8px 12px;
}

.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.toolbar-row:last-child {
  margin-bottom: 0;
}

.tex-toolbar {
  background: #f1f8ff;
  border-top: 1px solid #e1e4e8;
  padding-top: 8px;
  margin-top: 4px;
}

.vditor-toolbar__item {
  display: inline-flex;
}

.vditor-toolbar__item button {
  border: none;
  background: transparent;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
  min-width: 28px;
  min-height: 28px;
}

.vditor-toolbar__item button:hover {
  background: #f3f4f6;
}

.vditor-toolbar__item button:active {
  background: #e5e7eb;
}

.vditor-toolbar__item svg {
  width: 16px;
  height: 16px;
  fill: #656d76;
}

.vditor-wysiwyg {
  min-height: 300px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #24292f;
  outline: none;
  overflow-y: auto;
}

.vditor-wysiwyg__block[data-block="0"] {
  margin: 0 0 16px 0;
}

.vditor-wysiwyg__block[data-block="0"]:last-child {
  margin-bottom: 0;
}

.vditor-wysiwyg h1,
.vditor-wysiwyg h2,
.vditor-wysiwyg h3,
.vditor-wysiwyg h4,
.vditor-wysiwyg h5,
.vditor-wysiwyg h6 {
  margin: 0 0 16px 0;
  font-weight: 600;
  line-height: 1.25;
}

.vditor-wysiwyg h1 {
  font-size: 2em;
  border-bottom: 1px solid #d0d7de;
  padding-bottom: 0.3em;
}

.vditor-wysiwyg h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #d0d7de;
  padding-bottom: 0.3em;
}

.vditor-wysiwyg h3 {
  font-size: 1.25em;
}

.vditor-wysiwyg p {
  margin: 0 0 16px 0;
}

.vditor-wysiwyg ul,
.vditor-wysiwyg ol {
  margin: 0 0 16px 0;
  padding-left: 2em;
}

.vditor-wysiwyg li {
  margin: 0.25em 0;
}

/* Blockquote styling - GitHub style */
.vditor-wysiwyg blockquote {
  margin: 0 0 16px 0;
  padding: 0 1em;
  color: #656d76;
  border-left: 0.25em solid #d0d7de;
  background: #f6f8fa;
  border-radius: 0 6px 6px 0;
}

.vditor-wysiwyg blockquote p {
  margin-bottom: 0;
}

/* Code block styling - GitHub style */
.vditor-wysiwyg pre {
  margin: 0 0 16px 0;
  padding: 16px;
  background: #f6f8fa;
  border-radius: 6px;
  border: 1px solid #d0d7de;
  overflow-x: auto;
  font-family: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 85%;
  line-height: 1.45;
}

.vditor-wysiwyg pre code {
  background: transparent !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  font-size: inherit;
  white-space: pre;
  word-break: normal;
  word-wrap: normal;
}

/* Inline code styling */
.vditor-wysiwyg code {
  background: rgba(175, 184, 193, 0.2);
  padding: 0.2em 0.4em;
  border-radius: 6px;
  font-family: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 85%;
}

/* Task list styling */
.vditor-wysiwyg .task-list {
  list-style: none;
  padding-left: 0;
}

.vditor-wysiwyg .task-list-item {
  display: flex;
  align-items: flex-start;
  margin: 0.25em 0;
}

.vditor-wysiwyg .task-list-item-checkbox {
  margin-right: 0.5em;
  margin-top: 0.125em;
}

/* Table styling */
.vditor-wysiwyg table {
  border-collapse: collapse;
  margin: 0 0 16px 0;
  width: 100%;
  border: 1px solid #d0d7de;
  border-radius: 6px;
}

.vditor-wysiwyg th,
.vditor-wysiwyg td {
  padding: 6px 13px;
  border: 1px solid #d0d7de;
  text-align: left;
}

.vditor-wysiwyg th {
  background: #f6f8fa;
  font-weight: 600;
}

/* Horizontal rule styling */
.vditor-wysiwyg hr {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #d0d7de;
  border: 0;
  border-radius: 2px;
}

/* TOC placeholder styling */
.vditor-wysiwyg .toc-placeholder {
  background: #f6f8fa;
  padding: 8px 12px;
  border-radius: 6px;
  margin: 16px 0;
  font-family: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', Consolas, 'Courier New', monospace;
  color: #656d76;
  border: 1px solid #d0d7de;
}

/* Markdown indicators styling */
.vditor-wysiwyg .markdown-indicator {
  color: #8b949e !important;
  font-weight: normal !important;
  opacity: 0.7;
  user-select: none;
  pointer-events: none;
}

/* Task list styles */
.vditor-wysiwyg ul.task-list {
  list-style-type: none;
  padding-left: 1.5em;
}

.vditor-wysiwyg li.task-list-item {
  position: relative;
  list-style-type: none;
}

.vditor-wysiwyg .task-list-item-checkbox {
  position: absolute;
  left: -1.5em;
  top: 0.15em;
  margin: 0;
}

.vditor-wysiwyg pre {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  margin: 0 0 16px 0;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 85%;
  line-height: 1.45;
}

.vditor-wysiwyg code {
  background: rgba(175, 184, 193, 0.2);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 85%;
}

.vditor-wysiwyg pre code {
  background: transparent;
  padding: 0;
  border-radius: 0;
}

.vditor-wysiwyg blockquote {
  margin: 0 0 16px 0;
  padding: 0 1em;
  color: #656d76;
  border-left: 0.25em solid #d0d7de;
}

.vditor-wysiwyg a {
  color: #0969da;
  text-decoration: none;
}

.vditor-wysiwyg a:hover {
  text-decoration: underline;
}

.vditor-wysiwyg img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}

.vditor-wysiwyg strong {
  font-weight: 600;
}

.vditor-wysiwyg em {
  font-style: italic;
}

.vditor-wysiwyg mark {
  background-color: #fff3cd;
  padding: 0.1em 0.2em;
}

.vditor-wysiwyg hr {
  border: none;
  border-top: 1px solid #d0d7de;
  margin: 24px 0;
}

/* Special element styles */
.vditor-wysiwyg .toc-placeholder {
  background: #f6f8fa;
  padding: 8px;
  border-radius: 4px;
  margin: 16px 0;
  font-family: monospace;
  color: #656d76;
  border: 1px solid #d0d7de;
}

.vditor-wysiwyg .tex-formula,
.vditor-wysiwyg .tex-symbol {
  background: #f6f8fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
  color: #0969da;
  border: 1px solid #e1e4e8;
}

/* Markdown indicator styles (vditor-style) */
.markdown-indicator {
  color: #999 !important;
  font-size: 0.9em !important;
  user-select: none !important;
  opacity: 0.6 !important;
  font-weight: normal !important;
}

.vditor-tooltipped {
  position: relative;
}

.vditor-tooltipped--n:before {
  content: attr(aria-label);
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #24292f;
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 100;
}

.vditor-tooltipped--n:hover:before {
  opacity: 1;
}

/* Responsive design for mobile */
@media (max-width: 768px) {
  .toolbar-row {
    gap: 2px;
  }
  
  .vditor-toolbar__item button {
    padding: 4px 6px;
    min-width: 24px;
    min-height: 24px;
  }
  
  .vditor-toolbar__item svg {
    width: 14px;
    height: 14px;
  }
}
</style>