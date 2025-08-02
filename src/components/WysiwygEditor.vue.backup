<template>
  <div class="wysiwyg-editor">
    <!-- WYSIWYG Toolbar -->
    <div class="wysiwyg-toolbar">
      <span class="BtnGroup d-block">
        <button class="btn btn-invisible btn-sm" @click="formatText('bold')" aria-label="粗体">
          <Bold :size="16" />
        </button>
        <button class="btn btn-invisible btn-sm" @click="formatText('italic')" aria-label="斜体">
          <Italic :size="16" />
        </button>
        <button class="btn btn-invisible btn-sm" @click="formatHeading(1)" aria-label="标题1">
          <Heading :size="16" />
        </button>
        <button class="btn btn-invisible btn-sm" @click="formatHeading(2)" aria-label="标题2">
          <Heading :size="16" />
        </button>
        <button class="btn btn-invisible btn-sm" @click="formatText('underline')" aria-label="下划线">
          <Underline :size="16" />
        </button>
        <button class="btn btn-invisible btn-sm" @click="formatText('strikethrough')" aria-label="删除线">
          <Strikethrough :size="16" />
        </button>
        <button class="btn btn-invisible btn-sm" @click="insertList('ul')" aria-label="无序列表">
          <List :size="16" />
        </button>
        <button class="btn btn-invisible btn-sm" @click="insertList('ol')" aria-label="有序列表">
          <ListOrdered :size="16" />
        </button>
        <button class="btn btn-invisible btn-sm" @click="insertLink()" aria-label="链接">
          <Link :size="16" />
        </button>
        <button class="btn btn-invisible btn-sm" @click="insertImage()" aria-label="图片">
          <Image :size="16" />
        </button>
        <button class="btn btn-invisible btn-sm" @click="insertCodeBlock()" aria-label="代码块">
          <Code :size="16" />
        </button>
      </span>
    </div>

    <!-- WYSIWYG Content Area -->
    <div 
      ref="editorContent"
      class="wysiwyg-content markdown-body"
      contenteditable="true"
      @input="handleInput"
      @paste="handlePaste"
      @keydown="handleKeydown"
      @keyup="handleKeyup"
      v-html="htmlContent"
    ></div>
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
      debounceTimer: null
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
    // Convert Markdown to HTML for WYSIWYG display
    markdownToHtml(markdown) {
      if (!markdown) return ''
      
      // Use the parent's get_md method for consistency with the preview
      if (this.$parent && this.$parent.get_md) {
        const html = this.$parent.get_md(markdown)
        
        // Clean up the HTML for WYSIWYG editing
        return this.cleanHtmlForWysiwyg(html)
      }
      
      // Fallback basic conversion (kept for safety)
      return this.basicMarkdownToHtml(markdown)
    },

    // Clean HTML output from MarkdownIt for WYSIWYG editing
    cleanHtmlForWysiwyg(html) {
      // Remove or modify elements that don't work well in contenteditable
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      
      // Handle code blocks with line numbers (from MarkdownIt highlight.js setup)
      const codeBlocks = tempDiv.querySelectorAll('pre.hljs')
      codeBlocks.forEach(pre => {
        const ol = pre.querySelector('ol')
        if (ol) {
          // Convert numbered code lines back to simple code block
          const code = pre.querySelector('code')
          if (code) {
            const lines = Array.from(ol.querySelectorAll('li')).map(li => li.textContent).join('\n')
            code.innerHTML = ''
            code.textContent = lines
            // Remove the ol and replace with simple text
            ol.remove()
          }
        }
      })

      // Handle task lists (convert to regular lists for editing)
      const taskItems = tempDiv.querySelectorAll('li.task-list-item input[type="checkbox"]')
      taskItems.forEach(checkbox => {
        const li = checkbox.closest('li')
        const checked = checkbox.checked
        // Replace checkbox with text representation
        checkbox.remove()
        li.textContent = (checked ? '[x] ' : '[ ] ') + li.textContent
      })

      return tempDiv.innerHTML
    },

    // Basic Markdown to HTML conversion (fallback)
    basicMarkdownToHtml(markdown) {
      let html = markdown
        // Headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        
        // Bold and Italic
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        
        // Strikethrough
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        
        // Images
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />')
        
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        
        // Code blocks
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        
        // Line breaks
        .replace(/\n/g, '<br>')
        
        // Simple lists (basic implementation)
        .replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>')
        .replace(/^\d+\. (.*$)/gm, '<ol><li>$1</li></ol>')
      
      return html
    },

    // Convert HTML back to Markdown
    htmlToMarkdown(html) {
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      
      // Clean up the HTML first
      this.preprocessHtmlForConversion(tempDiv)
      
      let markdown = this.domToMarkdown(tempDiv).trim()
      
      // Clean up the final markdown
      markdown = markdown
        .replace(/\n\n\n+/g, '\n\n')  // Remove excessive line breaks
        .replace(/^\n+|\n+$/g, '')     // Remove leading/trailing newlines
        .replace(/\n\n$/, '\n')        // Remove final double newline
      
      return markdown
    },

    // Preprocess HTML before conversion to clean up contenteditable artifacts
    preprocessHtmlForConversion(container) {
      // Remove empty paragraphs and divs
      const emptyElements = container.querySelectorAll('p:empty, div:empty')
      emptyElements.forEach(el => el.remove())
      
      // Convert <div> elements to <p> for better Markdown conversion
      const divs = container.querySelectorAll('div')
      divs.forEach(div => {
        if (!div.querySelector('div, p, ul, ol, pre, blockquote, h1, h2, h3, h4, h5, h6')) {
          // This div only contains inline content, convert to paragraph
          const p = document.createElement('p')
          p.innerHTML = div.innerHTML
          div.parentNode.replaceChild(p, div)
        }
      })
      
      // Merge consecutive line breaks
      const textNodes = this.getTextNodes(container)
      textNodes.forEach(node => {
        node.textContent = node.textContent.replace(/\n\s*\n/g, '\n')
      })
    },

    // Get all text nodes in a container
    getTextNodes(container) {
      const textNodes = []
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null,
        false
      )
      
      let node
      while (node = walker.nextNode()) {
        textNodes.push(node)
      }
      
      return textNodes
    },

    // Convert DOM node to Markdown recursively
    domToMarkdown(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent
      }
      
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return ''
      }
      
      const tagName = node.tagName.toLowerCase()
      let result = ''
      
      switch (tagName) {
        case 'h1':
          result = '# ' + this.getInnerMarkdown(node) + '\n\n'
          break
        case 'h2':
          result = '## ' + this.getInnerMarkdown(node) + '\n\n'
          break
        case 'h3':
          result = '### ' + this.getInnerMarkdown(node) + '\n\n'
          break
        case 'h4':
          result = '#### ' + this.getInnerMarkdown(node) + '\n\n'
          break
        case 'h5':
          result = '##### ' + this.getInnerMarkdown(node) + '\n\n'
          break
        case 'h6':
          result = '###### ' + this.getInnerMarkdown(node) + '\n\n'
          break
        case 'strong':
        case 'b':
          result = '**' + this.getInnerMarkdown(node) + '**'
          break
        case 'em':
        case 'i':
          result = '*' + this.getInnerMarkdown(node) + '*'
          break
        case 'del':
        case 's':
          result = '~~' + this.getInnerMarkdown(node) + '~~'
          break
        case 'u':
          // HTML underline doesn't have direct Markdown equivalent, use HTML
          result = '<u>' + this.getInnerMarkdown(node) + '</u>'
          break
        case 'code':
          // Check if this is inline code or part of a pre block
          if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'pre') {
            return node.textContent // Handle as part of code block
          }
          result = '`' + node.textContent + '`'
          break
        case 'pre':
          const codeElement = node.querySelector('code')
          if (codeElement) {
            const language = this.extractLanguageFromClass(codeElement.className)
            const codeContent = codeElement.textContent
            result = '```' + language + '\n' + codeContent + '\n```\n\n'
          } else {
            result = '```\n' + node.textContent + '\n```\n\n'
          }
          break
        case 'a':
          const href = node.getAttribute('href') || ''
          result = '[' + this.getInnerMarkdown(node) + '](' + href + ')'
          break
        case 'img':
          const src = node.getAttribute('src') || ''
          const alt = node.getAttribute('alt') || ''
          result = '![' + alt + '](' + src + ')'
          break
        case 'ul':
          result = this.convertList(node, false) + '\n'
          break
        case 'ol':
          result = this.convertList(node, true) + '\n'
          break
        case 'li':
          result = this.getInnerMarkdown(node)
          break
        case 'br':
          result = '\n'
          break
        case 'p':
          const innerContent = this.getInnerMarkdown(node).trim()
          if (innerContent) {
            result = innerContent + '\n\n'
          }
          break
        case 'blockquote':
          const lines = this.getInnerMarkdown(node).split('\n').filter(line => line.trim())
          result = lines.map(line => '> ' + line).join('\n') + '\n\n'
          break
        case 'hr':
          result = '---\n\n'
          break
        case 'table':
          result = this.convertTable(node) + '\n\n'
          break
        case 'div':
          // Handle div as paragraph-like content, but be careful about nested structure
          const innerContent = this.getInnerMarkdown(node)
          if (innerContent.trim()) {
            result = innerContent + '\n\n'
          }
          break
        case 'span':
          // Handle special span cases (math formulas, etc.)
          if (node.classList.contains('katex') || node.classList.contains('katex-display')) {
            // Try to extract original LaTeX from data attributes or reconstruct
            result = this.extractMathFormula(node)
          } else {
            result = this.getInnerMarkdown(node)
          }
          break
        default:
          result = this.getInnerMarkdown(node)
          break
      }
      
      return result
    },

    // Extract math formula from KaTeX rendered element
    extractMathFormula(katexElement) {
      // Try to find original LaTeX in data attributes
      const annotation = katexElement.querySelector('.katex-html annotation')
      if (annotation) {
        const isDisplayMode = katexElement.classList.contains('katex-display')
        const formula = annotation.textContent
        return isDisplayMode ? `$$${formula}$$` : `$${formula}$`
      }
      
      // Fallback to placeholder
      return '$formula$'
    },

    // Convert table to Markdown
    convertTable(tableElement) {
      const rows = Array.from(tableElement.querySelectorAll('tr'))
      if (rows.length === 0) return ''
      
      const markdownRows = []
      
      rows.forEach((row, rowIndex) => {
        const cells = Array.from(row.querySelectorAll('th, td'))
        const cellContents = cells.map(cell => this.getInnerMarkdown(cell).trim())
        markdownRows.push('| ' + cellContents.join(' | ') + ' |')
        
        // Add separator after header row
        if (rowIndex === 0 && row.querySelector('th')) {
          const separator = '| ' + cells.map(() => '---').join(' | ') + ' |'
          markdownRows.push(separator)
        }
      })
      
      return markdownRows.join('\n')
    },
      }
      
      return result
    },

    // Extract language from code element class
    extractLanguageFromClass(className) {
      const match = className.match(/(?:language-|hljs-)(\w+)/)
      return match ? match[1] : ''
    },

    // Convert list elements to Markdown
    convertList(listElement, isOrdered) {
      const items = Array.from(listElement.children).filter(child => 
        child.tagName.toLowerCase() === 'li'
      )
      
      return items.map((li, index) => {
        const prefix = isOrdered ? `${index + 1}. ` : '- '
        const content = this.getInnerMarkdown(li).trim()
        return prefix + content
      }).join('\n')
    },

    // Get markdown content from child nodes
    getInnerMarkdown(node) {
      let result = ''
      for (const child of node.childNodes) {
        result += this.domToMarkdown(child)
      }
      return result.replace(/\n\n+/g, '\n\n').trim()
    },

    // Handle input events
    handleInput() {
      this.debouncedConvertToMarkdown()
    },

    // Handle paste events
    handlePaste(event) {
      event.preventDefault()
      
      const clipboardData = event.clipboardData || window.clipboardData
      
      // Try to get HTML content first (for rich paste)
      const htmlData = clipboardData.getData('text/html')
      const textData = clipboardData.getData('text/plain')
      
      if (htmlData && htmlData.trim()) {
        // Process rich content
        this.processRichPaste(htmlData)
      } else {
        // Insert plain text
        document.execCommand('insertText', false, textData)
      }
      
      this.debouncedConvertToMarkdown()
    },

    // Process rich content paste
    processRichPaste(html) {
      // Create a temporary container to clean the HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      
      // Clean up the pasted content
      this.cleanPastedHtml(tempDiv)
      
      // Insert the cleaned content
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        
        // Insert each child of the temp div
        const fragment = document.createDocumentFragment()
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild)
        }
        
        range.insertNode(fragment)
      }
    },

    // Clean pasted HTML content
    cleanPastedHtml(container) {
      // Remove unwanted elements and attributes
      const unwantedElements = container.querySelectorAll('script, style, meta, link')
      unwantedElements.forEach(el => el.remove())
      
      // Remove all style attributes
      const elementsWithStyle = container.querySelectorAll('[style]')
      elementsWithStyle.forEach(el => el.removeAttribute('style'))
      
      // Remove class attributes except for code language classes
      const elementsWithClass = container.querySelectorAll('[class]')
      elementsWithClass.forEach(el => {
        const classes = el.className
        if (!classes.includes('language-') && !classes.includes('hljs')) {
          el.removeAttribute('class')
        }
      })
      
      // Convert common formatting elements
      this.normalizeFormattingElements(container)
    },

    // Normalize formatting elements from different sources
    normalizeFormattingElements(container) {
      // Convert <b> to <strong>
      const boldElements = container.querySelectorAll('b')
      boldElements.forEach(b => {
        const strong = document.createElement('strong')
        strong.innerHTML = b.innerHTML
        b.parentNode.replaceChild(strong, b)
      })
      
      // Convert <i> to <em>
      const italicElements = container.querySelectorAll('i')
      italicElements.forEach(i => {
        const em = document.createElement('em')
        em.innerHTML = i.innerHTML
        i.parentNode.replaceChild(em, i)
      })
      
      // Handle Word-style formatting
      const spans = container.querySelectorAll('span')
      spans.forEach(span => {
        // If span has no meaningful attributes, unwrap it
        if (!span.hasAttribute('class') && !span.hasAttribute('id')) {
          const parent = span.parentNode
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span)
          }
          parent.removeChild(span)
        }
      })
    },

    // Handle keydown events
    handleKeydown(event) {
      // Handle shortcuts
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
        }
      }
    },

    // Handle keyup events
    handleKeyup() {
      this.debouncedConvertToMarkdown()
    },

    // Debounced conversion to avoid frequent updates
    debouncedConvertToMarkdown() {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }
      
      this.debounceTimer = setTimeout(() => {
        this.convertToMarkdown()
      }, 300)
    },

    // Convert current HTML content to Markdown
    convertToMarkdown() {
      if (this.isConverting) return
      
      this.isConverting = true
      const markdown = this.htmlToMarkdown(this.$refs.editorContent.innerHTML)
      this.$emit('update:modelValue', markdown)
      
      // Reset flag after a brief delay
      setTimeout(() => {
        this.isConverting = false
      }, 100)
    },

    // Format text (bold, italic, etc.)
    formatText(command) {
      document.execCommand(command, false, null)
      this.debouncedConvertToMarkdown()
    },

    // Format heading
    formatHeading(level) {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        
        // Find the closest block element
        let targetElement = range.commonAncestorContainer
        if (targetElement.nodeType === Node.TEXT_NODE) {
          targetElement = targetElement.parentElement
        }
        
        // Find the actual block element (p, h1-h6, div, etc.)
        while (targetElement && targetElement !== this.$refs.editorContent) {
          if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV'].includes(targetElement.tagName)) {
            break
          }
          targetElement = targetElement.parentElement
        }
        
        if (targetElement && targetElement !== this.$refs.editorContent) {
          const content = targetElement.textContent
          const newElement = document.createElement('h' + level)
          newElement.textContent = content
          
          // Replace the element
          targetElement.parentNode.replaceChild(newElement, targetElement)
          
          // Restore selection
          const newRange = document.createRange()
          newRange.selectNodeContents(newElement)
          selection.removeAllRanges()
          selection.addRange(newRange)
        } else {
          // No block element found, create a new heading
          const headingText = selection.toString() || 'New Heading'
          const heading = document.createElement('h' + level)
          heading.textContent = headingText
          
          if (selection.toString()) {
            range.deleteContents()
          }
          range.insertNode(heading)
          
          // Position cursor after the heading
          const newRange = document.createRange()
          newRange.setStartAfter(heading)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      }
      
      this.debouncedConvertToMarkdown()
    },

    // Insert list
    insertList(type) {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        
        // Check if we're already in a list
        let currentList = null
        let element = range.commonAncestorContainer
        
        while (element && element !== this.$refs.editorContent) {
          if (element.tagName === 'UL' || element.tagName === 'OL') {
            currentList = element
            break
          }
          element = element.parentElement
        }
        
        if (currentList) {
          // Already in a list, add new item
          const newItem = document.createElement('li')
          newItem.textContent = '新列表项'
          currentList.appendChild(newItem)
          
          // Position cursor in new item
          const newRange = document.createRange()
          newRange.selectNodeContents(newItem)
          selection.removeAllRanges()
          selection.addRange(newRange)
        } else {
          // Create new list
          const listElement = document.createElement(type)
          const listItem = document.createElement('li')
          
          const selectedText = selection.toString()
          listItem.textContent = selectedText || '列表项'
          listElement.appendChild(listItem)
          
          if (selectedText) {
            range.deleteContents()
          }
          range.insertNode(listElement)
          
          // Position cursor in the list item
          const newRange = document.createRange()
          newRange.selectNodeContents(listItem)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      }
      
      this.debouncedConvertToMarkdown()
    },

    // Insert link
    insertLink() {
      const selection = window.getSelection()
      const selectedText = selection.toString()
      
      const url = prompt('请输入链接地址:')
      if (url) {
        const linkText = selectedText || prompt('请输入链接文本:') || '链接文本'
        const link = document.createElement('a')
        link.href = url
        link.textContent = linkText
        
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          if (selectedText) {
            range.deleteContents()
          }
          range.insertNode(link)
          
          // Position cursor after link
          const newRange = document.createRange()
          newRange.setStartAfter(link)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
        
        this.debouncedConvertToMarkdown()
      }
    },

    // Insert image
    insertImage() {
      const url = prompt('请输入图片地址:')
      if (url) {
        const alt = prompt('请输入图片描述:') || '图片'
        const img = document.createElement('img')
        img.src = url
        img.alt = alt
        img.style.maxWidth = '100%'
        
        const selection = window.getSelection()
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.insertNode(img)
          
          // Position cursor after image
          const newRange = document.createRange()
          newRange.setStartAfter(img)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
        
        this.debouncedConvertToMarkdown()
      }
    },

    // Insert code block
    insertCodeBlock() {
      const language = prompt('请输入代码语言 (可选):') || ''
      const code = prompt('请输入代码内容:') || 'console.log("Hello World")'
      
      const pre = document.createElement('pre')
      const codeElement = document.createElement('code')
      
      if (language) {
        codeElement.className = 'language-' + language
      }
      codeElement.textContent = code
      pre.appendChild(codeElement)
      
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.insertNode(pre)
        
        // Position cursor after code block
        const newRange = document.createRange()
        newRange.setStartAfter(pre)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
      
      this.debouncedConvertToMarkdown()
    }
}
</script>

<style scoped>
.wysiwyg-editor {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  overflow: hidden;
}

.wysiwyg-toolbar {
  background-color: #f6f8fa;
  border-bottom: 1px solid #d0d7de;
  padding: 8px 16px;
}

.wysiwyg-content {
  min-height: 300px;
  padding: 16px;
  outline: none;
  line-height: 1.5;
}

.wysiwyg-content:focus {
  outline: none;
}

/* Ensure proper styling for WYSIWYG content */
.wysiwyg-content h1,
.wysiwyg-content h2,
.wysiwyg-content h3,
.wysiwyg-content h4,
.wysiwyg-content h5,
.wysiwyg-content h6 {
  margin-top: 0;
  margin-bottom: 16px;
}

.wysiwyg-content p {
  margin-bottom: 16px;
}

.wysiwyg-content ul,
.wysiwyg-content ol {
  margin-bottom: 16px;
  padding-left: 24px;
}

.wysiwyg-content pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.wysiwyg-content code {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 85%;
}

.wysiwyg-content img {
  max-width: 100%;
  height: auto;
}

.wysiwyg-content a {
  color: #0969da;
  text-decoration: none;
}

.wysiwyg-content a:hover {
  text-decoration: underline;
}
</style>