<template>
  <div 
    class="wysiwyg-editor-simple"
    contenteditable="true"
    ref="editor"
    @input="handleInput"
    @keydown="handleKeydown"
    @paste="handlePaste"
    @focus="handleFocus"
    @blur="handleBlur"
    @keyup="updateCursorPosition"
    @mouseup="updateCursorPosition"
    @click="updateCursorPosition"
    v-html="renderedContent"
    style="min-height: 250px; padding: 15px; border: 1px solid #d1d9e0; border-radius: 6px; outline: none; white-space: pre-wrap; word-wrap: break-word;"
  ></div>
</template>

<script>
import { debounce } from 'lodash-es';

export default {
  name: 'WysiwygEditorSimple',
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
      isUpdating: false,
      lastCaretPosition: null,
      debouncedSync: null,
      currentStyles: {
        bold: false,
        italic: false,
        underline: false,
        code: false,
        strikethrough: false,
        highlight: false
      },
      currentHeadingLevel: 0
    }
  },
  computed: {
    renderedContent() {
      if (!this.modelValue) {
        return '<div><br></div>';
      }
      
      return this.renderMarkdownWithVisibleSyntax(this.modelValue);
    }
  },
  created() {
    // Minimal debouncing for responsive typing
    this.debouncedSync = debounce(this.syncToMarkdown, 100);
  },
  mounted() {
    this.updateCursorPosition();
  },
  beforeUnmount() {
    if (this.debouncedSync) {
      this.debouncedSync.cancel();
    }
  },
  watch: {
    modelValue: {
      handler(newValue) {
        if (!this.isUpdating) {
          this.$nextTick(() => {
            this.restoreCursorPosition();
          });
        }
      },
      immediate: true
    }
  },
  methods: {
    renderMarkdownWithVisibleSyntax(markdown) {
      // Escape HTML to prevent XSS
      let escaped = markdown
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      // Detect if cursor is inside formatting markers
      const cursorInfo = this.getCursorMarkdownPosition();
      
      // Apply styling with syntax highlighting
      escaped = this.applyFormattingSyntax(escaped, cursorInfo);
      
      // Handle line breaks
      escaped = escaped.replace(/\n/g, '<br>');
      
      // If empty, ensure we have a div for editing
      if (escaped.trim() === '') {
        return '<div><br></div>';
      }
      
      return '<div>' + escaped + '</div>';
    },
    
    applyFormattingSyntax(text, cursorInfo) {
      // Apply formatting while showing syntax
      let result = text;
      
      // Handle code blocks first (to avoid interfering with inline formatting)
      result = this.processCodeBlocks(result, cursorInfo);
      
      // Handle inline formatting
      result = this.processInlineFormatting(result, cursorInfo);
      
      // Handle headings
      result = this.processHeadings(result, cursorInfo);
      
      // Handle lists
      result = this.processLists(result, cursorInfo);
      
      // Handle blockquotes
      result = this.processBlockquotes(result, cursorInfo);
      
      return result;
    },
    
    processCodeBlocks(text, cursorInfo) {
      // Process code blocks ```
      return text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code, offset) => {
        const isInsideBlock = cursorInfo && 
          cursorInfo.offset >= offset && 
          cursorInfo.offset <= offset + match.length;
        
        if (isInsideBlock) {
          // Show markers in light gray when cursor is inside
          return '<span style="color: #6a737d;">```' + lang + '</span><br><span style="font-family: monospace; background: #f6f8fa; padding: 2px 4px;">' + code + '</span><br><span style="color: #6a737d;">```</span>';
        } else {
          // Render as code block
          return '<pre style="background: #f6f8fa; padding: 12px; border-radius: 6px; font-family: monospace; overflow-x: auto;"><code>' + code + '</code></pre>';
        }
      });
    },
    
    processInlineFormatting(text, cursorInfo) {
      let result = text;
      
      // Bold **text**
      result = this.processInlineFormat(result, /\*\*([^*]+)\*\*/g, 'font-weight: bold;', cursorInfo);
      
      // Italic *text*
      result = this.processInlineFormat(result, /(?<!\*)\*([^*]+)\*(?!\*)/g, 'font-style: italic;', cursorInfo);
      
      // Strikethrough ~~text~~
      result = this.processInlineFormat(result, /~~([^~]+)~~/g, 'text-decoration: line-through;', cursorInfo);
      
      // Inline code `text`
      result = this.processInlineFormat(result, /`([^`]+)`/g, 'font-family: monospace; background: #f6f8fa; padding: 2px 4px; border-radius: 3px;', cursorInfo);
      
      // Underline <u>text</u>
      result = result.replace(/&lt;u&gt;([^&]+)&lt;\/u&gt;/g, (match, content, offset) => {
        const isInsideMarkers = cursorInfo && this.isCursorInsideMarkers(cursorInfo.offset, offset, match.length);
        
        if (isInsideMarkers) {
          return '<span style="color: #6a737d;">&lt;u&gt;</span>' + content + '<span style="color: #6a737d;">&lt;/u&gt;</span>';
        } else {
          return '<span style="text-decoration: underline;">' + content + '</span>';
        }
      });
      
      // Highlight <mark>text</mark>
      result = result.replace(/&lt;mark&gt;([^&]+)&lt;\/mark&gt;/g, (match, content, offset) => {
        const isInsideMarkers = cursorInfo && this.isCursorInsideMarkers(cursorInfo.offset, offset, match.length);
        
        if (isInsideMarkers) {
          return '<span style="color: #6a737d;">&lt;mark&gt;</span>' + content + '<span style="color: #6a737d;">&lt;/mark&gt;</span>';
        } else {
          return '<span style="background: yellow; padding: 1px 2px;">' + content + '</span>';
        }
      });
      
      return result;
    },
    
    processInlineFormat(text, regex, style, cursorInfo) {
      return text.replace(regex, (match, content, offset) => {
        const isInsideMarkers = cursorInfo && this.isCursorInsideMarkers(cursorInfo.offset, offset, match.length);
        
        if (isInsideMarkers) {
          // Show markers in light gray
          const markers = match.replace(content, '').split(content);
          const openMarker = markers[0];
          const closeMarker = markers[1] || markers[0];
          
          return '<span style="color: #6a737d;">' + openMarker + '</span>' + content + '<span style="color: #6a737d;">' + closeMarker + '</span>';
        } else {
          // Apply formatting
          return '<span style="' + style + '">' + content + '</span>';
        }
      });
    },
    
    processHeadings(text, cursorInfo) {
      return text.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content, offset) => {
        const level = hashes.length;
        const size = Math.max(1.5 - (level - 1) * 0.2, 1);
        return '<span style="font-size: ' + size + 'em; font-weight: bold; color: #6a737d;">' + hashes + '</span> <span style="font-size: ' + size + 'em; font-weight: bold;">' + content + '</span>';
      });
    },
    
    processLists(text, cursorInfo) {
      // Unordered lists
      text = text.replace(/^(\s*)-\s+(.+)$/gm, '<span style="color: #6a737d;">$1-</span> $2');
      
      // Ordered lists
      text = text.replace(/^(\s*)(\d+)\.\s+(.+)$/gm, '<span style="color: #6a737d;">$1$2.</span> $3');
      
      // Task lists
      text = text.replace(/^(\s*)-\s+\[([ x])\]\s+(.+)$/gm, (match, indent, check, content) => {
        const checked = check === 'x';
        return '<span style="color: #6a737d;">' + indent + '- [' + check + ']</span> <span style="' + (checked ? 'text-decoration: line-through; color: #6a737d;' : '') + '">' + content + '</span>';
      });
      
      return text;
    },
    
    processBlockquotes(text, cursorInfo) {
      return text.replace(/^>\s+(.+)$/gm, '<span style="border-left: 4px solid #ddd; padding-left: 12px; color: #6a737d; display: block;"><span style="color: #6a737d;">&gt;</span> <span style="color: inherit;">$1</span></span>');
    },
    
    isCursorInsideMarkers(cursorOffset, matchOffset, matchLength) {
      return cursorOffset >= matchOffset && cursorOffset <= matchOffset + matchLength;
    },
    
    getCursorMarkdownPosition() {
      if (!this.$refs.editor) return null;
      
      const selection = window.getSelection();
      if (!selection.rangeCount) return null;
      
      const range = selection.getRangeAt(0);
      
      // Convert HTML position to markdown position
      const textContent = this.getTextContent(this.$refs.editor);
      const htmlOffset = this.getHtmlOffset(range);
      
      return {
        offset: htmlOffset,
        textContent: textContent
      };
    },
    
    getTextContent(element) {
      // Get plain text content that matches our markdown
      let text = '';
      
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: function(node) {
            if (node.nodeType === Node.TEXT_NODE) {
              return NodeFilter.FILTER_ACCEPT;
            }
            if (node.nodeName === 'BR') {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent;
        } else if (node.nodeName === 'BR') {
          text += '\n';
        }
      }
      
      return text;
    },
    
    getHtmlOffset(range) {
      // Get offset in terms of text characters
      const preRange = document.createRange();
      preRange.setStart(this.$refs.editor, 0);
      preRange.setEnd(range.startContainer, range.startOffset);
      
      return this.getTextContent(preRange.cloneContents()).length;
    },
    
    handleInput(event) {
      if (this.isUpdating) return;
      
      this.saveCaretPosition();
      this.debouncedSync();
    },
    
    syncToMarkdown() {
      if (this.isUpdating) return;
      
      const textContent = this.getTextContent(this.$refs.editor);
      
      this.isUpdating = true;
      this.$emit('update:modelValue', textContent);
      
      this.$nextTick(() => {
        setTimeout(() => {
          this.isUpdating = false;
          this.updateCursorPosition();
        }, 50);
      });
    },
    
    handleKeydown(event) {
      // Handle special keys
      if (event.key === 'Enter') {
        this.handleEnterKey(event);
      } else if (event.key === 'Tab') {
        event.preventDefault();
        this.insertText('    '); // Insert 4 spaces
      }
    },
    
    handleEnterKey(event) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const currentLine = this.getCurrentLine(range);
      
      // Handle list continuation
      if (currentLine.match(/^(\s*)-\s+/) || currentLine.match(/^(\s*)\d+\.\s+/)) {
        event.preventDefault();
        const indent = currentLine.match(/^(\s*)/)[1];
        const marker = currentLine.match(/^(\s*)(-\s+|\d+\.\s+)/)[2];
        
        if (currentLine.trim() === marker.trim()) {
          // Empty list item, break out
          this.insertText('\n');
        } else {
          // Continue list
          this.insertText('\n' + indent + marker);
        }
      }
      // Handle blockquote continuation
      else if (currentLine.match(/^>\s+/)) {
        event.preventDefault();
        this.insertText('\n> ');
      }
    },
    
    getCurrentLine(range) {
      const textContent = this.getTextContent(this.$refs.editor);
      const offset = this.getHtmlOffset(range);
      
      const lineStart = textContent.lastIndexOf('\n', offset - 1) + 1;
      const lineEnd = textContent.indexOf('\n', offset);
      
      return textContent.substring(lineStart, lineEnd === -1 ? textContent.length : lineEnd);
    },
    
    handlePaste(event) {
      event.preventDefault();
      
      const clipboardData = event.clipboardData || window.clipboardData;
      const pastedText = clipboardData.getData('text/plain');
      
      if (pastedText) {
        // Check if it's multi-line code that should be wrapped in code block
        if (pastedText.includes('\n') && pastedText.split('\n').length > 2) {
          const lang = prompt('Multi-line content detected. Enter language for code block (or cancel for plain text):');
          if (lang !== null) {
            const codeBlock = lang ? `\`\`\`${lang}\n${pastedText}\n\`\`\`` : `\`\`\`\n${pastedText}\n\`\`\``;
            this.insertText(codeBlock);
            return;
          }
        }
        
        this.insertText(pastedText);
      }
    },
    
    insertText(text) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      
      // Position cursor after inserted text
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      this.handleInput({ target: this.$refs.editor });
    },
    
    handleFocus() {
      this.updateCursorPosition();
    },
    
    handleBlur() {
      // Update one final time on blur
      this.debouncedSync.flush();
    },
    
    saveCaretPosition() {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        this.lastCaretPosition = {
          range: selection.getRangeAt(0).cloneRange(),
          offset: this.getHtmlOffset(selection.getRangeAt(0))
        };
      }
    },
    
    restoreCursorPosition() {
      if (!this.lastCaretPosition || !this.$refs.editor) return;
      
      try {
        const targetOffset = this.lastCaretPosition.offset;
        const position = this.findPositionByOffset(targetOffset);
        
        if (position) {
          const range = document.createRange();
          range.setStart(position.container, position.offset);
          range.collapse(true);
          
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } catch (error) {
        console.warn('Failed to restore cursor position:', error);
      }
    },
    
    findPositionByOffset(targetOffset) {
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
      
      return null;
    },
    
    updateCursorPosition() {
      // Update style states and cursor-based formatting detection
      this.updateStyleStates();
    },
    
    updateStyleStates() {
      const cursorInfo = this.getCursorMarkdownPosition();
      if (!cursorInfo) return;
      
      const text = cursorInfo.textContent;
      const offset = cursorInfo.offset;
      
      // Check what formatting the cursor is inside
      this.currentStyles = {
        bold: this.isCursorInsideFormat(text, offset, /\*\*([^*]+)\*\*/g),
        italic: this.isCursorInsideFormat(text, offset, /(?<!\*)\*([^*]+)\*(?!\*)/g),
        code: this.isCursorInsideFormat(text, offset, /`([^`]+)`/g),
        strikethrough: this.isCursorInsideFormat(text, offset, /~~([^~]+)~~/g),
        underline: this.isCursorInsideFormat(text, offset, /<u>([^<]+)<\/u>/g),
        highlight: this.isCursorInsideFormat(text, offset, /<mark>([^<]+)<\/mark>/g)
      };
      
      // Check heading level
      const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
      const lineEnd = text.indexOf('\n', offset);
      const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
      const headingMatch = currentLine.match(/^(#{1,6})\s+/);
      this.currentHeadingLevel = headingMatch ? headingMatch[1].length : 0;
      
      // Emit style state update
      this.$emit('style-state-update', {
        styles: this.currentStyles,
        headingLevel: this.currentHeadingLevel
      });
    },
    
    isCursorInsideFormat(text, offset, regex) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        
        if (offset >= start && offset <= end) {
          return true;
        }
      }
      return false;
    },
    
    // Methods for toolbar actions - simple insertion like normal mode
    insertMarkdown(markdownText) {
      this.insertText(markdownText);
    },
    
    toggleBold() {
      this.add1('**');
    },
    
    toggleItalic() {
      this.add1('*');
    },
    
    toggleUnderline() {
      this.add4('<u>', '</u>');
    },
    
    toggleStrikethrough() {
      this.add1('~~');
    },
    
    toggleCode() {
      this.add1('`');
    },
    
    insertHighlight() {
      this.add4('<mark>', '</mark>');
    },
    
    // Helper methods similar to normal mode
    add1(str1) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        // Wrap selected text
        range.deleteContents();
        const wrappedText = str1 + selectedText + str1;
        this.insertText(wrappedText);
      } else {
        // Insert markers and position cursor between them
        range.deleteContents();
        const beforeText = str1;
        const afterText = str1;
        
        range.insertNode(document.createTextNode(beforeText + afterText));
        
        // Position cursor between markers
        const textNode = range.startContainer.nextSibling || range.startContainer;
        const newRange = document.createRange();
        newRange.setStart(textNode, beforeText.length);
        newRange.collapse(true);
        
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      this.handleInput({ target: this.$refs.editor });
    },
    
    add4(str1, str2) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      
      if (selectedText) {
        // Wrap selected text
        range.deleteContents();
        const wrappedText = str1 + selectedText + str2;
        this.insertText(wrappedText);
      } else {
        // Insert markers and position cursor between them
        range.deleteContents();
        const fullText = str1 + str2;
        
        range.insertNode(document.createTextNode(fullText));
        
        // Position cursor between markers
        const textNode = range.startContainer.nextSibling || range.startContainer;
        const newRange = document.createRange();
        newRange.setStart(textNode, str1.length);
        newRange.collapse(true);
        
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      this.handleInput({ target: this.$refs.editor });
    },
    
    insertCodeBlock() {
      const lang = prompt('Enter programming language (e.g., javascript, python):');
      const codeBlock = lang ? `\n\`\`\`${lang}\n\n\`\`\`\n` : `\n\`\`\`\n\n\`\`\`\n`;
      this.insertText(codeBlock);
      
      // Position cursor inside the code block
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          // Move cursor to the line inside the code block
          range.setStart(range.startContainer, range.startOffset - 4);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }, 50);
    },
    
    showCodeBlockLanguageSelector() {
      // F2 shortcut - just show prompt for now
      const lang = prompt('Enter programming language:');
      if (lang) {
        // Try to find and update nearby code block
        this.insertText(lang);
      }
    },
    
    insertUnorderedList() {
      this.insertText('\n- ');
    },
    
    insertTaskList() {
      this.insertText('\n- [ ] ');
    },
    
    insertBlockQuote() {
      this.insertText('\n> ');
    },
    
    insertHorizontalRule() {
      this.insertText('\n---\n');
    },
    
    insertImage() {
      const url = prompt('Enter image URL:');
      if (url) {
        const alt = prompt('Enter alt text (optional):') || 'image';
        this.insertText(`![${alt}](${url})`);
      }
    },
    
    insertMathInline() {
      const formula = prompt('Enter LaTeX formula:');
      if (formula) {
        this.insertText(`$${formula}$`);
      }
    },
    
    insertMathBlock() {
      const formula = prompt('Enter LaTeX formula:');
      if (formula) {
        this.insertText(`\n$$\n${formula}\n$$\n`);
      }
    },
    
    insertTOC() {
      this.insertText('\n[[TOC]]\n');
    },
    
    toggleHeading() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const currentLine = this.getCurrentLine(range);
      
      // Determine next heading level
      const headingMatch = currentLine.match(/^(#{1,6})\s+/);
      let nextLevel = 1;
      
      if (headingMatch) {
        const currentLevel = headingMatch[1].length;
        nextLevel = currentLevel >= 6 ? 1 : currentLevel + 1;
        
        // Replace existing heading
        const newLine = currentLine.replace(/^#{1,6}\s+/, '#'.repeat(nextLevel) + ' ');
        this.replaceCurrentLine(newLine);
      } else {
        // Add heading to current line
        const newLine = '# ' + currentLine;
        this.replaceCurrentLine(newLine);
      }
    },
    
    replaceCurrentLine(newLine) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const textContent = this.getTextContent(this.$refs.editor);
      const offset = this.getHtmlOffset(range);
      
      const lineStart = textContent.lastIndexOf('\n', offset - 1) + 1;
      const lineEnd = textContent.indexOf('\n', offset);
      
      const before = textContent.substring(0, lineStart);
      const after = textContent.substring(lineEnd === -1 ? textContent.length : lineEnd);
      
      const newContent = before + newLine + after;
      
      this.isUpdating = true;
      this.$emit('update:modelValue', newContent);
      
      this.$nextTick(() => {
        setTimeout(() => {
          this.isUpdating = false;
          // Try to maintain cursor position
          const newOffset = lineStart + newLine.length;
          const position = this.findPositionByOffset(newOffset);
          if (position) {
            const newRange = document.createRange();
            newRange.setStart(position.container, position.offset);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }, 50);
      });
    },
    
    focus() {
      this.$refs.editor?.focus();
    }
  }
}
</script>

<style scoped>
.wysiwyg-editor-simple {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  overflow-wrap: break-word;
}

.wysiwyg-editor-simple:focus {
  border-color: #0969da !important;
  box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.3);
}

/* Ensure proper spacing */
.wysiwyg-editor-simple > div {
  min-height: 1.5em;
}

/* Style for empty content */
.wysiwyg-editor-simple:empty::before {
  content: 'Start typing...';
  color: #8c959f;
  font-style: italic;
}
</style>