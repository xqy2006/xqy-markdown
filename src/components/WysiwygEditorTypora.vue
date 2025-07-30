<template>
  <div 
    class="wysiwyg-editor-typora"
    contenteditable="true"
    ref="editor"
    @input="handleInput"
    @keydown="handleKeydown" 
    @paste="handlePaste"
    @focus="handleFocus"
    @blur="handleBlur"
    @selectionchange="updateCursorPosition"
    style="min-height: 250px; padding: 15px; border: 1px solid #d1d9e0; border-radius: 6px; outline: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; white-space: pre-wrap;"
    :style="{ fontSize: '14px' }"
    spellcheck="false"
  ></div>
</template>

<script>
import { debounce } from 'lodash-es';

export default {
  name: 'WysiwygEditorTypora',
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'style-state-update'],
  data() {
    return {
      isUpdating: false,
      debouncedUpdate: null,
      currentStyles: {
        bold: false,
        italic: false,
        underline: false,
        code: false,
        strikethrough: false,
        highlight: false
      }
    }
  },
  computed: {
    // Remove displayContent computed property
  },
  created() {
    // Use minimal debouncing for responsive feel
    this.debouncedUpdate = debounce(this.updateMarkdown, 100);
  },
  mounted() {
    this.initializeContent();
    this.setupEventListeners();
  },
  watch: {
    modelValue: {
      handler(newValue) {
        if (!this.isUpdating && this.$refs.editor) {
          const savedSelection = this.saveSelection();
          this.$refs.editor.textContent = newValue || '';
          this.$nextTick(() => {
            this.applySyntaxHighlighting();
            this.restoreSelection(savedSelection);
            this.updateStyleStates();
          });
        }
      },
      immediate: true
    }
  },
  beforeUnmount() {
    if (this.debouncedUpdate) {
      this.debouncedUpdate.cancel();
    }
  },
  methods: {
    initializeContent() {
      if (!this.$refs.editor) return;
      
      // Set initial content as plain text
      this.$refs.editor.textContent = this.modelValue || '';
      
      // Apply initial styling
      this.$nextTick(() => {
        this.applySyntaxHighlighting();
        this.updateStyleStates();
      });
    },

    setupEventListeners() {
      // Listen for selection changes to update cursor position and styling
      document.addEventListener('selectionchange', () => {
        if (this.$refs.editor && document.activeElement === this.$refs.editor) {
          this.updateCursorPosition();
        }
      });
    },

    applySyntaxHighlighting() {
      if (!this.$refs.editor) return;
      
      const selection = window.getSelection();
      const savedSelection = this.saveSelection();
      
      const text = this.$refs.editor.textContent;
      const cursorPos = this.getCurrentTextPosition();
      
      // Create highlighted HTML
      const highlightedHTML = this.createHighlightedHTML(text, cursorPos);
      
      // Update content only if it changed significantly
      if (this.$refs.editor.innerHTML !== highlightedHTML) {
        this.$refs.editor.innerHTML = highlightedHTML;
        this.restoreSelection(savedSelection);
      }
    },

    createHighlightedHTML(text, cursorPos) {
      if (!text) return '<br>';
      
      let html = '';
      let i = 0;
      
      while (i < text.length) {
        const char = text[i];
        
        if (char === '*') {
          const result = this.processAsterisks(text, i, cursorPos);
          html += result.html;
          i = result.nextIndex;
        } else if (char === '`') {
          const result = this.processBackticks(text, i, cursorPos);
          html += result.html;
          i = result.nextIndex;
        } else if (char === '~') {
          const result = this.processTildes(text, i, cursorPos);
          html += result.html;
          i = result.nextIndex;
        } else if (char === '<') {
          const result = this.processHtmlTags(text, i, cursorPos);
          html += result.html;
          i = result.nextIndex;
        } else if (char === '\n') {
          html += '<br>';
          i++;
        } else {
          html += this.escapeHtml(char);
          i++;
        }
      }
      
      return html || '<br>';
    },

    processAsterisks(text, pos, cursorPos) {
      // Check for bold (**text**)
      if (text[pos + 1] === '*') {
        const closePos = this.findClosingPattern(text, pos + 2, '**');
        if (closePos !== -1) {
          const content = text.substring(pos + 2, closePos);
          const isNearCursor = this.isCursorNearMarkers(cursorPos, pos, closePos + 2);
          
          if (isNearCursor) {
            // Show markers in gray when cursor is nearby
            return {
              html: `<span class="md-marker">**</span>${this.escapeHtml(content)}<span class="md-marker">**</span>`,
              nextIndex: closePos + 2
            };
          } else {
            // Render as bold when cursor is away
            return {
              html: `<strong>${this.escapeHtml(content)}</strong>`,
              nextIndex: closePos + 2
            };
          }
        }
      }
      
      // Check for italic (*text*)
      const closePos = this.findClosingPattern(text, pos + 1, '*');
      if (closePos !== -1) {
        const content = text.substring(pos + 1, closePos);
        const isNearCursor = this.isCursorNearMarkers(cursorPos, pos, closePos + 1);
        
        if (isNearCursor) {
          return {
            html: `<span class="md-marker">*</span>${this.escapeHtml(content)}<span class="md-marker">*</span>`,
            nextIndex: closePos + 1
          };
        } else {
          return {
            html: `<em>${this.escapeHtml(content)}</em>`,
            nextIndex: closePos + 1
          };
        }
      }
      
      return {
        html: this.escapeHtml(text[pos]),
        nextIndex: pos + 1
      };
    },

    processBackticks(text, pos, cursorPos) {
      // Check for code blocks (```text```)
      if (text.substr(pos, 3) === '```') {
        const closePos = text.indexOf('```', pos + 3);
        if (closePos !== -1) {
          const content = text.substring(pos + 3, closePos);
          const isNearCursor = this.isCursorNearMarkers(cursorPos, pos, closePos + 3);
          
          if (isNearCursor) {
            return {
              html: `<span class="md-marker">\`\`\`</span><br>${this.escapeHtml(content)}<br><span class="md-marker">\`\`\`</span>`,
              nextIndex: closePos + 3
            };
          } else {
            return {
              html: `<pre><code>${this.escapeHtml(content)}</code></pre>`,
              nextIndex: closePos + 3
            };
          }
        }
      }
      
      // Check for inline code (`text`)
      const closePos = this.findClosingPattern(text, pos + 1, '`');
      if (closePos !== -1) {
        const content = text.substring(pos + 1, closePos);
        const isNearCursor = this.isCursorNearMarkers(cursorPos, pos, closePos + 1);
        
        if (isNearCursor) {
          return {
            html: `<span class="md-marker">\`</span>${this.escapeHtml(content)}<span class="md-marker">\`</span>`,
            nextIndex: closePos + 1
          };
        } else {
          return {
            html: `<code>${this.escapeHtml(content)}</code>`,
            nextIndex: closePos + 1
          };
        }
      }
      
      return {
        html: this.escapeHtml(text[pos]),
        nextIndex: pos + 1
      };
    },

    processTildes(text, pos, cursorPos) {
      if (text.substr(pos, 2) === '~~') {
        const closePos = text.indexOf('~~', pos + 2);
        if (closePos !== -1) {
          const content = text.substring(pos + 2, closePos);
          const isNearCursor = this.isCursorNearMarkers(cursorPos, pos, closePos + 2);
          
          if (isNearCursor) {
            return {
              html: `<span class="md-marker">~~</span>${this.escapeHtml(content)}<span class="md-marker">~~</span>`,
              nextIndex: closePos + 2
            };
          } else {
            return {
              html: `<del>${this.escapeHtml(content)}</del>`,
              nextIndex: closePos + 2
            };
          }
        }
      }
      
      return {
        html: this.escapeHtml(text[pos]),
        nextIndex: pos + 1
      };
    },

    processHtmlTags(text, pos, cursorPos) {
      // Check for underline <u>text</u>
      if (text.substr(pos, 3) === '<u>') {
        const closePos = text.indexOf('</u>', pos + 3);
        if (closePos !== -1) {
          const content = text.substring(pos + 3, closePos);
          const isNearCursor = this.isCursorNearMarkers(cursorPos, pos, closePos + 4);
          
          if (isNearCursor) {
            return {
              html: `<span class="md-marker">&lt;u&gt;</span>${this.escapeHtml(content)}<span class="md-marker">&lt;/u&gt;</span>`,
              nextIndex: closePos + 4
            };
          } else {
            return {
              html: `<u>${this.escapeHtml(content)}</u>`,
              nextIndex: closePos + 4
            };
          }
        }
      }
      
      // Check for highlight <mark>text</mark>
      if (text.substr(pos, 6) === '<mark>') {
        const closePos = text.indexOf('</mark>', pos + 6);
        if (closePos !== -1) {
          const content = text.substring(pos + 6, closePos);
          const isNearCursor = this.isCursorNearMarkers(cursorPos, pos, closePos + 7);
          
          if (isNearCursor) {
            return {
              html: `<span class="md-marker">&lt;mark&gt;</span>${this.escapeHtml(content)}<span class="md-marker">&lt;/mark&gt;</span>`,
              nextIndex: closePos + 7
            };
          } else {
            return {
              html: `<mark>${this.escapeHtml(content)}</mark>`,
              nextIndex: closePos + 7
            };
          }
        }
      }
      
      return {
        html: this.escapeHtml(text[pos]),
        nextIndex: pos + 1
      };
    },

    findClosingPattern(text, startPos, pattern) {
      return text.indexOf(pattern, startPos);
    },

    isCursorNearMarkers(cursorPos, startPos, endPos) {
      // Show markers when cursor is within or immediately adjacent to markers
      return cursorPos >= startPos - 1 && cursorPos <= endPos + 1;
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    getCurrentTextPosition() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return 0;
      
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(this.$refs.editor);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      
      return preCaretRange.toString().length;
    },

    saveSelection() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return null;
      
      const range = selection.getRangeAt(0);
      return {
        startOffset: this.getOffsetInText(range.startContainer, range.startOffset),
        endOffset: this.getOffsetInText(range.endContainer, range.endOffset)
      };
    },

    restoreSelection(savedSelection) {
      if (!savedSelection) return;
      
      const range = document.createRange();
      const startPos = this.getPositionFromOffset(savedSelection.startOffset);
      const endPos = this.getPositionFromOffset(savedSelection.endOffset);
      
      if (startPos && endPos) {
        range.setStart(startPos.node, startPos.offset);
        range.setEnd(endPos.node, endPos.offset);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    },

    getOffsetInText(node, offset) {
      const walker = document.createTreeWalker(
        this.$refs.editor,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let currentOffset = 0;
      let currentNode;
      
      while (currentNode = walker.nextNode()) {
        if (currentNode === node) {
          return currentOffset + offset;
        }
        currentOffset += currentNode.textContent.length;
      }
      
      return currentOffset;
    },

    getPositionFromOffset(targetOffset) {
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
          return {
            node: node,
            offset: targetOffset - currentOffset
          };
        }
        currentOffset += nodeLength;
      }
      
      return null;
    },

    handleInput(event) {
      if (this.isUpdating) return;
      
      // Debounce the markdown update
      this.debouncedUpdate();
      
      // Apply syntax highlighting after a short delay
      setTimeout(() => {
        this.applySyntaxHighlighting();
        this.updateStyleStates();
      }, 50);
    },

    updateMarkdown() {
      if (!this.$refs.editor) return;
      
      const text = this.$refs.editor.textContent || '';
      
      this.isUpdating = true;
      this.$emit('update:modelValue', text);
      
      setTimeout(() => {
        this.isUpdating = false;
      }, 100);
    },

    updateCursorPosition() {
      this.updateStyleStates();
      
      // Re-apply highlighting based on new cursor position
      setTimeout(() => {
        this.applySyntaxHighlighting();
      }, 10);
    },

    updateStyleStates() {
      if (!this.$refs.editor) return;
      
      const text = this.$refs.editor.textContent || '';
      const pos = this.getCurrentTextPosition();
      
      this.currentStyles = {
        bold: this.isInsideMarkdown(text, pos, '**'),
        italic: this.isInsideMarkdown(text, pos, '*', true),
        code: this.isInsideMarkdown(text, pos, '`'),
        strikethrough: this.isInsideMarkdown(text, pos, '~~'),
        underline: this.isInsideMarkdown(text, pos, '<u>', '</u>'),
        highlight: this.isInsideMarkdown(text, pos, '<mark>', '</mark>')
      };
      
      this.$emit('style-state-update', {
        styles: this.currentStyles,
        headingLevel: 0
      });
    },

    isInsideMarkdown(text, pos, startMarker, endMarker = null, skipBold = false) {
      if (!endMarker) endMarker = startMarker;
      
      // For italic, skip bold markers
      if (skipBold && startMarker === '*') {
        // Find italic markers that are not part of bold
        let searchPos = 0;
        while (searchPos < text.length) {
          const starPos = text.indexOf('*', searchPos);
          if (starPos === -1) break;
          
          // Skip if this is part of a bold marker (**)
          if (text[starPos - 1] === '*' || text[starPos + 1] === '*') {
            searchPos = starPos + 1;
            continue;
          }
          
          // Find closing italic marker
          let closePos = starPos + 1;
          while (closePos < text.length) {
            const nextStar = text.indexOf('*', closePos);
            if (nextStar === -1) break;
            
            // Skip if this is part of a bold marker
            if (text[nextStar - 1] === '*' || text[nextStar + 1] === '*') {
              closePos = nextStar + 1;
              continue;
            }
            
            // Found valid italic closing marker
            if (pos >= starPos && pos <= nextStar + 1) {
              return true;
            }
            break;
          }
          
          searchPos = starPos + 1;
        }
        return false;
      }
      
      // Find nearest markers around cursor
      let searchStart = Math.max(0, pos - 100);
      let searchEnd = Math.min(text.length, pos + 100);
      
      let beforeStart = -1;
      let afterEnd = -1;
      
      // Search backwards for start marker
      for (let i = pos - startMarker.length; i >= searchStart; i--) {
        if (text.substr(i, startMarker.length) === startMarker) {
          beforeStart = i;
          break;
        }
      }
      
      // Search forwards for end marker
      if (beforeStart >= 0) {
        for (let i = pos; i <= searchEnd - endMarker.length; i++) {
          if (text.substr(i, endMarker.length) === endMarker) {
            afterEnd = i;
            break;
          }
        }
      }
      
      return beforeStart >= 0 && afterEnd > beforeStart && pos >= beforeStart && pos <= afterEnd + endMarker.length;
    },

    handleKeydown(event) {
      // Handle Enter for proper line breaks
      if (event.key === 'Enter') {
        setTimeout(() => {
          this.applySyntaxHighlighting();
        }, 10);
      }
      
      // Handle Tab for indentation
      if (event.key === 'Tab') {
        event.preventDefault();
        this.insertTextAtCursor('    ');
      }
    },

    handlePaste(event) {
      event.preventDefault();
      
      const clipboardData = event.clipboardData || window.clipboardData;
      let text = clipboardData.getData('text/plain');
      
      if (text) {
        // Auto-wrap multi-line code
        if (text.includes('\n') && text.trim().length > 50) {
          const language = prompt('这看起来像代码。请输入编程语言 (如: javascript, python):') || '';
          text = `\n\`\`\`${language}\n${text}\n\`\`\`\n`;
        }
        
        this.insertTextAtCursor(text);
      }
    },

    insertTextAtCursor(text) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      
      this.handleInput();
    },

    handleFocus() {
      if (!this.$refs.editor.textContent && !this.modelValue) {
        this.$refs.editor.innerHTML = '<br>';
      }
      this.updateStyleStates();
    },

    handleBlur() {
      setTimeout(() => {
        this.applySyntaxHighlighting();
      }, 100);
    },

    focus() {
      this.$refs.editor?.focus();
    },

    // Toolbar methods - simple markdown insertion
    toggleBold() {
      this.insertMarkdownWrapper('**');
    },

    toggleItalic() {
      this.insertMarkdownWrapper('*');
    },

    toggleCode() {
      this.insertMarkdownWrapper('`');
    },

    toggleStrikethrough() {
      this.insertMarkdownWrapper('~~');
    },

    toggleUnderline() {
      this.insertMarkdownWrapper('<u>', '</u>');
    },

    toggleHighlight() {
      this.insertMarkdownWrapper('<mark>', '</mark>');
    },

    insertMarkdownWrapper(startMarker, endMarker = null) {
      if (!endMarker) endMarker = startMarker;
      
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      
      if (range.collapsed) {
        // No selection - insert markers and position cursor between them
        // Insert the combined text first
        const textNode = document.createTextNode(startMarker + endMarker);
        range.insertNode(textNode);
        
        // Now position cursor between the markers
        const newRange = document.createRange();
        newRange.setStart(textNode, startMarker.length);
        newRange.setEnd(textNode, startMarker.length);
        
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        // Has selection - wrap it
        const selectedText = range.toString();
        const wrappedText = startMarker + selectedText + endMarker;
        
        range.deleteContents();
        range.insertNode(document.createTextNode(wrappedText));
        range.collapse(false);
      }
      
      this.handleInput();
    },

    insertCodeBlock() {
      const language = prompt('请输入编程语言 (如: javascript, python):') || '';
      const codeBlock = `\n\`\`\`${language}\n\n\`\`\`\n`;
      this.insertTextAtCursor(codeBlock);
      
      // Position cursor inside code block
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection.rangeCount) {
          const range = selection.getRangeAt(0);
          const pos = this.getCurrentTextPosition();
          this.positionCursorAtOffset(pos - 5); // Before closing ```
        }
      }, 50);
    },

    positionCursorAtOffset(offset) {
      const position = this.getPositionFromOffset(offset);
      if (position) {
        const range = document.createRange();
        range.setStart(position.node, position.offset);
        range.collapse(true);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    },

    insertUnorderedList() {
      this.insertTextAtCursor('\n- ');
    },

    insertBlockQuote() {
      this.insertTextAtCursor('\n> ');
    },

    insertHorizontalRule() {
      this.insertTextAtCursor('\n------\n');
    },

    insertImage() {
      const url = prompt('请输入图片URL:');
      if (url) {
        const alt = prompt('请输入图片描述 (可选):') || '图片';
        this.insertTextAtCursor(`![${alt}](${url})`);
      }
    },

    insertTaskList() {
      this.insertTextAtCursor('\n- [ ] ');
    },

    insertTOC() {
      this.insertTextAtCursor('\n[[TOC]]\n');
    },

    insertMathInline() {
      const formula = prompt('请输入LaTeX公式:');
      if (formula) {
        this.insertTextAtCursor(` $${formula}$ `);
      }
    },

    insertMathBlock() {
      const formula = prompt('请输入LaTeX块级公式:');
      if (formula) {
        this.insertTextAtCursor(`\n$$\n${formula}\n$$\n`);
      }
    },

    insertColorText(color) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      
      if (range.collapsed) {
        this.insertTextAtCursor(`<font color="${color}"></font>`);
        setTimeout(() => {
          const pos = this.getCurrentTextPosition();
          this.positionCursorAtOffset(pos - 7); // Before </font>
        }, 50);
      } else {
        const selectedText = range.toString();
        const coloredText = `<font color="${color}">${selectedText}</font>`;
        
        range.deleteContents();
        range.insertNode(document.createTextNode(coloredText));
        range.collapse(false);
        
        this.handleInput();
      }
    },

    showCodeBlockLanguageSelector() {
      this.insertCodeBlock();
    },

    toggleHeading() {
      const text = this.$refs.editor.textContent || '';
      const pos = this.getCurrentTextPosition();
      
      // Find current line boundaries
      const beforeCursor = text.substring(0, pos);
      const lineStart = beforeCursor.lastIndexOf('\n') + 1;
      const afterCursor = text.substring(pos);
      const lineEnd = afterCursor.indexOf('\n');
      const actualLineEnd = lineEnd === -1 ? text.length : pos + lineEnd;
      
      const currentLine = text.substring(lineStart, actualLineEnd);
      
      // Check current heading level
      const headingMatch = currentLine.match(/^(#{1,6})\s/);
      let newLevel = 1;
      
      if (headingMatch) {
        const currentLevel = headingMatch[1].length;
        newLevel = currentLevel >= 6 ? 1 : currentLevel + 1;
      }
      
      // Remove existing heading markers
      const contentWithoutHeading = currentLine.replace(/^#{1,6}\s/, '');
      
      // Create new heading
      const newLine = '#'.repeat(newLevel) + ' ' + contentWithoutHeading;
      
      // Replace the line
      const beforeLine = text.substring(0, lineStart);
      const afterLine = text.substring(actualLineEnd);
      const newText = beforeLine + newLine + afterLine;
      
      this.$refs.editor.textContent = newText;
      
      // Update cursor position
      const newCursorPos = lineStart + newLine.length;
      this.positionCursorAtOffset(newCursorPos);
      
      this.handleInput();
    }
  }
}
</script>

<style scoped>
.wysiwyg-editor-typora {
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  background: white;
}

.wysiwyg-editor-typora:focus {
  border-color: #0969da !important;
  box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.3);
}

