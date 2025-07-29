<template>
  <div
    ref="editor"
    contenteditable="true"
    @input="handleInput"
    @keydown="handleKeydown"
    @keyup="handleKeyup"
    @paste="handlePaste"
    @focus="handleFocus"
    @blur="handleBlur"
    @click="handleClick"
    @selectionchange="handleSelectionChange"
    v-html="htmlContent"
    class="wysiwyg-editor"
    style="min-height: 250px; padding: 15px; border: 1px solid #d1d9e0; border-radius: 6px; outline: none; overflow-y: auto;"
  ></div>
</template>

<script>
import TurndownService from 'turndown'
import { debounce } from 'lodash-es'

export default {
  name: 'WysiwygEditor',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    getMarkdownRenderer: {
      type: Function,
      required: true
    }
  },
  emits: ['update:modelValue', 'cursor-moved', 'selection-changed'],
  data() {
    return {
      htmlContent: '',
      turndownService: null,
      isUpdating: false,
      lastCaretPosition: null,
      debouncedUpdate: null,
      userMovedCursor: false,
      debounceTimeout: null,
      lastInputTime: 0,
      cursorMoveTimeout: null
    }
  },
  created() {
    // Initialize Turndown service for HTML to Markdown conversion
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined'
    })

    // Add custom rules for special elements
    this.setupTurndownRules()
    
    // Initialize optimized debounced update function
    this.debouncedUpdate = debounce(this.performContentUpdate, 300)
  },
  mounted() {
    // Initial conversion from Markdown to HTML
    this.updateHtmlContent()
    
    // Add selection change listener for cursor tracking
    document.addEventListener('selectionchange', this.handleDocumentSelectionChange)
  },
  beforeUnmount() {
    // Clean up listeners and timers
    document.removeEventListener('selectionchange', this.handleDocumentSelectionChange)
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }
    if (this.cursorMoveTimeout) {
      clearTimeout(this.cursorMoveTimeout)
    }
  },
  watch: {
    modelValue: {
      handler(newValue) {
        if (!this.isUpdating) {
          this.updateHtmlContent()
        }
      },
      immediate: true
    }
  },
  methods: {
    setupTurndownRules() {
      // Custom rule for task lists
      this.turndownService.addRule('taskList', {
        filter: function (node) {
          return node.type === 'checkbox' || 
                 (node.nodeName === 'INPUT' && node.type === 'checkbox')
        },
        replacement: function (content, node) {
          return node.checked ? '- [x] ' : '- [ ] '
        }
      })

      // Custom rule for math formulas
      this.turndownService.addRule('mathFormula', {
        filter: function (node) {
          return node.classList && (
            node.classList.contains('katex') ||
            node.classList.contains('katex-display') ||
            node.classList.contains('katex-inline')
          )
        },
        replacement: function (content, node) {
          const annotation = node.querySelector('.katex-mathml annotation')
          if (annotation) {
            const isBlock = node.classList.contains('katex-display')
            const formula = annotation.textContent
            return isBlock ? `\n$$\n${formula}\n$$\n` : `$${formula}$`
          }
          return content
        }
      })

      // Custom rule for code blocks
      this.turndownService.addRule('codeBlock', {
        filter: function (node) {
          return node.nodeName === 'PRE' && node.firstChild && node.firstChild.nodeName === 'CODE'
        },
        replacement: function (content, node) {
          const className = node.firstChild.className || ''
          const language = className.replace(/hljs|language-/g, '').trim()
          const code = node.firstChild.textContent
          return `\n\`\`\`${language}\n${code}\n\`\`\`\n`
        }
      })

      // Custom rule for highlights
      this.turndownService.addRule('highlight', {
        filter: ['mark'],
        replacement: function (content) {
          return `<mark>${content}</mark>`
        }
      })
    },

    updateHtmlContent() {
      if (this.modelValue) {
        const processedMarkdown = this.processEmptyLines(this.modelValue)
        this.htmlContent = this.getMarkdownRenderer()(processedMarkdown)
      } else {
        this.htmlContent = ''
      }
    },

    processEmptyLines(markdown) {
      // Convert empty lines to ensure they are editable in WYSIWYG mode
      return markdown.replace(/\n\s*\n/g, '\n\n')
    },

    // 修复1: 优化防抖逻辑，在用户主动移动光标时取消防抖
    handleInput(event) {
      if (this.isUpdating) return

      const currentTime = Date.now()
      this.lastInputTime = currentTime
      
      // 保存光标位置 - 立即保存，不等待防抖
      this.saveCaretPosition()
      
      // 检查是否为用户输入还是程序更新
      if (!this.userMovedCursor) {
        // 实时渲染检测 - 优先级5: 实现更智能的实时渲染触发机制
        this.detectAndConvertMarkdown(event)
      }
      
      // 重置用户移动光标标志
      this.userMovedCursor = false
      
      // 使用优化的防抖更新
      this.debouncedUpdate(event.target.innerHTML)
    },

    // 检测用户主动移动光标
    handleClick(event) {
      this.userMovedCursor = true
      this.cancelDebounceIfNeeded()
      this.saveCaretPosition()
      this.emitSelectionChange()
    },

    handleKeydown(event) {
      // 检测光标移动按键
      const cursorKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']
      if (cursorKeys.includes(event.key)) {
        this.userMovedCursor = true
        this.cancelDebounceIfNeeded()
      }
      
      // 实时渲染触发 - 优先级5: 识别Markdown语法模式并即时转换
      if (event.key === ' ' || event.key === 'Enter') {
        // 延迟一点以确保内容已更新
        setTimeout(() => {
          this.detectAndConvertMarkdown(event)
        }, 50)
      }
    },

    handleKeyup(event) {
      // 保存光标位置并发送选择变化事件
      this.saveCaretPosition()
      this.emitSelectionChange()
    },

    handleDocumentSelectionChange() {
      // 只处理当前编辑器的选择变化
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const container = range.commonAncestorContainer
        
        // 检查选择是否在当前编辑器内
        if (this.$refs.editor && this.$refs.editor.contains(container)) {
          this.userMovedCursor = true
          this.cancelDebounceIfNeeded()
          this.saveCaretPosition()
          this.emitSelectionChange()
        }
      }
    },

    // 取消防抖如果用户主动移动了光标
    cancelDebounceIfNeeded() {
      if (this.userMovedCursor && this.debouncedUpdate) {
        this.debouncedUpdate.cancel()
      }
    },

    // 优化的内容更新函数
    performContentUpdate(htmlContent) {
      // 如果用户在防抖期间移动了光标，不执行更新
      if (this.userMovedCursor) {
        this.userMovedCursor = false
        return
      }

      // Convert HTML back to Markdown
      const markdownContent = this.turndownService.turndown(htmlContent)
      
      this.isUpdating = true
      this.$emit('update:modelValue', markdownContent)
      
      // 智能光标位置恢复
      this.$nextTick(() => {
        setTimeout(() => {
          this.isUpdating = false
          if (!this.userMovedCursor) {
            this.restoreCaretPosition()
          }
        }, 100)
      })
    },

    // 优先级5: 实时渲染机制 - 类似Typora的实时渲染
    detectAndConvertMarkdown(event) {
      const selection = window.getSelection()
      if (!selection.rangeCount) return

      const range = selection.getRangeAt(0)
      const container = range.startContainer
      
      if (container.nodeType !== Node.TEXT_NODE) return

      const text = container.textContent
      const cursorPos = range.startOffset

      // 定义Markdown模式
      const patterns = [
        // 标题模式
        { regex: /^(#{1,6})\s+(.+)$/, replacement: (match, hashes, content) => {
          const level = hashes.length
          return `<h${level}>${content}</h${level}>`
        }},
        // 粗体模式
        { regex: /\*\*([^*]+)\*\*(\s|$)/, replacement: (match, content, space) => {
          return `<strong>${content}</strong>${space}`
        }},
        // 斜体模式
        { regex: /\*([^*]+)\*(\s|$)/, replacement: (match, content, space) => {
          return `<em>${content}</em>${space}`
        }},
        // 删除线模式
        { regex: /~~([^~]+)~~(\s|$)/, replacement: (match, content, space) => {
          return `<del>${content}</del>${space}`
        }},
        // 单行代码模式
        { regex: /`([^`]+)`(\s|$)/, replacement: (match, content, space) => {
          return `<code>${content}</code>${space}`
        }},
        // 链接模式
        { regex: /\[([^\]]+)\]\(([^)]+)\)(\s|$)/, replacement: (match, text, url, space) => {
          return `<a href="${url}">${text}</a>${space}`
        }}
      ]

      // 检查每个模式
      for (const pattern of patterns) {
        const match = text.match(pattern.regex)
        if (match) {
          // 只有在光标位于匹配文本末尾时才转换
          const matchEnd = text.indexOf(match[0]) + match[0].length
          if (cursorPos >= matchEnd) {
            this.convertMatchedPattern(container, match, pattern.replacement)
            break
          }
        }
      }
    },

    convertMatchedPattern(container, match, replacement) {
      try {
        const text = container.textContent
        const matchIndex = text.indexOf(match[0])
        const newHtml = replacement(...match)
        
        // 创建新的HTML内容
        const beforeText = text.substring(0, matchIndex)
        const afterText = text.substring(matchIndex + match[0].length)
        
        // 替换内容
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = beforeText + newHtml + afterText
        
        // 更新容器内容
        const parent = container.parentNode
        parent.innerHTML = tempDiv.innerHTML
        
        // 重新定位光标
        this.repositionCursorAfterConversion(parent, beforeText.length + newHtml.length)
        
      } catch (error) {
        console.warn('Markdown conversion error:', error)
      }
    },

    repositionCursorAfterConversion(parent, targetOffset) {
      try {
        const walker = document.createTreeWalker(
          parent,
          NodeFilter.SHOW_TEXT,
          null,
          false
        )
        
        let currentOffset = 0
        let node = walker.nextNode()
        
        while (node) {
          const nodeLength = node.textContent.length
          if (currentOffset + nodeLength >= targetOffset) {
            const range = document.createRange()
            const selection = window.getSelection()
            range.setStart(node, targetOffset - currentOffset)
            range.collapse(true)
            selection.removeAllRanges()
            selection.addRange(range)
            break
          }
          currentOffset += nodeLength
          node = walker.nextNode()
        }
      } catch (error) {
        console.warn('Cursor repositioning error:', error)
      }
    },

    handlePaste(event) {
      event.preventDefault()
      
      const clipboardData = event.clipboardData || window.clipboardData
      const pastedText = clipboardData.getData('text/plain')
      
      // Insert as plain text
      document.execCommand('insertText', false, pastedText)
      
      // Trigger input event
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }))
    },

    handleFocus() {
      // 确保空内容有适当的占位符用于编辑
      if (!this.htmlContent.trim() || this.htmlContent === '<br>') {
        this.$refs.editor.innerHTML = '<p><br></p>'
      }
    },

    handleBlur() {
      // 清理空段落
      const content = this.$refs.editor.innerHTML
      if (content === '<p><br></p>' || content === '<br>') {
        this.$refs.editor.innerHTML = ''
        this.$emit('update:modelValue', '')
      }
    },

    // 增强的光标位置保存机制
    saveCaretPosition() {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        
        // 多重备用策略的光标位置保存
        this.lastCaretPosition = {
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset,
          // 额外的上下文信息
          textContent: range.startContainer.textContent,
          containerIndex: this.getNodeIndex(range.startContainer),
          parentElement: range.startContainer.parentElement,
          // 文档级别偏移量作为备用方案
          documentOffset: this.getDocumentOffset(range.startContainer, range.startOffset),
          // 保存时间戳
          timestamp: Date.now()
        }
      }
    },

    getDocumentOffset(node, offset) {
      if (!this.$refs.editor) return 0
      
      try {
        const range = document.createRange()
        range.setStart(this.$refs.editor, 0)
        range.setEnd(node, offset)
        const contents = range.toString()
        return contents.length
      } catch (error) {
        return 0
      }
    },

    getNodeIndex(node) {
      if (!node || !node.parentNode) return -1
      return Array.from(node.parentNode.childNodes).indexOf(node)
    },

    // 智能光标位置恢复
    restoreCaretPosition() {
      if (this.lastCaretPosition && this.$refs.editor) {
        try {
          const selection = window.getSelection()
          const range = document.createRange()
          
          // 首先尝试使用原始节点
          if (this.isValidNode(this.lastCaretPosition.startContainer)) {
            range.setStart(this.lastCaretPosition.startContainer, this.lastCaretPosition.startOffset)
            range.setEnd(this.lastCaretPosition.endContainer, this.lastCaretPosition.endOffset)
          } else {
            // 备用方案：使用文档偏移量
            const restoredPosition = this.findPositionByOffset(this.lastCaretPosition.documentOffset)
            if (restoredPosition) {
              range.setStart(restoredPosition.container, restoredPosition.offset)
              range.collapse(true)
            } else {
              // 最后备用方案：定位到编辑器末尾
              this.focusAtEnd()
              return
            }
          }
          
          selection.removeAllRanges()
          selection.addRange(range)
        } catch (error) {
          console.warn('Failed to restore caret position:', error)
          this.focusAtEnd()
        }
      }
    },

    findPositionByOffset(targetOffset) {
      if (!this.$refs.editor) return null
      
      try {
        const walker = document.createTreeWalker(
          this.$refs.editor,
          NodeFilter.SHOW_TEXT,
          null,
          false
        )
        
        let currentOffset = 0
        let node
        
        while (node = walker.nextNode()) {
          const nodeLength = node.textContent.length
          if (currentOffset + nodeLength >= targetOffset) {
            const offset = targetOffset - currentOffset
            return { container: node, offset: Math.min(offset, nodeLength) }
          }
          currentOffset += nodeLength
        }
        
        // 如果偏移量超出内容，定位到末尾
        const lastNode = this.getLastTextNode()
        if (lastNode) {
          return { container: lastNode, offset: lastNode.textContent.length }
        }
      } catch (error) {
        console.warn('Error finding position by offset:', error)
      }
      
      return null
    },

    getLastTextNode() {
      const walker = document.createTreeWalker(
        this.$refs.editor,
        NodeFilter.SHOW_TEXT,
        null,
        false
      )
      
      let lastNode = null
      let node
      while (node = walker.nextNode()) {
        lastNode = node
      }
      
      return lastNode
    },

    focusAtEnd() {
      if (!this.$refs.editor) return
      
      this.$refs.editor.focus()
      const range = document.createRange()
      range.selectNodeContents(this.$refs.editor)
      range.collapse(false)
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    },

    isValidNode(node) {
      return node && 
             node.parentNode && 
             this.$refs.editor && 
             this.$refs.editor.contains(node)
    },

    // 优先级2: 工具栏按钮集成
    insertMarkdown(markdownText) {
      const selection = window.getSelection()
      if (!selection.rangeCount) {
        this.$refs.editor.focus()
        return
      }

      const range = selection.getRangeAt(0)
      
      // 处理不同类型的markdown插入
      if (markdownText.startsWith('# ')) {
        this.toggleHeading()
        return
      }
      
      // 检查是否为成对分隔符（如 ** 用于粗体）
      const pairedDelimiters = ['**', '*', '`', '~~']
      const isPaired = pairedDelimiters.some(delimiter => markdownText === delimiter + delimiter)
      
      if (isPaired) {
        const delimiter = markdownText.substring(0, markdownText.length / 2)
        
        if (delimiter === '**') {
          document.execCommand('bold', false, null)
        } else if (delimiter === '*') {
          document.execCommand('italic', false, null)
        } else {
          this.wrapSelectionWithDelimiters(delimiter, range)
        }
      } else {
        this.insertTextAtCurrentPosition(markdownText, range)
      }
      
      // 触发输入事件以更新内容
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }))
    },

    wrapSelectionWithDelimiters(delimiter, range) {
      if (!range.collapsed) {
        // 包装选中的文本
        const selectedText = range.toString()
        range.deleteContents()
        
        const wrappedText = delimiter + selectedText + delimiter
        const textNode = document.createTextNode(wrappedText)
        range.insertNode(textNode)
        
        // 将光标定位在包装文本之后
        const newRange = document.createRange()
        newRange.setStartAfter(textNode)
        newRange.collapse(true)
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(newRange)
      } else {
        // 没有选中文本，插入分隔符并将光标定位在中间
        const leftDelimiter = document.createTextNode(delimiter)
        const rightDelimiter = document.createTextNode(delimiter)
        
        range.insertNode(leftDelimiter)
        range.insertNode(rightDelimiter)
        
        // 将光标定位在分隔符之间
        const newRange = document.createRange()
        newRange.setStart(rightDelimiter, 0)
        newRange.collapse(true)
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    },

    insertTextAtCurrentPosition(text, range) {
      const textNode = document.createTextNode(text)
      range.deleteContents()
      range.insertNode(textNode)
      
      // 将光标定位在插入文本之后
      const newRange = document.createRange()
      newRange.setStartAfter(textNode)
      newRange.collapse(true)
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(newRange)
    },

    // 优先级4: 标题按钮功能 - 循环切换h1-h6
    toggleHeading() {
      const selection = window.getSelection()
      if (!selection.rangeCount) return
      
      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      
      // 找到当前块元素
      let blockElement = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container
      
      // 向上查找标题或段落
      while (blockElement && blockElement !== this.$refs.editor) {
        if (/^H[1-6]$/i.test(blockElement.tagName) || blockElement.tagName === 'P') {
          break
        }
        blockElement = blockElement.parentElement
      }
      
      if (!blockElement || blockElement === this.$refs.editor) {
        // 没有找到合适的块，创建新标题
        document.execCommand('formatBlock', false, 'h1')
        return
      }
      
      // 确定下一个标题级别
      let nextLevel = 1
      if (/^H([1-6])$/i.test(blockElement.tagName)) {
        const currentLevel = parseInt(blockElement.tagName.substring(1))
        nextLevel = currentLevel >= 6 ? 1 : currentLevel + 1
      }
      
      // 格式化为标题
      document.execCommand('formatBlock', false, `h${nextLevel}`)
      
      // 发送标题级别变化事件
      this.$emit('heading-changed', nextLevel)
    },

    // 获取当前标题级别
    getCurrentHeadingLevel() {
      const selection = window.getSelection()
      if (!selection.rangeCount) return 0
      
      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      
      let element = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container
      
      while (element && element !== this.$refs.editor) {
        if (/^H([1-6])$/i.test(element.tagName)) {
          return parseInt(element.tagName.substring(1))
        }
        element = element.parentElement
      }
      
      return 0
    },

    // 获取当前样式状态 - 优先级3: 样式按钮开关状态
    getCurrentStyles() {
      const selection = window.getSelection()
      if (!selection.rangeCount) {
        return {
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          code: false
        }
      }
      
      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      
      let element = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container
      
      const styles = {
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        code: false
      }
      
      // 检查所有父元素的样式
      while (element && element !== this.$refs.editor) {
        const tagName = element.tagName
        const computedStyle = window.getComputedStyle(element)
        
        if (tagName === 'STRONG' || tagName === 'B' || computedStyle.fontWeight === 'bold') {
          styles.bold = true
        }
        if (tagName === 'EM' || tagName === 'I' || computedStyle.fontStyle === 'italic') {
          styles.italic = true
        }
        if (tagName === 'U' || computedStyle.textDecoration.includes('underline')) {
          styles.underline = true
        }
        if (tagName === 'DEL' || tagName === 'S' || computedStyle.textDecoration.includes('line-through')) {
          styles.strikethrough = true
        }
        if (tagName === 'CODE') {
          styles.code = true
        }
        
        element = element.parentElement
      }
      
      return styles
    },

    // 发送选择变化事件
    emitSelectionChange() {
      // 清除之前的定时器
      if (this.cursorMoveTimeout) {
        clearTimeout(this.cursorMoveTimeout)
      }
      
      // 延迟发送事件，避免过度频繁
      this.cursorMoveTimeout = setTimeout(() => {
        const styles = this.getCurrentStyles()
        const headingLevel = this.getCurrentHeadingLevel()
        
        this.$emit('selection-changed', {
          styles,
          headingLevel
        })
      }, 100)
    }
  }
}
</script>

