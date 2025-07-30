/**
 * Style Manager
 * Handles style state detection and management for WYSIWYG mode
 */
export class StyleManager {
  constructor() {
    this.currentStyles = {
      bold: false,
      italic: false,
      underline: false,
      code: false,
      strikethrough: false,
      highlight: false
    };
    this.currentHeadingLevel = 0;
  }

  /**
   * Update style states based on cursor position in markdown
   * @param {string} markdownContent - Current markdown content
   * @param {number} position - Cursor position in markdown
   * @returns {Object} Style state object
   */
  updateStyleState(markdownContent, position) {
    const styleState = this.detectStylesAtPosition(markdownContent, position);
    const headingLevel = this.detectHeadingAtPosition(markdownContent, position);

    this.currentStyles = styleState;
    this.currentHeadingLevel = headingLevel;

    return {
      styles: this.currentStyles,
      headingLevel: this.currentHeadingLevel
    };
  }

  /**
   * Detect active styles at a specific position in markdown
   * @param {string} markdownContent - Markdown content
   * @param {number} position - Position to check
   * @returns {Object} Detected styles
   */
  detectStylesAtPosition(markdownContent, position) {
    const context = this.getContextAroundPosition(markdownContent, position);
    
    return {
      bold: this.isInsideMarkers(context, '**'),
      italic: this.isInsideMarkers(context, '*', ['**']), // Exclude ** matches
      strikethrough: this.isInsideMarkers(context, '~~'),
      code: this.isInsideMarkers(context, '`'),
      underline: this.isInsideHtmlTag(context, 'u'),
      highlight: this.isInsideHtmlTag(context, 'mark')
    };
  }

