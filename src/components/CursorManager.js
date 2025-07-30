/**
 * Cursor Manager
 * Handles bidirectional mapping between HTML cursor positions and Markdown positions
 */
export class CursorManager {
  constructor() {
    this.lastSavedPosition = null;
  }

  /**
   * Save current cursor position in HTML element
   * @param {HTMLElement} htmlElement - The contenteditable element
   * @returns {Object} Saved position data
   */
  savePosition(htmlElement) {
    try {
      const selection = window.getSelection();
      if (!selection.rangeCount) return null;

      const range = selection.getRangeAt(0);
      
      // Get offset within the HTML content
      const htmlOffset = this.getOffsetInElement(htmlElement, range.startContainer, range.startOffset);
      
      // Save multiple fallback strategies
      this.lastSavedPosition = {
        htmlOffset,
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer, 
        endOffset: range.endOffset,
        isCollapsed: range.collapsed,
        // Additional context for better restoration
        textContent: range.startContainer.textContent,
        nodeIndex: this.getNodeIndex(range.startContainer),
        timestamp: Date.now()
      };

      return this.lastSavedPosition;
    } catch (error) {
      console.warn('Failed to save cursor position:', error);
      return null;
    }
  }

  /**
   * Restore cursor position after content change
   * @param {HTMLElement} htmlElement - The contenteditable element
   * @param {Object} positionData - Previously saved position data
   */
  restorePosition(htmlElement, positionData = null) {
    const position = positionData || this.lastSavedPosition;
    if (!position || !htmlElement) return false;

    try {
      const selection = window.getSelection();
      
      // Strategy 1: Try to restore using saved containers if still valid
      if (this.isValidNode(position.startContainer) && this.isValidNode(position.endContainer)) {
        const range = document.createRange();
        range.setStart(position.startContainer, Math.min(position.startOffset, position.startContainer.textContent?.length || 0));
        range.setEnd(position.endContainer, Math.min(position.endOffset, position.endContainer.textContent?.length || 0));
        
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
      }

      // Strategy 2: Try to restore using HTML offset
      if (position.htmlOffset !== undefined) {
        const restoredPosition = this.findPositionByOffset(htmlElement, position.htmlOffset);
        if (restoredPosition) {
          const range = document.createRange();
          range.setStart(restoredPosition.container, restoredPosition.offset);
          range.collapse(true);
          
          selection.removeAllRanges();
          selection.addRange(range);
          return true;
        }
      }

      // Strategy 3: Position at end as fallback
      this.positionAtEnd(htmlElement);
      return true;

    } catch (error) {
      console.warn('Failed to restore cursor position:', error);
      // Final fallback
      this.positionAtEnd(htmlElement);
      return false;
    }
  }

  /**
   * Convert HTML offset to Markdown offset
   * @param {string} htmlContent - Rendered HTML content (text content)
   * @param {string} markdownContent - Source markdown
   * @param {number} htmlOffset - Offset in HTML text content
   * @returns {number} Corresponding offset in markdown
   */
  htmlToMarkdownOffset(htmlContent, markdownContent, htmlOffset) {
    // Advanced mapping strategy
    if (!htmlContent || !markdownContent) return 0;
    
    // Strategy 1: Try character-by-character mapping for simple cases
    if (this.isSimpleContent(markdownContent)) {
      const ratio = markdownContent.length / htmlContent.length;
      return Math.min(Math.floor(htmlOffset * ratio), markdownContent.length);
    }
    
    // Strategy 2: Line-by-line mapping for complex content
    return this.mapOffsetByLines(htmlContent, markdownContent, htmlOffset, 'htmlToMarkdown');
  }

  /**
   * Convert Markdown offset to HTML offset
   * @param {string} markdownContent - Source markdown
   * @param {string} htmlContent - Rendered HTML content (text content)
   * @param {number} markdownOffset - Offset in markdown
   * @returns {number} Corresponding offset in HTML
   */
  markdownToHtmlOffset(markdownContent, htmlContent, markdownOffset) {
    // Advanced mapping strategy
    if (!markdownContent || !htmlContent) return 0;
    
    // Strategy 1: Try character-by-character mapping for simple cases
    if (this.isSimpleContent(markdownContent)) {
      const ratio = htmlContent.length / markdownContent.length;
      return Math.min(Math.floor(markdownOffset * ratio), htmlContent.length);
    }
    
    // Strategy 2: Line-by-line mapping for complex content
    return this.mapOffsetByLines(markdownContent, htmlContent, markdownOffset, 'markdownToHtml');
  }

