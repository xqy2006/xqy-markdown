<template>
  <div 
    class="wysiwyg-editor markdown-body"
    contenteditable="true"
    ref="editor"
    @input="handleInput"
    @keydown="handleKeydown"
    @paste="handlePaste"
    v-html="htmlContent"
    style="min-height: 250px; padding: 15px; border: 1px solid #d1d9e0; border-radius: 6px; outline: none;"
  ></div>
</template>

<script>
import TurndownService from 'turndown';

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
  emits: ['update:modelValue'],
  data() {
    return {
      htmlContent: '',
      turndownService: null,
      isUpdating: false,
      lastCaretPosition: null
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
  },
  mounted() {
    // Initial conversion from Markdown to HTML
    this.updateHtmlContent();
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

      // Custom rule for math expressions
      this.turndownService.addRule('math', {
        filter: (node) => {
          return node.classList && (
            node.classList.contains('katex') || 
            node.classList.contains('katex-display') ||
            node.classList.contains('katex-inline')
          );
        },
        replacement: (content, node) => {
          // Try to get the original LaTeX from data attributes or annotations
          const annotation = node.querySelector('.katex-mathml annotation[encoding="application/x-tex"]');
          if (annotation) {
            const latex = annotation.textContent;
            return node.classList.contains('katex-display') ? `\n$$\n${latex}\n$$\n` : ` $${latex}$ `;
          }
          return content;
        }
      });
    },

    updateHtmlContent() {
      if (this.modelValue) {
        this.htmlContent = this.getMarkdownRenderer()(this.modelValue);
      } else {
        this.htmlContent = '';
      }
    },

    handleInput(event) {
      if (this.isUpdating) return;
      
      // Save caret position
      this.saveCaretPosition();
      
      // Convert HTML back to Markdown
      const htmlContent = event.target.innerHTML;
      const markdownContent = this.turndownService.turndown(htmlContent);
      
      this.isUpdating = true;
      this.$emit('update:modelValue', markdownContent);
      
      // Restore caret position after a short delay
      this.$nextTick(() => {
        setTimeout(() => {
          this.isUpdating = false;
          this.restoreCaretPosition();
        }, 50);
      });
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
        
        // Enhanced caret position saving with fallback strategies
        this.lastCaretPosition = {
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset,
          // Add additional context for better restoration
          textContent: range.startContainer.textContent,
          containerIndex: this.getNodeIndex(range.startContainer),
          parentElement: range.startContainer.parentElement
        };
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
            // Fallback: find similar position using context
            const newPosition = this.findSimilarPosition();
            if (newPosition) {
              range.setStart(newPosition.container, newPosition.offset);
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
          // Fallback: just focus the editor
          this.$refs.editor.focus();
          // Position at end
          const range = document.createRange();
          range.selectNodeContents(this.$refs.editor);
          range.collapse(false);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
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
      
      // Check if we're inserting paired delimiters (like ** for bold)
      const pairedDelimiters = ['**', '*', '`', '~~'];
      const isPaired = pairedDelimiters.some(delimiter => markdownText === delimiter + delimiter);
      
      if (isPaired) {
        // For paired delimiters, place cursor in the middle
        const delimiter = markdownText.substring(0, markdownText.length / 2);
        
        // Check if there's selected text
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
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else {
        // Regular text insertion
        const textNode = document.createTextNode(markdownText);
        range.deleteContents();
        range.insertNode(textNode);
        
        // Position cursor after inserted text
        const newRange = document.createRange();
        newRange.setStartAfter(textNode);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      // Trigger input event to update the content
      this.$refs.editor.dispatchEvent(new Event('input', { bubbles: true }));
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
</style>