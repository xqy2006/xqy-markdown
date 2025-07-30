<template>
<div class="markdown-body" style="margin-top: 15px;margin-inline-start: 15px;">
    <h1>markdown编辑器</h1>
</div>
<div style="margin-top: 5px;white-space:nowrap;overflow-x: auto;overflow-y: hidden;">
    <td><a v-if="!mdup" style="margin-inline-start: 15px;" href="javascript:;" class="a-upload btn btn-primary btn-sm"><input type="file" accept=".md," ref="mdfile" @change="up_md()">上传markdown</a>
        <button v-if="mdup" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" aria-disabled="true"><span>Processing</span><span class="AnimatedEllipsis"></span></button></td>
    <td><button v-if="!mddown" :disabled="mdtext==''" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" @click="to_md()">
            导出markdown
        </button>
        <button v-if="mddown" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" aria-disabled="true"><span>Processing</span><span class="AnimatedEllipsis"></span></button></td>
    <td><button v-if="!htmldown" :disabled="mdtext==''" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" @click="to_html()">
            导出html
        </button>
        <button v-if="htmldown" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" aria-disabled="true"><span>Processing</span><span class="AnimatedEllipsis"></span></button></td>

    <td><button v-if="!pdfdown" :disabled="mdtext==''" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" @click="to_pdf(20)">
            导出pdf
        </button>
        <button v-if="pdfdown" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" aria-disabled="true"><span>Processing</span><span class="AnimatedEllipsis"></span></button></td>
    <td><button v-if="!pngdown" :disabled="mdtext==''" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" @click="to_png()">
            导出png
        </button>
        <button v-if="pngdown" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" aria-disabled="true"><span>Loading</span><span class="AnimatedEllipsis"></span></button></td>
    
    <!-- 修改：清除储存 -> 清除所有内容 -->
    <td><button style="margin-inline-start: 15px;" class="btn btn-danger btn-sm" @click="clearAllContent()" title="清除文件名和内容">
            清除内容
        </button></td>
</div>
<span class="Progress" v-if="pdfdown" style="margin-top: 10px;margin-inline-start: 15px;margin-inline-end: 15px;">
  <span class="Progress-item color-bg-success-emphasis" :style="`width:`+(count/sum*100)+`%;`"></span>
</span>

<!-- 修改：缩小提示条高度 -->
<div v-if="autoSaveStatus" class="flash flash-success compact-flash" style="margin: 10px 15px;">
    <span>{{ autoSaveStatus }}</span>
</div>

<div class="Box" style="margin-inline-start: 15px;margin-inline-end: 15px;margin-top: 15px;">
    <div class="Box-header">
        <b>导出设置：</b>
        <div class="export-settings">
            <div class="setting-group">
                <label>文件名：</label>
                <input v-model="filename" class="form-control input-sm" type="text" placeholder="导出文件名" style="flex: 1;" />
            </div>
            <div class="setting-group">
                <label>缩放倍率：</label>
                <input v-model.number="exportScale" class="form-control input-sm" type="number" min="0.5" max="3" step="0.1" style="width: 80px;" />
                <small class="text-gray">(1.0 = 标准A4宽度)</small>
            </div>
        </div>
    </div>
    <div class="Box-row" id="buttons">
        <span class="BtnGroup d-block toolbar-row primary-toolbar" style="margin-top: 5px;margin-inline-start: 15px;white-space:nowrap;overflow-x: auto;overflow-y: hidden;">
            <td><IconButton :icon="currentHeadingIcon" tooltip="标题" @click="handleHeading()" /></td>
            <td><IconButton icon="code-block" tooltip="代码块 (Ctrl+K)" @click="handleCodeBlock()" /></td>
            <td><IconButton icon="settings" tooltip="代码语言 (F2)" @click="handleCodeLanguage()" /></td>
            <td><IconButton icon="code" tooltip="单行代码" :variant="codeButtonClass.replace('btn-', '')" @click="handleCode()" /></td>
            <td><IconButton icon="image" tooltip="图片" @click="handleImage()" /></td>
            <td><IconButton icon="quote" tooltip="引用" @click="handleQuote()" /></td>
            <td><IconButton icon="list" tooltip="无序列表" @click="handleList()" /></td>
            <td><IconButton icon="check-list" tooltip="任务列表" @click="handleTaskList()" /></td>
            <td><IconButton icon="hash" tooltip="目录" @click="handleTOC()" /></td>
            <td><IconButton icon="hr" tooltip="分割线" @click="handleHR()" /></td>
            <td><IconButton icon="function" tooltip="Tex公式" @click="handleMath()" /></td>
            <td><IconButton icon="eye" tooltip="显示Tex工具箱" v-if="!tex" @click="opentex()" /></td>
            <td><IconButton icon="eye-off" tooltip="隐藏Tex工具箱" v-if="tex" @click="closetex()" /></td>
            <td><button 
                class="btn btn-sm" 
                :class="isWysiwygMode ? 'btn-primary' : 'btn-invisible'" 
                @click="toggleEditMode()">
                {{ isWysiwygMode ? 'WYSIWYG模式' : '切换到WYSIWYG' }}
            </button></td>
        </span>
        <span class="BtnGroup d-block toolbar-row" style="margin-top: 5px;margin-inline-start: 15px;white-space:nowrap;overflow-x: auto;overflow-y: hidden;">
            <td><IconButton icon="bold" tooltip="粗体 (Ctrl+B)" :variant="boldButtonClass.replace('btn-', '')" @click="handleBold()" /></td>
            <td><IconButton icon="italic" tooltip="斜体 (Ctrl+I)" :variant="italicButtonClass.replace('btn-', '')" @click="handleItalic()" /></td>
            <td><IconButton icon="underline" tooltip="下划线" :variant="underlineButtonClass.replace('btn-', '')" @click="handleUnderline()" /></td>
            <td><IconButton icon="paint" tooltip="标红" @click="handleColorText('red')" /></td>
            <td><IconButton icon="highlight" tooltip="高亮" :variant="highlightButtonClass.replace('btn-', '')" @click="handleHighlight()" /></td>
            <td><IconButton icon="strikethrough" tooltip="删除线" :variant="strikethroughButtonClass.replace('btn-', '')" @click="handleStrikethrough()" /></td>
        </span>
        <span class="BtnGroup d-block toolbar-row" v-if="tex" style="margin-top: 5px;margin-inline-start: 15px;white-space:nowrap;overflow-x: auto;overflow-y: hidden;">
            <td><IconButton icon="plus" tooltip="加号 +" @click="add4('+','')" /></td>
            <td><IconButton icon="minus" tooltip="减号 -" @click="add4('-','')" /></td>
            <td><IconButton icon="times" tooltip="乘号 ×" @click="add4('\\times','')" /></td>
            <td><IconButton icon="divide" tooltip="除号 ÷" @click="add4('\\div','')" /></td>
            <td><IconButton icon="fraction" tooltip="分数" @click="add4('\\frac{','}{}')" /></td>
            <td><IconButton icon="power" tooltip="上标" @click="add4('^{','}')" /></td>
            <td><IconButton icon="subscript" tooltip="下标" @click="add4('_{','}')" /></td>
            <td><IconButton icon="sqrt" tooltip="根号" @click="add4('\\sqrt{','}')" /></td>
            <td><IconButton icon="vector" tooltip="向量" @click="add4('\\overrightarrow{','}')" /></td>
            <td><IconButton icon="sum" tooltip="求和 Σ" @click="add4('\\sum_{','}^{} {}')" /></td>
            <td><IconButton icon="product" tooltip="求积 Π" @click="add4('\\prod_{','}^{} {}')" /></td>
            <td><IconButton icon="limit" tooltip="极限" @click="add4('\\lim_{x \\to ','}{}')" /></td>
            <td><IconButton icon="integral" tooltip="积分 ∫" @click="add4('\\int_{','}^{} {} dx')" /></td>
            <td><IconButton icon="derivative" tooltip="导数 '" @click="addDerivative" /></td>
            <td><IconButton icon="cases" tooltip="大括号" @click="add4('\\begin{cases}','\\\\\\end{cases}')" /></td>
            <td><IconButton icon="newline" tooltip="换行" @click="add4('\\\\','')" /></td>
        </span>
    </div>
    <div class="Box-row" id="mytextarea" style="margin-inline-start: 15px;margin-inline-end: 15px;">
        <div v-if="!isWysiwygMode">
            <textarea :disabled="mddown||htmldown||pdfdown||jpgdown" style="margin-top: 5px;width: 100%;height: 250px;" class="form-control" v-model="mdtext" ref="input"></textarea>
        </div>
        <div v-else style="margin-top: 5px;">
            <WysiwygEditorTypora 
                v-model="mdtext" 
                @style-state-update="handleStyleStateUpdate"
                ref="wysiwygEditor"
            />
        </div>
    </div>
