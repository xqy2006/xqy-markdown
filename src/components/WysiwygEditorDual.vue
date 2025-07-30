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
    @mouseup="handleCursorMove"
    @keyup="handleCursorMove"
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
      debouncedRender: null,
      currentStyles: {
        bold: false,
        italic: false,
        underline: false,
        code: false,
        strikethrough: false,
        highlight: false
      },
      showMarkdownSyntax: false,
      cursorNearMarkdown: false,
      lastCursorPosition: 0,
      syntaxRanges: [],
      isComposing: false
    }
  },
  created() {
    // Debounce synchronization to prevent excessive updates
    this.debouncedSync = debounce(this.syncFromHTML, 150);
    this.debouncedRender = debounce(this.updateHTMLFromMarkdown, 100);
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
          this.debouncedRender();
        }
      },
      immediate: true
    }
  },
  beforeUnmount() {
    if (this.debouncedSync) {
      this.debouncedSync.cancel();
    }
    if (this.debouncedRender) {
      this.debouncedRender.cancel();
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
          this.handleCursorMove();
        }
      });
      
      // Handle composition events for better input handling
      this.$refs.editor?.addEventListener('compositionstart', () => {
        this.isComposing = true;
      });
      
      this.$refs.editor?.addEventListener('compositionend', () => {
        this.isComposing = false;
        this.debouncedSync();
      });
    },

    updateHTMLFromMarkdown() {
      if (!this.$refs.editor) return;
      
      const savedCursor = this.saveCursorPosition();
      
      // Check if cursor is near markdown syntax
      const cursorPos = this.getMarkdownCursorPosition();
      const syntaxToShow = this.findNearbyMarkdownSyntax(cursorPos);
      
      // Create mixed content (rendered + raw syntax where needed)
      this.htmlContent = this.createMixedContent(this.markdownContent, syntaxToShow);
      
      this.$refs.editor.innerHTML = this.htmlContent || '<br>';
      
      this.$nextTick(() => {
        this.restoreCursorPosition(savedCursor);
        this.updateStyleStates();
      });
    },

    createMixedContent(markdown, syntaxToShow) {
      // If no syntax to show, render normally
      if (!syntaxToShow.length) {
        return this.markdownRenderer(markdown);
      }
      
      // Create content with visible syntax at cursor position
      let processedMarkdown = markdown;
      
      // Sort syntax ranges by position (descending to avoid offset issues)
      syntaxToShow.sort((a, b) => b.start - a.start);
      
      syntaxToShow.forEach(range => {
        const before = processedMarkdown.substring(0, range.start);
        const syntax = processedMarkdown.substring(range.start, range.end);
        const after = processedMarkdown.substring(range.end);
        
        // Create visible syntax with special styling
        const visibleSyntax = `<span class="markdown-syntax-visible" style="color: #888; font-weight: normal;">${this.escapeHtml(syntax)}</span>`;
        processedMarkdown = before + visibleSyntax + after;
      });
      
      // For now, render the whole thing with markdown-it
      // In a more sophisticated implementation, we'd parse selectively
      return this.markdownRenderer(processedMarkdown);
    },

    findNearbyMarkdownSyntax(cursorPos) {
      const ranges = [];
      const text = this.markdownContent;
      
      // Find markdown syntax patterns near cursor
      const patterns = [
        { regex: /\*\*([^*]+)\*\*/g, type: 'bold' },
        { regex: /\*([^*]+)\*/g, type: 'italic' },
        { regex: /`([^`]+)`/g, type: 'code' },
        { regex: /~~([^~]+)~~/g, type: 'strikethrough' },
        { regex: /<u>([^<]+)<\/u>/g, type: 'underline' },
        { regex: /<mark>([^<]+)<\/mark>/g, type: 'highlight' }
      ];
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(text)) !== null) {
          const start = match.index;
          const end = start + match[0].length;
          
          // Check if cursor is within or very near this syntax
          if (cursorPos >= start - 2 && cursorPos <= end + 2) {
            ranges.push({ start, end, type: pattern.type });
          }
        }
      });
      
      return ranges;
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    getMarkdownCursorPosition() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return 0;
      
      const range = selection.getRangeAt(0);
      return this.mapHTMLToMarkdownPosition(range.startContainer, range.startOffset);
    },

    mapHTMLToMarkdownPosition(container, offset) {
      // Simplified mapping - in a full implementation this would be more sophisticated
      // For now, try to estimate based on text content
      const editor = this.$refs.editor;
      if (!editor) return 0;
      
      let position = 0;
      const walker = document.createTreeWalker(
        editor,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node === container) {
          return position + offset;
        }
        position += node.textContent.length;
      }
      
      return Math.min(position, this.markdownContent.length);
    },

    handleCursorMove() {
      this.updateCursorState();
    },

    updateCursorState() {
      const position = this.getMarkdownCursorPosition();
      this.lastCursorPosition = position;
      this.updateStyleStates();
      
      // Check if we need to show/hide syntax
      const nearSyntax = this.findNearbyMarkdownSyntax(position);
      const shouldShowSyntax = nearSyntax.length > 0;
      
      if (shouldShowSyntax !== this.showMarkdownSyntax) {
        this.showMarkdownSyntax = shouldShowSyntax;
        this.syntaxRanges = nearSyntax;
        this.debouncedRender();
      }
      
      // Emit style states for toolbar updates
      this.$emit('style-state-update', {
        styles: this.currentStyles,
        headingLevel: this.getCurrentHeadingLevel()
      });
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
      // Skip during composition (IME input)
      if (this.isComposing) return;
      
      // Don't interfere with natural editing, just sync after changes
      this.debouncedSync();
    },

    handleKeydown(event) {
      // Handle special keys
      if (event.key === 'Enter' && !event.shiftKey) {
        this.handleEnterKey(event);
      }
      
      // Allow natural editing, sync afterward
      this.$nextTick(() => {
        if (!this.isComposing) {
          this.debouncedSync();
        }
      });
    },

    handleEnterKey(event) {
      // Get current cursor position in markdown
      const cursorPos = this.getMarkdownCursorPosition();
      const lines = this.markdownContent.split('\n');
      let currentLineIndex = 0;
      let charCount = 0;
      
      // Find current line
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= cursorPos) {
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
        if (listMatch) {
          prefix = listMatch[1];
        } else if (orderedListMatch) {
          const indent = orderedListMatch[1].match(/^\s*/)[0];
          const nextNum = parseInt(orderedListMatch[1].match(/\d+/)[0]) + 1;
          prefix = `${indent}${nextNum}. `;
        } else if (quoteMatch) {
          prefix = quoteMatch[1];
        }
        
        // Insert line break with proper prefix
        this.insertAtCursor('\n' + prefix);
        return;
      }
    },

    syncFromHTML() {
      if (!this.$refs.editor) return;
      
      try {
        // Get the text content from the editor
        const htmlContent = this.$refs.editor.innerHTML;
        const textContent = this.$refs.editor.textContent || '';
        
        // Simple approach: if the text content has changed significantly,
        // try to update the markdown content accordingly
        
        // For now, we'll use a simplified approach that preserves the markdown
        // and only updates based on direct text changes
        const currentTextLength = textContent.length;
        const previousTextLength = this.markdownContent.length;
        
        if (Math.abs(currentTextLength - previousTextLength) > 0) {
          // Try to map the changes back to markdown
          this.updateMarkdownFromText(textContent);
        }
        
        this.updateStyleStates();
      } catch (error) {
        console.warn('Error syncing from HTML:', error);
      }
    },

    updateMarkdownFromText(newText) {
      // Simplified approach: if the text content changed, try to preserve markdown structure
      // This is a complex problem that would need sophisticated diff algorithms
      // For now, we'll handle basic cases
      
      const oldText = this.getPlainTextFromMarkdown(this.markdownContent);
      
      if (newText === oldText) return;
      
      // For now, just update if the change is simple (like typing at the end)
      if (newText.startsWith(oldText)) {
        // Text was added at the end
        const addedText = newText.substring(oldText.length);
        this.markdownContent += addedText;
        this.syncToParent();
      } else if (oldText.startsWith(newText)) {
        // Text was removed from the end
        const removedLength = oldText.length - newText.length;
        this.markdownContent = this.markdownContent.substring(0, this.markdownContent.length - removedLength);
        this.syncToParent();
      }
      // For more complex changes, we'd need a proper diff algorithm
    },

    getPlainTextFromMarkdown(markdown) {
      // Simple approach: render to HTML then extract text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = this.markdownRenderer(markdown);
      return tempDiv.textContent || tempDiv.innerText || '';
    },

    insertAtCursor(text) {
      const cursorPos = this.getMarkdownCursorPosition();
      
      // Insert text at cursor position in markdown
      const before = this.markdownContent.substring(0, cursorPos);
      const after = this.markdownContent.substring(cursorPos);
      
      this.markdownContent = before + text + after;
      this.syncToParent();
      
      // Update HTML and restore cursor
      this.$nextTick(() => {
        this.updateHTMLFromMarkdown();
        // Try to place cursor after inserted text
        this.setCursorAtMarkdownPosition(cursorPos + text.length);
      });
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
      // Use the new insertAtCursor method for better positioning
      this.insertAtCursor(text);
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

    updateStyleStates() {
      const position = this.getMarkdownCursorPosition();
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
      const position = this.getMarkdownCursorPosition();
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

    saveCursorPosition() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return null;
      
      const range = selection.getRangeAt(0);
      const markdownPos = this.mapHTMLToMarkdownPosition(range.startContainer, range.startOffset);
      
      return {
        markdownPosition: markdownPos,
        htmlSelection: {
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset
        }
      };
    },

    restoreCursorPosition(savedCursor) {
      if (!savedCursor || !this.$refs.editor) return;
      
      try {
        // Try to restore HTML selection first
        const selection = window.getSelection();
        const range = document.createRange();
        
        if (this.$refs.editor.contains(savedCursor.htmlSelection.startContainer) &&
            this.$refs.editor.contains(savedCursor.htmlSelection.endContainer)) {
          range.setStart(savedCursor.htmlSelection.startContainer, savedCursor.htmlSelection.startOffset);
          range.setEnd(savedCursor.htmlSelection.endContainer, savedCursor.htmlSelection.endOffset);
          
          selection.removeAllRanges();
          selection.addRange(range);
          return;
        }
      } catch (e) {
        // Fall back to markdown position
      }
      
      // Fall back to placing cursor at markdown position
      this.setCursorAtMarkdownPosition(savedCursor.markdownPosition);
    },

    setCursorAtMarkdownPosition(markdownPos) {
      if (!this.$refs.editor) return;
      
      try {
        // Find the corresponding HTML position
        const htmlPos = this.mapMarkdownToHTMLPosition(markdownPos);
        
        const selection = window.getSelection();
        const range = document.createRange();
        
        // Find the text node and offset for this position
        const { node, offset } = this.findTextNodeAtPosition(this.$refs.editor, htmlPos);
        
        if (node) {
          range.setStart(node, offset);
          range.setEnd(node, offset);
          
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } catch (e) {
        // If all else fails, place cursor at end
        this.placeCursorAtEnd();
      }
    },

    findTextNodeAtPosition(container, targetOffset) {
      let currentOffset = 0;
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        const nodeLength = node.textContent.length;
        
        if (currentOffset + nodeLength >= targetOffset) {
          return {
            node: node,
            offset: targetOffset - currentOffset
          };
        }
        
        currentOffset += nodeLength;
      }
      
      // If not found, return the last text node
      return { node: container.lastChild, offset: 0 };
    },

    mapMarkdownToHTMLPosition(markdownPos) {
      // Simplified mapping - would need more sophisticated implementation
      // For now, assume roughly similar positions
      return Math.min(markdownPos, this.$refs.editor?.textContent?.length || 0);
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
      this.insertAtCursor(markdown);
    },

    insertMarkdownWrapper(start, end = '') {
      const cursorPos = this.getMarkdownCursorPosition();
      const text = start + end;
      
      // Insert the wrapper and position cursor between markers
      const before = this.markdownContent.substring(0, cursorPos);
      const after = this.markdownContent.substring(cursorPos);
      
      this.markdownContent = before + text + after;
      this.syncToParent();
      
      // Update HTML and place cursor between markers
      this.$nextTick(() => {
        this.updateHTMLFromMarkdown();
        this.setCursorAtMarkdownPosition(cursorPos + start.length);
      });
    },

    getSelectedMarkdownText() {
      // For now, return empty - would need proper selection mapping
      return '';
    },

    // Toolbar integration methods - simplified to work like normal mode
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
      this.insertAtCursor(`\n\`\`\`${language}\n\n\`\`\`\n`);
    },

    insertHeading() {
      this.insertAtCursor('# ');
    },

    insertQuote() {
      this.insertAtCursor('> ');
    },

    insertList() {
      this.insertAtCursor('- ');
    },

    insertImage() {
      this.insertMarkdownWrapper('![](', ')');
    },

    insertHorizontalRule() {
      this.insertAtCursor('\n------\n');
    },

    insertTOC() {
      this.insertAtCursor('\n[[TOC]]\n');
    },

    insertMathInline() {
      this.insertMarkdownWrapper(' $', '$ ');
    },

    insertColorText(color) {
      this.insertMarkdownWrapper(`<font color="${color}">`, '</font>');
    },

    showCodeBlockLanguageSelector() {
      const language = prompt('请选择代码语言:', 'javascript');
      if (language !== null) {
        this.insertCodeBlock();
      }
    },

    insertBlockQuote() {
      this.insertAtCursor('> ');
    },

    insertUnorderedList() {
      this.insertAtCursor('- ');
    },

    insertTaskList() {
      this.insertAtCursor('- [ ] ');
    },

    // Public API for parent component integration
    focus() {
      if (this.$refs.editor) {
        this.$refs.editor.focus();
      }
    }
  }
}
</script>

