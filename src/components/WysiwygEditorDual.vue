<template>
  <div 
    class="wysiwyg-editor-dual"
    contenteditable="true"
    ref="editor"
    @input="handleInput"
    @keydown="handleKeydown" 
    @paste="handlePaste"
    @focus="handleFocus"
    @blur="handleBlur"
    style="min-height: 250px; padding: 15px; border: 1px solid #d1d9e0; border-radius: 6px; outline: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; white-space: pre-wrap;"
    :style="{ fontSize: '14px' }"
    spellcheck="false"
  ></div>
</template>

<script>
import { debounce } from 'lodash-es';

export default {
  name: 'WysiwygEditorDual',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    markdownRenderer: {
      type: Function,
      required: true
    }
  },
  emits: ['update:modelValue', 'style-state-update'],
  data() {
    return {
      isUpdating: false,
      markdownContent: '',
      htmlContent: '',
      debouncedSync: null,
      currentStyles: {
        bold: false,
        italic: false,
        underline: false,
        code: false,
        strikethrough: false,
        highlight: false
      },
      showMarkdownSyntax: false,
      cursorNearMarkdown: false
    }
  },
  created() {
    // Debounce synchronization to prevent excessive updates
    this.debouncedSync = debounce(this.syncFromHTML, 200);
  },
  mounted() {
    this.initializeContent();
    this.setupEventListeners();
  },
  watch: {
    modelValue: {
      handler(newValue) {
        if (!this.isUpdating && newValue !== this.markdownContent) {
          this.markdownContent = newValue || '';
          this.updateHTMLFromMarkdown();
        }
      },
      immediate: true
    }
  },
  beforeUnmount() {
    if (this.debouncedSync) {
      this.debouncedSync.cancel();
    }
  },
  methods: {
    initializeContent() {
      this.markdownContent = this.modelValue || '';
      this.updateHTMLFromMarkdown();
    },

    setupEventListeners() {
      document.addEventListener('selectionchange', () => {
        if (this.$refs.editor && document.activeElement === this.$refs.editor) {
          this.updateCursorState();
        }
      });
    },

    updateHTMLFromMarkdown() {
      if (!this.$refs.editor) return;
      
      const savedSelection = this.saveSelection();
      
      // Use the parent's markdown renderer (get_md method)
      this.htmlContent = this.markdownRenderer(this.markdownContent);
      this.$refs.editor.innerHTML = this.htmlContent || '<br>';
      
      this.$nextTick(() => {
        this.restoreSelection(savedSelection);
        this.updateStyleStates();
      });
    },

    updateCursorState() {
      const position = this.getCurrentMarkdownPosition();
      this.updateStyleStates();
      
      // Check if cursor is near markdown syntax
      this.checkIfNearMarkdown(position);
      
      // Emit style states for toolbar updates
      this.$emit('style-state-update', {
        styles: this.currentStyles,
        headingLevel: this.getCurrentHeadingLevel()
      });
    },

    checkIfNearMarkdown(position) {
      // For now, always show rendered content
      // We can enhance this later to show syntax when editing
      this.cursorNearMarkdown = false;
    },

    getCurrentMarkdownPosition() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return 0;
      
      const range = selection.getRangeAt(0);
      
      // Simple approach: map HTML position to approximate markdown position
      // This can be enhanced with more sophisticated mapping
      return this.mapHTMLToMarkdownPosition(range.startOffset);
    },

    mapHTMLToMarkdownPosition(htmlOffset) {
      // Simple mapping - this could be enhanced
      return Math.min(htmlOffset, this.markdownContent.length);
    },

    updateStyleStates() {
      const position = this.getCurrentMarkdownPosition();
      const text = this.markdownContent;
      
      // Detect current styles based on markdown syntax
      this.currentStyles = {
        bold: this.isInStyle(text, position, '**') || this.isInStyle(text, position, '__'),
        italic: this.isInStyle(text, position, '*') || this.isInStyle(text, position, '_'),
        code: this.isInStyle(text, position, '`'),
        strikethrough: this.isInStyle(text, position, '~~'),
        underline: this.isInStyle(text, position, '<u>', '</u>'),
        highlight: this.isInStyle(text, position, '<mark>', '</mark>')
      };
    },

    getCurrentHeadingLevel() {
      const position = this.getCurrentMarkdownPosition();
      const text = this.markdownContent;
      
      // Find the current line
      const lines = text.split('\n');
      let currentLineIndex = 0;
      let charCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= position) {
          currentLineIndex = i;
          break;
        }
        charCount += lines[i].length + 1;
      }
      
      const currentLine = lines[currentLineIndex];
      const headingMatch = currentLine.match(/^(#{1,6})\s/);
      
      return headingMatch ? headingMatch[1].length : 0;
    },

    isInStyle(text, position, startMarker, endMarker = null) {
      if (!endMarker) endMarker = startMarker;
      
      // Find the nearest markers around the cursor position
      let beforePos = text.lastIndexOf(startMarker, position);
      let afterPos = text.indexOf(endMarker, position);
      
      if (beforePos === -1 || afterPos === -1) return false;
      
      // Check if we're between a valid pair
      return beforePos < position && position <= afterPos;
    },

    handleInput(event) {
      // Don't interfere with natural editing, just sync after changes
      this.debouncedSync();
    },

    handleKeydown(event) {
      // Handle special keys
      if (event.key === 'Enter') {
        this.handleEnterKey(event);
      }
      
      // Allow natural editing, sync afterward
      this.$nextTick(() => {
        this.debouncedSync();
      });
    },

    handleEnterKey(event) {
      // Handle line breaks in lists, quotes, etc.
      const position = this.getCurrentMarkdownPosition();
      const lines = this.markdownContent.split('\n');
      let currentLineIndex = 0;
      let charCount = 0;
      
      // Find current line
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= position) {
          currentLineIndex = i;
          break;
        }
        charCount += lines[i].length + 1; // +1 for newline
      }
      
      const currentLine = lines[currentLineIndex];
      
      // Handle list continuation
      const listMatch = currentLine.match(/^(\s*[-*+]\s+)/);
      const orderedListMatch = currentLine.match(/^(\s*\d+\.\s+)/);
      const quoteMatch = currentLine.match(/^(\s*>\s*)/);
      
      if (listMatch || orderedListMatch || quoteMatch) {
        event.preventDefault();
        
        let prefix = '';
        if (listMatch) prefix = listMatch[1];
        else if (orderedListMatch) {
          const indent = orderedListMatch[1].match(/^\s*/)[0];
          const nextNum = parseInt(orderedListMatch[1].match(/\d+/)[0]) + 1;
          prefix = `${indent}${nextNum}. `;
        } else if (quoteMatch) prefix = quoteMatch[1];
        
        this.insertText('\n' + prefix);
      }
    },

    handlePaste(event) {
      event.preventDefault();
      
      const pastedText = event.clipboardData.getData('text/plain');
      
      // Handle multi-line code paste
      if (pastedText.includes('\n') && !pastedText.startsWith('```')) {
        // Ask for language for multi-line code
        const language = prompt('请选择代码语言 (或留空):', 'javascript');
        const codeBlock = `\n\`\`\`${language || ''}\n${pastedText}\n\`\`\`\n`;
        this.insertText(codeBlock);
      } else {
        this.insertText(pastedText);
      }
    },

    insertText(text) {
      // Simple approach: append to the end of the current content
      // This works like the normal mode buttons
      this.markdownContent = this.markdownContent + text;
      
      this.syncToParent();
      this.updateHTMLFromMarkdown();
    },

    syncFromHTML() {
      if (!this.$refs.editor) return;
      
      // Get the current HTML content
      const htmlContent = this.$refs.editor.innerHTML;
      
      // For now, we don't reverse-engineer markdown from HTML
      // Instead, we rely on the insertText method for changes
      // This prevents the complex HTML-to-markdown conversion issues
      
      this.updateStyleStates();
    },

    syncToParent() {
      this.isUpdating = true;
      this.$emit('update:modelValue', this.markdownContent);
      this.$nextTick(() => {
        this.isUpdating = false;
      });
    },

    handleFocus() {
      this.updateCursorState();
    },

    handleBlur() {
      // Sync any pending changes
      this.debouncedSync.flush();
    },

    saveSelection() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return null;
      
      const range = selection.getRangeAt(0);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset
      };
    },

    restoreSelection(savedSelection) {
      if (!savedSelection || !this.$refs.editor) return;
      
      try {
        const range = document.createRange();
        const selection = window.getSelection();
        
        // Validate containers are still in the document
        if (this.$refs.editor.contains(savedSelection.startContainer) &&
            this.$refs.editor.contains(savedSelection.endContainer)) {
          range.setStart(savedSelection.startContainer, savedSelection.startOffset);
          range.setEnd(savedSelection.endContainer, savedSelection.endOffset);
          
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } catch (e) {
        // If restoration fails, just place cursor at end
        this.placeCursorAtEnd();
      }
    },

    placeCursorAtEnd() {
      if (!this.$refs.editor) return;
      
      const range = document.createRange();
      const selection = window.getSelection();
      
      range.selectNodeContents(this.$refs.editor);
      range.collapse(false);
      
      selection.removeAllRanges();
      selection.addRange(range);
    },

    // Public methods for toolbar integration
    insertMarkdown(markdown) {
      this.insertText(markdown);
    },

    insertMarkdownWrapper(start, end = '') {
      // Simple approach: just insert the markers at current position
      // This will work like the normal mode buttons
      this.insertText(start + end);
    },

    getSelectedMarkdownText() {
      const start = this.getSelectionStartMarkdownPosition();
      const end = this.getSelectionEndMarkdownPosition();
      return this.markdownContent.substring(start, end);
    },

    getSelectionStartMarkdownPosition() {
      // Simplified - this can be enhanced
      return this.getCurrentMarkdownPosition();
    },

    getSelectionEndMarkdownPosition() {
      // Simplified - this can be enhanced
      return this.getCurrentMarkdownPosition();
    },

    setCursorAtMarkdownPosition(position) {
      // This would need sophisticated HTML-to-markdown mapping
      // For now, just place at end
      this.placeCursorAtEnd();
    },

    // Public API for parent component integration
    focus() {
      if (this.$refs.editor) {
        this.$refs.editor.focus();
      }
    },

    // Toolbar integration methods
    toggleBold() {
      this.insertMarkdownWrapper('**', '**');
    },

    toggleItalic() {
      this.insertMarkdownWrapper('*', '*');
    },

    toggleUnderline() {
      this.insertMarkdownWrapper('<u>', '</u>');
    },

    toggleCode() {
      this.insertMarkdownWrapper('`', '`');
    },

    toggleStrikethrough() {
      this.insertMarkdownWrapper('~~', '~~');
    },

    toggleHighlight() {
      this.insertMarkdownWrapper('<mark>', '</mark>');
    },

    toggleHeading() {
      const position = this.getCurrentMarkdownPosition();
      const lines = this.markdownContent.split('\n');
      let currentLineIndex = 0;
      let charCount = 0;
      
      // Find current line
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= position) {
          currentLineIndex = i;
          break;
        }
        charCount += lines[i].length + 1;
      }
      
      const currentLine = lines[currentLineIndex];
      const headingMatch = currentLine.match(/^(#{1,6})\s/);
      
      if (headingMatch) {
        const level = headingMatch[1].length;
        if (level >= 6) {
          // Remove heading
          lines[currentLineIndex] = currentLine.replace(/^#{1,6}\s/, '');
        } else {
          // Increase level
          lines[currentLineIndex] = currentLine.replace(/^#{1,6}\s/, '#'.repeat(level + 1) + ' ');
        }
      } else {
        // Add heading
        lines[currentLineIndex] = '# ' + currentLine;
      }
      
      this.markdownContent = lines.join('\n');
      this.syncToParent();
      this.updateHTMLFromMarkdown();
    },

    insertCodeBlock() {
      const language = prompt('请选择代码语言 (或留空):', 'javascript') || '';
      this.insertMarkdown(`\n\`\`\`${language}\n\n\`\`\`\n`);
    },

    showCodeBlockLanguageSelector() {
      // For now, just prompt for language
      const language = prompt('请选择代码语言:', 'javascript');
      if (language !== null) {
        // Try to update current code block or create new one
        this.insertCodeBlock();
      }
    },

    insertBlockQuote() {
      this.insertMarkdown('> ');
    },

    insertUnorderedList() {
      this.insertMarkdown('- ');
    },

    insertTaskList() {
      this.insertMarkdown('- [ ] ');
    },

    insertImage() {
      this.insertMarkdownWrapper('![](', ')');
    },

    insertHorizontalRule() {
      this.insertMarkdown('\n------\n');
    },

    insertTOC() {
      this.insertMarkdown('\n[[TOC]]\n');
    },

    insertMathInline() {
      this.insertMarkdownWrapper(' $', '$ ');
    },

    insertColorText(color) {
      this.insertMarkdownWrapper(`<font color="${color}">`, '</font>');
    },

    // Toolbar integration methods
    toggleBold() {
      this.insertMarkdownWrapper('**', '**');
    },

    toggleItalic() {
      this.insertMarkdownWrapper('*', '*');
    },

    toggleUnderline() {
      this.insertMarkdownWrapper('<u>', '</u>');
    },

    toggleCode() {
      this.insertMarkdownWrapper('`', '`');
    },

    toggleStrikethrough() {
      this.insertMarkdownWrapper('~~', '~~');
    },

    toggleHighlight() {
      this.insertMarkdownWrapper('<mark>', '</mark>');
    },

    insertCodeBlock() {
      const language = prompt('请选择代码语言 (或留空):', 'javascript') || '';
      this.insertMarkdown(`\n\`\`\`${language}\n\n\`\`\`\n`);
    },

    insertHeading() {
      this.insertMarkdown('# ');
    },

    insertQuote() {
      this.insertMarkdown('> ');
    },

    insertList() {
      this.insertMarkdown('- ');
    }
  }
}
</script>

<style scoped>
.wysiwyg-editor-dual {
  /* Base editor styles */
}

/* Ensure proper rendering of markdown-it generated content */
.wysiwyg-editor-dual :deep(.hljs) {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
}

.wysiwyg-editor-dual :deep(pre) {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
}

.wysiwyg-editor-dual :deep(blockquote) {
  border-left: 4px solid #d1d9e0;
  padding: 0 16px;
  margin: 16px 0;
  color: #656d76;
}

.wysiwyg-editor-dual :deep(h1),
.wysiwyg-editor-dual :deep(h2),
.wysiwyg-editor-dual :deep(h3),
.wysiwyg-editor-dual :deep(h4),
.wysiwyg-editor-dual :deep(h5),
.wysiwyg-editor-dual :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.wysiwyg-editor-dual :deep(ul),
.wysiwyg-editor-dual :deep(ol) {
  padding-left: 2em;
  margin: 16px 0;
}

.wysiwyg-editor-dual :deep(li) {
  margin: 0.25em 0;
}
</style>