</div>
<div class="Box Box--blue" v-if="!isWysiwygMode" style="margin-inline-start: 15px;margin-inline-end: 15px;margin-top: 15px;">
    <div class="Box-header">
        <b>预览：</b>
    </div>
    <div class="markdown-body Box-row" id="mdcontent" ref="md">
        <div ref="exportContent" class="export-container" v-html="get_md(mdtext)">
        </div>
    </div>
</div>
</template>

<style lang="scss">
@import "@primer/css/index.scss";
@import "highlight.js/styles/github.css";
@import "katex/dist/katex.css";

html,
body {
    display: block;
    margin: 0px;
    margin-top: 0px;
    margin-right: 0px;
    margin-bottom: 0px;
    margin-left: 0px;
}

.a-upload {
    position: relative;
    cursor: pointer;
    overflow: hidden;
    display: inline-block;
    *display: inline;
    *zoom: 1
}

.a-upload input {
    position: absolute;
    font-size: 100px;
    right: 0;
    top: 0;
    opacity: 0;
    filter: alpha(opacity=0);
    cursor: pointer
}

.a-upload:hover {
    text-decoration: none;
}

.annotation {
    display: none;
}

code {
    white-space: pre-wrap !important;
    word-wrap: break-word !important;
}

#buttons {
    padding: 0px;
}

#mytextarea {
    padding: 5px 16px 16px;
    margin-top: 5px
}

.github-corner:hover .octo-arm {
    animation: octocat-wave 560ms ease-in-out
}

/* 新增：紧凑的提示条样式 */
.compact-flash {
    padding: 8px 16px !important;
    font-size: 14px;
    line-height: 1.2;
}

/* 导出设置布局样式 */
.export-settings {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 5px;
}

.setting-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

@media (max-width:500px) {
    .github-corner:hover .octo-arm {
        animation: none
    }

    .github-corner .octo-arm {
        animation: octocat-wave 560ms ease-in-out
    }

    /* 移动端导出设置布局：分两行显示 */
    .export-settings {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
    }

    .setting-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .setting-group label {
        min-width: 80px;
        flex-shrink: 0;
    }

    .setting-group input[type="text"] {
        flex: 1;
    }

    .setting-group input[type="number"] {
        width: 60px !important;
    }

    .setting-group small {
        font-size: 12px;
    }
}

/* Enhanced mobile responsiveness for toolbar */
@media (max-width: 768px) {
    /* Make toolbar buttons more touch-friendly */
    .BtnGroup {
        display: flex !important;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 8px !important;
    }
    
    .BtnGroup td {
        display: block;
        margin: 0;
    }
    
    /* Reduce margins on mobile */
    #buttons {
        padding: 0px 8px;
    }
    
    #mytextarea {
        padding: 5px 8px 16px;
    }
    
    /* Make editor full width on mobile */
    .wysiwyg-editor {
        font-size: 16px; /* Prevent zoom on iOS */
        line-height: 1.5;
    }
    
    /* Responsive export container */
    .export-container {
        padding: 15px;
    }
}

/* Extra small screens (phones) */
@media (max-width: 480px) {
    /* Collapsible toolbar for very small screens */
    .toolbar-row {
        margin-bottom: 8px;
    }
    
    .toolbar-row:not(.primary-toolbar) {
        display: none;
    }
    
    .toolbar-row.expanded {
        display: block;
    }
    
    /* Larger touch targets */
    .icon-button {
        min-width: 44px !important;
        min-height: 44px !important;
        margin: 2px;
    }
    
    /* Compact layout */
    .Box {
        margin: 10px 8px !important;
    }
    
    .Box-header {
        padding: 12px;
        font-size: 14px;
    }
    
    /* Hide secondary UI elements on very small screens */
    .setting-group small {
        display: none;
    }
    
    /* Optimize editor height */
    .wysiwyg-editor, 
    textarea.form-control {
        min-height: 200px;
        font-size: 16px; /* Prevent zoom */
    }
}

/* Landscape orientation optimization */
@media (max-width: 768px) and (orientation: landscape) {
    .wysiwyg-editor,
    textarea.form-control {
        min-height: 150px;
    }
    
    .toolbar-row {
        margin-bottom: 4px;
    }
}

@keyframes octocat-wave {

    0%,
    100% {
        transform: rotate(0)
    }

    20%,
    60% {
        transform: rotate(-25deg)
    }

    40%,
    80% {
        transform: rotate(10deg)
    }
}

@media (max-width:500px) {
    .github-corner:hover .octo-arm {
        animation: none
    }

    .github-corner .octo-arm {
        animation: octocat-wave 560ms ease-in-out
    }
}
/* 导出专用容器样式 */
.export-container {
    padding: 20px;
    margin: 0;
    background: #ffffff;
    border: none !important;
    box-shadow: none !important;
    min-height: 100px;
}

