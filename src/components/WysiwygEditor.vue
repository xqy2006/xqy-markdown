<template>
  <div 
    class="wysiwyg-editor markdown-body"
    contenteditable="true"
    ref="editor"
    @input="handleInput"
    @keydown="handleKeydown"
    @paste="handlePaste"
    @focus="handleFocus"
    @blur="handleBlur"
    v-html="htmlContent"
    style="min-height: 250px; padding: 15px; border: 1px solid #d1d9e0; border-radius: 6px; outline: none;"
  ></div>
</template>

<script>
import TurndownService from 'turndown';
import { debounce } from 'lodash-es';

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
  emits: ['update:modelValue', 'style-state-update'],
  data() {
    return {
      htmlContent: '',
      turndownService: null,
      isUpdating: false,
      lastCaretPosition: null,
      debouncedUpdate: null,
      userMovedCursor: false,
      isInDebounceperiod: false,
      currentStyles: {
        bold: false,
        italic: false,
        underline: false,
        code: false,
        strikethrough: false
      },
      currentHeadingLevel: 0
    }
  },
  created() {
    // Initialize Turndown service for HTML to Markdown conversion
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      hr: '------',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full'
    });

    // Add custom rules for special elements
    this.setupTurndownRules();
    
    // Initialize debounced update function with smart cursor detection
    this.debouncedUpdate = debounce(this.performContentUpdate, 300);
  },
  mounted() {
    // Initial conversion from Markdown to HTML
    this.updateHtmlContent();
    
    // Setup cursor movement detection during debounce
    this.setupCursorMovementDetection();
    
    // Setup style state monitoring
    this.setupStyleStateMonitoring();
  },
  watch: {
    modelValue: {
      handler(newValue) {
        if (!this.isUpdating) {
          this.updateHtmlContent();
        }
      },
      immediate: true
    }
  },
  beforeUnmount() {
    // Clean up event listeners
    if (this.debouncedUpdate) {
      this.debouncedUpdate.cancel();
    }
    document.removeEventListener('selectionchange', this.handleSelectionChange);
  },
  methods: {
    setupTurndownRules() {
      // Custom rule for task lists
      this.turndownService.addRule('taskList', {
        filter: (node) => {
          return node.nodeName === 'INPUT' && node.type === 'checkbox';
        },
        replacement: (content, node) => {
          return node.checked ? '- [x] ' : '- [ ] ';
        }
      });

      // Custom rule for highlighted text
      this.turndownService.addRule('highlight', {
        filter: ['mark'],
        replacement: (content) => `<mark>${content}</mark>`
      });

      // Custom rule for underlined text
      this.turndownService.addRule('underline', {
        filter: ['u'],
        replacement: (content) => `<u>${content}</u>`
      });

      // Custom rule for colored text
      this.turndownService.addRule('coloredText', {
        filter: (node) => {
          return node.nodeName === 'FONT' && node.getAttribute('color');
        },
        replacement: (content, node) => {
          const color = node.getAttribute('color');
          return `<font color="${color}">${content}</font>`;
        }
      });

      // Custom rule for math expressions - handle both rendered and editable versions
      this.turndownService.addRule('math', {
        filter: (node) => {
          return (node.classList && (
            node.classList.contains('katex') || 
            node.classList.contains('katex-display') ||
            node.classList.contains('katex-inline') ||
            node.classList.contains('math-inline') ||
            node.classList.contains('math-block')
          ));
        },
        replacement: (content, node) => {
          // Try to get the original LaTeX from data attributes first
          const dataLatex = node.getAttribute('data-latex');
          if (dataLatex) {
            return node.classList.contains('math-block') ? `\n$$\n${dataLatex}\n$$\n` : ` $${dataLatex}$ `;
          }
          
          // Fallback: try to get from KaTeX annotation
          const annotation = node.querySelector('.katex-mathml annotation[encoding="application/x-tex"]');
          if (annotation) {
            const latex = annotation.textContent;
            return node.classList.contains('katex-display') ? `\n$$\n${latex}\n$$\n` : ` $${latex}$ `;
          }
          
          // Last fallback: extract from text content
          const textContent = node.textContent || '';
          if (textContent.startsWith('$$') && textContent.endsWith('$$')) {
            return `\n${textContent}\n`;
          } else if (textContent.startsWith('$') && textContent.endsWith('$')) {
            return ` ${textContent} `;
          }
          
          return content;
        }
      });
    },

    updateHtmlContent() {
      if (this.modelValue) {
        const processedMarkdown = this.processEmptyLines(this.modelValue);
        let htmlContent = this.getMarkdownRenderer()(processedMarkdown);
        
        // Post-process to make math formulas editable in WYSIWYG mode
        htmlContent = this.makeMatFormulasEditable(htmlContent);
        
        this.htmlContent = htmlContent;
      } else {
        this.htmlContent = '';
      }
    },

    makeMatFormulasEditable(htmlContent) {
      // Replace rendered KaTeX with editable placeholders
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // Handle inline math
      const inlineMath = tempDiv.querySelectorAll('.katex');
      inlineMath.forEach(katexElement => {
        const annotation = katexElement.querySelector('annotation[encoding="application/x-tex"]');
        if (annotation) {
          const latex = annotation.textContent;
          const mathSpan = document.createElement('span');
          mathSpan.className = 'math-inline';
          mathSpan.setAttribute('data-latex', latex);
          mathSpan.textContent = `$${latex}$`;
          mathSpan.addEventListener('click', () => this.editMathFormula(mathSpan));
          katexElement.parentNode.replaceChild(mathSpan, katexElement);
        }
      });
      
      // Handle block math  
      const blockMath = tempDiv.querySelectorAll('.katex-display');
      blockMath.forEach(katexElement => {
        const annotation = katexElement.querySelector('annotation[encoding="application/x-tex"]');
        if (annotation) {
          const latex = annotation.textContent;
          const mathDiv = document.createElement('div');
          mathDiv.className = 'math-block';
          mathDiv.setAttribute('data-latex', latex);
          mathDiv.textContent = `$$${latex}$$`;
          mathDiv.addEventListener('click', () => this.editMathFormula(mathDiv));
          katexElement.parentNode.replaceChild(mathDiv, katexElement);
        }
      });
      
      return tempDiv.innerHTML;
    },

    editMathFormula(mathElement) {
      const currentLatex = mathElement.getAttribute('data-latex') || '';
      const isBlock = mathElement.classList.contains('math-block');
      
      const newLatex = prompt(`编辑${isBlock ? '块级' : '行内'}数学公式:`, currentLatex);
      if (newLatex !== null) {
        mathElement.setAttribute('data-latex', newLatex);
        mathElement.textContent = isBlock ? `$$${newLatex}$$` : `$${newLatex}$`;
        
        // Trigger input event to update the content
        this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },

    processEmptyLines(markdown) {
      // Convert empty lines to ensure they are editable in WYSIWYG mode
      return markdown.replace(/\n\n+/g, '\n\n<br>\n\n');
    },

    handleInput(event) {
      if (this.isUpdating) return;
      
      // Save caret position immediately
      this.saveCaretPosition();
      
      // Mark that we're in debounce period
      this.isInDebounceperiod = true;
      this.userMovedCursor = false;
      
      // Use debounced update to prevent cursor jumping
      this.debouncedUpdate(event.target.innerHTML);
    },

    performContentUpdate(htmlContent) {
      // Check if user moved cursor during debounce
      if (this.userMovedCursor) {
        // User moved cursor, only update content, don't restore cursor position
        const markdownContent = this.turndownService.turndown(htmlContent);
        this.isUpdating = true;
        this.$emit('update:modelValue', markdownContent);
        
        this.$nextTick(() => {
          setTimeout(() => {
            this.isUpdating = false;
            this.isInDebounceperiod = false;
            this.userMovedCursor = false;
          }, 50);
        });
        return;
      }
      
      // Normal update with cursor restoration
      const markdownContent = this.turndownService.turndown(htmlContent);
      
      this.isUpdating = true;
      this.$emit('update:modelValue', markdownContent);
      
      // Restore caret position after update
      this.$nextTick(() => {
        setTimeout(() => {
          this.isUpdating = false;
          this.isInDebounceperiod = false;
          this.restoreCaretPosition();
        }, 50);
      });
    },

    setupCursorMovementDetection() {
      // Listen for selection changes during debounce period
      document.addEventListener('selectionchange', () => {
        if (this.isInDebounceperiod && this.$refs.editor && document.activeElement === this.$refs.editor) {
          this.userMovedCursor = true;
        }
      });
    },

    setupStyleStateMonitoring() {
      // Monitor cursor position for style state updates
      this.$refs.editor.addEventListener('keyup', this.updateStyleStates);
      this.$refs.editor.addEventListener('mouseup', this.updateStyleStates);
      this.$refs.editor.addEventListener('focus', this.updateStyleStates);
      this.$refs.editor.addEventListener('click', this.updateStyleStates);
      // Add selection change listener for immediate updates
      document.addEventListener('selectionchange', this.handleSelectionChange);
    },

    handleSelectionChange() {
      // Only update if the selection is within our editor
      if (this.$refs.editor && document.activeElement === this.$refs.editor) {
        this.updateStyleStates();
      }
    },

    updateStyleStates() {
      if (!this.$refs.editor) return;
      
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      
      // Smart style detection: handle both selection and cursor position
      let styleElement = null;
      
      if (range.collapsed) {
        // No selection - check style at cursor position
        styleElement = this.getStyleElementAtCursor(range);
      } else {
        // Has selection - check style of selected content
        styleElement = this.getStyleElementOfSelection(range);
      }
      
      // Update current styles
      this.currentStyles = {
        bold: this.isStyleActive(styleElement, 'strong, b'),
        italic: this.isStyleActive(styleElement, 'em, i'),
        underline: this.isStyleActive(styleElement, 'u'),
        code: this.isStyleActive(styleElement, 'code'),
        strikethrough: this.isStyleActive(styleElement, 'del, s, strike')
      };
      
      // Update current heading level
      this.currentHeadingLevel = this.getCurrentHeadingLevel(styleElement);
      
      // Emit style state update for parent component
      this.$emit('style-state-update', {
        styles: this.currentStyles,
        headingLevel: this.currentHeadingLevel
      });
    },

    getStyleElementAtCursor(range) {
      // When no selection, check the style at cursor position
      const container = range.startContainer;
      
      if (container.nodeType === Node.TEXT_NODE) {
        const offset = range.startOffset;
        
        // If cursor is at the beginning of text, check previous element's style
        if (offset === 0) {
          const prevElement = this.getPreviousStyledElement(container);
          if (prevElement) {
            return prevElement;
          }
        }
        
        // Check parent element for style
        return container.parentElement;
      }
      
      return container;
    },

    getStyleElementOfSelection(range) {
      // When has selection, analyze the selected content
      const container = range.commonAncestorContainer;
      
      if (container.nodeType === Node.TEXT_NODE) {
        return container.parentElement;
      }
      
      return container;
    },

    getPreviousStyledElement(textNode) {
      // Find the previous text node and check its style
      let currentNode = textNode;
      
      while (currentNode) {
        if (currentNode.previousSibling) {
          currentNode = currentNode.previousSibling;
          
          // If it's a text node with content, check its parent
          if (currentNode.nodeType === Node.TEXT_NODE && currentNode.textContent.trim()) {
            return currentNode.parentElement;
          }
          
          // If it's an element with text content, return it
          if (currentNode.nodeType === Node.ELEMENT_NODE && currentNode.textContent.trim()) {
            return currentNode;
          }
        } else {
          // Move up to parent and continue searching
          currentNode = currentNode.parentNode;
          if (currentNode === this.$refs.editor) {
            break;
          }
        }
      }
      
      return null;
    },

    isStyleActive(element, selector) {
      return element && element.closest(selector) !== null;
    },

    getCurrentHeadingLevel(element) {
      if (!element) return 0;
      
      const headingElement = element.closest('h1, h2, h3, h4, h5, h6');
      if (!headingElement) return 0;
      
      return parseInt(headingElement.tagName.substring(1));
    },

    handleKeydown(event) {
      // Handle real-time markdown syntax conversion (Typora-like behavior)
      if (event.key === ' ' || event.key === 'Enter') {
        const converted = this.detectAndConvertMarkdown(event);
        if (converted) {
          return; // Conversion handled, no need to continue
        }
      }

      // Handle special key combinations
      if (event.key === 'Enter') {
        // Handle enter key for list items and other special cases
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const container = range.commonAncestorContainer;
          const listItem = container.nodeType === Node.TEXT_NODE 
            ? container.parentElement.closest('li')
            : container.closest('li');
          
          if (listItem) {
            // Handle list item enter behavior
            event.preventDefault();
            this.handleListItemEnter(listItem, range);
          }
        }
      }

      // Handle tab for code blocks and lists
      if (event.key === 'Tab') {
        event.preventDefault();
        this.handleTabKey(event.shiftKey);
      }
    },

    handlePaste(event) {
      event.preventDefault();
      
      // Get pasted data
      const clipboardData = event.clipboardData || window.clipboardData;
      const htmlData = clipboardData.getData('text/html');
      const textData = clipboardData.getData('text/plain');
      
      let contentToInsert = '';
      
      if (htmlData) {
        // Convert HTML to Markdown
        contentToInsert = this.turndownService.turndown(htmlData);
      } else if (textData) {
        contentToInsert = textData;
      }
      
      if (contentToInsert) {
        // Insert the content at cursor position
        this.insertTextAtCursor(contentToInsert);
      }
    },

    handleListItemEnter(listItem, range) {
      const listItemText = listItem.textContent.trim();
      
      // Check if it's a task list item
      const isTaskList = listItem.innerHTML.includes('<input type="checkbox"');
      
      if (listItemText === '' || (isTaskList && listItemText === '')) {
        // Empty list item, break out of list
        const list = listItem.closest('ul, ol');
        const newParagraph = document.createElement('p');
        newParagraph.appendChild(document.createElement('br'));
        list.parentNode.insertBefore(newParagraph, list.nextSibling);
        listItem.remove();
        
        // Move cursor to new paragraph
        const newRange = document.createRange();
        newRange.setStart(newParagraph, 0);
        newRange.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        // Create new list item
        const newListItem = document.createElement('li');
        if (isTaskList) {
          newListItem.innerHTML = '<input type="checkbox"> ';
        } else {
          newListItem.appendChild(document.createElement('br'));
        }
        
        listItem.parentNode.insertBefore(newListItem, listItem.nextSibling);
        
        // Move cursor to new list item
        const newRange = document.createRange();
        newRange.setStart(newListItem, isTaskList ? 1 : 0);
        newRange.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    },

    handleTabKey(isShiftTab) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const listItem = container.nodeType === Node.TEXT_NODE 
          ? container.parentElement.closest('li')
          : container.closest('li');
        
        if (listItem) {
          // Handle list indentation
          if (isShiftTab) {
            this.outdentListItem(listItem);
          } else {
            this.indentListItem(listItem);
          }
        } else {
          // Insert tab character or spaces
          this.insertTextAtCursor(isShiftTab ? '' : '    ');
        }
      }
    },

    indentListItem(listItem) {
      const list = listItem.closest('ul, ol');
      const prevItem = listItem.previousElementSibling;
      
      if (prevItem) {
        let subList = prevItem.querySelector('ul, ol');
        if (!subList) {
          subList = document.createElement(list.tagName.toLowerCase());
          prevItem.appendChild(subList);
        }
        subList.appendChild(listItem);
      }
    },

    outdentListItem(listItem) {
      const list = listItem.closest('ul, ol');
      const parentListItem = list.closest('li');
      
      if (parentListItem) {
        const parentList = parentListItem.closest('ul, ol');
        parentList.insertBefore(listItem, parentListItem.nextSibling);
      }
    },

    insertTextAtCursor(text) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    },

    saveCaretPosition() {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Enhanced caret position saving with multiple fallback strategies
        this.lastCaretPosition = {
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset,
          // Add additional context for better restoration
          textContent: range.startContainer.textContent,
          containerIndex: this.getNodeIndex(range.startContainer),
          parentElement: range.startContainer.parentElement,
          // Add document-wide offset for better fallback
          documentOffset: this.getDocumentOffset(range.startContainer, range.startOffset)
        };
      }
    },

    getDocumentOffset(node, offset) {
      if (!this.$refs.editor) return 0;
      
      try {
        const range = document.createRange();
        range.setStart(this.$refs.editor, 0);
        range.setEnd(node, offset);
        const contents = range.toString();
        return contents.length;
      } catch (error) {
        return 0;
      }
    },

    restoreCaretPosition() {
      if (this.lastCaretPosition && this.$refs.editor) {
        try {
          const range = document.createRange();
          
          // Try to restore using the saved containers
          if (this.isValidNode(this.lastCaretPosition.startContainer) &&
              this.isValidNode(this.lastCaretPosition.endContainer)) {
            range.setStart(this.lastCaretPosition.startContainer, this.lastCaretPosition.startOffset);
            range.setEnd(this.lastCaretPosition.endContainer, this.lastCaretPosition.endOffset);
          } else {
            // Fallback: find similar position using document offset
            const restoredPosition = this.findPositionByOffset(this.lastCaretPosition.documentOffset);
            if (restoredPosition) {
              range.setStart(restoredPosition.container, restoredPosition.offset);
              range.collapse(true);
            } else {
              // Last fallback: position at end of editor
              range.selectNodeContents(this.$refs.editor);
              range.collapse(false);
            }
          }
          
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (error) {
          console.warn('Failed to restore caret position:', error);
          // Fallback: just focus the editor and position at end
          this.focusAtEnd();
        }
      }
    },

    findPositionByOffset(targetOffset) {
      if (!this.$refs.editor) return null;
      
      try {
        const walker = document.createTreeWalker(
          this.$refs.editor,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let currentOffset = 0;
        let node;
        
        while (node = walker.nextNode()) {
          const nodeLength = node.textContent.length;
          if (currentOffset + nodeLength >= targetOffset) {
            const offset = targetOffset - currentOffset;
            return { container: node, offset: Math.min(offset, nodeLength) };
          }
          currentOffset += nodeLength;
        }
        
        // If offset is beyond content, position at end
        const lastNode = this.getLastTextNode();
        if (lastNode) {
          return { container: lastNode, offset: lastNode.textContent.length };
        }
      } catch (error) {
        console.warn('Error finding position by offset:', error);
      }
      
      return null;
    },

    getLastTextNode() {
      const walker = document.createTreeWalker(
        this.$refs.editor,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let lastNode = null;
      let node;
      while (node = walker.nextNode()) {
        lastNode = node;
      }
      
      return lastNode;
    },

    focusAtEnd() {
      if (!this.$refs.editor) return;
      
      this.$refs.editor.focus();
      const range = document.createRange();
      range.selectNodeContents(this.$refs.editor);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    },

    isValidNode(node) {
      // Check if a node is still valid in the DOM
      return node && 
             node.parentNode && 
             this.$refs.editor.contains(node);
    },

    getNodeIndex(node) {
      // Get the index of a node among its siblings
      if (!node || !node.parentNode) return -1;
      return Array.from(node.parentNode.childNodes).indexOf(node);
    },

    findSimilarPosition() {
      // Try to find a similar position based on saved context
      if (!this.lastCaretPosition) return null;
      
      try {
        const savedText = this.lastCaretPosition.textContent;
        const savedOffset = this.lastCaretPosition.startOffset;
        
        // Walk through text nodes to find one with similar content
        const walker = document.createTreeWalker(
          this.$refs.editor,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent === savedText) {
            const offset = Math.min(savedOffset, node.textContent.length);
            return { container: node, offset };
          }
        }
        
        // If exact match not found, try to find parent element
        if (this.lastCaretPosition.parentElement && 
            this.$refs.editor.contains(this.lastCaretPosition.parentElement)) {
          const element = this.lastCaretPosition.parentElement;
          if (element.firstChild) {
            return { 
              container: element.firstChild, 
              offset: Math.min(this.lastCaretPosition.startOffset, element.firstChild.textContent?.length || 0)
            };
          }
        }
      } catch (error) {
        console.warn('Error finding similar position:', error);
      }
      
      return null;
    },

    focus() {
      this.$refs.editor.focus();
    },

    getSelection() {
      return window.getSelection();
    },

    insertMarkdown(markdownText) {
      // Enhanced markdown insertion with proper cursor positioning
      const selection = window.getSelection();
      if (!selection.rangeCount) {
        this.$refs.editor.focus();
        return;
      }

      const range = selection.getRangeAt(0);
      
      // Handle different types of markdown insertions
      if (markdownText.startsWith('# ')) {
        // Handle heading insertion/toggling
        this.toggleHeading();
        return;
      }
      
      // Check if we're inserting paired delimiters (like ** for bold)
      const pairedDelimiters = ['**', '*', '`', '~~'];
      const isPaired = pairedDelimiters.some(delimiter => markdownText === delimiter + delimiter);
      
      if (isPaired) {
        // For paired delimiters, use execCommand when possible
        const delimiter = markdownText.substring(0, markdownText.length / 2);
        
        if (delimiter === '**') {
          document.execCommand('bold', false, null);
        } else if (delimiter === '*') {
          document.execCommand('italic', false, null);
        } else {
          // For other delimiters, manually wrap text
          this.wrapSelectionWithDelimiters(delimiter, range);
        }
      } else {
        // Regular text insertion
        this.insertTextAtCurrentPosition(markdownText, range);
      }
      
      // Trigger input event to update the content
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    wrapSelectionWithDelimiters(delimiter, range) {
      if (!range.collapsed) {
        // Wrap selected text
        const selectedText = range.toString();
        range.deleteContents();
        
        const wrappedText = delimiter + selectedText + delimiter;
        const textNode = document.createTextNode(wrappedText);
        range.insertNode(textNode);
        
        // Position cursor after the wrapped text
        const newRange = document.createRange();
        newRange.setStartAfter(textNode);
        newRange.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        // No selected text, insert delimiters and position cursor between them
        const leftDelimiter = document.createTextNode(delimiter);
        const rightDelimiter = document.createTextNode(delimiter);
        
        range.insertNode(leftDelimiter);
        range.insertNode(rightDelimiter);
        
        // Position cursor between the delimiters
        const newRange = document.createRange();
        newRange.setStart(rightDelimiter, 0);
        newRange.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    },

    insertTextAtCurrentPosition(text, range) {
      const textNode = document.createTextNode(text);
      range.deleteContents();
      range.insertNode(textNode);
      
      // Position cursor after inserted text
      const newRange = document.createRange();
      newRange.setStartAfter(textNode);
      newRange.collapse(true);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(newRange);
    },

    toggleHeading() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      // Find the current block element
      let blockElement = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container;
      
      // Walk up to find a heading or paragraph
      while (blockElement && blockElement !== this.$refs.editor) {
        if (/^H[1-6]$/i.test(blockElement.tagName) || blockElement.tagName === 'P') {
          break;
        }
        blockElement = blockElement.parentElement;
      }
      
      if (!blockElement || blockElement === this.$refs.editor) {
        // No suitable block found, create a new heading
        document.execCommand('formatBlock', false, 'h1');
        this.updateStyleStates();
        return;
      }
      
      // Determine next heading level
      let nextLevel = 1;
      if (/^H([1-6])$/i.test(blockElement.tagName)) {
        const currentLevel = parseInt(blockElement.tagName.substring(1));
        nextLevel = currentLevel >= 6 ? 1 : currentLevel + 1;
      }
      
      // Format as heading
      document.execCommand('formatBlock', false, `h${nextLevel}`);
      
      // Update style states after change
      this.updateStyleStates();
      
      // Trigger input event to update the content
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    toggleBold() {
      if (this.isSimpleToggle()) {
        // Use execCommand for simple cases (selected text)
        document.execCommand('bold', false, null);
      } else {
        // Use our custom logic for cursor-based formatting
        this.toggleFormatWithContext('bold');
      }
      
      // Force immediate style state update
      setTimeout(() => {
        this.updateStyleStates();
      }, 50);
      
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    toggleItalic() {
      if (this.isSimpleToggle()) {
        document.execCommand('italic', false, null);
      } else {
        this.toggleFormatWithContext('italic');
      }
      
      setTimeout(() => {
        this.updateStyleStates();
      }, 50);
      
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    toggleUnderline() {
      if (this.isSimpleToggle()) {
        document.execCommand('underline', false, null);
      } else {
        this.toggleFormatWithContext('underline');
      }
      
      setTimeout(() => {
        this.updateStyleStates();
      }, 50);
      
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    toggleStrikethrough() {
      if (this.isSimpleToggle()) {
        document.execCommand('strikeThrough', false, null);
      } else {
        this.toggleFormatWithContext('strikeThrough');
      }
      
      setTimeout(() => {
        this.updateStyleStates();
      }, 50);
      
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    isSimpleToggle() {
      const selection = window.getSelection();
      return selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed;
    },

    toggleFormatWithContext(formatType) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      
      if (range.collapsed) {
        // No selection - apply formatting for next input
        this.applyFormatToNextInput(formatType, range);
      } else {
        // Has selection - apply formatting to selected content
        this.applyFormatToSelection(formatType);
      }
      
      this.updateStyleStates();
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    applyFormatToNextInput(formatType, range) {
      // Check current style state
      const styleElement = this.getStyleElementAtCursor(range);
      const isCurrentlyActive = this.isFormatActive(formatType, styleElement);
      
      if (isCurrentlyActive) {
        // Remove formatting by inserting a neutral span
        this.insertNeutralSpan(range);
      } else {
        // Apply formatting by inserting a formatted span
        this.insertFormattedSpan(formatType, range);
      }
    },

    applyFormatToSelection(formatType) {
      // Use execCommand for selected content
      const commandMap = {
        'bold': 'bold',
        'italic': 'italic', 
        'underline': 'underline',
        'strikeThrough': 'strikeThrough'
      };
      
      const command = commandMap[formatType];
      if (command) {
        document.execCommand(command, false, null);
      }
    },

    isFormatActive(formatType, element) {
      const selectorMap = {
        'bold': 'strong, b',
        'italic': 'em, i',
        'underline': 'u',
        'strikeThrough': 'del, s, strike'
      };
      
      const selector = selectorMap[formatType];
      return selector ? this.isStyleActive(element, selector) : false;
    },

    insertNeutralSpan(range) {
      // Insert a span that breaks the current formatting
      const span = document.createElement('span');
      span.style.fontWeight = 'normal';
      span.style.fontStyle = 'normal';
      span.style.textDecoration = 'none';
      span.appendChild(document.createTextNode('\u200B')); // Zero-width space
      
      range.insertNode(span);
      
      // Position cursor inside the span
      const newRange = document.createRange();
      newRange.setStart(span.firstChild, 1);
      newRange.collapse(true);
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(newRange);
    },

    insertFormattedSpan(formatType, range) {
      // Insert a span with the desired formatting
      const span = document.createElement('span');
      
      switch (formatType) {
        case 'bold':
          span.style.fontWeight = 'bold';
          break;
        case 'italic':
          span.style.fontStyle = 'italic';
          break;
        case 'underline':
          span.style.textDecoration = 'underline';
          break;
        case 'strikeThrough':
          span.style.textDecoration = 'line-through';
          break;
      }
      
      span.appendChild(document.createTextNode('\u200B')); // Zero-width space
      
      range.insertNode(span);
      
      // Position cursor inside the span
      const newRange = document.createRange();
      newRange.setStart(span.firstChild, 1);
      newRange.collapse(true);
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(newRange);
    },

    toggleCode() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      
      // Check if we're already in a code element
      const container = range.commonAncestorContainer;
      const element = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container;
      const codeElement = element.closest('code');
      
      if (codeElement) {
        // Remove code formatting
        const textNode = document.createTextNode(codeElement.textContent);
        codeElement.parentNode.replaceChild(textNode, codeElement);
        
        // Position cursor in the text node
        const newRange = document.createRange();
        newRange.setStart(textNode, Math.min(range.startOffset, textNode.textContent.length));
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else if (range.collapsed) {
        // No selection - apply code for next input
        this.applyCodeToNextInput(range);
      } else {
        // Has selection - apply code to selected content
        const selectedText = range.toString();
        const codeElement = document.createElement('code');
        codeElement.textContent = selectedText;
        
        range.deleteContents();
        range.insertNode(codeElement);
        
        // Position cursor after the code element
        const newRange = document.createRange();
        newRange.setStartAfter(codeElement);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      this.updateStyleStates();
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    applyCodeToNextInput(range) {
      // Insert a code span for next input
      const codeElement = document.createElement('code');
      codeElement.appendChild(document.createTextNode('\u200B')); // Zero-width space
      
      range.insertNode(codeElement);
      
      // Position cursor inside the code element
      const newRange = document.createRange();
      newRange.setStart(codeElement.firstChild, 1);
      newRange.collapse(true);
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(newRange);
    },

    insertColorText(color) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      
      // Check if we're already in a colored element
      const container = range.commonAncestorContainer;
      const element = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container;
      
      const existingColorElement = element.closest(`font[color="${color}"]`);
      
      if (existingColorElement) {
        // Remove color formatting - toggle off
        this.removeColorFormatting(existingColorElement, range);
      } else if (range.collapsed) {
        // No selection - apply color for next input
        this.applyColorToNextInput(color, range);
      } else {
        // Has selection - apply color to selected content
        const selectedText = range.toString();
        const fontElement = document.createElement('font');
        fontElement.setAttribute('color', color);
        fontElement.textContent = selectedText;
        
        range.deleteContents();
        range.insertNode(fontElement);
        
        // Position cursor after the font element
        const newRange = document.createRange();
        newRange.setStartAfter(fontElement);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    removeColorFormatting(colorElement, range) {
      // Replace the font element with plain text
      const textContent = colorElement.textContent;
      const textNode = document.createTextNode(textContent);
      
      colorElement.parentNode.replaceChild(textNode, colorElement);
      
      // Position cursor appropriately
      const newRange = document.createRange();
      newRange.setStart(textNode, Math.min(range.startOffset, textContent.length));
      newRange.collapse(true);
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(newRange);
    },

    applyColorToNextInput(color, range) {
      // Insert a colored span for next input
      const span = document.createElement('font');
      span.setAttribute('color', color);
      span.appendChild(document.createTextNode('\u200B')); // Zero-width space
      
      range.insertNode(span);
      
      // Position cursor inside the span
      const newRange = document.createRange();
      newRange.setStart(span.firstChild, 1);
      newRange.collapse(true);
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(newRange);
    },

    insertHighlight() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        const markElement = document.createElement('mark');
        markElement.textContent = selectedText;
        
        range.deleteContents();
        range.insertNode(markElement);
        
        // Position cursor after the mark element
        const newRange = document.createRange();
        newRange.setStartAfter(markElement);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },

    detectAndConvertMarkdown(event) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return false;

      const range = selection.getRangeAt(0);
      const container = range.startContainer;
      
      // Only process text nodes
      if (container.nodeType !== Node.TEXT_NODE) return false;

      const textContent = container.textContent;
      const caretPosition = range.startOffset;
      
      // Get the text before the cursor on the current line
      const lineStart = this.findLineStart(textContent, caretPosition);
      const textBeforeCursor = textContent.substring(lineStart, caretPosition);
      
      // Check for various markdown patterns
      const patterns = [
        // Bold: **text**
        {
          regex: /\*\*([^*]+)\*\*$/,
          replacement: (match, content) => `<strong>${content}</strong>`,
          cursorOffset: 0
        },
        // Italic: *text*
        {
          regex: /\*([^*]+)\*$/,
          replacement: (match, content) => `<em>${content}</em>`,
          cursorOffset: 0
        },
        // Inline code: `code`
        {
          regex: /`([^`]+)`$/,
          replacement: (match, content) => `<code>${content}</code>`,
          cursorOffset: 0
        },
        // Strikethrough: ~~text~~
        {
          regex: /~~([^~]+)~~$/,
          replacement: (match, content) => `<del>${content}</del>`,
          cursorOffset: 0
        },
        // Headers: # text, ## text, etc.
        {
          regex: /^(#{1,6})\s+(.+)$/,
          replacement: (match, hashes, content) => {
            const level = hashes.length;
            return `<h${level}>${content}</h${level}>`;
          },
          cursorOffset: 0,
          wholeLine: true
        }
      ];

      for (const pattern of patterns) {
        const match = textBeforeCursor.match(pattern.regex);
        if (match) {
          event.preventDefault();
          this.performMarkdownConversion(
            container, 
            lineStart, 
            caretPosition, 
            match, 
            pattern,
            textContent
          );
          return true;
        }
      }

      return false;
    },

    findLineStart(text, position) {
      // Find the start of the current line
      const lineBreak = text.lastIndexOf('\n', position - 1);
      return lineBreak === -1 ? 0 : lineBreak + 1;
    },

    performMarkdownConversion(container, lineStart, caretPosition, match, pattern, textContent) {
      const replacement = pattern.replacement(...match);
      
      if (pattern.wholeLine) {
        // Replace the entire line for headers
        const lineEnd = textContent.indexOf('\n', caretPosition);
        const actualLineEnd = lineEnd === -1 ? textContent.length : lineEnd;
        
        // Create a temporary container for the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = replacement;
        const newElement = tempDiv.firstChild;
        
        // Replace the text content
        const range = document.createRange();
        range.setStart(container, lineStart);
        range.setEnd(container, actualLineEnd);
        range.deleteContents();
        range.insertNode(newElement);
        
        // Position cursor at the end of the new element
        const newRange = document.createRange();
        newRange.setStartAfter(newElement);
        newRange.collapse(true);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        // Replace inline patterns
        const matchStart = caretPosition - match[0].length;
        
        // Create HTML element from replacement
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = replacement;
        const newElement = tempDiv.firstChild;
        
        // Replace the matched text
        const range = document.createRange();
        range.setStart(container, matchStart);
        range.setEnd(container, caretPosition);
        range.deleteContents();
        range.insertNode(newElement);
        
        // Position cursor after the new element
        const newRange = document.createRange();
        newRange.setStartAfter(newElement);
        newRange.collapse(true);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      // Trigger input event to update the model
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    handleFocus() {
      // Ensure empty content has a proper placeholder for editing
      if (!this.htmlContent.trim() || this.htmlContent === '<br>') {
        this.$refs.editor.innerHTML = '<p><br></p>';
      }
      
      // Update style states on focus
      this.$nextTick(() => {
        this.updateStyleStates();
      });
    },

    handleBlur() {
      // Clean up empty paragraphs when losing focus, but preserve structure
      if (!this.$refs.editor) return;
      
      const content = this.$refs.editor.innerHTML;
      if (content === '<p><br></p>' || content === '<br>' || content.trim() === '') {
        // Only clear if completely empty
        if (!this.modelValue || this.modelValue.trim() === '') {
          this.$refs.editor.innerHTML = '';
          this.$emit('update:modelValue', '');
        }
      }
    },

    insertUnorderedList() {
      document.execCommand('insertUnorderedList', false, null);
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    insertTaskList() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      
      // Create task list item
      const li = document.createElement('li');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.style.marginRight = '8px';
      
      li.appendChild(checkbox);
      li.appendChild(document.createTextNode(' '));
      
      // Create ul if not in one
      let listElement = range.commonAncestorContainer;
      if (listElement.nodeType === Node.TEXT_NODE) {
        listElement = listElement.parentElement;
      }
      
      let ul = listElement.closest('ul');
      if (!ul) {
        ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.paddingLeft = '20px';
        
        range.insertNode(ul);
      }
      
      ul.appendChild(li);
      
      // Position cursor in the list item
      const newRange = document.createRange();
      newRange.setStart(li, 1);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    insertBlockQuote() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      // Find current block
      let blockElement = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container;
      
      while (blockElement && blockElement !== this.$refs.editor) {
        if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(blockElement.tagName)) {
          break;
        }
        blockElement = blockElement.parentElement;
      }
      
      if (blockElement && blockElement !== this.$refs.editor) {
        const blockquote = document.createElement('blockquote');
        blockquote.style.borderLeft = '4px solid #ddd';
        blockquote.style.paddingLeft = '16px';
        blockquote.style.margin = '16px 0';
        
        // Move content to blockquote
        blockquote.appendChild(blockElement.cloneNode(true));
        blockElement.parentNode.replaceChild(blockquote, blockElement);
      }
      
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    insertCodeBlock() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      
      pre.style.backgroundColor = '#f6f8fa';
      pre.style.borderRadius = '6px';
      pre.style.padding = '16px';
      pre.style.overflow = 'auto';
      pre.style.fontFamily = 'monospace';
      
      code.textContent = 'Your code here...';
      pre.appendChild(code);
      
      const range = selection.getRangeAt(0);
      range.insertNode(pre);
      
      // Select the placeholder text
      const newRange = document.createRange();
      newRange.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    insertHorizontalRule() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const hr = document.createElement('hr');
      hr.style.border = 'none';
      hr.style.borderTop = '1px solid #e1e4e8';
      hr.style.margin = '24px 0';
      
      const range = selection.getRangeAt(0);
      range.insertNode(hr);
      
      // Position cursor after HR
      const newRange = document.createRange();
      newRange.setStartAfter(hr);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    },

    insertImage() {
      const url = prompt('请输入图片URL:');
      if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = '图片';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(img);
        }
        
        this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },

    insertMathInline() {
      const mathText = prompt('请输入LaTeX公式:');
      if (mathText) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          const span = document.createElement('span');
          span.className = 'math-inline';
          span.setAttribute('data-latex', mathText);
          span.textContent = `$${mathText}$`;
          span.addEventListener('click', () => this.editMathFormula(span));
          
          range.insertNode(span);
          
          // Position cursor after the math element
          const newRange = document.createRange();
          newRange.setStartAfter(span);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
        
        this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },

    insertMathBlock() {
      const mathText = prompt('请输入LaTeX块级公式:');
      if (mathText) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          const div = document.createElement('div');
          div.className = 'math-block';
          div.setAttribute('data-latex', mathText);
          div.textContent = `$$${mathText}$$`;
          div.addEventListener('click', () => this.editMathFormula(div));
          
          range.insertNode(div);
          
          // Position cursor after the math element
          const newRange = document.createRange();
          newRange.setStartAfter(div);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
        
        this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },

    insertTOC() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const toc = document.createElement('div');
      toc.textContent = '[[TOC]]';
      toc.style.padding = '8px';
      toc.style.backgroundColor = '#f6f8fa';
      toc.style.border = '1px dashed #d1d9e0';
      toc.style.borderRadius = '6px';
      toc.style.textAlign = 'center';
      toc.style.color = '#656d76';
      
      const range = selection.getRangeAt(0);
      range.insertNode(toc);
      
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
</script>

<style scoped>
.wysiwyg-editor {
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}

.wysiwyg-editor:focus {
  border-color: #0969da !important;
  box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.3);
}

/* Ensure empty lines are properly handled and clickable */
.wysiwyg-editor p:empty::before {
  content: '\00a0'; /* Non-breaking space */
  color: transparent;
}

.wysiwyg-editor p:empty {
  min-height: 1.2em; /* Ensure empty paragraphs have height */
}

.wysiwyg-editor br:only-child {
  display: block;
  min-height: 1.2em;
}

/* Ensure code blocks are properly styled in edit mode */
.wysiwyg-editor pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
}

.wysiwyg-editor code {
  background-color: rgba(175, 184, 193, 0.2);
  border-radius: 3px;
  padding: 2px 4px;
}

/* Style for task list checkboxes */
.wysiwyg-editor input[type="checkbox"] {
  margin-right: 8px;
}

/* Ensure tables are properly styled */
.wysiwyg-editor table {
  border-collapse: collapse;
  margin: 16px 0;
}

.wysiwyg-editor th,
.wysiwyg-editor td {
  border: 1px solid #d1d9e0;
  padding: 8px 12px;
}

.wysiwyg-editor th {
  background-color: #f6f8fa;
  font-weight: 600;
}

/* Math formula styling */
.wysiwyg-editor .math-inline {
  background-color: #f6f8fa;
  border: 1px dashed #d1d9e0;
  border-radius: 3px;
  padding: 2px 4px;
  cursor: pointer;
  display: inline-block;
}

.wysiwyg-editor .math-block {
  background-color: #f6f8fa;
  border: 1px dashed #d1d9e0;
  border-radius: 6px;
  padding: 16px;
  cursor: pointer;
  display: block;
  margin: 16px 0;
  text-align: center;
}

.wysiwyg-editor .math-inline:hover,
.wysiwyg-editor .math-block:hover {
  background-color: #e1f5fe;
  border-color: #0969da;
}
</style>