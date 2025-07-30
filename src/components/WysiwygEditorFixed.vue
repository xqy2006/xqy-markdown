<template>
  <div 
    class="wysiwyg-editor-fixed"
    contenteditable="true"
    ref="editor"
    @input="handleInput"
    @keydown="handleKeydown"
    @paste="handlePaste"
    @focus="handleFocus"
    @blur="handleBlur"
    @mouseup="updateStyleStates"
    @keyup="updateStyleStates"
    style="min-height: 250px; padding: 15px; border: 1px solid #d1d9e0; border-radius: 6px; outline: none; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; font-size: 14px; line-height: 1.6;"
    :style="editorStyles"
    v-html="formattedContent"
  ></div>
</template>

<script>
import { debounce } from 'lodash-es';

export default {
  name: 'WysiwygEditorFixed',
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
      lastCaretPosition: null,
      currentStyles: {
        bold: false,
        italic: false,
        underline: false,
        code: false,
        strikethrough: false,
        highlight: false
      },
      currentHeadingLevel: 0,
      debouncedSync: null,
      debouncedStyleUpdate: null
    };
  },
  computed: {
    formattedContent() {
      if (!this.modelValue) {
        return '<div><br></div>';
      }
      
      // Format the markdown content for visual editing
      return this.formatMarkdownForEditing(this.modelValue);
    },
    
    editorStyles() {
      return {
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word'
      };
    }
  },
  watch: {
    modelValue: {
      handler(newValue) {
        if (!this.isUpdating) {
          this.$nextTick(() => {
            this.restoreCursor();
            this.updateStyleStates();
          });
        }
      }
    }
  },
  created() {
    // Create debounced functions with appropriate delays
    this.debouncedSync = debounce(this.syncContent, 100);
    this.debouncedStyleUpdate = debounce(this.updateStyleStates, 50);
  },
  mounted() {
    this.setupEditor();
    this.updateStyleStates();
  },
  beforeUnmount() {
    if (this.debouncedSync) {
      this.debouncedSync.cancel();
    }
    if (this.debouncedStyleUpdate) {
      this.debouncedStyleUpdate.cancel();
    }
  },
  methods: {
    setupEditor() {
      if (!this.$refs.editor) return;
      
      // Ensure proper initial state
      if (!this.modelValue) {
        this.$refs.editor.innerHTML = '<div><br></div>';
      }
    },

    formatMarkdownForEditing(markdown) {
      // Convert markdown to visually formatted HTML for editing
      // This creates a Typora-like experience where markdown syntax is visible but styled
      
      let html = markdown;
      
      // Escape HTML to prevent injection
      html = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      // Style markdown syntax elements
      
      // Headers (make # symbols lighter)
      html = html.replace(/^(#{1,6})\s+(.*)$/gm, (match, hashes, content) => {
        const level = hashes.length;
        return `<div class="md-header md-header-${level}"><span class="md-syntax">${hashes} </span><span class="md-content">${content}</span></div>`;
      });
      
      // Bold (make ** symbols lighter)
      html = html.replace(/\*\*([^*\n]+)\*\*/g, '<span class="md-bold"><span class="md-syntax">**</span><span class="md-content">$1</span><span class="md-syntax">**</span></span>');
      
      // Italic (make * symbols lighter) - avoid conflict with bold
      // Use a different approach to avoid lookbehind
      html = html.replace(/([^*]|^)\*([^*\n]+)\*([^*]|$)/g, '$1<span class="md-italic"><span class="md-syntax">*</span><span class="md-content">$2</span><span class="md-syntax">*</span></span>$3');
      
      // Strikethrough (make ~~ symbols lighter)
      html = html.replace(/~~([^~\n]+)~~/g, '<span class="md-strikethrough"><span class="md-syntax">~~</span><span class="md-content">$1</span><span class="md-syntax">~~</span></span>');
      
      // Inline code (make ` symbols lighter)
      html = html.replace(/`([^`\n]+)`/g, '<span class="md-code"><span class="md-syntax">`</span><span class="md-content">$1</span><span class="md-syntax">`</span></span>');
      
      // Underline
      html = html.replace(/&lt;u&gt;([^&\n]+)&lt;\/u&gt;/g, '<span class="md-underline"><span class="md-syntax">&lt;u&gt;</span><span class="md-content">$1</span><span class="md-syntax">&lt;/u&gt;</span></span>');
      
      // Highlight
      html = html.replace(/&lt;mark&gt;([^&\n]+)&lt;\/mark&gt;/g, '<span class="md-highlight"><span class="md-syntax">&lt;mark&gt;</span><span class="md-content">$1</span><span class="md-syntax">&lt;/mark&gt;</span></span>');
      
      // Code blocks
      html = html.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
        const language = lang || 'plaintext';
        return `<div class="md-code-block">
          <div class="md-code-lang"><span class="md-syntax">\`\`\`</span><span class="md-content">${language}</span></div>
          <div class="md-code-content">${code}</div>
          <div class="md-code-end"><span class="md-syntax">\`\`\`</span></div>
        </div>`;
      });
      
      // Block quotes
      html = html.replace(/^&gt;\s+(.*)$/gm, '<div class="md-quote"><span class="md-syntax">&gt; </span><span class="md-content">$1</span></div>');
      
      // Lists
      html = html.replace(/^(\s*)-\s+(.*)$/gm, '<div class="md-list"><span class="md-syntax">$1- </span><span class="md-content">$2</span></div>');
      html = html.replace(/^(\s*)-\s+\[\s\]\s+(.*)$/gm, '<div class="md-task-list"><span class="md-syntax">$1- [ ] </span><span class="md-content">$2</span></div>');
      html = html.replace(/^(\s*)-\s+\[x\]\s+(.*)$/gm, '<div class="md-task-list checked"><span class="md-syntax">$1- [x] </span><span class="md-content">$2</span></div>');
      
      // Convert remaining line breaks to div elements
      html = html.split('\n').map(line => {
        if (line.includes('<div class="md-')) {
          return line; // Already wrapped
        }
        return line.trim() ? `<div>${line}</div>` : '<div><br></div>';
      }).join('');
      
      return html;
    },

    handleInput(event) {
      if (this.isUpdating) return;
      
      // Save cursor position
      this.saveCursor();
      
      // Simple sync without complex processing
      this.debouncedSync();
      this.debouncedStyleUpdate();
    },

    syncContent() {
      if (this.isUpdating || !this.$refs.editor) return;
      
      try {
        // Extract plain text content (this gives us clean markdown)
        const rawText = this.extractMarkdownFromEditor();
        
        if (rawText !== this.modelValue) {
          this.isUpdating = true;
          this.$emit('update:modelValue', rawText);
          
          this.$nextTick(() => {
            this.isUpdating = false;
          });
        }
      } catch (error) {
        console.warn('Content sync error:', error);
        this.isUpdating = false;
      }
    },

    extractMarkdownFromEditor() {
      if (!this.$refs.editor) return '';
      
      // Get the editor content and convert back to plain markdown
      const content = this.$refs.editor.innerHTML;
      
      // Simple approach: extract text content and preserve structure
      let markdown = '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // Walk through the content and reconstruct markdown
      const children = Array.from(tempDiv.children);
      
      for (const child of children) {
        if (child.classList.contains('md-header')) {
          const level = child.className.match(/md-header-(\d)/)?.[1] || '1';
          const hashes = '#'.repeat(parseInt(level));
          const text = child.textContent.replace(/^#+ /, '');
          markdown += `${hashes} ${text}\n`;
        } else if (child.classList.contains('md-code-block')) {
          const langDiv = child.querySelector('.md-code-lang');
          const contentDiv = child.querySelector('.md-code-content');
          const lang = langDiv ? langDiv.textContent.replace(/```/, '').trim() : '';
          const code = contentDiv ? contentDiv.textContent : '';
          markdown += `\`\`\`${lang}\n${code}\n\`\`\`\n`;
        } else if (child.classList.contains('md-quote')) {
          const text = child.textContent.replace(/^> /, '');
          markdown += `> ${text}\n`;
        } else if (child.classList.contains('md-list')) {
          const text = child.textContent;
          const indent = text.match(/^(\s*)/)?.[1] || '';
          const content = text.replace(/^\s*- /, '');
          markdown += `${indent}- ${content}\n`;
        } else if (child.classList.contains('md-task-list')) {
          const text = child.textContent;
          const indent = text.match(/^(\s*)/)?.[1] || '';
          const isChecked = child.classList.contains('checked');
          const content = text.replace(/^\s*- \[[x ]\] /, '');
          markdown += `${indent}- [${isChecked ? 'x' : ' '}] ${content}\n`;
        } else {
          // Regular content - extract and preserve inline formatting
          let lineText = this.extractInlineMarkdown(child);
          if (lineText.trim() || markdown.endsWith('\n\n')) {
            markdown += lineText + '\n';
          } else if (!markdown.endsWith('\n')) {
            markdown += '\n';
          }
        }
      }
      
      return markdown.replace(/\n+$/, ''); // Remove trailing newlines
    },

    extractInlineMarkdown(element) {
      if (!element) return '';
      
      let text = '';
      
      for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const elem = node;
          
          if (elem.classList.contains('md-bold')) {
            const content = elem.querySelector('.md-content')?.textContent || '';
            text += `**${content}**`;
          } else if (elem.classList.contains('md-italic')) {
            const content = elem.querySelector('.md-content')?.textContent || '';
            text += `*${content}*`;
          } else if (elem.classList.contains('md-strikethrough')) {
            const content = elem.querySelector('.md-content')?.textContent || '';
            text += `~~${content}~~`;
          } else if (elem.classList.contains('md-code')) {
            const content = elem.querySelector('.md-content')?.textContent || '';
            text += `\`${content}\``;
          } else if (elem.classList.contains('md-underline')) {
            const content = elem.querySelector('.md-content')?.textContent || '';
            text += `<u>${content}</u>`;
          } else if (elem.classList.contains('md-highlight')) {
            const content = elem.querySelector('.md-content')?.textContent || '';
            text += `<mark>${content}</mark>`;
          } else {
            text += elem.textContent;
          }
        }
      }
      
      return text;
    },

    handleKeydown(event) {
      // Handle keyboard shortcuts
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
          case 'k':
            event.preventDefault();
            this.insertCodeBlock();
            break;
          case '`':
            event.preventDefault();
            this.toggleCode();
            break;
        }
      }
      
      // Handle F2 for code language
      if (event.key === 'F2') {
        event.preventDefault();
        this.showCodeBlockLanguageSelector();
      }
      
      // Handle Enter key for maintaining list/quote formatting
      if (event.key === 'Enter') {
        this.handleEnterKey(event);
      }
    },

    handleEnterKey(event) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const container = range.startContainer;
      
      // Find the current line div
      let currentDiv = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container;
      
      while (currentDiv && !currentDiv.className?.includes('md-')) {
        currentDiv = currentDiv.parentElement;
        if (currentDiv === this.$refs.editor) {
          currentDiv = null;
          break;
        }
      }
      
      if (currentDiv) {
        if (currentDiv.classList.contains('md-list') || 
            currentDiv.classList.contains('md-task-list') ||
            currentDiv.classList.contains('md-quote')) {
          
          event.preventDefault();
          this.continueBlockFormatting(currentDiv);
        }
      }
    },

    continueBlockFormatting(currentDiv) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      
      // Create new div with same formatting
      const newDiv = document.createElement('div');
      newDiv.className = currentDiv.className;
      
      if (currentDiv.classList.contains('md-list')) {
        const indent = this.getIndentFromDiv(currentDiv);
        newDiv.innerHTML = `<span class="md-syntax">${indent}- </span><span class="md-content"></span>`;
      } else if (currentDiv.classList.contains('md-task-list')) {
        const indent = this.getIndentFromDiv(currentDiv);
        newDiv.innerHTML = `<span class="md-syntax">${indent}- [ ] </span><span class="md-content"></span>`;
      } else if (currentDiv.classList.contains('md-quote')) {
        newDiv.innerHTML = '<span class="md-syntax">&gt; </span><span class="md-content"></span>';
      }
      
      // Insert new div after current one
      currentDiv.parentNode.insertBefore(newDiv, currentDiv.nextSibling);
      
      // Position cursor in the content span
      const contentSpan = newDiv.querySelector('.md-content');
      if (contentSpan) {
        const newRange = document.createRange();
        newRange.setStart(contentSpan, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
      
      // Sync content
      this.debouncedSync();
    },

    getIndentFromDiv(div) {
      const syntaxSpan = div.querySelector('.md-syntax');
      if (syntaxSpan) {
        const text = syntaxSpan.textContent;
        const match = text.match(/^(\s*)/);
        return match ? match[1] : '';
      }
      return '';
    },

    handlePaste(event) {
      const clipboardData = event.clipboardData || window.clipboardData;
      const plainText = clipboardData.getData('text/plain');
      
      // Check for multi-line code
      if (plainText && plainText.includes('\n') && plainText.split('\n').length > 2) {
        event.preventDefault();
        
        // Prompt for language
        const language = prompt('请输入代码语言 (如: javascript, python):') || 'plaintext';
        const codeBlock = `\n\`\`\`${language}\n${plainText}\n\`\`\`\n`;
        
        this.insertTextAtCursor(codeBlock);
        return;
      }
      
      // Allow default paste for simple text
      this.$nextTick(() => {
        this.debouncedSync();
      });
    },

    handleFocus() {
      this.updateStyleStates();
    },

    handleBlur() {
      // Clean up any empty elements
      this.cleanupEmptyElements();
    },

    cleanupEmptyElements() {
      if (!this.$refs.editor) return;
      
      const emptyDivs = this.$refs.editor.querySelectorAll('div:empty');
      emptyDivs.forEach(div => {
        if (!div.innerHTML.trim()) {
          div.innerHTML = '<br>';
        }
      });
    },

    updateStyleStates() {
      if (!this.$refs.editor) return;
      
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      const { styles, headingLevel } = this.detectStylesAtCursor(range);
      
      this.currentStyles = styles;
      this.currentHeadingLevel = headingLevel;
      
      this.$emit('style-state-update', {
        styles: this.currentStyles,
        headingLevel: this.currentHeadingLevel
      });
    },

    detectStylesAtCursor(range) {
      const styles = {
        bold: false,
        italic: false,
        underline: false,
        code: false,
        strikethrough: false,
        highlight: false
      };
      
      let headingLevel = 0;
      
      // Check if cursor is inside formatted elements
      let container = range.startContainer;
      if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentElement;
      }
      
      // Walk up the DOM tree to find formatting
      while (container && container !== this.$refs.editor) {
        if (container.classList?.contains('md-bold')) {
          styles.bold = true;
        }
        if (container.classList?.contains('md-italic')) {
          styles.italic = true;
        }
        if (container.classList?.contains('md-underline')) {
          styles.underline = true;
        }
        if (container.classList?.contains('md-code')) {
          styles.code = true;
        }
        if (container.classList?.contains('md-strikethrough')) {
          styles.strikethrough = true;
        }
        if (container.classList?.contains('md-highlight')) {
          styles.highlight = true;
        }
        
        // Check for headers
        const headerMatch = container.className?.match(/md-header-(\d)/);
        if (headerMatch) {
          headingLevel = parseInt(headerMatch[1]);
        }
        
        container = container.parentElement;
      }
      
      return { styles, headingLevel };
    },

    // Style toggle methods that work with Typora-like behavior
    toggleBold() {
      this.toggleInlineStyle('**', '**', 'md-bold');
    },

    toggleItalic() {
      this.toggleInlineStyle('*', '*', 'md-italic');
    },

    toggleUnderline() {
      this.toggleInlineStyle('<u>', '</u>', 'md-underline');
    },

    toggleStrikethrough() {
      this.toggleInlineStyle('~~', '~~', 'md-strikethrough');
    },

    toggleCode() {
      this.toggleInlineStyle('`', '`', 'md-code');
    },

    toggleHighlight() {
      this.toggleInlineStyle('<mark>', '</mark>', 'md-highlight');
    },

    toggleInlineStyle(openTag, closeTag, className) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      
      // Check if we're inside the style already
      let container = range.startContainer;
      if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentElement;
      }
      
      const styledElement = container.closest(`.${className}`);
      
      if (styledElement) {
        // We're inside the style - remove it
        this.removeInlineStyle(styledElement, range);
      } else if (range.collapsed) {
        // No selection - create empty style for next input
        this.createEmptyStyle(openTag, closeTag, className, range);
      } else {
        // Has selection - wrap it
        this.wrapSelection(openTag, closeTag, range);
      }
      
      this.debouncedSync();
      this.debouncedStyleUpdate();
    },

    removeInlineStyle(styledElement, range) {
      // Extract the content and replace the styled element
      const contentSpan = styledElement.querySelector('.md-content');
      if (contentSpan) {
        const textNode = document.createTextNode(contentSpan.textContent);
        styledElement.parentNode.replaceChild(textNode, styledElement);
        
        // Position cursor in the text
        const newRange = document.createRange();
        newRange.setStart(textNode, Math.min(range.startOffset, textNode.textContent.length));
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    },

    createEmptyStyle(openTag, closeTag, className, range) {
      // Create the style structure for next input
      const styledSpan = document.createElement('span');
      styledSpan.className = className;
      styledSpan.innerHTML = `<span class="md-syntax">${openTag}</span><span class="md-content"></span><span class="md-syntax">${closeTag}</span>`;
      
      range.insertNode(styledSpan);
      
      // Position cursor inside the content span
      const contentSpan = styledSpan.querySelector('.md-content');
      const newRange = document.createRange();
      newRange.setStart(contentSpan, 0);
      newRange.collapse(true);
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(newRange);
    },

    wrapSelection(openTag, closeTag, range) {
      const selectedText = range.toString();
      const markdownText = openTag + selectedText + closeTag;
      
      range.deleteContents();
      range.insertNode(document.createTextNode(markdownText));
      
      // Position cursor after the wrapped text
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    },

    // Block operations
    toggleHeading() {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      let container = range.startContainer;
      
      if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentElement;
      }
      
      // Find current line div
      let currentDiv = container;
      while (currentDiv && currentDiv.parentElement !== this.$refs.editor) {
        currentDiv = currentDiv.parentElement;
      }
      
      if (!currentDiv) return;
      
      // Check if it's already a header
      const headerMatch = currentDiv.className?.match(/md-header-(\d)/);
      let nextLevel = 1;
      
      if (headerMatch) {
        const currentLevel = parseInt(headerMatch[1]);
        nextLevel = currentLevel >= 6 ? 0 : currentLevel + 1; // 0 means remove header
      }
      
      if (nextLevel === 0) {
        // Remove header formatting
        const content = currentDiv.querySelector('.md-content')?.textContent || '';
        currentDiv.className = '';
        currentDiv.innerHTML = content || '<br>';
      } else {
        // Apply header formatting
        const content = currentDiv.textContent || '';
        const cleanContent = content.replace(/^#+ /, '');
        currentDiv.className = `md-header md-header-${nextLevel}`;
        const hashes = '#'.repeat(nextLevel);
        currentDiv.innerHTML = `<span class="md-syntax">${hashes} </span><span class="md-content">${cleanContent}</span>`;
      }
      
      this.debouncedSync();
      this.debouncedStyleUpdate();
    },

    insertCodeBlock() {
      // Show language selector first
      const languages = [
        'javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'typescript',
        'html', 'css', 'sql', 'bash', 'json', 'xml', 'yaml', 'markdown',
        'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'dart', 'plaintext'
      ];
      
      const language = prompt(`请选择代码语言:\n\n${languages.join(', ')}\n\n输入语言名称:`) || 'plaintext';
      
      const codeBlock = `\n\`\`\`${language}\n// Your code here\n\`\`\`\n`;
      this.insertTextAtCursor(codeBlock);
    },

    showCodeBlockLanguageSelector() {
      // Similar to insertCodeBlock but for existing blocks
      this.insertCodeBlock();
    },

    insertUnorderedList() {
      this.insertBlockPrefix('- ');
    },

    insertTaskList() {
      this.insertBlockPrefix('- [ ] ');
    },

    insertBlockQuote() {
      this.insertBlockPrefix('> ');
    },

    insertBlockPrefix(prefix) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      
      // Find current line start
      const text = '\n' + prefix;
      this.insertTextAtCursor(text);
    },

    insertHorizontalRule() {
      this.insertTextAtCursor('\n---\n');
    },

    insertImage() {
      const url = prompt('请输入图片URL:');
      if (url) {
        const alt = prompt('请输入图片描述:') || 'image';
        this.insertTextAtCursor(`![${alt}](${url})`);
      }
    },

    insertMathInline() {
      const latex = prompt('请输入LaTeX公式:');
      if (latex) {
        this.insertTextAtCursor(`$${latex}$`);
      }
    },

    insertMathBlock() {
      const latex = prompt('请输入LaTeX块级公式:');
      if (latex) {
        this.insertTextAtCursor(`\n$$\n${latex}\n$$\n`);
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
      
      const newSelection = window.getSelection();
      newSelection.removeAllRanges();
      newSelection.addRange(range);
      
      this.debouncedSync();
    },

    insertTOC() {
      this.insertTextAtCursor('\n[[TOC]]\n');
    },

    // Helper methods
    insertTextAtCursor(text) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      this.debouncedSync();
    },

    saveCursor() {
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

    restoreCursor() {
      if (!this.lastCaretPosition) return;
      
      try {
        const range = document.createRange();
        if (this.isValidNode(this.lastCaretPosition.startContainer)) {
          range.setStart(
            this.lastCaretPosition.startContainer, 
            Math.min(this.lastCaretPosition.startOffset, this.lastCaretPosition.startContainer.textContent?.length || 0)
          );
          range.setEnd(
            this.lastCaretPosition.endContainer,
            Math.min(this.lastCaretPosition.endOffset, this.lastCaretPosition.endContainer.textContent?.length || 0)
          );
          
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } catch (error) {
        console.warn('Could not restore cursor:', error);
      }
    },

    isValidNode(node) {
      return node && node.parentNode && this.$refs.editor?.contains(node);
    },

    focus() {
      if (this.$refs.editor) {
        this.$refs.editor.focus();
      }
    },

    insertMarkdown(markdownText) {
      this.insertTextAtCursor(markdownText);
    }
  }
};
</script>

