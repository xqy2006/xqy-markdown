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
      markdownPosition: 0, // Current cursor position in markdown
      debouncedStyleUpdate: null
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
        });
      }
    }
  },
  created() {
    // Initialize edit handler with cursor manager
    this.editHandler = new EditHandler(this.cursorManager);
    
    // Debounced style state update
    this.debouncedStyleUpdate = debounce(this.updateStyleStates, 100);
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
     * Handle input events - convert to markdown operations
     */
    handleInput(event) {
      if (this.isUpdating) return;
      
      this.preventDefaultContentEditing(event);
      
      // Get the current selection/cursor position
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      // Save cursor position before processing
      this.cursorManager.savePosition(this.$refs.editor);

      // For now, we'll use a simplified approach
      // In a full implementation, we'd detect the exact edit operation
      this.debouncedStyleUpdate();
    },

    /**
     * Prevent default contenteditable behavior and intercept edits
     */
    preventDefaultContentEditing(event) {
      // We want to prevent default HTML editing and convert to markdown ops
      // For now, allow limited editing to test the concept
      
      // Prevent HTML formatting commands
      if (event.inputType && event.inputType.startsWith('format')) {
        event.preventDefault();
        return false;
      }

      return true;
    },

    /**
     * Handle key down events
     */
    handleKeydown(event) {
      // Handle special key combinations for markdown operations
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
          default:
            break;
        }
      }

      // Handle Enter key for markdown-aware line breaks
      if (event.key === 'Enter') {
        this.handleEnterKey(event);
      }

      // Handle Tab key for lists and code blocks
      if (event.key === 'Tab') {
        this.handleTabKey(event);
      }
    },

    /**
     * Handle paste events
     */
    handlePaste(event) {
      event.preventDefault();
      
      const clipboardData = event.clipboardData || window.clipboardData;
      const plainText = clipboardData.getData('text/plain');
      
      if (plainText) {
        this.insertTextAtCursor(plainText);
      }
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
     * Update style states based on current cursor position
     */
    updateStyleStates() {
      if (!this.$refs.editor) return;

      // Get current cursor position in markdown
      const markdownPosition = this.getCurrentMarkdownPosition();
      
      // Update style manager state
      const styleState = this.styleManager.updateStyleState(this.modelValue, markdownPosition);
      
      // Emit style state update
      this.$emit('style-state-update', styleState);
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
     * Execute a markdown operation and update content
     */
    executeMarkdownOperation(operation) {
      if (this.isUpdating) return;

      this.isUpdating = true;
      
      // Save current position
      this.markdownPosition = this.getCurrentMarkdownPosition();
      
      // Execute operation
      const result = operation();
      
      if (result && result.content !== undefined) {
        // Update markdown content
        this.$emit('update:modelValue', result.content);
        
        // Update cursor position for restoration
        if (result.cursorPosition !== undefined) {
          this.markdownPosition = result.cursorPosition;
        }
      } else {
        this.isUpdating = false;
      }
    },

    /**
     * Style toggle methods
     */
    toggleBold() {
      this.executeMarkdownOperation(() => {
        const position = this.getCurrentMarkdownPosition();
        return this.editHandler.handleStyleToggle(this.modelValue, position, position, 'bold');
      });
    },

    toggleItalic() {
      this.executeMarkdownOperation(() => {
        const position = this.getCurrentMarkdownPosition();
        return this.editHandler.handleStyleToggle(this.modelValue, position, position, 'italic');
      });
    },

    toggleUnderline() {
      this.executeMarkdownOperation(() => {
        const position = this.getCurrentMarkdownPosition();
        return this.editHandler.handleStyleToggle(this.modelValue, position, position, 'underline');
      });
    },

    toggleStrikethrough() {
      this.executeMarkdownOperation(() => {
        const position = this.getCurrentMarkdownPosition();
        return this.editHandler.handleStyleToggle(this.modelValue, position, position, 'strikethrough');
      });
    },

    toggleCode() {
      this.executeMarkdownOperation(() => {
        const position = this.getCurrentMarkdownPosition();
        return this.editHandler.handleStyleToggle(this.modelValue, position, position, 'code');
      });
    },

    toggleHighlight() {
      this.executeMarkdownOperation(() => {
        const position = this.getCurrentMarkdownPosition();
        return this.editHandler.handleStyleToggle(this.modelValue, position, position, 'highlight');
      });
    },

    /**
     * Block operation methods
     */
    toggleHeading() {
      this.executeMarkdownOperation(() => {
        const position = this.getCurrentMarkdownPosition();
        return this.editHandler.handleHeadingToggle(this.modelValue, position);
      });
    },

    insertUnorderedList() {
      this.executeMarkdownOperation(() => {
        const position = this.getCurrentMarkdownPosition();
        return this.editHandler.handleListInsertion(this.modelValue, position, 'unordered');
      });
    },

    insertTaskList() {
      this.executeMarkdownOperation(() => {
        const position = this.getCurrentMarkdownPosition();
        return this.editHandler.handleListInsertion(this.modelValue, position, 'task');
      });
    },

    insertBlockQuote() {
      this.executeMarkdownOperation(() => {
        const position = this.getCurrentMarkdownPosition();
        return this.editHandler.handleBlockquoteInsertion(this.modelValue, position);
      });
    },

    insertCodeBlock() {
      this.executeMarkdownOperation(() => {
        const position = this.getCurrentMarkdownPosition();
        return this.editHandler.handleCodeBlockInsertion(this.modelValue, position);
      });
    },

    insertHorizontalRule() {
      this.executeMarkdownOperation(() => {
        const position = this.getCurrentMarkdownPosition();
        return this.editHandler.handleHorizontalRuleInsertion(this.modelValue, position);
      });
    },

    insertImage() {
      const url = prompt('请输入图片URL:');
      if (url) {
        this.executeMarkdownOperation(() => {
          const position = this.getCurrentMarkdownPosition();
          return this.editHandler.handleImageInsertion(this.modelValue, position, url);
        });
      }
    },

    insertMathInline() {
      const latex = prompt('请输入LaTeX公式:');
      if (latex) {
        this.executeMarkdownOperation(() => {
          const position = this.getCurrentMarkdownPosition();
          return this.editHandler.handleMathInsertion(this.modelValue, position, latex, false);
        });
      }
    },

    insertMathBlock() {
      const latex = prompt('请输入LaTeX块级公式:');
      if (latex) {
        this.executeMarkdownOperation(() => {
          const position = this.getCurrentMarkdownPosition();
          return this.editHandler.handleMathInsertion(this.modelValue, position, latex, true);
        });
      }
    },

    insertColorText(color) {
      this.executeMarkdownOperation(() => {
        const position = this.getCurrentMarkdownPosition();
        return this.editHandler.handleStyleToggle(this.modelValue, position, position, 'highlight');
      });
    },

    /**
     * Helper methods
     */
    insertTextAtCursor(text) {
      this.executeMarkdownOperation(() => {
        const position = this.getCurrentMarkdownPosition();
        return this.editHandler.handleTextInput(this.modelValue, position, text);
      });
    },

    handleEnterKey(event) {
      // Allow default behavior for now
      // In full implementation, would handle list continuation, etc.
    },

    handleTabKey(event) {
      // Allow default behavior for now
      // In full implementation, would handle list indentation, etc.
    },

    /**
     * Public methods for external access
     */
    focus() {
      if (this.$refs.editor) {
        this.$refs.editor.focus();
      }
    },

    insertMarkdown(markdownText) {
      this.insertTextAtCursor(markdownText);
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