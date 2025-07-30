/**
 * Edit Handler
 * Converts editing operations to Markdown source modifications
 */
export class EditHandler {
  constructor(cursorManager) {
    this.cursorManager = cursorManager;
  }

  /**
   * Handle text input by directly modifying markdown
   * @param {string} markdownContent - Current markdown content
   * @param {number} position - Position in markdown to insert text
   * @param {string} text - Text to insert
   * @returns {Object} { content: newMarkdown, cursorPosition: newPosition }
   */
  handleTextInput(markdownContent, position, text) {
    const before = markdownContent.slice(0, position);
    const after = markdownContent.slice(position);
    
    return {
      content: before + text + after,
      cursorPosition: position + text.length
    };
  }

  /**
   * Handle style toggle by modifying markdown syntax
   * @param {string} markdownContent - Current markdown content
   * @param {number} startPos - Start position of selection/cursor
   * @param {number} endPos - End position of selection
   * @param {string} styleType - Type of style ('bold', 'italic', etc.)
   * @returns {Object} { content: newMarkdown, cursorPosition: newPosition }
   */
  handleStyleToggle(markdownContent, startPos, endPos, styleType) {
    const styleMap = {
      'bold': { prefix: '**', suffix: '**' },
      'italic': { prefix: '*', suffix: '*' },
      'strikethrough': { prefix: '~~', suffix: '~~' },
      'code': { prefix: '`', suffix: '`' },
      'underline': { prefix: '<u>', suffix: '</u>' },
      'highlight': { prefix: '<mark>', suffix: '</mark>' }
    };

    const style = styleMap[styleType];
    if (!style) return { content: markdownContent, cursorPosition: startPos };

    const before = markdownContent.slice(0, startPos);
    const selected = markdownContent.slice(startPos, endPos);
    const after = markdownContent.slice(endPos);

    // Check if already styled
    const beforeStyle = before.endsWith(style.prefix);
    const afterStyle = after.startsWith(style.suffix);

    if (beforeStyle && afterStyle) {
      // Remove existing style
      const newBefore = before.slice(0, -style.prefix.length);
      const newAfter = after.slice(style.suffix.length);
      return {
        content: newBefore + selected + newAfter,
        cursorPosition: startPos - style.prefix.length
      };
    } else {
      // Add style
      return {
        content: before + style.prefix + selected + style.suffix + after,
        cursorPosition: startPos + style.prefix.length + selected.length + style.suffix.length
      };
    }
  }

  /**
   * Handle heading toggle
   * @param {string} markdownContent - Current markdown content
   * @param {number} position - Cursor position
   * @returns {Object} { content: newMarkdown, cursorPosition: newPosition }
   */
  handleHeadingToggle(markdownContent, position) {
    const lines = markdownContent.split('\n');
    let lineIndex = 0;
    let charCount = 0;

    // Find which line the cursor is on
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= position) {
        lineIndex = i;
        break;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }

    const line = lines[lineIndex];
    const headingMatch = line.match(/^(#{1,6})\s*/);

    if (headingMatch) {
      const currentLevel = headingMatch[1].length;
      const nextLevel = currentLevel >= 6 ? 0 : currentLevel + 1;
      
      if (nextLevel === 0) {
        // Remove heading
        lines[lineIndex] = line.replace(/^#{1,6}\s*/, '');
      } else {
        // Change heading level
        lines[lineIndex] = '#'.repeat(nextLevel) + ' ' + line.replace(/^#{1,6}\s*/, '');
      }
    } else {
      // Add heading
      lines[lineIndex] = '# ' + line;
    }

    return {
      content: lines.join('\n'),
      cursorPosition: position // Try to maintain position
    };
  }

  /**
   * Handle list insertion
   * @param {string} markdownContent - Current markdown content
   * @param {number} position - Cursor position
   * @param {string} listType - 'unordered' or 'task'
   * @returns {Object} { content: newMarkdown, cursorPosition: newPosition }
   */
  handleListInsertion(markdownContent, position, listType = 'unordered') {
    const listMarkers = {
      'unordered': '- ',
      'task': '- [ ] '
    };

    const marker = listMarkers[listType] || '- ';
    const lines = markdownContent.split('\n');
    let lineIndex = 0;
    let charCount = 0;

    // Find current line
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= position) {
        lineIndex = i;
        break;
      }
      charCount += lines[i].length + 1;
    }

    const line = lines[lineIndex];
    
    // Check if already a list item
    if (line.match(/^\s*-\s*/)) {
      // Remove list formatting
      lines[lineIndex] = line.replace(/^\s*-\s*(\[\s*[x ]\s*\])?\s*/, '');
    } else {
      // Add list formatting
      lines[lineIndex] = marker + line.trim();
    }

    return {
      content: lines.join('\n'),
      cursorPosition: position + marker.length
    };
  }

  /**
   * Handle blockquote insertion
   * @param {string} markdownContent - Current markdown content
   * @param {number} position - Cursor position
   * @returns {Object} { content: newMarkdown, cursorPosition: newPosition }
   */
  handleBlockquoteInsertion(markdownContent, position) {
    const lines = markdownContent.split('\n');
    let lineIndex = 0;
    let charCount = 0;

    // Find current line
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= position) {
        lineIndex = i;
        break;
      }
      charCount += lines[i].length + 1;
    }