<style scoped>
.wysiwyg-editor-dual {
  /* Base editor styles */
}

/* Typora-like visible markdown syntax */
.wysiwyg-editor-dual :deep(.markdown-syntax-visible) {
  color: #888 !important;
  font-weight: normal !important;
  opacity: 0.7;
  font-family: Monaco, 'Courier New', monospace;
  font-size: 0.9em;
  background: rgba(0, 0, 0, 0.05);
  padding: 0 2px;
  border-radius: 2px;
}

/* Hide syntax markers when not in focus */
.wysiwyg-editor-dual:not(:focus-within) :deep(.markdown-syntax-visible) {
  display: none;
}

/* Ensure proper rendering of markdown-it generated content */
.wysiwyg-editor-dual :deep(.hljs) {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  font-family: 'Courier New', Monaco, monospace;
}

.wysiwyg-editor-dual :deep(pre) {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  font-family: 'Courier New', Monaco, monospace;
}

.wysiwyg-editor-dual :deep(pre code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
}

.wysiwyg-editor-dual :deep(blockquote) {
  border-left: 4px solid #d1d9e0;
  padding: 0 16px;
  margin: 16px 0;
  color: #656d76;
  background: #f8f9fa;
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
  border-bottom: 1px solid #e1e4e8;
  padding-bottom: 8px;
}

