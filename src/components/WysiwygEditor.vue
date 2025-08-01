<template>
  <div class="wysiwyg-editor">
    <!-- WYSIWYG Toolbar inspired by vditor -->
    <div class="wysiwyg-toolbar vditor-toolbar">
      <div class="vditor-toolbar__item">
        <button class="vditor-tooltipped vditor-tooltipped--n" 
                @click="formatText('bold')" 
                aria-label="粗体">
          <Bold :size="16" />
        </button>
      </div>
      <div class="vditor-toolbar__item">
        <button class="vditor-tooltipped vditor-tooltipped--n" 
                @click="formatText('italic')" 
                aria-label="斜体">
          <Italic :size="16" />
        </button>
      </div>
      <div class="vditor-toolbar__item">
        <button class="vditor-tooltipped vditor-tooltipped--n" 
                @click="formatHeading(1)" 
                aria-label="标题1">
          <Heading :size="16" />
        </button>
      </div>
      <div class="vditor-toolbar__item">
        <button class="vditor-tooltipped vditor-tooltipped--n" 
                @click="formatHeading(2)" 
                aria-label="标题2">
          <Heading :size="16" />
        </button>
      </div>
      <div class="vditor-toolbar__item">
        <button class="vditor-tooltipped vditor-tooltipped--n" 
                @click="formatText('underline')" 
                aria-label="下划线">
          <Underline :size="16" />
        </button>
      </div>
      <div class="vditor-toolbar__item">
        <button class="vditor-tooltipped vditor-tooltipped--n" 
                @click="formatText('strikethrough')" 
                aria-label="删除线">
          <Strikethrough :size="16" />
        </button>
      </div>
      <div class="vditor-toolbar__item">
        <button class="vditor-tooltipped vditor-tooltipped--n" 
                @click="insertList('ul')" 
                aria-label="无序列表">
          <List :size="16" />
        </button>
      </div>
      <div class="vditor-toolbar__item">
        <button class="vditor-tooltipped vditor-tooltipped--n" 
                @click="insertList('ol')" 
                aria-label="有序列表">
          <ListOrdered :size="16" />
        </button>
      </div>
      <div class="vditor-toolbar__item">
        <button class="vditor-tooltipped vditor-tooltipped--n" 
                @click="insertLink()" 
                aria-label="链接">
          <Link :size="16" />
        </button>
      </div>
      <div class="vditor-toolbar__item">
        <button class="vditor-tooltipped vditor-tooltipped--n" 
                @click="insertImage()" 
                aria-label="图片">
          <Image :size="16" />
        </button>
      </div>
      <div class="vditor-toolbar__item">
        <button class="vditor-tooltipped vditor-tooltipped--n" 
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
      @input="handleInput"
      @paste="handlePaste"
      @keydown="handleKeydown"
      @keyup="handleKeyup"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <div v-html="htmlContent" class="vditor-wysiwyg__block" data-block="0"></div>
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
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      
      // Process elements to make them suitable for contenteditable
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
      )
      
      let node
      while (node = walker.nextNode()) {
        // Add data attributes for better editing experience
        if (node.tagName === 'H1' || node.tagName === 'H2' || node.tagName === 'H3') {
          node.setAttribute('data-block', '0')
        } else if (node.tagName === 'P') {
          node.setAttribute('data-block', '0')
          if (!node.textContent.trim()) {
            node.innerHTML = '<br>'
          }
        } else if (node.tagName === 'UL' || node.tagName === 'OL') {
          node.setAttribute('data-block', '0')
        } else if (node.tagName === 'LI') {
          node.setAttribute('data-block', '0')
        } else if (node.tagName === 'PRE') {
          node.setAttribute('data-block', '0')
        }
      }
      
      return tempDiv.innerHTML
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
      
      let markdown = ''
      const walker = document.createTreeWalker(
        content,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
      )
      
      let node
      while (node = walker.nextNode()) {
        if (node.getAttribute('data-block') === '0') {
          const blockMarkdown = this.elementToMarkdown(node)
          if (blockMarkdown) {
            markdown += blockMarkdown + '\n\n'
          }
        }
      }
      
      return markdown.trim()
    },

    // Convert individual element to Markdown
    elementToMarkdown(element) {
      const tagName = element.tagName.toLowerCase()
      const textContent = element.textContent || ''
      
      switch (tagName) {
        case 'h1':
          return `# ${textContent}`
        case 'h2':
          return `## ${textContent}`
        case 'h3':
          return `### ${textContent}`
        case 'h4':
          return `#### ${textContent}`
        case 'h5':
          return `##### ${textContent}`
        case 'h6':
          return `###### ${textContent}`
        case 'p':
          return this.processInlineMarkdown(element)
        case 'ul':
          return this.processListMarkdown(element, false)
        case 'ol':
          return this.processListMarkdown(element, true)
        case 'pre':
          const code = element.querySelector('code')
          const language = code ? (code.className.match(/language-(\w+)/) || [])[1] || '' : ''
          return `\`\`\`${language}\n${textContent}\n\`\`\``
        case 'blockquote':
          return `> ${textContent}`
        default:
          return this.processInlineMarkdown(element)
      }
    },

    // Process inline formatting (bold, italic, etc.)
    processInlineMarkdown(element) {
      let result = ''
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_ALL,
        null,
        false
      )
      
      let node
      while (node = walker.nextNode()) {
        if (node.nodeType === Node.TEXT_NODE) {
          result += node.textContent
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase()
          const text = node.textContent
          
          switch (tagName) {
            case 'strong':
            case 'b':
              result += `**${text}**`
              break
            case 'em':
            case 'i':
              result += `*${text}*`
              break
            case 'code':
              result += `\`${text}\``
              break
            case 'a':
              const href = node.getAttribute('href') || ''
              result += `[${text}](${href})`
              break
            case 'img':
              const src = node.getAttribute('src') || ''
              const alt = node.getAttribute('alt') || ''
              result += `![${alt}](${src})`
              break
            default:
              result += text
          }
        }
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

    // Handle input events (debounced conversion)
    handleInput() {
      this.debouncedConvertToMarkdown()
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

    // Handle keydown events
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
        }
      }
      
      // Handle Enter key for lists
      if (event.key === 'Enter') {
        this.handleEnterKey(event)
      }
    },

    // Handle Enter key for better list behavior
    handleEnterKey(event) {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const listItem = range.startContainer.closest ? range.startContainer.closest('li') : null
        
        if (listItem) {
          event.preventDefault()
          
          // Create new list item
          const newListItem = document.createElement('li')
          newListItem.setAttribute('data-block', '0')
          newListItem.innerHTML = '<br>'
          
          listItem.parentNode.insertBefore(newListItem, listItem.nextSibling)
          
          // Move cursor to new list item
          const newRange = document.createRange()
          newRange.setStart(newListItem, 0)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      }
    },

    // Handle keyup events
    handleKeyup() {
      this.debouncedConvertToMarkdown()
    },

    // Handle focus events
    handleFocus() {
      // Add any focus-specific logic here
    },

    // Handle blur events
    handleBlur() {
      // Add any blur-specific logic here
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

    // Convert content and emit to parent
    convertAndEmit() {
      this.isConverting = true
      const markdown = this.convertToMarkdown()
      this.$emit('update:modelValue', markdown)
      
      setTimeout(() => {
        this.isConverting = false
      }, 100)
    },

    // Format text (bold, italic, etc.) - vditor inspired
    formatText(command) {
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      const selectedText = selection.toString()
      
      if (!selectedText) return
      
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
      
      element.textContent = selectedText
      range.deleteContents()
      range.insertNode(element)
      
      // Restore selection
      const newRange = document.createRange()
      newRange.selectNodeContents(element)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      this.debouncedConvertToMarkdown()
    },

    // Format heading - vditor inspired
    formatHeading(level) {
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      let blockElement = range.startContainer
      
      // Find the closest block element
      while (blockElement && blockElement.nodeType !== Node.ELEMENT_NODE) {
        blockElement = blockElement.parentNode
      }
      
      while (blockElement && !blockElement.getAttribute('data-block')) {
        blockElement = blockElement.parentNode
      }
      
      if (blockElement) {
        const heading = document.createElement(`h${level}`)
        heading.setAttribute('data-block', '0')
        heading.textContent = blockElement.textContent || `标题 ${level}`
        
        blockElement.parentNode.replaceChild(heading, blockElement)
        
        // Set cursor in heading
        const newRange = document.createRange()
        newRange.selectNodeContents(heading)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
      
      this.debouncedConvertToMarkdown()
    },

    // Insert list - vditor inspired
    insertList(type) {
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      const list = document.createElement(type)
      list.setAttribute('data-block', '0')
      
      const listItem = document.createElement('li')
      listItem.setAttribute('data-block', '0')
      listItem.textContent = '列表项'
      
      list.appendChild(listItem)
      range.insertNode(list)
      
      // Set cursor in list item
      const newRange = document.createRange()
      newRange.selectNodeContents(listItem)
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      this.debouncedConvertToMarkdown()
    },

    // Insert link - vditor inspired
    insertLink() {
      const selection = window.getSelection()
      const selectedText = selection.toString()
      
      const url = prompt('请输入链接地址:')
      if (!url) return
      
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
        
        // Set cursor after link
        const newRange = document.createRange()
        newRange.setStartAfter(link)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
      
      this.debouncedConvertToMarkdown()
    },

    // Insert image - vditor inspired
    insertImage() {
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
      const language = prompt('请输入代码语言 (可选):') || ''
      const code = prompt('请输入代码内容:') || 'console.log("Hello World")'
      
      const pre = document.createElement('pre')
      pre.setAttribute('data-block', '0')
      
      const codeElement = document.createElement('code')
      if (language) {
        codeElement.className = `language-${language}`
      }
      codeElement.textContent = code
      
      pre.appendChild(codeElement)
      
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.insertNode(pre)
        
        // Set cursor after code block
        const newRange = document.createRange()
        newRange.setStartAfter(pre)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
      
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