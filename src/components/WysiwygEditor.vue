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
        this.lastCaretPosition = {
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset
        };
      }
    },

    restoreCaretPosition() {
      if (this.lastCaretPosition && this.$refs.editor) {
        try {
          const range = document.createRange();
          range.setStart(this.lastCaretPosition.startContainer, this.lastCaretPosition.startOffset);
          range.setEnd(this.lastCaretPosition.endContainer, this.lastCaretPosition.endOffset);
          
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (error) {
          // If we can't restore the exact position, just focus the editor
          this.$refs.editor.focus();
        }
      }
    },

    focus() {
      this.$refs.editor.focus();
    },

    getSelection() {
      return window.getSelection();
    },

    insertMarkdown(markdownText) {
      // Insert markdown text at current cursor position
      this.insertTextAtCursor(markdownText);
      
      // Trigger input event to update the content
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