.wysiwyg-editor-dual :deep(h1) { font-size: 2em; }
.wysiwyg-editor-dual :deep(h2) { font-size: 1.5em; }
.wysiwyg-editor-dual :deep(h3) { font-size: 1.25em; }
.wysiwyg-editor-dual :deep(h4) { font-size: 1em; }
.wysiwyg-editor-dual :deep(h5) { font-size: 0.875em; }
.wysiwyg-editor-dual :deep(h6) { font-size: 0.85em; }

.wysiwyg-editor-dual :deep(ul),
.wysiwyg-editor-dual :deep(ol) {
  padding-left: 2em;
  margin: 16px 0;
}

.wysiwyg-editor-dual :deep(li) {
  margin: 0.25em 0;
}

.wysiwyg-editor-dual :deep(p) {
  margin: 0 0 16px 0;
}

.wysiwyg-editor-dual :deep(code) {
  background: #f6f8fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', Monaco, monospace;
  font-size: 0.9em;
}

.wysiwyg-editor-dual :deep(mark) {
  background: #fff3cd;
  padding: 2px 4px;
  border-radius: 3px;
}

.wysiwyg-editor-dual :deep(strong) {
  font-weight: 600;
}

.wysiwyg-editor-dual :deep(em) {
  font-style: italic;
}

.wysiwyg-editor-dual :deep(del) {
  text-decoration: line-through;
  opacity: 0.7;
}

.wysiwyg-editor-dual :deep(u) {
  text-decoration: underline;
}

.wysiwyg-editor-dual :deep(hr) {
  border: none;
  border-top: 2px solid #e1e4e8;
  margin: 24px 0;
}

.wysiwyg-editor-dual :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.wysiwyg-editor-dual :deep(table th),
.wysiwyg-editor-dual :deep(table td) {
  border: 1px solid #d1d9e0;
  padding: 8px 12px;
  text-align: left;
}

.wysiwyg-editor-dual :deep(table th) {
  background: #f6f8fa;
  font-weight: 600;
}

.wysiwyg-editor-dual :deep(img) {
  max-width: 100%;
  height: auto;
}

/* Improved focus styles */
.wysiwyg-editor-dual:focus {
  border-color: #0366d6;
  box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
}
</style>