    const line = lines[lineIndex];
    
    // Check if already blockquote
    if (line.match(/^\s*>\s*/)) {
      // Remove blockquote
      lines[lineIndex] = line.replace(/^\s*>\s*/, '');
    } else {
      // Add blockquote
      lines[lineIndex] = '> ' + line.trim();
    }

    return {
      content: lines.join('\n'),
      cursorPosition: position + 2 // Account for "> "
    };
  }

  /**
   * Handle code block insertion
   * @param {string} markdownContent - Current markdown content
   * @param {number} position - Cursor position
   * @param {string} language - Programming language
   * @returns {Object} { content: newMarkdown, cursorPosition: newPosition }
   */
  handleCodeBlockInsertion(markdownContent, position, language = '') {
    const before = markdownContent.slice(0, position);
    const after = markdownContent.slice(position);
    
    const codeBlock = `\n\`\`\`${language}\nYour code here...\n\`\`\`\n`;
    
    return {
      content: before + codeBlock + after,
      cursorPosition: position + codeBlock.indexOf('Your code here...')
    };
  }

  /**
   * Handle horizontal rule insertion
   * @param {string} markdownContent - Current markdown content
   * @param {number} position - Cursor position
   * @returns {Object} { content: newMarkdown, cursorPosition: newPosition }
   */
  handleHorizontalRuleInsertion(markdownContent, position) {
    const before = markdownContent.slice(0, position);
    const after = markdownContent.slice(position);
    
    const hr = '\n------\n';
    
    return {
      content: before + hr + after,
      cursorPosition: position + hr.length
    };
  }

  /**
   * Handle image insertion
   * @param {string} markdownContent - Current markdown content
   * @param {number} position - Cursor position
   * @param {string} url - Image URL
   * @param {string} alt - Alt text
   * @returns {Object} { content: newMarkdown, cursorPosition: newPosition }
   */
  handleImageInsertion(markdownContent, position, url = '', alt = '图片') {
    const before = markdownContent.slice(0, position);
    const after = markdownContent.slice(position);
    
    const image = `![${alt}](${url})`;
    
    return {
      content: before + image + after,
      cursorPosition: position + image.length
    };
  }

  /**
   * Handle math formula insertion
   * @param {string} markdownContent - Current markdown content
   * @param {number} position - Cursor position
   * @param {string} latex - LaTeX formula
   * @param {boolean} isBlock - Whether it's a block formula
   * @returns {Object} { content: newMarkdown, cursorPosition: newPosition }
   */
  handleMathInsertion(markdownContent, position, latex = '', isBlock = false) {
    const before = markdownContent.slice(0, position);
    const after = markdownContent.slice(position);
    
    const math = isBlock ? `\n$$\n${latex}\n$$\n` : ` $${latex}$ `;
    
    return {
      content: before + math + after,
      cursorPosition: position + (isBlock ? math.indexOf(latex) : math.indexOf(latex))
    };
  }

  /**
   * Detect current style state at position
   * @param {string} markdownContent - Current markdown content
   * @param {number} position - Cursor position
   * @returns {Object} Style state object
   */
  detectStyleState(markdownContent, position) {
    // Look around the cursor position for style markers
    const before = markdownContent.slice(Math.max(0, position - 10), position);
    const after = markdownContent.slice(position, position + 10);
    
    return {
      bold: (before.endsWith('**') && after.startsWith('**')) || (before.includes('**') && after.includes('**')),
      italic: (before.endsWith('*') && after.startsWith('*')) || (before.includes('*') && after.includes('*')),
      strikethrough: (before.endsWith('~~') && after.startsWith('~~')) || (before.includes('~~') && after.includes('~~')),
      code: (before.endsWith('`') && after.startsWith('`')) || (before.includes('`') && after.includes('`')),
      underline: (before.includes('<u>') && after.includes('</u>')),
      highlight: (before.includes('<mark>') && after.includes('</mark>'))
    };
  }

  /**
   * Detect current heading level at position
   * @param {string} markdownContent - Current markdown content
   * @param {number} position - Cursor position
   * @returns {number} Heading level (0-6)
   */
  detectHeadingLevel(markdownContent, position) {
    const lines = markdownContent.split('\n');
    let charCount = 0;

    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= position) {
        const match = lines[i].match(/^(#{1,6})\s*/);
        return match ? match[1].length : 0;
      }
      charCount += lines[i].length + 1;
    }

    return 0;
  }
}