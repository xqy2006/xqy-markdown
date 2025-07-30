<template>
  <div 
    class="markdown-renderer"
    ref="rendererElement"
    v-html="renderedHtml"
  ></div>
</template>

<script>
/**
 * Unified Markdown Renderer
 * Provides consistent rendering for both WYSIWYG and preview modes
 */
export default {
  name: 'MarkdownRenderer',
  props: {
    markdown: {
      type: String,
      default: ''
    },
    renderer: {
      type: Function,
      required: true
    }
  },
  computed: {
    renderedHtml() {
      if (!this.markdown || !this.renderer) {
        return '<p><br></p>'; // Ensure minimal content for editing
      }
      
      const html = this.renderer(this.markdown);
      
      // Ensure html is a string and handle empty content
      if (!html || typeof html !== 'string' || !html.trim()) {
        return '<p><br></p>';
      }
      
      return html;
    }
  },
  mounted() {
    this.$emit('rendered', this.$refs.rendererElement);
  },
  updated() {
    this.$emit('rendered', this.$refs.rendererElement);
  },
  emits: ['rendered']
}
</script>

<style scoped>
.markdown-renderer {
  min-height: 1.2em;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Ensure empty paragraphs are clickable */
.markdown-renderer p:empty::before {
  content: '\00a0';
  color: transparent;
}

.markdown-renderer p:empty {
  min-height: 1.2em;
}
</style>