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
        <b>编辑设置：</b>
        <div class="export-settings">
            <div class="setting-group">
                <label>编辑模式：</label>
                <button 
                  class="btn btn-sm" 
                  :class="isWysiwygMode ? 'btn-primary' : 'btn-outline'"
                  @click="toggleEditingMode"
                >
                  {{ isWysiwygMode ? 'WYSIWYG模式' : '传统模式' }}
                </button>
            </div>
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
        <span class="BtnGroup d-block" style="margin-top: 5px;margin-inline-start: 15px;white-space:nowrap;overflow-x: auto;overflow-y: hidden;">
            <td><IconButton :icon="getHeadingIcon()" :tooltip="getHeadingTooltip()" :isActive="buttonStates.heading > 0" @click="title()" /></td>
            <td><IconButton icon="code" tooltip="代码块" @click="add1('\n\`\`\`\n')" /></td>
            <td><IconButton icon="code" tooltip="单行代码" :isActive="buttonStates.code" @click="add1('\`')" /></td>
            <td><IconButton icon="image" tooltip="图片" @click="add4('![](',')')" /></td>
            <td><IconButton icon="quote" tooltip="引用" @click="add2('> ')" /></td>
            <td><IconButton icon="list" tooltip="无序列表" @click="add2('- ')" /></td>
            <td><IconButton icon="check" tooltip="任务列表" @click="add2('- [ ] ')" /></td>
            <td><IconButton icon="hash" tooltip="目录" @click="add3('[[TOC]]')" /></td>
            <td><IconButton icon="minus" tooltip="分割线" @click="add3('------')" /></td>
            <td><IconButton icon="function" tooltip="Tex公式" @click="add4(' $','$ ')" /></td>
            <td><IconButton :icon="tex ? 'eye-off' : 'eye'" :tooltip="tex ? '隐藏Tex工具箱' : '显示Tex工具箱'" @click="toggleTex()" /></td>
        </span>
        <span class="BtnGroup d-block" style="margin-top: 5px;margin-inline-start: 15px;white-space:nowrap;overflow-x: auto;overflow-y: hidden;">
            <td><IconButton icon="bold" tooltip="粗体 (Ctrl+B)" :isActive="buttonStates.bold" @click="add1('**')" /></td>
            <td><IconButton icon="italic" tooltip="斜体 (Ctrl+I)" :isActive="buttonStates.italic" @click="add1('*')" /></td>
            <td><IconButton icon="underline" tooltip="下划线" :isActive="buttonStates.underline" @click="add4('<u>','</u>')" /></td>
            <td><IconButton icon="paint" tooltip="标红" @click="add4('<font color=\x22red\x22>','</font>')" /></td>
            <td><IconButton icon="highlight" tooltip="高亮" @click="add4('<mark>','</mark>')" /></td>
            <td><IconButton icon="strikethrough" tooltip="删除线" :isActive="buttonStates.strikethrough" @click="add1('~~')" /></td>
        </span>
        <span class="BtnGroup d-block toolbar-row" v-if="tex" style="margin-top: 5px;margin-inline-start: 15px;white-space:nowrap;overflow-x: auto;overflow-y: hidden;">
            <td><IconButton icon="plus" tooltip="加号" @click="add4('+','')" /></td>
            <td><IconButton icon="minus" tooltip="减号" @click="add4('-','')" /></td>
            <td><IconButton icon="times" tooltip="点乘" @click="add4('\\cdot','')" /></td>
            <td><IconButton icon="times" tooltip="叉乘" @click="add4('\\times','')" /></td>
            <td><IconButton icon="divide" tooltip="除法" @click="add4('\\div','')" /></td>
            <td><IconButton icon="cases" tooltip="换行" @click="add4('\\\\','')" /></td>
            <td><IconButton icon="fraction" tooltip="分数" @click="add4('\\frac{','}{}}')" /></td>
            <td><IconButton icon="power" tooltip="上标" @click="add4('^{','}')" /></td>
            <td><IconButton icon="subscript" tooltip="下标" @click="add4('_{','}')" /></td>
            <td><IconButton icon="sqrt" tooltip="根号" @click="add4('\\sqrt[]{','}')" /></td>
            <td><IconButton icon="vector" tooltip="向量" @click="add4('\\overrightarrow{','}')" /></td>
            <td><IconButton icon="arc" tooltip="弧" @click="add4('\\overset{\\frown}{','}')" /></td>
            <td><IconButton icon="derivative" tooltip="导数" @click="addDerivative" /></td>
            <td><IconButton icon="sum" tooltip="求和" @click="add4('\\sum_{','}^{} {}')" /></td>
            <td><IconButton icon="product" tooltip="求积" @click="add4('\\prod_{','}^{} {}')" /></td>
            <td><IconButton icon="limit" tooltip="极限" @click="add4('\\lim_{n \\to \\infty}{','}')" /></td>
            <td><IconButton icon="integral" tooltip="积分" @click="add4('\\int_{}^{} {','}\\, dx')" /></td>
            <td><IconButton icon="cases" tooltip="大括号" @click="add4('\\begin{cases}line1','\\\\line2\\end{cases}')" /></td>
        </span>
    </div>
    <div class="Box-row" id="mytextarea" style="margin-inline-start: 15px;margin-inline-end: 15px;">
        <div v-if="!isWysiwygMode">
            <textarea :disabled="mddown||htmldown||pdfdown||jpgdown" style="margin-top: 5px;width: 100%;height: 250px;" class="form-control" v-model="mdtext" ref="input"></textarea>
        </div>
        <div v-else>
            <WysiwygEditor 
              ref="wysiwygEditor"
              v-model="mdtext"
              :getMarkdownRenderer="get_md"
              @selection-changed="handleSelectionChanged"
              @heading-changed="handleHeadingChanged"
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
import IconButton from './components/IconButton.vue'
import WysiwygEditor from './components/WysiwygEditor.vue'

