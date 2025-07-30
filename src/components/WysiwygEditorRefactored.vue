<template>
  <div 
    class="wysiwyg-editor-refactored markdown-body"
    contenteditable="true"
    ref="editor"
    @input="handleInput"
    @keydown="handleKeydown"
    @paste="handlePaste"
    @focus="handleFocus"
    @blur="handleBlur"
    @mouseup="handleSelectionChange"
    @keyup="handleSelectionChange"
    style="min-height: 250px; padding: 15px; border: 1px solid #d1d9e0; border-radius: 6px; outline: none;"
    v-html="renderedContent"
  ></div>
</template>

<script>
import { CursorManager } from './CursorManager.js';
import { EditHandler } from './EditHandler.js';
import { StyleManager } from './StyleManager.js';
import { debounce } from 'lodash-es';

export default {
  name: 'WysiwygEditorRefactored',
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
      cursorManager: new CursorManager(),
      editHandler: new EditHandler(),
      styleManager: new StyleManager(),
      isUpdating: false,
      pendingUpdate: false,
      lastCursorPosition: 0,
      debouncedStyleUpdate: null,
      debouncedContentSync: null,
      allowNaturalEditing: true // Allow contenteditable to work naturally
    };
  },
  computed: {
    renderedContent() {
      if (!this.modelValue || !this.getMarkdownRenderer) {
        return '<p><br></p>';
      }
      
      const html = this.getMarkdownRenderer()(this.modelValue);
      
      // Ensure html is a string and handle empty content
      if (!html || typeof html !== 'string' || !html.trim()) {
        return '<p><br></p>';
      }
      
      return html;
    }
  },
  watch: {
    modelValue: {
      handler(newValue, oldValue) {
        if (this.isUpdating) return;
        
        // Content changed externally, update the editor
        this.$nextTick(() => {
          this.restoreCursorAfterUpdate();
          this.updateStyleStates();
        });
      }
    }
  },
  created() {
    // Initialize edit handler with cursor manager
    this.editHandler = new EditHandler(this.cursorManager);
    
    // Debounced style state update with longer delay to reduce cursor jumping
    this.debouncedStyleUpdate = debounce(this.updateStyleStates, 300);
    
    // Debounced content sync with longer delay for better performance
    this.debouncedContentSync = debounce(this.syncContentFromHTML, 500);
  },
  mounted() {
    this.initializeEditor();
    this.setupEventListeners();
  },
  beforeUnmount() {
    this.cleanupEventListeners();
  },
  methods: {
    /**
     * Initialize the editor
     */
    initializeEditor() {
      if (!this.$refs.editor) return;
      
      // Ensure editor has focus capability
      this.$refs.editor.setAttribute('contenteditable', 'true');
      
      // Set up initial state
      this.updateStyleStates();
    },

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
      document.addEventListener('selectionchange', this.handleGlobalSelectionChange);
    },

    /**
     * Cleanup event listeners
     */
    cleanupEventListeners() {
      document.removeEventListener('selectionchange', this.handleGlobalSelectionChange);
      if (this.debouncedStyleUpdate) {
        this.debouncedStyleUpdate.cancel();
      }
    },

    /**
     * Handle input events - simplified approach
     */
    handleInput(event) {
      if (this.isUpdating) return;
      
      // For basic text input, allow natural contenteditable behavior
      // Only sync periodically to avoid cursor jumping
      this.debouncedContentSync();
      this.debouncedStyleUpdate();
    },

    /**
     * Simplified content sync that works more reliably
     */
    syncContentFromHTML() {
      if (this.isUpdating) return;
      
      const editor = this.$refs.editor;
      if (!editor) return;
      
      // Save cursor position
      const selection = window.getSelection();
      let cursorInfo = null;
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        cursorInfo = {
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset
        };
      }
      
      // Get plain text content - this is a simplified approach
      // In a full implementation, we'd parse the HTML structure properly
      const textContent = editor.textContent || '';
      
      if (textContent !== this.modelValue) {
        this.isUpdating = true;
        this.$emit('update:modelValue', textContent);
        
        this.$nextTick(() => {
          // Restore cursor position if possible
          if (cursorInfo && this.isValidNode(cursorInfo.startContainer)) {
            try {
              const newRange = document.createRange();
              newRange.setStart(cursorInfo.startContainer, Math.min(cursorInfo.startOffset, cursorInfo.startContainer.textContent?.length || 0));
              newRange.setEnd(cursorInfo.endContainer, Math.min(cursorInfo.endOffset, cursorInfo.endContainer.textContent?.length || 0));
              
              const newSelection = window.getSelection();
              newSelection.removeAllRanges();
              newSelection.addRange(newRange);
            } catch (error) {
              console.warn('Could not restore cursor position:', error);
            }
          }
          
          this.isUpdating = false;
        });
      }
    },
    
    /**
     * Check if a DOM node is still valid
     */
    isValidNode(node) {
      return node && node.parentNode && document.contains(node);
    },

    /**
     * Handle key down events - simplified
     */
    handleKeydown(event) {
      // Only handle essential shortcuts, let contenteditable handle the rest
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'b':
            event.preventDefault();
            this.toggleBold();
            break;
          case 'i':
            event.preventDefault();
            this.toggleItalic();
            break;
          case 'u':
            event.preventDefault();
            this.toggleUnderline();
            break;
          case '`':
            event.preventDefault();
            this.toggleCode();
            break;
          default:
            break;
        }
      }
    },

    /**
     * Handle paste events - simplified
     */
    handlePaste(event) {
      // Allow default paste behavior, then sync content
      this.$nextTick(() => {
        this.debouncedContentSync();
      });
    },

    /**
     * Handle focus events
     */
    handleFocus() {
      this.updateStyleStates();
    },

    /**
     * Handle blur events
     */
    handleBlur() {
      // Perform any cleanup when editor loses focus
    },

    /**
     * Handle selection changes
     */
    handleSelectionChange() {
      this.debouncedStyleUpdate();
    },

    /**
     * Handle global selection changes (only for our editor)
     */
    handleGlobalSelectionChange() {
      if (document.activeElement === this.$refs.editor) {
        this.debouncedStyleUpdate();
      }
    },

    /**
     * Update style states based on current cursor position - simplified
     */
    updateStyleStates() {
      if (!this.$refs.editor) return;

      // Simple style detection based on cursor position
      const selection = window.getSelection();
      let styleState = {
        bold: false,
        italic: false,
        underline: false,
        code: false,
        strikethrough: false,
        highlight: false
      };
      
      let headingLevel = 0;
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textContent = this.$refs.editor.textContent || '';
        
        // Simple check for common markdown patterns around cursor
        const cursorPos = this.getTextOffset(range.startContainer, range.startOffset);
        const surroundingText = textContent.substring(Math.max(0, cursorPos - 10), cursorPos + 10);
        
        // Basic pattern detection
        styleState.bold = /\*\*.*?\*\*/.test(surroundingText);
        styleState.italic = /\*.*?\*/.test(surroundingText) && !styleState.bold;
        styleState.code = /`.*?`/.test(surroundingText);
        styleState.strikethrough = /~~.*?~~/.test(surroundingText);
        styleState.underline = /<u>.*?<\/u>/.test(surroundingText);
        styleState.highlight = /<mark>.*?<\/mark>/.test(surroundingText);
        
        // Basic heading detection
        const lineStart = textContent.lastIndexOf('\n', cursorPos - 1);
        const lineEnd = textContent.indexOf('\n', cursorPos);
        const currentLine = textContent.substring(lineStart + 1, lineEnd === -1 ? undefined : lineEnd);
        const headingMatch = currentLine.match(/^(#{1,6})\s/);
        if (headingMatch) {
          headingLevel = headingMatch[1].length;
        }
      }
      
      // Emit style state update
      this.$emit('style-state-update', {
        styles: styleState,
        headingLevel: headingLevel
      });
    },
    
    /**
     * Get text offset within the editor
     */
    getTextOffset(container, offset) {
      const walker = document.createTreeWalker(
        this.$refs.editor,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let textOffset = 0;
      let node;
      
      while (node = walker.nextNode()) {
        if (node === container) {
          return textOffset + offset;
        }
        textOffset += node.textContent.length;
      }
      
      return textOffset;
    },

    /**
     * Get current cursor position mapped to markdown
     */
    getCurrentMarkdownPosition() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return 0;

      const range = selection.getRangeAt(0);
      const htmlOffset = this.cursorManager.getOffsetInElement(
        this.$refs.editor, 
        range.startContainer, 
        range.startOffset
      );

      // Convert HTML offset to markdown position
      // This is simplified - a full implementation would have more sophisticated mapping
      const htmlContent = this.$refs.editor.textContent || '';
      return this.cursorManager.htmlToMarkdownOffset(htmlContent, this.modelValue, htmlOffset);
    },

    /**
     * Restore cursor position after content update
     */
    restoreCursorAfterUpdate() {
      // Convert markdown position back to HTML position and restore
      const htmlContent = this.$refs.editor.textContent || '';
      const htmlOffset = this.cursorManager.markdownToHtmlOffset(this.modelValue, htmlContent, this.markdownPosition);
      
      // Find position and restore cursor
      const position = this.cursorManager.findPositionByOffset(this.$refs.editor, htmlOffset);
      if (position) {
        const range = document.createRange();
        range.setStart(position.container, position.offset);
        range.collapse(true);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    },

    /**
     * Sync content from HTML back to markdown (fallback method)
     */
    syncContentFromHTML() {
      if (this.isUpdating) return;
      
      const htmlContent = this.$refs.editor.innerHTML;
      const textContent = this.$refs.editor.textContent || '';
      
      // This is a simplified sync - in a full implementation, 
      // we'd parse the HTML structure and convert it back to proper markdown
      if (textContent !== this.modelValue) {
        this.isUpdating = true;
        this.$emit('update:modelValue', textContent);
        
        this.$nextTick(() => {
          this.isUpdating = false;
        });
      }
    },

    /**
     * Execute a markdown operation and update content
     */
    executeMarkdownOperation(operation) {
      if (this.isUpdating) return;

      this.isUpdating = true;
      
      // Save current position
      this.markdownPosition = this.getCurrentMarkdownPosition();
      
      try {
        // Execute operation
        const result = operation();
        
        if (result && result.content !== undefined) {
          // Update markdown content
          this.$emit('update:modelValue', result.content);
          
          // Update cursor position for restoration
          if (result.cursorPosition !== undefined) {
            this.markdownPosition = result.cursorPosition;
          }
          
          // Re-render and restore cursor position
          this.$nextTick(() => {
            this.restoreCursorAfterUpdate();
            this.updateStyleStates();
            this.isUpdating = false;
          });
        } else {
          this.isUpdating = false;
        }
      } catch (error) {
        console.error('Error executing markdown operation:', error);
        this.isUpdating = false;
      }
    },

    /**
     * Style toggle methods - simplified and more reliable
     */
    toggleBold() {
      this.applyMarkdownStyle('**', '**');
    },

    toggleItalic() {
      this.applyMarkdownStyle('*', '*');
    },

    toggleUnderline() {
      this.applyMarkdownStyle('<u>', '</u>');
    },

    toggleStrikethrough() {
      this.applyMarkdownStyle('~~', '~~');
    },

    toggleCode() {
      this.applyMarkdownStyle('`', '`');
    },

    toggleHighlight() {
      this.applyMarkdownStyle('<mark>', '</mark>');
    },
    
    /**
     * Apply markdown style to selected text or at cursor position
     */
    applyMarkdownStyle(prefix, suffix) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      // Create the styled text
      const styledText = prefix + selectedText + suffix;
      
      // Replace the selection with styled text
      range.deleteContents();
      range.insertNode(document.createTextNode(styledText));
      
      // Position cursor after the styled text
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Sync content after style application
      this.debouncedContentSync();
      this.debouncedStyleUpdate();
    },

    /**
     * Block operation methods - simplified and working
     */
    toggleHeading() {
      this.insertAtLineStart('#');
    },

    insertUnorderedList() {
      this.insertAtLineStart('- ');
    },

    insertTaskList() {
      this.insertAtLineStart('- [ ] ');
    },

    insertBlockQuote() {
      this.insertAtLineStart('> ');
    },

    insertCodeBlock() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const codeBlock = '\n```\n\n```\n';
      
      range.deleteContents();
      range.insertNode(document.createTextNode(codeBlock));
      
      // Position cursor inside the code block
      const textNode = range.startContainer.nextSibling;
      if (textNode) {
        range.setStart(textNode, 4); // Position after ```\n
        range.collapse(true);
      }
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      this.debouncedContentSync();
    },

    insertHorizontalRule() {
      this.insertAtLineStart('---\n');
    },
    
    /**
     * Insert text at the beginning of the current line
     */
    insertAtLineStart(text) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      
      // Find the start of the current line
      let container = range.startContainer;
      let offset = range.startOffset;
      
      // Navigate to line start
      while (container && container.nodeType === Node.TEXT_NODE) {
        const textContent = container.textContent;
        const lineStart = textContent.lastIndexOf('\n', offset - 1);
        
        if (lineStart !== -1) {
          range.setStart(container, lineStart + 1);
          break;
        } else if (container.previousSibling) {
          container = container.previousSibling;
          offset = container.textContent ? container.textContent.length : 0;
        } else {
          // We're at the beginning of the content
          range.setStart(container, 0);
          break;
        }
      }
      
      // Insert the text
      range.collapse(true);
      range.insertNode(document.createTextNode(text));
      
      // Move cursor to end of inserted text
      range.setStartAfter(range.startContainer);
      range.collapse(true);
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      this.debouncedContentSync();
    },

    insertImage() {
      const url = prompt('请输入图片URL:');
      if (url) {
        const imageMarkdown = `![alt text](${url})`;
        this.insertTextAtCursor(imageMarkdown);
      }
    },

    insertMathInline() {
      const latex = prompt('请输入LaTeX公式:');
      if (latex) {
        const mathMarkdown = `$${latex}$`;
        this.insertTextAtCursor(mathMarkdown);
      }
    },

    insertMathBlock() {
      const latex = prompt('请输入LaTeX块级公式:');
      if (latex) {
        const mathMarkdown = `\n$$\n${latex}\n$$\n`;
        this.insertTextAtCursor(mathMarkdown);
      }
    },

    insertColorText(color) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const selectedText = range.toString() || 'colored text';
      const coloredText = `<font color="${color}">${selectedText}</font>`;
      
      range.deleteContents();
      range.insertNode(document.createTextNode(coloredText));
      range.collapse(false);
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      this.debouncedContentSync();
    },

    /**
     * Helper methods
     */
    insertTextAtCursor(text) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      this.debouncedContentSync();
    },

    focus() {
      if (this.$refs.editor) {
        this.$refs.editor.focus();
      }
    },

    insertMarkdown(markdownText) {
      this.insertTextAtCursor(markdownText);
    },
    
    /**
     * Simple method to get current cursor position (simplified)
     */
    getCurrentMarkdownPosition() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return 0;

      const range = selection.getRangeAt(0);
      return this.getTextOffset(range.startContainer, range.startOffset);
    },
    
    /**
     * Restore cursor position after content update (simplified)
     */
    restoreCursorAfterUpdate() {
      // In the simplified approach, we don't try to map positions
      // The cursor should stay where the user left it naturally
    }
  }
}
</script>

<style scoped>
.wysiwyg-editor-refactored {
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}

.wysiwyg-editor-refactored:focus {
  border-color: #0969da !important;
  box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.3);
}

/* Ensure empty lines are properly handled and clickable */
.wysiwyg-editor-refactored p:empty::before {
  content: '\00a0'; /* Non-breaking space */
  color: transparent;
}

.wysiwyg-editor-refactored p:empty {
  min-height: 1.2em; /* Ensure empty paragraphs have height */
}

.wysiwyg-editor-refactored br:only-child {
  display: block;
  min-height: 1.2em;
}
</style>