<style scoped>
.wysiwyg-editor-fixed {
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}

.wysiwyg-editor-fixed:focus {
  border-color: #0969da !important;
  box-shadow: 0 0 0 3px rgba(9, 105, 218, 0.3);
}

/* Markdown syntax highlighting */
.wysiwyg-editor-fixed :deep(.md-syntax) {
  color: #8b949e;
  opacity: 0.6;
  font-weight: normal;
}

.wysiwyg-editor-fixed :deep(.md-content) {
  color: inherit;
}

/* Headers */
.wysiwyg-editor-fixed :deep(.md-header-1 .md-content) {
  font-size: 2em;
  font-weight: 600;
  border-bottom: 1px solid #d1d9e0;
  padding-bottom: 0.3em;
  margin-bottom: 16px;
}

.wysiwyg-editor-fixed :deep(.md-header-2 .md-content) {
  font-size: 1.5em;
  font-weight: 600;
  border-bottom: 1px solid #d1d9e0;
  padding-bottom: 0.3em;
  margin-bottom: 16px;
}

.wysiwyg-editor-fixed :deep(.md-header-3 .md-content) {
  font-size: 1.25em;
  font-weight: 600;
}

.wysiwyg-editor-fixed :deep(.md-header-4 .md-content) {
  font-size: 1em;
  font-weight: 600;
}