/* 导出时隐藏不必要的元素 */
.export-mode .Box-header {
    display: none !important;
}

.export-mode .Box {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
}
</style>

<script>
import hljs from 'highlight.js/lib/common';
import MarkdownIt from 'markdown-it';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import FileSaver from 'file-saver';
import taskLists from 'markdown-it-task-lists'
import emoji from 'markdown-it-emoji'
import toc from 'markdown-it-table-of-contents'
import mk from 'markdown-it-texmath'
import katex from 'katex'
import footnote from 'markdown-it-footnote'
import github from './github.css?raw'
import WysiwygEditor from './components/WysiwygEditor.vue'
import WysiwygEditorRefactored from './components/WysiwygEditorRefactored.vue'
import WysiwygEditorFixed from './components/WysiwygEditorFixed.vue'
import WysiwygEditorSimple from './components/WysiwygEditorSimple.vue'
import WysiwygEditorTypora from './components/WysiwygEditorTypora.vue'
import IconButton from './components/IconButton.vue'

export default {
    components: {
        WysiwygEditor,
        WysiwygEditorRefactored,
        WysiwygEditorFixed,
        WysiwygEditorSimple,
        WysiwygEditorTypora,
        IconButton
    },
    data() {
        return {
            mdtext: '',
            filename: '',
            pdfdown: false,
            pngdown: false,
            jpgdown: false,
            mddown: false,
            htmldown: false,
            mdup: false,
            count: 0,
            sum: 1,
            tex:false,
            exportScale: 1.0, // 新增：导出缩放倍率
            originalStyles: null, // 保存原始样式
            autoSaveStatus: '', // 状态提示
            autoSaveTimer: null, // 自动保存定时器
            isInitializing: true, // 新增：标记是否正在初始化
            isWysiwygMode: true, // 新增：标记是否为WYSIWYG模式，默认启用WYSIWYG
            markdownRenderer: null, // 新增：缓存markdown渲染器
            wysiwygStyleStates: {
                bold: false,
                italic: false,
                underline: false,
                code: false,
                strikethrough: false,
                highlight: false
            },
            currentHeadingLevel: 0,
            headingIcons: {
                0: 'heading-1', // 普通文本，显示将变为h1
                1: 'heading-2', // h1，显示将变为h2
                2: 'heading-3', // h2，显示将变为h3
                3: 'heading-4', // h3，显示将变为h4
                4: 'heading-5', // h4，显示将变为h5
                5: 'heading-6', // h5，显示将变为h6
                6: 'heading-1'  // h6，显示将变为h1（循环）
            }
        }
    },
    computed: {
        currentHeadingIcon() {
            return this.headingIcons[this.currentHeadingLevel] || 'heading-1';
        },
        
        boldButtonClass() {
            return this.isWysiwygMode && this.wysiwygStyleStates.bold ? 'btn-primary' : 'btn-invisible';
        },
        
        italicButtonClass() {
            return this.isWysiwygMode && this.wysiwygStyleStates.italic ? 'btn-primary' : 'btn-invisible';
        },
        
        underlineButtonClass() {
            return this.isWysiwygMode && this.wysiwygStyleStates.underline ? 'btn-primary' : 'btn-invisible';
        },
        
        codeButtonClass() {
            return this.isWysiwygMode && this.wysiwygStyleStates.code ? 'btn-primary' : 'btn-invisible';
        },
        
        strikethroughButtonClass() {
            return this.isWysiwygMode && this.wysiwygStyleStates.strikethrough ? 'btn-primary' : 'btn-invisible';
        },
        
        highlightButtonClass() {
            return this.isWysiwygMode && this.wysiwygStyleStates.highlight ? 'btn-primary' : 'btn-invisible';
        }
    },
    created(){
        window.get_filename = this.get_filename;
        // Initialize markdown renderer
        this.initializeMarkdownRenderer();
    },
    // 添加生命周期钩子
    mounted() {
        this.loadFromStorage();
        this.setupAutoSave();
        
        // 初始化完成后，开始监听变化
        this.$nextTick(() => {
            setTimeout(() => {
                this.isInitializing = false;
            }, 500); // 延迟500ms后开始监听变化
        });
    },

    beforeUnmount() {
        // 组件销毁前清除定时器
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
    },

    // 添加侦听器
    watch: {
        // 监听 mdtext 变化，自动保存
        mdtext: {
            handler() {
                // 只在非初始化状态下触发保存
                if (!this.isInitializing) {
                    this.debouncedSave();
                }
            },
            deep: true
        },
        // 监听 filename 变化，自动保存
        filename: {
            handler() {
                // 只在非初始化状态下触发保存
                if (!this.isInitializing) {
                    this.debouncedSave();
                }
            }
        }
    },

    methods: {
        initializeMarkdownRenderer() {
            this.markdownRenderer = MarkdownIt({
                html: true,
                linkify: true,
                breaks: true,
                highlight: function (str, lang) {
                    if (lang && hljs.getLanguage(lang)) {
                        let lines = hljs.highlight(str, {
                            language: lang
                        }).value.split('\n')
                        let result = ''
                        lines.pop()
                        lines.forEach(line => {
                            result += `<li style="margin-top: 0;margin-inline-start: 15px;"><span style="color: #24292f;">${line}</span></li>`
                        })
                        return `<pre class="hljs"><code><ol>${result}</ol></code></pre>`
                    } else {
                        let lines = hljs.highlight(str, {
                            language: 'Plaintext'
                        }).value.split('\n')
                        let result = ''
                        lines.pop()
                        lines.forEach(line => {
                            result += `<li style="margin-top: 0;margin-inline-start: 15px;"><span style="color: #24292f;">${line}</span></li>`
                        })
                        return `<pre class="hljs"><code><ol>${result}</ol></code></pre>`;
                    }
                }
            }).use(taskLists, {
                enabled: true
            }).use(emoji).use(toc).use(footnote).use(mk, {
                engine: katex,
                delimiters: ['dollars','beg_end', 'brackets', 'gitlab'],
                katexOptions: {
                    macros: {
                        "\\RR": "\\mathbb{R}"
                    }
                }
            });
        },
        
        getMarkdownRenderer() {
            return (mds) => this.markdownRenderer.render(mds);
        },

        toggleEditMode() {
            this.isWysiwygMode = !this.isWysiwygMode;
            
            // Focus the appropriate editor after mode switch
            this.$nextTick(() => {
                if (this.isWysiwygMode) {
                    this.$refs.wysiwygEditor?.focus();
                } else {
                    this.$refs.input?.focus();
                }
            });
        },

        getExportContent() {
            // For export functions, always use the preview content regardless of mode
            if (this.isWysiwygMode) {
                // In WYSIWYG mode, use the markdown content to generate HTML for export
                return this.get_md(this.mdtext);
            } else {
                // In normal mode, use the preview content
                return this.get_md(this.mdtext);
            }
        },
        get_filename(){
            return this.filename
        },
        // 修改：从 localStorage 加载数据
        loadFromStorage() {
            try {
                const savedData = localStorage.getItem('markdown-editor-data');
                if (savedData) {
                    const data = JSON.parse(savedData);
                    this.mdtext = data.content || '';
                    this.filename = data.filename || '';
                    
                    if (this.mdtext || this.filename) {
                        this.showSaveStatus('已恢复上次编辑的内容');
                    }
                }
            } catch (error) {
                console.warn('加载本地存储数据失败:', error);
            }
        },

        // 修改：保存到 localStorage（不显示保存提示）
        saveToStorage() {
            try {
                const dataToSave = {
                    content: this.mdtext,
                    filename: this.filename,
                    lastSaved: new Date().toISOString()
                };
                
                localStorage.setItem('markdown-editor-data', JSON.stringify(dataToSave));
                // 移除：不再显示"已自动保存"提示
            } catch (error) {
                console.warn('保存到本地存储失败:', error);
            }
        },

        // 修改：防抖保存（避免频繁保存）
        debouncedSave() {
            if (this.autoSaveTimer) {
                clearTimeout(this.autoSaveTimer);
            }
            
            this.autoSaveTimer = setTimeout(() => {
                this.saveToStorage();
            }, 1000); // 1秒后保存
        },

        // 设置自动保存
        setupAutoSave() {
            // 页面失去焦点时保存
            window.addEventListener('beforeunload', () => {
                this.saveToStorage();
            });

            // 页面可见性变化时保存
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.saveToStorage();
                }
            });
        },

        // 修改：显示状态提示（只用于加载提示）
        showSaveStatus(message) {
            this.autoSaveStatus = message;
            
            // 3秒后清除状态提示
            setTimeout(() => {
                this.autoSaveStatus = '';
            }, 3000);
        },

        // 修改：清除所有内容（替换清除存储功能）
        clearAllContent() {
            if (confirm('确定要清除所有内容吗？这将清空文件名和Markdown内容。')) {
                this.mdtext = '';
                this.filename = '';
                // 清除内容后会自动保存空内容
            }
        },
        setA4Width() {
            // Get export content element - either visible preview or create a temporary one
            let exportElement = this.$refs.exportContent;
            
            if (this.isWysiwygMode && !exportElement) {
                // In WYSIWYG mode, create a temporary export element
                const tempDiv = document.createElement('div');
                tempDiv.className = 'export-container';
                tempDiv.innerHTML = this.getExportContent();
                document.body.appendChild(tempDiv);
                exportElement = tempDiv;
                this._tempExportElement = tempDiv;
            }
            
            // Also get the visible content element for preview
            const contentElement = this.$refs.md || exportElement;
            const A4_WIDTH_PX = 794;
            
            // Save original styles
            this.originalStyles = {
                md: contentElement ? {
                    width: contentElement.style.width,
                    maxWidth: contentElement.style.maxWidth,
                    margin: contentElement.style.margin,
                    padding: contentElement.style.padding
                } : {},
                export: {
                    width: exportElement.style.width,
                    maxWidth: exportElement.style.maxWidth,
                    margin: exportElement.style.margin,
                    padding: exportElement.style.padding
                }
            };
            
            // Set export container style
            exportElement.style.width = `${A4_WIDTH_PX * this.exportScale}px`;
            exportElement.style.maxWidth = `${A4_WIDTH_PX * this.exportScale}px`;
            exportElement.style.margin = '0 auto';
            exportElement.style.padding = '20px';
            
            // Set preview container style (if visible)
            if (contentElement && contentElement !== exportElement) {
                contentElement.style.width = `${A4_WIDTH_PX * this.exportScale}px`;
                contentElement.style.maxWidth = `${A4_WIDTH_PX * this.exportScale}px`;
                contentElement.style.margin = '0 auto';
                contentElement.style.padding = '20px';
            }
            
            // Force layout
            exportElement.offsetHeight;
            if (contentElement && contentElement !== exportElement) {
                contentElement.offsetHeight;
            }
        },

        restoreOriginalWidth() {
            if (!this.originalStyles) return;
            
            const contentElement = this.$refs.md;
            const exportElement = this.$refs.exportContent || this._tempExportElement;
            
            // Restore preview container styles
            if (contentElement && this.originalStyles.md) {
                contentElement.style.width = this.originalStyles.md.width;
                contentElement.style.maxWidth = this.originalStyles.md.maxWidth;
                contentElement.style.margin = this.originalStyles.md.margin;
                contentElement.style.padding = this.originalStyles.md.padding;
            }
            
            // Restore export container styles
            if (exportElement && this.originalStyles.export) {
                exportElement.style.width = this.originalStyles.export.width;
                exportElement.style.maxWidth = this.originalStyles.export.maxWidth;
                exportElement.style.margin = this.originalStyles.export.margin;
                exportElement.style.padding = this.originalStyles.export.padding;
            }
            
            // Clean up temporary element
            if (this._tempExportElement) {
                document.body.removeChild(this._tempExportElement);
                this._tempExportElement = null;
            }
            
            this.originalStyles = null;
        },

        // 全新的智能分页算法
        getOptimalPageBreaks(contentElement, maxPageHeight, targetScale = 2) {
            const maxCanvasSize = 16000;
            const maxAllowedHeight = Math.floor(maxCanvasSize / targetScale);
            
            console.log(`智能分页开始: maxPageHeight=${maxPageHeight}, maxAllowedHeight=${maxAllowedHeight}`);
            
            // 核心修复：优先使用理想页面高度，而不是canvas限制高度
            const targetPageHeight = Math.min(maxPageHeight, maxAllowedHeight);
            
            // 如果理想页面高度远小于canvas限制，直接使用理想高度进行智能分页
            if (maxPageHeight <= maxAllowedHeight * 0.5) {
                console.log('使用理想页面高度进行智能分页');
                return this.getSmartPageBreaks(contentElement, maxPageHeight);
            }
            
            // 如果理想页面高度接近或超出canvas限制，才使用canvas限制高度
            console.log('使用canvas限制高度进行智能分页');
            return this.getSmartPageBreaks(contentElement, targetPageHeight);
        },

        // 新的智能分页方法 - 基于正确的页面高度
        getSmartPageBreaks(contentElement, targetPageHeight) {
            const breaks = [0];
            let currentY = 0;
            
            // 获取所有安全的分页点
            const safeBreakPoints = this.getAllSafeBreakPoints(contentElement);
            console.log(`找到 ${safeBreakPoints.length} 个安全分页点，目标页面高度: ${targetPageHeight}`);
            
            while (currentY < contentElement.scrollHeight) {
                const idealNextY = currentY + targetPageHeight;
                
                // 如果剩余内容不足一页，直接结束
                if (idealNextY >= contentElement.scrollHeight) {
                    breaks.push(contentElement.scrollHeight);
                    break;
                }
                
                // 在理想位置附近寻找最佳分页点
                const searchRange = targetPageHeight * 0.15; // 允许15%的偏差
                const bestBreakPoint = this.findBestBreakPointInRange(
                    safeBreakPoints, 
                    idealNextY - searchRange, 
                    idealNextY + searchRange,
                    currentY
                );
                
                if (bestBreakPoint > currentY) {
                    breaks.push(bestBreakPoint);
                    currentY = bestBreakPoint;
                    console.log(`添加分页点: ${bestBreakPoint}, 页面高度: ${bestBreakPoint - breaks[breaks.length - 2]}`);
                } else {
                    // 如果找不到合适的分页点，使用理想位置
                    breaks.push(idealNextY);
                    currentY = idealNextY;
                    console.log(`使用理想分页点: ${idealNextY}, 页面高度: ${targetPageHeight}`);
                }
            }
            
            console.log(`智能分页完成，总页数: ${breaks.length - 1}`);
            return breaks;
        },
        findBestBreakPointInRange(breakPoints, minY, maxY, currentY) {
            let bestPoint = -1;
            let bestScore = -1;
            
            for (const point of breakPoints) {
                if (point <= currentY || point < minY || point > maxY) {
                    continue;
                }
                
                // 评分系统：越接近理想位置得分越高
                const idealY = (minY + maxY) / 2;
                const distance = Math.abs(point - idealY);
                const maxDistance = Math.abs(maxY - minY) / 2;
                const score = 1 - (distance / maxDistance);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestPoint = point;
                }
            }
            
            return bestPoint;
        },
        

        // 获取所有安全的分页点
        getAllSafeBreakPoints(contentElement) {
            const breakPoints = new Set([0]);
            
            // 1. 添加块级元素边界
            this.addBlockElementBreaks(contentElement, breakPoints);
            
            // 2. 添加文本行边界
            this.addTextLineBreaks(contentElement, breakPoints);
            
            // 3. 添加代码行边界
            this.addCodeLineBreaks(contentElement, breakPoints);
            
            // 4. 添加表格行边界
            this.addTableRowBreaks(contentElement, breakPoints);
            
            // 转换为排序数组
            const sortedBreaks = Array.from(breakPoints).sort((a, b) => a - b);
            console.log(`总共收集到 ${sortedBreaks.length} 个分页点`);
            
            return sortedBreaks;
        },

        // 添加块级元素边界
        addBlockElementBreaks(contentElement, breakPoints) {
            const blockElements = contentElement.querySelectorAll(
                'h1, h2, h3, h4, h5, h6, p, pre, blockquote, div, hr, table, ul, ol'
            );
            
            blockElements.forEach(element => {
                // 跳过嵌套在代码块中的元素
                if (element.closest('pre.hljs') && element.tagName !== 'PRE') {
                    return;
                }
                
                const rect = element.getBoundingClientRect();
                const containerRect = contentElement.getBoundingClientRect();
                const relativeTop = rect.top - containerRect.top + contentElement.scrollTop;
                const relativeBottom = relativeTop + rect.height;
                
                breakPoints.add(Math.floor(relativeTop));
                breakPoints.add(Math.floor(relativeBottom));
            });
            
            console.log(`添加了块级元素边界，当前分页点数: ${breakPoints.size}`);
        },

        // 添加文本行边界（使用Range API检测真实的文本行）
        addTextLineBreaks(contentElement, breakPoints) {
            const textElements = contentElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
            
            textElements.forEach(element => {
                // 跳过代码块中的元素
                if (element.closest('pre.hljs')) {
                    return;
                }
                
                const textLines = this.getTextLines(element, contentElement);
                textLines.forEach(lineY => {
                    breakPoints.add(Math.floor(lineY));
                });
            });
            
            console.log(`添加了文本行边界，当前分页点数: ${breakPoints.size}`);
        },

        // 获取元素中的文本行位置
        getTextLines(element, contentElement) {
            const lines = [];
            const text = element.textContent;
            
            if (!text || text.trim().length === 0) {
                return lines;
            }
            
            try {
                const range = document.createRange();
                const containerRect = contentElement.getBoundingClientRect();
                
                // 逐字符扫描来检测换行
                let lastTop = null;
                let currentLineStart = 0;
                
                for (let i = 0; i <= text.length; i++) {
                    try {
                        range.setStart(element.firstChild || element, Math.min(i, text.length));
                        range.setEnd(element.firstChild || element, Math.min(i, text.length));
                        
                        const rect = range.getBoundingClientRect();
                        if (rect.height === 0) continue;
                        
                        const currentTop = rect.top - containerRect.top + contentElement.scrollTop;
                        
                        if (lastTop !== null && Math.abs(currentTop - lastTop) > 5) {
                            // 检测到换行
                            lines.push(lastTop);
                            currentLineStart = i;
                        }
                        
                        lastTop = currentTop;
                    } catch (e) {
                        // 忽略Range错误，继续处理
                        continue;
                    }
                }
                
                // 添加最后一行
                if (lastTop !== null) {
                    lines.push(lastTop);
                }
                
            } catch (error) {
                console.warn('文本行检测失败:', error);
                // 回退到元素边界
                const rect = element.getBoundingClientRect();
                const containerRect = contentElement.getBoundingClientRect();
                const relativeTop = rect.top - containerRect.top + contentElement.scrollTop;
                lines.push(relativeTop);
            }
            
            return lines;
        },

        // 添加代码行边界
        addCodeLineBreaks(contentElement, breakPoints) {
            const codeBlocks = contentElement.querySelectorAll('pre.hljs');
            
            codeBlocks.forEach(codeBlock => {
                const codeList = codeBlock.querySelector('ol');
                if (codeList) {
                    const codeLines = codeList.querySelectorAll('li');
                    const containerRect = contentElement.getBoundingClientRect();
                    
                    codeLines.forEach(line => {
                        const rect = line.getBoundingClientRect();
                        const relativeTop = rect.top - containerRect.top + contentElement.scrollTop;
                        const relativeBottom = relativeTop + rect.height;
                        
                        breakPoints.add(Math.floor(relativeTop));
                        breakPoints.add(Math.floor(relativeBottom));
                    });
                }
            });
            
            console.log(`添加了代码行边界，当前分页点数: ${breakPoints.size}`);
        },

        // 添加表格行边界
        addTableRowBreaks(contentElement, breakPoints) {
            const tables = contentElement.querySelectorAll('table');
            
            tables.forEach(table => {
                const rows = table.querySelectorAll('tr');
                const containerRect = contentElement.getBoundingClientRect();
                
                rows.forEach(row => {
                    const rect = row.getBoundingClientRect();
                    const relativeTop = rect.top - containerRect.top + contentElement.scrollTop;
                    const relativeBottom = relativeTop + rect.height;
                    
                    breakPoints.add(Math.floor(relativeTop));
                    breakPoints.add(Math.floor(relativeBottom));
                });
            });
            
            console.log(`添加了表格行边界，当前分页点数: ${breakPoints.size}`);
        },

        // 寻找合适的分页点
        findSuitableBreakPoint(breakPoints, minY, maxY, currentIndex) {
            let bestBreakPoint = minY;
            
            // 从当前位置向前寻找合适的分页点
            for (let i = currentIndex - 1; i >= 0; i--) {
                const breakPoint = breakPoints[i];
                
                if (breakPoint < minY) {
                    break;
                }
                
                if (breakPoint <= maxY) {
                    bestBreakPoint = breakPoint;
                    break;
                }
            }
            
            return bestBreakPoint;
        },

        // Export functionality improvements for WYSIWYG mode
        async to_pdf(length = 20) {
            const wasWysiwygMode = this.isWysiwygMode;
            
            try {
                // Switch to normal mode for export if in WYSIWYG mode
                if (wasWysiwygMode) {
                    this.isWysiwygMode = false;
                    await this.$nextTick();
                    // Wait for mode switch to complete
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                this.pdfdown = true;
                this.count = 0;
                
                // Set A4 width and wait for layout to stabilize
                this.setA4Width();
                await new Promise(resolve => setTimeout(resolve, 800));
                
                const pdf = new jsPDF('', 'pt', 'a4');
                const pageWidth = 595.28;
                const pageHeight = 841.89;
                const margin = length;
                
                // Get the proper export element (either existing or temporary)
                const contentElement = this.$refs.exportContent || this._tempExportElement;
                const contentWidth = contentElement.scrollWidth;
                const pdfContentWidth = pageWidth - margin * 2;
                const widthRatio = pdfContentWidth / contentWidth;
                const idealPageHeightInPixels = (pageHeight - margin * 2) / widthRatio;
                
                console.log('=== PDF导出开始 ===');
                console.log(`内容尺寸: ${contentWidth} x ${contentElement.scrollHeight}`);
                console.log(`理想页面像素高度: ${idealPageHeightInPixels}`);
                
                // Use improved smart pagination algorithm
                const targetScale = 2.5;
                const breakPoints = this.getOptimalPageBreaks(contentElement, idealPageHeightInPixels, targetScale);
                this.sum = breakPoints.length - 1;
                
                // Pre-calculate the safest scale for all pages
                const maxCanvasSize = 17000;
                let globalScale = targetScale;
                
                for (let i = 0; i < breakPoints.length - 1; i++) {
                    const currentPageHeight = breakPoints[i + 1] - breakPoints[i];
                    
                    // Check canvas limits for each page
                    const maxScaleForWidth = maxCanvasSize / contentWidth;
                    const maxScaleForHeight = maxCanvasSize / currentPageHeight;
                    const maxSafeScale = Math.min(maxScaleForWidth, maxScaleForHeight) * 0.95;
                    
                    if (maxSafeScale < globalScale) {
                        globalScale = maxSafeScale;
                        console.log(`调整全局缩放比例为: ${globalScale} (因第${i + 1}页高度: ${currentPageHeight})`);
                    }
                }
                
                console.log(`最终使用全局缩放比例: ${globalScale}`);
                console.log(`智能分页完成，共${this.sum}页`);
                
                // Render each page
                for (let i = 0; i < breakPoints.length - 1; i++) {
                    const startY = breakPoints[i];
                    const endY = breakPoints[i + 1];
                    const currentPageHeight = endY - startY;
                    
                    console.log(`第${i + 1}页: ${startY} - ${endY} (高度: ${currentPageHeight})`);
                    
                    try {
                        const canvas = await html2canvas(contentElement, {
                            logging: false,
                            scale: globalScale,
                            width: contentWidth,
                            height: currentPageHeight,
                            x: 0,
                            y: startY,
                            useCORS: true,
                            allowTaint: true,
                            backgroundColor: '#ffffff'
                        });
                        
                        const imgData = canvas.toDataURL('image/jpeg', 1.0);
                        const pdfImageWidth = pdfContentWidth;
                        const pdfImageHeight = (canvas.height / canvas.width) * pdfImageWidth;
                        
                        if (i > 0) {
                            pdf.addPage();
                        }
                        
                        // Ensure image fits completely within PDF page
                        const maxPdfImageHeight = pageHeight - margin * 2;
                        const finalImageHeight = Math.min(pdfImageHeight, maxPdfImageHeight);
                        
                        pdf.addImage(
                            imgData, 'JPEG',
                            margin, margin,
                            pdfImageWidth, finalImageHeight
                        );
                        
                        this.count = i + 1;
                        console.log(`第${i + 1}页渲染成功，实际高度: ${finalImageHeight}px`);
                        
                    } catch (error) {
                        console.error(`渲染第${i + 1}页失败:`, error);
                        
                        if (i > 0) {
                            pdf.addPage();
                        }
                        pdf.setFontSize(12);
                        pdf.text(`第${i + 1}页渲染失败: ${error.message}`, margin, margin + 20);
                    }
                }
                
                const blob = pdf.output('blob');
                const finalBlob = blob.slice(0, blob.size, 'application/octet-stream');
                FileSaver.saveAs(finalBlob, (this.filename || 'undefined') + '.pdf');
                
                console.log('=== PDF导出完成 ===');
                
            } finally {
                this.restoreOriginalWidth();
                this.pdfdown = false;
                
                // Restore WYSIWYG mode if it was originally enabled
                if (wasWysiwygMode) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    this.isWysiwygMode = true;
                    await this.$nextTick();
                    this.$refs.wysiwygEditor?.focus();
                }
            }
        },

        async to_png() {
            const wasWysiwygMode = this.isWysiwygMode;
            
            try {
                // Switch to normal mode for export if in WYSIWYG mode
                if (wasWysiwygMode) {
                    this.isWysiwygMode = false;
                    await this.$nextTick();
                    // Wait for mode switch to complete
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                this.pngdown = true;
                
                // Set A4 width
                this.setA4Width();
                
                // Wait for layout to stabilize
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Get the proper export element (either existing or temporary)
                const contentElement = this.$refs.exportContent || this._tempExportElement;
                
                const canvas = await html2canvas(contentElement, {
                    scale: 2.5,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff'
                });
                
                const blob = canvas.toDataURL('image/png', 1.0);
                FileSaver.saveAs(blob, (this.filename || 'undefined') + '.png');
                
            } finally {
                this.restoreOriginalWidth();
                this.pngdown = false;
                
                // Restore WYSIWYG mode if it was originally enabled
                if (wasWysiwygMode) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    this.isWysiwygMode = true;
                    await this.$nextTick();
                    this.$refs.wysiwygEditor?.focus();
                }
            }
        },

        async renderOversizedPage(contentElement, startY, pageHeight, pdf, margin, pdfContentWidth, needNewPage, contentWidth) {
            const maxCanvasSize = 16000;
            const minScale = 0.5;
            
            const fragmentHeight = Math.floor(maxCanvasSize / minScale / 2);
            const fragments = Math.ceil(pageHeight / fragmentHeight);
            
            for (let i = 0; i < fragments; i++) {
                const fragmentStartY = startY + i * fragmentHeight;
                const fragmentEndY = Math.min(fragmentStartY + fragmentHeight, startY + pageHeight);
                const currentFragmentHeight = fragmentEndY - fragmentStartY;
                
                if (needNewPage || i > 0) {
                    pdf.addPage();
                }
                needNewPage = true;
                
                try {
                    const canvas = await html2canvas(contentElement, {
                        logging: false,
                        scale: minScale,
                        width: contentWidth,
                        height: currentFragmentHeight,
                        x: 0,
                        y: fragmentStartY,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff'
                    });
                    
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    const pdfImageWidth = pdfContentWidth;
                    const pdfImageHeight = (canvas.height / canvas.width) * pdfImageWidth;
                    
                    pdf.addImage(
                        imgData, 'JPEG',
                        margin, 0,
                        pdfImageWidth, Math.min(pdfImageHeight, 841.89)
                    );
                    
                } catch (error) {
                    console.error(`Error rendering fragment ${i + 1}:`, error);
                    pdf.setFontSize(12);
                    pdf.text(`Error rendering content fragment ${i + 1}`, margin, 50);
                }
            }
        },
        to_md() {
            this.mddown = true
            var blob = new Blob([this.mdtext])
            FileSaver.saveAs(blob, (this.filename || 'undefined') + '.md')
            this.mddown = false

        },
        to_html() {
            this.htmldown = true
            var blob = new Blob(['<head>\n<link href=\"https://unpkg.com/@primer/css@^20.2.4/dist/primer.css\" rel=\"stylesheet\" />\n<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css\" integrity=\"sha384-Xi8rHCmBmhbuyyhbI88391ZKP2dmfnOl4rT9ZfRI7mLTdk1wblIUnrIq35nqwEvC\" crossorigin=\"anonymous\">\n<style type="text/css">\n' + github + '\n</style>\n</head>\n<div class=\"markdown-body\">\n' + this.get_md(this.mdtext) + '\n</div>'])
            FileSaver.saveAs(blob, (this.filename || 'undefined') + '.html')
            this.htmldown = false
        },
        up_md() {
            this.mdup = true

            var reader = new FileReader();
            reader.readAsText(this.$refs.mdfile.files[0])
            reader.onload = () => {
                this.mdtext = reader.result;
                this.filename = this.$refs.mdfile.files[0]['name'].slice(0, this.$refs.mdfile.files[0]['name'].lastIndexOf("."));
            };

            this.mdup = false
        },
        get_md(mds) {
            const md = MarkdownIt({
                html: true,
                linkify: true,
                breaks: true,
                highlight: function (str, lang) {
                    if (lang && hljs.getLanguage(lang)) {
                        //console.log(1)
                        let lines = hljs.highlight(str, {
                            language: lang
                        }).value.split('\n')
                        let result = ''
                        lines.pop()
                        lines.forEach(line => {
                            result += `<li style="margin-top: 0;margin-inline-start: 15px;"><span style="color: #24292f;">${line}</span></li>`
                        })
                        return `<pre class="hljs"><code><ol>${result}</ol></code></pre>`

                    } else {
                        //console.log(2)
                        let lines = hljs.highlight(str, {
                            language: 'Plaintext'
                        }).value.split('\n')
                        let result = ''
                        lines.pop()
                        lines.forEach(line => {
                            result += `<li style="margin-top: 0;margin-inline-start: 15px;"><span style="color: #24292f;">${line}</span></li>`
                        })
                        return `<pre class="hljs"><code><ol>${result}</ol></code></pre>`; // use external default escaping
                    }
                }
            }).use(taskLists, {
                enabled: true
            }).use(emoji).use(toc).use(footnote).use(mk, {
                engine: katex,
                delimiters: ['dollars','beg_end', 'brackets', 'gitlab'],
                katexOptions: {
                    macros: {
                        "\\RR": "\\mathbb{R}"
                    }
                }
            });
            const content = md.render(mds)
            return content
        },
        add1(str1) {
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertMarkdown(str1 + str1);
                return;
            }
            
            const oldlocs = this.$refs.input.selectionStart
            const oldloc = this.$refs.input.selectionEnd
            this.mdtext = this.mdtext.slice(0, this.$refs.input.selectionStart) + str1 + this.mdtext.slice(this.$refs.input.selectionStart, this.$refs.input.selectionEnd) + str1 + this.mdtext.slice(this.$refs.input.selectionEnd)
            this.$refs.input.focus();
            this.$nextTick(() => {
                this.$refs.input.selectionStart = oldlocs + str1.length
                this.$refs.input.selectionEnd = oldloc + str1.length
            })
        },
        add2(str1) {
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertMarkdown(str1);
                return;
            }
            
            const oldlocs = this.$refs.input.selectionStart
            const oldloc = this.$refs.input.selectionEnd
            var start = this.current_line()[0]
            var end = this.current_line()[1]
            if (this.mdtext.slice(start, start + str1.length) == str1) {
                this.mdtext = this.mdtext.slice(0, start) + this.mdtext.slice(start + str1.length)
                var enter = -str1.length
            } else {
                this.mdtext = this.mdtext.slice(0, start) + str1 + this.mdtext.slice(start)
                var enter = str1.length
            }
            this.$refs.input.focus();
            this.$nextTick(() => {
                this.$refs.input.selectionStart = oldlocs + enter
                this.$refs.input.selectionEnd = oldloc + enter
            })
        },
        add3(str1) {
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertMarkdown('\n' + str1 + '\n');
                return;
            }
            
            const oldlocs = this.$refs.input.selectionStart
            const oldloc = this.$refs.input.selectionEnd
            var start = this.current_line()[0]
            var end = this.current_line()[1]
            //console.log(end,end-start)
            this.mdtext = this.mdtext.slice(0, end + start) + '\n' + str1 + '\n' + this.mdtext.slice(end + start)
            this.$refs.input.focus();
            this.$nextTick(() => {
                this.$refs.input.selectionStart = end + start + str1.length + 2
                this.$refs.input.selectionEnd = end + start + str1.length + 2
            })
        },
        add4(str1, str2) {
            // Ensure editor focus before executing
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.add4(str1, str2), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertMarkdown(str1 + str2);
                return;
            }
            
            const oldlocs = this.$refs.input.selectionStart
            const oldloc = this.$refs.input.selectionEnd
            this.mdtext = this.mdtext.slice(0, this.$refs.input.selectionStart) + str1 + this.mdtext.slice(this.$refs.input.selectionStart, this.$refs.input.selectionEnd) + str2 + this.mdtext.slice(this.$refs.input.selectionEnd)
            this.$refs.input.focus();
            this.$nextTick(() => {
                this.$refs.input.selectionStart = oldlocs + str1.length
                this.$refs.input.selectionEnd = oldloc + str1.length
            })
        },
        opentex() {
            this.tex = true
        },
        closetex() {
            this.tex = false
        },
        title() {
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.toggleHeading();
                return;
            }
            
            const oldlocs = this.$refs.input.selectionStart
            const oldloc = this.$refs.input.selectionEnd
            var start = this.current_line()[0]
            var end = this.current_line()[1]
            if (this.mdtext.slice(start, start + 7) == '###### ') {
                this.mdtext = this.mdtext.slice(0, start) + this.mdtext.slice(start + 7)
                var enter = -7
            } else {
                if (this.mdtext.slice(start, start + 1) == '#') {
                    this.mdtext = this.mdtext.slice(0, start) + '#' + this.mdtext.slice(start)
                    var enter = 1
                } else {
                    this.mdtext = this.mdtext.slice(0, start) + '# ' + this.mdtext.slice(start)
                    var enter = 2
                }
            }
            
            this.$refs.input.focus();
            this.$nextTick(() => {
                this.$refs.input.selectionStart = oldlocs + enter
                this.$refs.input.selectionEnd = oldloc + enter
            })
        },
        current_line() {
            var pos = this.$refs.input.selectionStart
            var taval = this.mdtext
            var start = taval.lastIndexOf('\n', pos - 1) + 1
            var end = taval.indexOf('\n', pos);
            if (pos == 0) {
                start = 0
                if (this.mdtext.split('\n' [0].length == 0)) {
                    end = 0
                }
            }
            if (end == -1) {
                end = taval.length;
            }
            return [start, end - start];
        },
        blob_download(blob, filename) {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = (e) => {
                const link = document.createElement('a')
                const body = document.querySelector('body')

                link.href = e.target.result
                link.download = filename
                link.style.display = 'none'
                body.appendChild(link)

                link.click()
                body.removeChild(link)
            }
        },

        addDerivative() {
            this.add4("'", "");
        },

        // Handle WYSIWYG style state updates
        handleStyleStateUpdate(data) {
            this.wysiwygStyleStates = data.styles;
            this.currentHeadingLevel = data.headingLevel;
        },

        // Helper method to ensure editor focus before executing commands
        ensureEditorFocus() {
            // Check if focus is on markdown editor
            const activeElement = document.activeElement;
            
            if (this.isWysiwygMode) {
                const wysiwygEditor = this.$refs.wysiwygEditor?.$refs.editor;
                if (activeElement !== wysiwygEditor) {
                    // Auto-focus the WYSIWYG editor
                    this.$refs.wysiwygEditor?.focus();
                    return false; // Indicate focus was changed
                }
            } else {
                const textareaEditor = this.$refs.input;
                if (activeElement !== textareaEditor) {
                    // Auto-focus the textarea editor
                    textareaEditor?.focus();
                    return false; // Indicate focus was changed
                }
            }
            
            return true; // Focus is already on editor
        },

        // Unified toolbar handlers that work in both modes with focus management
        handleHeading() {
            if (!this.ensureEditorFocus()) {
                // Focus was changed, retry after a short delay
                this.$nextTick(() => {
                    setTimeout(() => this.handleHeading(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.toggleHeading();
            } else {
                this.title();
            }
        },

        handleBold() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleBold(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.toggleBold();
            } else {
                this.add1('**');
            }
        },

        handleItalic() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleItalic(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.toggleItalic();
            } else {
                this.add1('*');
            }
        },

        handleUnderline() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleUnderline(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.toggleUnderline();
            } else {
                this.add4('<u>', '</u>');
            }
        },

        handleStrikethrough() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleStrikethrough(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.toggleStrikethrough();
            } else {
                this.add1('~~');
            }
        },

        handleCode() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleCode(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.toggleCode();
            } else {
                this.add1('`');
            }
        },

        handleCodeBlock() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleCodeBlock(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertCodeBlock();
            } else {
                this.add1('\n```\n');
            }
        },
        
        handleCodeLanguage() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleCodeLanguage(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.showCodeBlockLanguageSelector();
            } else {
                // In normal mode, just show a hint
                alert('请切换到WYSIWYG模式使用代码语言选择功能，或手动在代码块第一行添加语言标识，如: ```javascript');
            }
        },

        handleQuote() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleQuote(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertBlockQuote();
            } else {
                this.add2('> ');
            }
        },

        handleList() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleList(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertUnorderedList();
            } else {
                this.add2('- ');
            }
        },

        handleTaskList() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleTaskList(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertTaskList();
            } else {
                this.add2('- [ ] ');
            }
        },

        handleImage() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleImage(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertImage();
            } else {
                this.add4('![](', ')');
            }
        },

        handleHR() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleHR(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertHorizontalRule();
            } else {
                this.add3('------');
            }
        },

        handleTOC() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleTOC(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertTOC();
            } else {
                this.add3('[[TOC]]');
            }
        },

        handleMath() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleMath(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertMathInline();
            } else {
                this.add4(' $', '$ ');
            }
        },

        handleColorText(color) {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleColorText(color), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertColorText(color);
            } else {
                this.add4(`<font color="${color}">`, '</font>');
            }
        },

        handleHighlight() {
            if (!this.ensureEditorFocus()) {
                this.$nextTick(() => {
                    setTimeout(() => this.handleHighlight(), 50);
                });
                return;
            }
            
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.toggleHighlight();
            } else {
                this.add4('<mark>', '</mark>');
            }
        },

        // Export functionality improvements for WYSIWYG mode
        async exportContent(type) {
            const originalMode = this.isWysiwygMode;
            
            try {
                if (originalMode) {
                    // Temporarily switch to normal mode for export
                    this.isWysiwygMode = false;
                    await this.$nextTick();
                }
                
                // Execute the appropriate export function
                switch (type) {
                    case 'pdf':
                        await this.to_pdf();
                        break;
                    case 'png':
                        await this.to_png();
                        break;
                    case 'html':
                        this.to_html();
                        break;
                    case 'md':
                        this.to_md();
                        break;
                }
            } finally {
                if (originalMode) {
                    // Restore WYSIWYG mode
                    this.isWysiwygMode = true;
                    await this.$nextTick();
                    this.$refs.wysiwygEditor?.focus();
                }
            }
        },
    },
}
</script>
