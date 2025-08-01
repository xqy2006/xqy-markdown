<template>
  <div class="wysiwyg-editor">
    <!-- WYSIWYG Toolbar inspired by vditor -->
    <div class="wysiwyg-toolbar vditor-toolbar">
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
                @click="formatHeading(1)" 
                aria-label="标题1 (Ctrl+1)">
          <Heading :size="16" />
        </button>
      </div>
      <div class="vditor-toolbar__item">
        <button class="vditor-tooltipped vditor-tooltipped--n" 
                @mousedown="handleToolbarMouseDown"
                @click="formatHeading(2)" 
                aria-label="标题2 (Ctrl+2)">
          <Heading :size="16" />
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
                @click="formatText('strikethrough')" 
                aria-label="删除线 (Ctrl+D)">
          <Strikethrough :size="16" />
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
                @click="insertList('ol')" 
                aria-label="有序列表">
          <ListOrdered :size="16" />
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
                @click="insertCodeBlock()" 
                aria-label="代码块">
          <Code :size="16" />
        </button>
      </div>
    </div>

    <!-- WYSIWYG Content Area inspired by vditor -->
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
  List, ListOrdered, Link, Image, Code 
} from 'lucide-vue-next'

export default {
  name: 'WysiwygEditor',
  components: {
    Bold, Italic, Underline, Strikethrough, Heading,
    List, ListOrdered, Link, Image, Code
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
      savedSelection: null // Store selection when focus is lost
    }
  },
  watch: {
    modelValue: {
      handler(newValue) {
        if (!this.isConverting) {
          this.htmlContent = this.markdownToHtml(newValue)
        }
      },
      immediate: true
    }
  },
  methods: {
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
            case 'a':
              const href = node.getAttribute('href') || ''
              const linkText = this.getTextContent(node).replace(/\u200b/g, '')
              return linkText ? `[${linkText}](${href})` : ''
            case 'img':
              const src = node.getAttribute('src') || ''
              const alt = node.getAttribute('alt') || ''
              return `![${alt}](${src})`
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
      
      // Check for markdown patterns
      this.convertMarkdownPatterns(textNode, beforeCursor, afterCursor, range)
    },

    // Convert markdown patterns in real-time
    convertMarkdownPatterns(textNode, beforeCursor, afterCursor, range) {
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
          
          break // Only process one pattern at a time
        }
      }
      
      // Check for block-level patterns at the beginning of paragraphs
      this.convertBlockMarkdownPatterns(textNode, beforeCursor, afterCursor, range)
    },

    // Convert block-level markdown patterns
    convertBlockMarkdownPatterns(textNode, beforeCursor, afterCursor, range) {
      const blockElement = this.getClosestBlockElement(textNode)
      if (!blockElement || blockElement.tagName.toLowerCase() !== 'p') return
      
      const fullText = blockElement.textContent
      
      // Heading patterns: # text, ## text, etc.
      const headingMatch = fullText.match(/^(#{1,6})\s+(.*)$/)
      if (headingMatch && beforeCursor.includes('#')) {
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
        }
        return
      }
      
      // List patterns: - text, * text, + text
      const unorderedListMatch = fullText.match(/^[-*+]\s+(.*)$/)
      if (unorderedListMatch && (beforeCursor.includes('-') || beforeCursor.includes('*') || beforeCursor.includes('+'))) {
        const content = unorderedListMatch[1] || '列表项'
        this.convertParagraphToList(blockElement, 'ul', content)
        return
      }
      
      // Ordered list patterns: 1. text, 2. text, etc.
      const orderedListMatch = fullText.match(/^(\d+)\.\s+(.*)$/)
      if (orderedListMatch && beforeCursor.includes('.')) {
        const content = orderedListMatch[2] || '列表项'
        this.convertParagraphToList(blockElement, 'ol', content)
        return
      }
    },

    // Create inline element with content
    createInlineElement(tagName, content) {
      const element = document.createElement(tagName)
      element.textContent = content
      return element
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
      }
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
    insertCodeBlock() {
      // Restore selection first
      this.restoreSavedSelection()
      
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      const selectedText = selection.toString()
      
      const language = prompt('请输入代码语言 (可选):') || ''
      const defaultCode = selectedText || 'console.log("Hello World")'
      const codeContent = selectedText ? selectedText : prompt('请输入代码内容:', defaultCode) || defaultCode
      
      const pre = document.createElement('pre')
      const codeElement = document.createElement('code')
      
      if (language) {
        codeElement.className = `language-${language}`
      }
      codeElement.textContent = codeContent
      pre.appendChild(codeElement)
      
      // Clear selection if text was selected
      if (selectedText) {
        range.deleteContents()
      }
      
      // Insert the code block
      let blockElement = this.getClosestBlockElement(range.startContainer)
      
      if (blockElement && blockElement !== this.$refs.editorContent && blockElement.innerHTML.trim() === '') {
        // Replace empty block with code block
        blockElement.parentNode.replaceChild(pre, blockElement)
      } else {
        // Insert code block at cursor position
        range.insertNode(pre)
      }
      
      // Position cursor after code block
      const newRange = document.createRange()
      newRange.setStartAfter(pre)
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
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
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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
</style>