<style scoped>
.wysiwyg-editor {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.6;
  color: #24292f;
  background-color: #ffffff;
}

.wysiwyg-editor:focus {
  border-color: #0969da;
  box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.3);
}

.wysiwyg-editor p {
  margin: 0 0 10px 0;
}

.wysiwyg-editor h1,
.wysiwyg-editor h2,
.wysiwyg-editor h3,
.wysiwyg-editor h4,
.wysiwyg-editor h5,
.wysiwyg-editor h6 {
  margin: 16px 0 10px 0;
  font-weight: 600;
}

.wysiwyg-editor code {
  background-color: rgba(175, 184, 193, 0.2);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
}

.wysiwyg-editor pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
}

.wysiwyg-editor blockquote {
  border-left: 4px solid #d1d9e0;
  padding-left: 16px;
  margin: 0;
  color: #656d76;
}

.wysiwyg-editor a {
  color: #0969da;
  text-decoration: none;
}

.wysiwyg-editor a:hover {
  text-decoration: underline;
}

/* 确保空行可编辑 */
.wysiwyg-editor p:empty:before {
  content: '\00a0';
  color: transparent;
}

/* 数学公式样式 */
.wysiwyg-editor .katex {
  font-size: 1em;
}

.wysiwyg-editor .katex-display {
  margin: 1em 0;
  text-align: center;
}
</style>