.wysiwyg-editor-fixed :deep(.md-header-5 .md-content) {
  font-size: 0.875em;
  font-weight: 600;
}

.wysiwyg-editor-fixed :deep(.md-header-6 .md-content) {
  font-size: 0.85em;
  font-weight: 600;
  color: #656d76;
}

/* Bold */
.wysiwyg-editor-fixed :deep(.md-bold .md-content) {
  font-weight: 600;
}

/* Italic */
.wysiwyg-editor-fixed :deep(.md-italic .md-content) {
  font-style: italic;
}

/* Strikethrough */
.wysiwyg-editor-fixed :deep(.md-strikethrough .md-content) {
  text-decoration: line-through;
}

/* Underline */
.wysiwyg-editor-fixed :deep(.md-underline .md-content) {
  text-decoration: underline;
}

/* Highlight */
.wysiwyg-editor-fixed :deep(.md-highlight .md-content) {
  background-color: #fff3cd;
  padding: 2px 4px;
  border-radius: 3px;
}

/* Inline code */
.wysiwyg-editor-fixed :deep(.md-code) {
  background-color: rgba(175, 184, 193, 0.2);
  border-radius: 3px;
  padding: 2px 4px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 85%;
}

.wysiwyg-editor-fixed :deep(.md-code .md-content) {
  color: #d73a49;
}