export default {
    components: {
        IconButton,
        WysiwygEditor
    },
    data() {
        return {
            mdtext: '',
            filename: '',
            pdfdown: false,
            pngdown: false,
            mddown: false,
            htmldown: false,
            mdup: false,
            count: 0,
            sum: 1,
            tex:false,
            exportScale: 1.0,
            originalStyles: null,
            autoSaveStatus: '',
            autoSaveTimer: null,
            isInitializing: true,
            // WYSIWYG 模式相关
            isWysiwygMode: false,
            buttonStates: {
                bold: false,
                italic: false,
                underline: false,
                strikethrough: false,
                code: false,
                heading: 0
            },
            currentHeadingLevel: 0
        }
    },
    created(){
        window.get_filename = this.get_filename;
    },
    // 添加生命周期钩子
    mounted() {
        this.loadFromStorage();
        this.setupAutoSave();
        
        // 加载WYSIWYG模式偏好
        const savedMode = localStorage.getItem('wysiwyg-mode')
        if (savedMode !== null) {
            this.isWysiwygMode = savedMode === 'true'
        }
        
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
            // 获取导出内容元素 - 适配WYSIWYG模式
            let exportElement = this.$refs.exportContent;
            
            if (this.isWysiwygMode && !exportElement) {
                // 在WYSIWYG模式下，创建临时导出元素
                const tempDiv = document.createElement('div');
                tempDiv.className = 'export-container';
                tempDiv.innerHTML = this.get_md(this.mdtext);
                document.body.appendChild(tempDiv);
                exportElement = tempDiv;
                this._tempExportElement = tempDiv;
            }
            
            // 同时设置预览容器和导出容器的宽度
            const contentElement = this.$refs.md || exportElement;
            const A4_WIDTH_PX = 794;
            
            // 保存原始样式
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
            
            // 设置导出容器样式
            exportElement.style.width = `${A4_WIDTH_PX * this.exportScale}px`;
            exportElement.style.maxWidth = `${A4_WIDTH_PX * this.exportScale}px`;
            exportElement.style.margin = '0 auto';
            exportElement.style.padding = '20px';
            
            // 设置预览容器样式（如果可见）
            if (contentElement && contentElement !== exportElement) {
                contentElement.style.width = `${A4_WIDTH_PX * this.exportScale}px`;
                contentElement.style.maxWidth = `${A4_WIDTH_PX * this.exportScale}px`;
                contentElement.style.margin = '0 auto';
                contentElement.style.padding = '20px';
            }
            
            // 强制重新布局
            exportElement.offsetHeight;
            if (contentElement && contentElement !== exportElement) {
                contentElement.offsetHeight;
            }
        },

        restoreOriginalWidth() {
            if (!this.originalStyles) return;
            
            const contentElement = this.$refs.md;
            const exportElement = this.$refs.exportContent || this._tempExportElement;
            
            // 恢复预览容器样式
            if (contentElement && this.originalStyles.md) {
                contentElement.style.width = this.originalStyles.md.width;
                contentElement.style.maxWidth = this.originalStyles.md.maxWidth;
                contentElement.style.margin = this.originalStyles.md.margin;
                contentElement.style.padding = this.originalStyles.md.padding;
            }
            
            // 恢复导出容器样式
            if (exportElement && this.originalStyles.export) {
                exportElement.style.width = this.originalStyles.export.width;
                exportElement.style.maxWidth = this.originalStyles.export.maxWidth;
                exportElement.style.margin = this.originalStyles.export.margin;
                exportElement.style.padding = this.originalStyles.export.padding;
            }
            
            // 清理临时元素
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

        // 改进的PDF导出函数
        async to_pdf(length = 20) {
            this.pdfdown = true;
            this.count = 0;
            
            try {
                // 设置A4宽度并等待布局稳定
                this.setA4Width();
                await new Promise(resolve => setTimeout(resolve, 800));
                
                const pdf = new jsPDF('', 'pt', 'a4');
                const pageWidth = 595.28;
                const pageHeight = 841.89;
                const margin = length;
                
                const contentElement = this.$refs.exportContent || this._tempExportElement;
                const contentWidth = contentElement.scrollWidth;
                const pdfContentWidth = pageWidth - margin * 2;
                const widthRatio = pdfContentWidth / contentWidth;
                const idealPageHeightInPixels = (pageHeight - margin * 2) / widthRatio;
                
                console.log('=== PDF导出开始 ===');
                console.log(`内容尺寸: ${contentWidth} x ${contentElement.scrollHeight}`);
                console.log(`理想页面像素高度: ${idealPageHeightInPixels}`);
                
                // 使用修复后的智能分页算法
                const targetScale = 2.5;
                const breakPoints = this.getOptimalPageBreaks(contentElement, idealPageHeightInPixels, targetScale);
                this.sum = breakPoints.length - 1;
                
                // 预先计算所有页面的最安全缩放比例
                const maxCanvasSize = 17000;
                let globalScale = targetScale;
                
                for (let i = 0; i < breakPoints.length - 1; i++) {
                    const currentPageHeight = breakPoints[i + 1] - breakPoints[i];
                    
                    // 检查每页的canvas限制
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
                
                // 渲染每一页
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
                        
                        // 确保图像完全适配PDF页面
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
            }
        },

        async to_png() {
            this.pngdown = true;
            
            try {
                // 设置A4宽度
                this.setA4Width();
                
                // 等待布局稳定
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const canvas = await html2canvas(this.$refs.exportContent || this._tempExportElement, {
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
        // 优化后的工具栏按钮方法 - 支持WYSIWYG模式
        add1(str1) {
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertMarkdown(str1 + str1);
                return;
            }
            
            // 传统模式逻辑
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
            
            // 传统模式逻辑
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
            
            // 传统模式逻辑
            const oldlocs = this.$refs.input.selectionStart
            const oldloc = this.$refs.input.selectionEnd
            var start = this.current_line()[0]
            var end = this.current_line()[1]
            this.mdtext = this.mdtext.slice(0, end + start) + '\n' + str1 + '\n' + this.mdtext.slice(end + start)
            this.$refs.input.focus();
            this.$nextTick(() => {
                this.$refs.input.selectionStart = end + start + str1.length + 2
                this.$refs.input.selectionEnd = end + start + str1.length + 2
            })
        },
        add4(str1, str2) {
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.insertMarkdown(str1 + str2);
                return;
            }
            
            // 传统模式逻辑
            const oldlocs = this.$refs.input.selectionStart
            const oldloc = this.$refs.input.selectionEnd
            this.mdtext = this.mdtext.slice(0, this.$refs.input.selectionStart) + str1 + this.mdtext.slice(this.$refs.input.selectionStart, this.$refs.input.selectionEnd) + str2 + this.mdtext.slice(this.$refs.input.selectionEnd)
            this.$refs.input.focus();
            this.$nextTick(() => {
                this.$refs.input.selectionStart = oldlocs + str1.length
                this.$refs.input.selectionEnd = oldloc + str1.length
            })
        },
        // 优先级4: 标题按钮图标 - 根据当前标题级别显示
        getHeadingIcon() {
            switch(this.currentHeadingLevel) {
                case 1: return 'heading1'
                case 2: return 'heading2'
                case 3: return 'heading3'
                default: return 'heading'
            }
        },
        
        getHeadingTooltip() {
            if (this.currentHeadingLevel > 0) {
                return `当前: H${this.currentHeadingLevel} (点击切换)`
            }
            return '添加标题 (H1-H6)'
        },
        
        // 切换编辑模式
        toggleEditingMode() {
            this.isWysiwygMode = !this.isWysiwygMode
            
            // 保存模式选择到localStorage
            localStorage.setItem('wysiwyg-mode', this.isWysiwygMode.toString())
            
            // 在模式切换后立即保存光标位置状态
            this.$nextTick(() => {
                if (this.isWysiwygMode) {
                    // 切换到WYSIWYG模式时重置按钮状态
                    this.resetButtonStates()
                }
            })
        },
        
        // 重置按钮状态
        resetButtonStates() {
            this.buttonStates = {
                bold: false,
                italic: false,
                underline: false,
                strikethrough: false,
                code: false,
                heading: 0
            }
            this.currentHeadingLevel = 0
        },
        
        // 处理选择变化事件 - 优先级3: 更新按钮状态
        handleSelectionChanged(eventData) {
            this.buttonStates = {
                ...this.buttonStates,
                ...eventData.styles
            }
            this.currentHeadingLevel = eventData.headingLevel
        },
        
        // 处理标题变化事件
        handleHeadingChanged(level) {
            this.currentHeadingLevel = level
        },
        
        // TEX工具箱切换
        toggleTex() {
            this.tex = !this.tex
        },
        
        // 导数符号添加
        addDerivative() {
            this.add4("'", "")
        },
        title() {
            if (this.isWysiwygMode) {
                this.$refs.wysiwygEditor?.toggleHeading();
                return;
            }
            
            // 传统模式逻辑
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
    },
}
</script>
