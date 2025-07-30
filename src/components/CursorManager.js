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
   * @param {string} htmlContent - Rendered HTML content
   * @param {string} markdownContent - Source markdown
   * @param {number} htmlOffset - Offset in HTML content
   * @returns {number} Corresponding offset in markdown
   */
  htmlToMarkdownOffset(htmlContent, markdownContent, htmlOffset) {
    // This is a simplified implementation
    // A more sophisticated version would parse both HTML and Markdown structures
    const ratio = markdownContent.length / htmlContent.length;
    return Math.floor(htmlOffset * ratio);
  }

  /**
   * Convert Markdown offset to HTML offset
   * @param {string} markdownContent - Source markdown
   * @param {string} htmlContent - Rendered HTML content  
   * @param {number} markdownOffset - Offset in markdown
   * @returns {number} Corresponding offset in HTML
   */
  markdownToHtmlOffset(markdownContent, htmlContent, markdownOffset) {
    // This is a simplified implementation
    const ratio = htmlContent.length / markdownContent.length;
    return Math.floor(markdownOffset * ratio);
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