  /**
   * Check if content is simple (no complex markdown structures)
   * @param {string} content - Content to check
   * @returns {boolean} Whether content is simple
   */
  isSimpleContent(content) {
    // Check for complex markdown patterns
    const complexPatterns = [
      /```/, // Code blocks
      /\|.*\|/, // Tables
      /\$\$/, // Math blocks
      /\[.*\]\(.*\)/, // Links
      /!\[.*\]\(.*\)/, // Images
      /^#{1,6}\s/, // Headers
      /^\s*[-*+]\s/, // Lists
      /^\s*\d+\.\s/, // Numbered lists
      /^\s*>\s/ // Blockquotes
    ];
    
    return !complexPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Map offset by comparing line positions
   * @param {string} sourceContent - Source content
   * @param {string} targetContent - Target content
   * @param {number} sourceOffset - Offset in source
   * @param {string} direction - 'htmlToMarkdown' or 'markdownToHtml'
   * @returns {number} Mapped offset
   */
  mapOffsetByLines(sourceContent, targetContent, sourceOffset, direction) {
    const sourceLines = sourceContent.split('\n');
    const targetLines = targetContent.split('\n');
    
    // Find line and position within line
    let currentOffset = 0;
    let lineIndex = 0;
    let positionInLine = 0;
    
    for (let i = 0; i < sourceLines.length; i++) {
      if (currentOffset + sourceLines[i].length >= sourceOffset) {
        lineIndex = i;
        positionInLine = sourceOffset - currentOffset;
        break;
      }
      currentOffset += sourceLines[i].length + 1; // +1 for newline
    }
    
    // Map to corresponding line in target
    if (lineIndex >= targetLines.length) {
      // Past end of target, return end position
      return targetContent.length;
    }
    
    // Calculate target offset
    let targetOffset = 0;
    for (let i = 0; i < lineIndex; i++) {
      targetOffset += targetLines[i].length + 1;
    }
    
    // Map position within line
    const sourceLine = sourceLines[lineIndex] || '';
    const targetLine = targetLines[lineIndex] || '';
    
    if (sourceLine.length === 0) {
      targetOffset += Math.min(positionInLine, targetLine.length);
    } else {
      const ratio = targetLine.length / sourceLine.length;
      targetOffset += Math.min(Math.floor(positionInLine * ratio), targetLine.length);
    }
    
    return Math.min(targetOffset, targetContent.length);
  }

  /**
   * Get absolute offset of a position within an element
   * @private
   */
  getOffsetInElement(element, container, offset) {
    if (container === element) return offset;

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let currentOffset = 0;
    let node;

    while (node = walker.nextNode()) {
      if (node === container) {
        return currentOffset + offset;
      }
      currentOffset += node.textContent.length;
    }

    return currentOffset;
  }

  /**
   * Find position by absolute offset
   * @private
   */
  findPositionByOffset(element, targetOffset) {
    const walker = document.createTreeWalker(
      element,
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

    // If not found, position at end
    const lastNode = this.getLastTextNode(element);
    if (lastNode) {
      return { container: lastNode, offset: lastNode.textContent.length };
    }

    return { container: element, offset: 0 };
  }

  /**
   * Get last text node in element
   * @private  
   */
  getLastTextNode(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let lastNode = null;
    let node;
    while (node = walker.nextNode()) {
      lastNode = node;
    }

    return lastNode;
  }

  /**
   * Position cursor at end of element
   * @private
   */
  positionAtEnd(element) {
    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Check if a node is still valid in DOM
   * @private
   */
  isValidNode(node) {
    return node && node.parentNode && document.contains(node);
  }

  /**
   * Get index of node among siblings
   * @private
   */
  getNodeIndex(node) {
    if (!node || !node.parentNode) return -1;
    return Array.from(node.parentNode.childNodes).indexOf(node);
  }
}