  /**
   * Detect heading level at position
   * @param {string} markdownContent - Markdown content
   * @param {number} position - Position to check
   * @returns {number} Heading level (0-6)
   */
  detectHeadingAtPosition(markdownContent, position) {
    const lines = markdownContent.split('\n');
    let charCount = 0;

    // Find which line contains the position
    for (let i = 0; i < lines.length; i++) {
      const lineEnd = charCount + lines[i].length;
      if (position <= lineEnd) {
        const line = lines[i];
        const headingMatch = line.match(/^(#{1,6})\s+/);
        return headingMatch ? headingMatch[1].length : 0;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }

    return 0;
  }

  /**
   * Get context around a position for style detection
   * @param {string} content - Content to analyze
   * @param {number} position - Center position
   * @param {number} radius - Characters to include before/after
   * @returns {Object} Context information
   */
  getContextAroundPosition(content, position, radius = 50) {
    const start = Math.max(0, position - radius);
    const end = Math.min(content.length, position + radius);
    
    const before = content.slice(start, position);
    const after = content.slice(position, end);
    const relativePosition = position - start;

    return {
      before,
      after,
      full: before + after,
      relativePosition,
      absolutePosition: position
    };
  }

  /**
   * Check if position is inside markdown markers
   * @param {Object} context - Context around position
   * @param {string} marker - Marker to check for (e.g., '**', '*', '~~')
   * @param {Array} excludeMarkers - Markers to exclude from detection
   * @returns {boolean} Whether position is inside markers
   */
  isInsideMarkers(context, marker, excludeMarkers = []) {
    const { full, relativePosition } = context;
    
    // Find all occurrences of the marker
    const markerPositions = [];
    let index = 0;
    
    while ((index = full.indexOf(marker, index)) !== -1) {
      // Skip if this marker is part of an excluded marker
      const isExcluded = excludeMarkers.some(excludeMarker => 
        excludeMarker.includes(marker) && 
        full.slice(index - excludeMarker.length + marker.length, index + marker.length) === excludeMarker
      );
      
      if (!isExcluded) {
        markerPositions.push(index);
      }
      index += marker.length;
    }

    // Check if we're inside a pair of markers
    for (let i = 0; i < markerPositions.length - 1; i += 2) {
      const startPos = markerPositions[i];
      const endPos = markerPositions[i + 1];
      
      if (startPos < relativePosition && relativePosition < endPos + marker.length) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if position is inside HTML tags
   * @param {Object} context - Context around position
   * @param {string} tagName - HTML tag name (e.g., 'u', 'mark')
   * @returns {boolean} Whether position is inside the tag
   */
  isInsideHtmlTag(context, tagName) {
    const { full, relativePosition } = context;
    
    const openTag = `<${tagName}>`;
    const closeTag = `</${tagName}>`;
    
    // Find all tag pairs
    const openPositions = [];
    const closePositions = [];
    
    let index = 0;
    while ((index = full.indexOf(openTag, index)) !== -1) {
      openPositions.push(index);
      index += openTag.length;
    }
    
    index = 0;
    while ((index = full.indexOf(closeTag, index)) !== -1) {
      closePositions.push(index);
      index += closeTag.length;
    }

    // Check if we're inside any tag pair
    for (let i = 0; i < Math.min(openPositions.length, closePositions.length); i++) {
      const openPos = openPositions[i];
      const closePos = closePositions[i];
      
      if (openPos + openTag.length <= relativePosition && relativePosition <= closePos) {
        return true;
      }
    }

    return false;
  }

  /**
   * Apply style to markdown at specific position
   * @param {string} markdownContent - Current markdown
   * @param {number} startPos - Selection start
   * @param {number} endPos - Selection end
   * @param {string} styleType - Style to apply
   * @param {boolean} enable - Whether to enable or disable
   * @returns {Object} Modified content and new cursor position
   */
  applyStyle(markdownContent, startPos, endPos, styleType, enable) {
    const styleConfig = {
      bold: { prefix: '**', suffix: '**' },
      italic: { prefix: '*', suffix: '*' },
      strikethrough: { prefix: '~~', suffix: '~~' },
      code: { prefix: '`', suffix: '`' },
      underline: { prefix: '<u>', suffix: '</u>' },
      highlight: { prefix: '<mark>', suffix: '</mark>' }
    };

    const config = styleConfig[styleType];
    if (!config) {
      return { content: markdownContent, cursorPosition: startPos };
    }

    const before = markdownContent.slice(0, startPos);
    const selected = markdownContent.slice(startPos, endPos);
    const after = markdownContent.slice(endPos);

    if (enable) {
      // Add style markers
      const newContent = before + config.prefix + selected + config.suffix + after;
      return {
        content: newContent,
        cursorPosition: endPos + config.prefix.length + config.suffix.length
      };
    } else {
      // Remove style markers if they exist
      const prefixPattern = this.escapeRegex(config.prefix);
      const suffixPattern = this.escapeRegex(config.suffix);
      
      // Check if selection is wrapped with the markers
      const wrappedPattern = new RegExp(`${prefixPattern}(.*?)${suffixPattern}`, 'g');
      
      if (selected.match(wrappedPattern)) {
        const unwrapped = selected.replace(wrappedPattern, '$1');
        const newContent = before + unwrapped + after;
        return {
          content: newContent,
          cursorPosition: startPos + unwrapped.length
        };
      }
      
      // Check if markers surround the selection
      if (before.endsWith(config.prefix) && after.startsWith(config.suffix)) {
        const newBefore = before.slice(0, -config.prefix.length);
        const newAfter = after.slice(config.suffix.length);
        const newContent = newBefore + selected + newAfter;
        return {
          content: newContent,
          cursorPosition: startPos - config.prefix.length
        };
      }
    }

    return { content: markdownContent, cursorPosition: startPos };
  }

  /**
   * Get style boundaries around position
   * @param {string} markdownContent - Markdown content
   * @param {number} position - Position to check
   * @param {string} styleType - Style type to find boundaries for
   * @returns {Object} Start and end positions of the style
   */
  getStyleBoundaries(markdownContent, position, styleType) {
    const styleConfig = {
      bold: { prefix: '**', suffix: '**' },
      italic: { prefix: '*', suffix: '*' },
      strikethrough: { prefix: '~~', suffix: '~~' },
      code: { prefix: '`', suffix: '`' },
      underline: { prefix: '<u>', suffix: '</u>' },
      highlight: { prefix: '<mark>', suffix: '</mark>' }
    };

    const config = styleConfig[styleType];
    if (!config) {
      return { start: position, end: position };
    }

    // Find the nearest style markers around the position
    const before = markdownContent.slice(0, position);
    const after = markdownContent.slice(position);

    const lastPrefixIndex = before.lastIndexOf(config.prefix);
    const nextSuffixIndex = after.indexOf(config.suffix);

    if (lastPrefixIndex !== -1 && nextSuffixIndex !== -1) {
      return {
        start: lastPrefixIndex,
        end: position + nextSuffixIndex + config.suffix.length
      };
    }

    return { start: position, end: position };
  }

  /**
   * Escape regex special characters
   * @param {string} string - String to escape
   * @returns {string} Escaped string
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get current style state
   * @returns {Object} Current style and heading state
   */
  getCurrentState() {
    return {
      styles: { ...this.currentStyles },
      headingLevel: this.currentHeadingLevel
    };
  }
}