/* Code blocks */
.wysiwyg-editor-fixed :deep(.md-code-block) {
  background-color: #f6f8fa;
  border-radius: 6px;
  margin: 16px 0;
  overflow: hidden;
  border: 1px solid #d1d9e0;
}

.wysiwyg-editor-fixed :deep(.md-code-lang) {
  background-color: #f1f3f4;
  padding: 8px 12px;
  border-bottom: 1px solid #d1d9e0;
  font-size: 12px;
  color: #586069;
}

.wysiwyg-editor-fixed :deep(.md-code-content) {
  padding: 16px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 85%;
  line-height: 1.45;
  overflow-x: auto;
  white-space: pre;
}

.wysiwyg-editor-fixed :deep(.md-code-end) {
  padding: 4px 12px;
  font-size: 12px;
}

/* Block quotes */
.wysiwyg-editor-fixed :deep(.md-quote) {
  border-left: 4px solid #d1d9e0;
  padding-left: 16px;
  margin: 16px 0;
  color: #656d76;
}

/* Lists */
.wysiwyg-editor-fixed :deep(.md-list),
.wysiwyg-editor-fixed :deep(.md-task-list) {
  margin: 4px 0;
}

.wysiwyg-editor-fixed :deep(.md-task-list.checked .md-content) {
  text-decoration: line-through;
  color: #8b949e;
}

/* Empty line handling */
.wysiwyg-editor-fixed :deep(div:empty::before) {
  content: '\00a0';
  color: transparent;
}

.wysiwyg-editor-fixed :deep(div:empty) {
  min-height: 1.2em;
}
</style>