/* Markdown syntax markers - shown in light gray */
.wysiwyg-editor-typora :global(.md-marker) {
  color: #8b949e !important;
  opacity: 0.6;
  font-weight: normal !important;
}

/* Formatted content styling */
.wysiwyg-editor-typora :global(strong) {
  font-weight: bold;
}

.wysiwyg-editor-typora :global(em) {
  font-style: italic;
}

.wysiwyg-editor-typora :global(code) {
  background-color: rgba(175, 184, 193, 0.2);
  border-radius: 3px;
  padding: 2px 4px;
  font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 85%;
}

.wysiwyg-editor-typora :global(del) {
  text-decoration: line-through;
}

.wysiwyg-editor-typora :global(u) {
  text-decoration: underline;
}

.wysiwyg-editor-typora :global(mark) {
  background-color: #fff2cc;
  padding: 1px 2px;
}

.wysiwyg-editor-typora :global(pre) {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  margin: 16px 0;
}

.wysiwyg-editor-typora :global(pre code) {
  background: none;
  border-radius: 0;
  padding: 0;
  font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
}

/* Ensure empty lines are visible */
.wysiwyg-editor-typora:empty::before {
  content: '';
  display: block;
  min-height: 1.2em;
}

.wysiwyg-editor-typora br:only-child {
  display: block;
  min-height: 1.2em;
}
</style>