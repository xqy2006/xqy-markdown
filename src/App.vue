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
            <div class="setting-group">
                <label>PDF导出模式：</label>
                <select v-model="pdfExportMode" class="form-control input-sm" style="width: 120px;">
                    <option value="vector">纯文本</option>
                    <option value="screenshot">截图</option>
                </select>
                <small class="text-gray">(纯文本：可选择复制，文件小)</small>
            </div>
        </div>
    </div>
    <div class="Box-row" id="buttons">
        <span class="BtnGroup d-block" style="margin-top: 5px;margin-inline-start: 15px;white-space:nowrap;overflow-x: auto;overflow-y: hidden;">
            <td><button class="btn btn-invisible btn-sm" @click="title()">标题</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add1('\n\`\`\`\n')">代码块</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add1('\`')">单行代码</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('![](',')')">img</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add2('> ')">引用</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add2('- ')">无序列表</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add2('- [ ] ')">任务列表</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add3('[[TOC]]')">目录</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add3('------')">分割线</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4(' $','$ ')">Tex公式</button></td>
            <td><button class="btn btn-invisible btn-sm" v-if="!tex" @click="opentex()">显示Tex工具箱</button></td>
            <td><button class="btn btn-invisible btn-sm" v-if="tex" @click="closetex()">隐藏Tex工具箱</button></td>
        </span>
        <span class="BtnGroup d-block" style="margin-top: 5px;margin-inline-start: 15px;white-space:nowrap;overflow-x: auto;overflow-y: hidden;">
            <td><button class="btn btn-invisible btn-sm" @click="add1('**')">粗体</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add1('*')">斜体</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('<u>','</u>')">下划线</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('<font color=\x22red\x22>','</font>')">标红</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('<mark>','</mark>')">高亮</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add1('~~')">删除线</button></td>
        </span>
        <span class="BtnGroup d-block" v-if="tex" style="margin-top: 5px;margin-inline-start: 15px;white-space:nowrap;overflow-x: auto;overflow-y: hidden;">
            <td><button class="btn btn-invisible btn-sm" @click="add4('+','')">加号</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('-','')">减号</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('\\cdot','')">点乘</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('\\times','')">叉乘</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('\\div','')">除法</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('\\\\','')">换行</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('\\frac{','}{}')">分数</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('^{','}')">上标</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('_{','}')">下标</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('\\sqrt[]{','}')">根号</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('\\overrightarrow{','}')">向量</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('\\overset{\\frown}{','}')">弧</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('\'','')">导数</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('\\sum_{','}^{} {}')">求和</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('\\prod_{','}^{} {}')">求积</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('\\lim_{n \\to \\infty}{','}')">极限</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('\\int_{}^{} {','}\\, dx')">积分</button></td>
            <td><button class="btn btn-invisible btn-sm" @click="add4('\\begin{cases}line1','\\\\line2\\end{cases}')">大括号</button></td>
        </span>
    </div>
    <div class="Box-row" id="mytextarea" style="margin-inline-start: 15px;margin-inline-end: 15px;">
        <div>
            <textarea :disabled="mddown||htmldown||pdfdown||jpgdown" style="margin-top: 5px;width: 100%;height: 250px;" class="form-control" v-model="mdtext" ref="input"></textarea>
        </div>
    </div>
</div>
<div class="Box Box--blue" style="margin-inline-start: 15px;margin-inline-end: 15px;margin-top: 15px;">
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

/* PDF导出专用样式 - 确保代码和数学公式正确显示 */
.export-container code:not(pre code) {
    background-color: rgba(175, 184, 193, 0.2) !important;
    color: rgb(36, 41, 47) !important;
    padding: 0.2em 0.4em !important;
    border-radius: 6px !important;
    font-size: 85% !important;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace !important;
}

.export-container pre.hljs {
    background-color: #f6f8fa !important;
    border: 1px solid #d0d7de !important;
    border-radius: 6px !important;
    padding: 16px !important;
    overflow: auto !important;
    font-size: 14px !important;
    line-height: 1.45 !important;
    margin: 16px 0 !important;
}

.export-container pre.hljs code {
    background: transparent !important;
    padding: 0 !important;
    border-radius: 0 !important;
}

.export-container pre.hljs li {
    margin-top: 0 !important;
    margin-left: 15px !important;
    list-style-type: decimal !important;
    color: #24292f !important;
}

/* 改进KaTeX数学公式在PDF中的显示 */
.export-container .katex {
    font-family: KaTeX_Main, "Times New Roman", serif !important;
    font-size: inherit !important;
}

.export-container .katex-display {
    display: block !important;
    text-align: center !important;
    margin: 1em 0 !important;
}

.export-container .katex:not(.katex-display) {
    display: inline-block !important;
}

/* 确保数学公式元素可见 */
.export-container .katex * {
    visibility: visible !important;
    opacity: 1 !important;
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

export default {
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
            exportScale: 1.0, // 新增：导出缩放倍率
            pdfExportMode: 'vector', // 新增：PDF导出模式
            originalStyles: null, // 保存原始样式
            autoSaveStatus: '', // 状态提示
            autoSaveTimer: null, // 自动保存定时器
            isInitializing: true, // 新增：标记是否正在初始化
            chineseFallback: false, // 中文字体支持标记
            chineseWarningShown: false, // 中文警告显示标记
        }
    },
    created(){
        window.get_filename = this.get_filename;
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
        },
        // 监听 PDF导出模式变化，自动保存
        pdfExportMode: {
            handler() {
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
                    this.pdfExportMode = data.pdfExportMode || 'vector';
                    
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
                    pdfExportMode: this.pdfExportMode,
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
                this.pdfExportMode = 'vector';
                // 清除内容后会自动保存空内容
            }
        },
        setA4Width() {
            // 同时设置预览容器和导出容器的宽度
            const contentElement = this.$refs.md;
            const exportElement = this.$refs.exportContent;
            const A4_WIDTH_PX = 794;
            
            // 保存原始样式
            this.originalStyles = {
                md: {
                    width: contentElement.style.width,
                    maxWidth: contentElement.style.maxWidth,
                    margin: contentElement.style.margin,
                    padding: contentElement.style.padding
                },
                export: {
                    width: exportElement.style.width,
                    maxWidth: exportElement.style.maxWidth,
                    margin: exportElement.style.margin,
                    padding: exportElement.style.padding
                }
            };
            
            // 设置预览容器（保持原有样式）
            contentElement.style.width = `${A4_WIDTH_PX * this.exportScale}px`;
            contentElement.style.maxWidth = `${A4_WIDTH_PX * this.exportScale}px`;
            contentElement.style.margin = '0 auto';
            contentElement.style.padding = '20px';
            
            // 设置导出容器（与预览保持一致）
            exportElement.style.width = `${A4_WIDTH_PX * this.exportScale}px`;
            exportElement.style.maxWidth = `${A4_WIDTH_PX * this.exportScale}px`;
            exportElement.style.margin = '0 auto';
            exportElement.style.padding = '20px';
            
            // 强制重新布局
            contentElement.offsetHeight;
            exportElement.offsetHeight;
        },

        restoreOriginalWidth() {
            if (!this.originalStyles) return;
            
            const contentElement = this.$refs.md;
            const exportElement = this.$refs.exportContent;
            
            // 恢复预览容器样式
            contentElement.style.width = this.originalStyles.md.width;
            contentElement.style.maxWidth = this.originalStyles.md.maxWidth;
            contentElement.style.margin = this.originalStyles.md.margin;
            contentElement.style.padding = this.originalStyles.md.padding;
            
            // 恢复导出容器样式
            exportElement.style.width = this.originalStyles.export.width;
            exportElement.style.maxWidth = this.originalStyles.export.maxWidth;
            exportElement.style.margin = this.originalStyles.export.margin;
            exportElement.style.padding = this.originalStyles.export.padding;
            
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

        // 真正的矢量化PDF导出方法 - 基于DOM的样式化文本提取
        async to_pdf_vector() {
            this.pdfdown = true;
            this.count = 0;
            this.sum = 1;
            
            try {
                console.log('=== 真正矢量化PDF导出开始 ===');
                
                // 设置A4宽度确保一致的渲染
                this.setA4Width();
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const pdf = new jsPDF('p', 'pt', 'a4');
                const pageWidth = 595.28;
                const pageHeight = 841.89;
                const margin = 40;
                const contentWidth = pageWidth - margin * 2;
                
                // 加载中文字体支持
                await this.setupChineseFonts(pdf);
                
                // 获取渲染后的内容元素
                const contentElement = this.$refs.exportContent;
                
                // 提取样式化内容
                const styledContent = this.extractStyledContent(contentElement);
                console.log('提取到样式化内容块数:', styledContent.length);
                
                // 计算分页
                const pageBreaks = this.calculateVectorPageBreaks(styledContent, contentWidth, pageHeight - margin * 2);
                this.sum = pageBreaks.length;
                
                // 渲染每一页
                for (let pageIndex = 0; pageIndex < pageBreaks.length; pageIndex++) {
                    if (pageIndex > 0) {
                        pdf.addPage();
                    }
                    
                    const pageContent = pageBreaks[pageIndex];
                    await this.renderStyledPageToPDF(pdf, pageContent, margin, margin, contentWidth);
                    
                    this.count = pageIndex + 1;
                    console.log(`第${pageIndex + 1}页渲染完成`);
                }
                
                // 下载PDF
                const filename = (this.filename || 'undefined') + '.pdf';
                pdf.save(filename);
                
                console.log('=== 真正矢量化PDF导出完成 ===');
                
            } catch (error) {
                console.error('矢量化PDF导出失败:', error);
                alert('矢量化PDF导出失败: ' + error.message);
            } finally {
                this.restoreOriginalWidth();
                this.pdfdown = false;
            }
        },

        // 设置中文字体支持 - 改进版
        async setupChineseFonts(pdf) {
            try {
                // 检测是否包含中文字符
                const hasChinese = /[\u4e00-\u9fff]/.test(this.mdtext);
                
                if (hasChinese) {
                    console.log('检测到中文内容，配置Unicode字体支持');
                    
                    // 尝试添加中文字体支持
                    // 注意：这里使用一个策略来最大化中文字符的显示
                    try {
                        // 使用内置字体的Unicode支持
                        pdf.setFont('helvetica', 'normal');
                        
                        // 设置fallback字符串，当遇到不支持的字符时显示
                        this.chineseFallback = true;
                        
                        console.log('中文字体配置完成，使用Unicode兼容模式');
                    } catch (fontError) {
                        console.warn('中文字体配置失败，使用默认字体:', fontError);
                        pdf.setFont('helvetica', 'normal');
                        this.chineseFallback = true;
                    }
                } else {
                    pdf.setFont('helvetica', 'normal');
                    this.chineseFallback = false;
                }
                
                console.log('字体设置完成');
            } catch (error) {
                console.warn('字体设置失败，使用默认字体:', error);
                pdf.setFont('helvetica', 'normal');
                this.chineseFallback = false;
            }
        },

        // 处理中文文本的fallback方法
        processChinese(text) {
            if (!this.chineseFallback) return text;
            
            // 检测并处理中文字符
            const chineseRegex = /[\u4e00-\u9fff]/g;
            const hasChinese = chineseRegex.test(text);
            
            if (hasChinese) {
                // 在PDF开始时添加中文支持说明
                if (!this.chineseWarningShown) {
                    console.warn('注意：当前PDF包含中文字符，可能显示为空白。建议使用截图模式以获得最佳效果。');
                    this.chineseWarningShown = true;
                }
                
                // 对于中文字符，我们尝试保留但可能会有显示问题
                return text;
            }
            
            return text;
        },

        // 提取样式化内容 - 改进的DOM遍历方法
        extractStyledContent(contentElement) {
            const styledBlocks = [];
            
            // 直接遍历内容元素的直接子元素
            const directChildren = Array.from(contentElement.children);
            
            for (const element of directChildren) {
                if (this.shouldSkipElement(element)) continue;
                
                const blockInfo = this.analyzeElementStyle(element, contentElement);
                if (blockInfo && blockInfo.text.trim()) {
                    styledBlocks.push(blockInfo);
                    
                    // 如果是代码块，特殊处理
                    if (element.tagName === 'PRE') {
                        blockInfo.isCodeBlock = true;
                        blockInfo.codeContent = this.extractCodeBlockContent(element);
                    }
                    
                    // 如果是列表，处理列表项
                    if (element.tagName === 'UL' || element.tagName === 'OL') {
                        const listItems = Array.from(element.querySelectorAll('li'));
                        blockInfo.listItems = listItems.map(li => li.textContent.trim());
                        blockInfo.isOrdered = element.tagName === 'OL';
                    }
                    
                    // 处理数学公式
                    const mathElements = element.querySelectorAll('.katex');
                    if (mathElements.length > 0) {
                        blockInfo.hasMath = true;
                        blockInfo.mathText = Array.from(mathElements).map(el => 
                            el.querySelector('.katex-html')?.textContent || 
                            el.textContent || ''
                        ).join(' ');
                    }
                }
            }
            
            return styledBlocks;
        },

        // 判断是否跳过元素
        shouldSkipElement(element) {
            // 跳过隐藏元素和不重要的元素
            const style = window.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return true;
            }
            
            // 跳过空的或只包含空白的元素
            if (!element.textContent.trim()) {
                return true;
            }
            
            return false;
        },

        // 分析元素样式 - 改进版
        analyzeElementStyle(element, containerElement) {
            const computedStyle = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            const containerRect = containerElement.getBoundingClientRect();
            
            // 计算相对位置
            const relativeTop = rect.top - containerRect.top;
            const relativeLeft = rect.left - containerRect.left;
            
            let text = '';
            let type = 'text';
            
            // 处理不同类型的元素
            switch (element.tagName) {
                case 'H1':
                case 'H2':
                case 'H3':
                case 'H4':
                case 'H5':
                case 'H6':
                    text = element.textContent.trim();
                    type = 'heading';
                    break;
                    
                case 'P':
                    text = this.extractInlineStyledText(element);
                    type = 'paragraph';
                    break;
                    
                case 'PRE':
                    text = this.extractCodeBlockContent(element);
                    type = 'codeblock';
                    break;
                    
                case 'UL':
                case 'OL':
                    text = this.extractListText(element);
                    type = 'list';
                    break;
                    
                case 'BLOCKQUOTE':
                    text = element.textContent.trim();
                    type = 'blockquote';
                    break;
                    
                case 'HR':
                    text = '---';
                    type = 'divider';
                    break;
                    
                default:
                    text = element.textContent.trim();
                    break;
            }
            
            if (!text) return null;
            
            return {
                text: text,
                type: type,
                tagName: element.tagName,
                fontSize: parseFloat(computedStyle.fontSize) || 12,
                fontWeight: computedStyle.fontWeight,
                fontStyle: computedStyle.fontStyle,
                color: computedStyle.color,
                backgroundColor: computedStyle.backgroundColor,
                lineHeight: parseFloat(computedStyle.lineHeight) || 1.2,
                marginTop: parseFloat(computedStyle.marginTop) || 0,
                marginBottom: parseFloat(computedStyle.marginBottom) || 0,
                paddingTop: parseFloat(computedStyle.paddingTop) || 0,
                paddingBottom: parseFloat(computedStyle.paddingBottom) || 0,
                relativeTop: relativeTop,
                relativeLeft: relativeLeft,
                width: rect.width,
                height: rect.height,
                // 添加更多样式信息
                borderRadius: computedStyle.borderRadius,
                border: computedStyle.border,
                isCodeBlock: false,
                isOrdered: false,
                listItems: [],
                hasMath: false,
                mathText: ''
            };
        },

        // 提取列表文本
        extractListText(listElement) {
            const items = Array.from(listElement.querySelectorAll('li'));
            return items.map(li => li.textContent.trim()).join('\n');
        },

        // 提取内联样式文本 - 改进版
        extractInlineStyledText(element) {
            let result = '';
            
            for (const child of element.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) {
                    result += child.textContent;
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    // 处理内联元素
                    switch (child.tagName) {
                        case 'CODE':
                            // 保留内联代码标记
                            result += child.textContent;
                            break;
                        case 'STRONG':
                        case 'B':
                            result += child.textContent;
                            break;
                        case 'EM':
                        case 'I':
                            result += child.textContent;
                            break;
                        case 'SPAN':
                            // 检查是否是数学公式
                            if (child.classList.contains('katex')) {
                                const mathText = child.querySelector('.katex-html')?.textContent || child.textContent;
                                result += mathText;
                            } else {
                                result += child.textContent;
                            }
                            break;
                        default:
                            result += child.textContent;
                            break;
                    }
                }
            }
            
            return result;
        },

        // 提取代码块内容 - 改进版
        extractCodeBlockContent(preElement) {
            const codeElement = preElement.querySelector('code');
            if (!codeElement) return preElement.textContent;
            
            // 检查是否有行号列表
            const linesList = codeElement.querySelector('ol');
            if (linesList) {
                const lines = Array.from(linesList.querySelectorAll('li'));
                return lines.map((li, index) => {
                    const lineNumber = (index + 1).toString().padStart(3, ' ');
                    const lineContent = li.textContent.replace(/\s+$/, ''); // 移除尾部空白
                    return `${lineNumber} | ${lineContent}`;
                }).join('\n');
            }
            
            // 如果没有行号，直接返回代码内容
            return codeElement.textContent;
        },

        // 计算矢量PDF分页
        calculateVectorPageBreaks(styledContent, contentWidth, pageHeight) {
            const pages = [];
            let currentPage = [];
            let currentPageHeight = 0;
            const lineHeight = 16; // 基础行高
            
            for (const block of styledContent) {
                const blockHeight = this.estimateStyledBlockHeight(block, contentWidth);
                
                // 检查是否需要新页面
                if (currentPageHeight + blockHeight > pageHeight && currentPage.length > 0) {
                    pages.push(currentPage);
                    currentPage = [];
                    currentPageHeight = 0;
                }
                
                currentPage.push(block);
                currentPageHeight += blockHeight;
            }
            
            // 添加最后一页
            if (currentPage.length > 0) {
                pages.push(currentPage);
            }
            
            return pages;
        },

        // 估算样式化块的高度
        estimateStyledBlockHeight(block, contentWidth) {
            const baseLineHeight = 16;
            let height = 0;
            
            switch (block.type) {
                case 'heading':
                    height = Math.max(block.fontSize * 1.2, 20) + block.marginTop + block.marginBottom;
                    break;
                    
                case 'paragraph':
                    const textLines = Math.ceil(block.text.length * 8 / contentWidth); // 粗略估算
                    height = textLines * baseLineHeight + block.marginTop + block.marginBottom;
                    break;
                    
                case 'codeblock':
                    const codeLines = block.text.split('\n').length;
                    height = codeLines * 14 + 20; // 代码行高 + 边距
                    break;
                    
                case 'listitem':
                    height = baseLineHeight + 4;
                    break;
                    
                default:
                    height = baseLineHeight;
                    break;
            }
            
            return Math.max(height, 10);
        },

        // 渲染样式化页面到PDF
        async renderStyledPageToPDF(pdf, pageContent, startX, startY, contentWidth) {
            let currentY = startY;
            
            for (const block of pageContent) {
                currentY = await this.renderStyledBlockToPDF(pdf, block, startX, currentY, contentWidth);
                currentY += 5; // 块间距
            }
        },

        // 渲染样式化块到PDF - 改进版
        async renderStyledBlockToPDF(pdf, block, x, y, contentWidth) {
            switch (block.type) {
                case 'heading':
                    return this.renderHeadingToPDF(pdf, block, x, y, contentWidth);
                    
                case 'paragraph':
                    return this.renderParagraphToPDF(pdf, block, x, y, contentWidth);
                    
                case 'codeblock':
                    return this.renderCodeBlockToPDF(pdf, block, x, y, contentWidth);
                    
                case 'list':
                    return this.renderListToPDF(pdf, block, x, y, contentWidth);
                    
                case 'blockquote':
                    return this.renderBlockquoteToPDF(pdf, block, x, y, contentWidth);
                    
                case 'divider':
                    return this.renderDividerToPDF(pdf, block, x, y, contentWidth);
                    
                default:
                    return this.renderTextToPDF(pdf, block, x, y, contentWidth);
            }
        },

        // 渲染标题 - 改进版支持中文
        renderHeadingToPDF(pdf, block, x, y, contentWidth) {
            const fontSize = Math.max(14, 24 - parseInt(block.tagName.charAt(1)) * 2);
            
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            
            const processedText = this.processChinese(block.text);
            const lines = pdf.splitTextToSize(processedText, contentWidth);
            pdf.text(lines, x, y + fontSize);
            
            return y + lines.length * fontSize * 1.2 + 10;
        },

        // 渲染段落 - 改进版，处理内联代码和数学公式，支持中文
        renderParagraphToPDF(pdf, block, x, y, contentWidth) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            
            let currentY = y + 12;
            const lineHeight = 16;
            
            // 如果包含数学公式，特殊处理
            if (block.hasMath && block.mathText) {
                // 先渲染普通文本
                const textWithoutMath = block.text.replace(/\$[^$]+\$/g, '');
                if (textWithoutMath.trim()) {
                    const processedText = this.processChinese(textWithoutMath);
                    const textLines = pdf.splitTextToSize(processedText, contentWidth);
                    pdf.text(textLines, x, currentY);
                    currentY += textLines.length * lineHeight;
                }
                
                // 渲染数学公式（作为普通文本）
                pdf.setFont('helvetica', 'italic');
                pdf.setTextColor(0, 0, 139); // 深蓝色
                const processedMath = this.processChinese(block.mathText);
                const mathLines = pdf.splitTextToSize(processedMath, contentWidth);
                pdf.text(mathLines, x, currentY);
                currentY += mathLines.length * lineHeight;
                
                // 恢复字体
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(0, 0, 0);
            } else {
                // 普通段落处理
                const processedText = this.processInlineFormats(block.text);
                const finalText = this.processChinese(processedText);
                const lines = pdf.splitTextToSize(finalText, contentWidth);
                pdf.text(lines, x, currentY);
                currentY += lines.length * lineHeight;
            }
            
            return currentY + 8;
        },

        // 处理内联格式 - 改进版
        processInlineFormats(text) {
            // 处理内联代码：添加背景标识
            text = text.replace(/`([^`]+)`/g, (match, code) => {
                return `[CODE: ${code}]`;
            });
            
            // 处理数学公式
            text = text.replace(/\$([^$]+)\$/g, (match, formula) => {
                return `[MATH: ${formula}]`;
            });
            
            // 移除其他markdown标记但保留内容
            text = text
                .replace(/\*\*([^*]+)\*\*/g, '$1') // 粗体
                .replace(/\*([^*]+)\*/g, '$1')     // 斜体
                .replace(/~~([^~]+)~~/g, '$1');    // 删除线
            
            return text;
        },

        // 渲染代码块 - 改进版支持中文和自动换行
        renderCodeBlockToPDF(pdf, block, x, y, contentWidth) {
            // 设置代码块背景
            const codeLines = block.text.split('\n');
            let totalLines = 0;
            
            // 预计算总行数（考虑自动换行）
            pdf.setFontSize(10);
            pdf.setFont('courier', 'normal');
            
            const wrappedLines = [];
            for (const line of codeLines) {
                if (line.trim()) {
                    const processedLine = this.processChinese(line);
                    const wrapped = pdf.splitTextToSize(processedLine, contentWidth - 16);
                    wrappedLines.push(...wrapped);
                    totalLines += wrapped.length;
                } else {
                    wrappedLines.push('');
                    totalLines += 1;
                }
            }
            
            const blockHeight = totalLines * 14 + 16;
            
            // 绘制灰色背景
            pdf.setFillColor(246, 248, 250);
            pdf.rect(x, y, contentWidth, blockHeight, 'F');
            
            // 绘制边框
            pdf.setDrawColor(208, 215, 222);
            pdf.setLineWidth(1);
            pdf.rect(x, y, contentWidth, blockHeight, 'S');
            
            // 设置代码字体
            pdf.setFontSize(10);
            pdf.setFont('courier', 'normal');
            pdf.setTextColor(36, 41, 47);
            
            // 渲染代码行
            let lineY = y + 14;
            for (const line of wrappedLines) {
                if (line.trim()) {
                    pdf.text(line, x + 8, lineY);
                }
                lineY += 14;
            }
            
            return y + blockHeight + 10;
        },

        // 渲染列表 - 改进版支持中文
        renderListToPDF(pdf, block, x, y, contentWidth) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            
            let listY = y;
            
            if (block.listItems && block.listItems.length > 0) {
                for (let i = 0; i < block.listItems.length; i++) {
                    const bullet = block.isOrdered ? `${i + 1}.` : '•';
                    pdf.text(bullet, x, listY + 12);
                    
                    const processedItem = this.processChinese(block.listItems[i]);
                    const itemLines = pdf.splitTextToSize(processedItem, contentWidth - 20);
                    pdf.text(itemLines, x + 20, listY + 12);
                    listY += itemLines.length * 16;
                }
            } else {
                // 回退到简单文本处理
                const lines = block.text.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line) {
                        pdf.text('•', x, listY + 12);
                        const processedLine = this.processChinese(line);
                        const itemLines = pdf.splitTextToSize(processedLine, contentWidth - 20);
                        pdf.text(itemLines, x + 20, listY + 12);
                        listY += itemLines.length * 16;
                    }
                }
            }
            
            return listY + 5;
        },

        // 渲染引用块 - 改进版支持中文
        renderBlockquoteToPDF(pdf, block, x, y, contentWidth) {
            // 绘制左侧边线
            pdf.setDrawColor(208, 215, 222);
            pdf.setLineWidth(3);
            
            const processedText = this.processChinese(block.text);
            const lines = pdf.splitTextToSize(processedText, contentWidth - 20);
            const blockHeight = lines.length * 16;
            
            pdf.line(x, y, x, y + blockHeight + 8);
            
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(87, 96, 106);
            
            pdf.text(lines, x + 15, y + 12);
            
            return y + blockHeight + 16;
        },

        // 渲染分隔线
        renderDividerToPDF(pdf, block, x, y, contentWidth) {
            pdf.setDrawColor(208, 215, 222);
            pdf.setLineWidth(1);
            pdf.line(x, y + 10, x + contentWidth, y + 10);
            
            return y + 20;
        },

        // 渲染普通文本 - 改进版支持中文
        renderTextToPDF(pdf, block, x, y, contentWidth) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            
            const processedText = this.processChinese(block.text);
            const lines = pdf.splitTextToSize(processedText, contentWidth);
            pdf.text(lines, x, y + 12);
            
            return y + lines.length * 16;
        },

        // 处理内联格式
        processInlineFormats(text) {
            // 简化处理：移除markdown标记但保留内容
            return text
                .replace(/\*\*([^*]+)\*\*/g, '$1') // 粗体
                .replace(/\*([^*]+)\*/g, '$1')     // 斜体
                .replace(/`([^`]+)`/g, '$1')       // 内联代码
                .replace(/\$([^$]+)\$/g, '$1');    // 数学公式
        },



        // 改进的PDF导出函数 - 根据模式选择导出方式
        async to_pdf(length = 20) {
            if (this.pdfExportMode === 'vector') {
                return this.to_pdf_vector();
            } else {
                return this.to_pdf_screenshot(length);
            }
        },

        // 截图方式PDF导出（原有方法）
        async to_pdf_screenshot(length = 20) {
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
                
                const contentElement = this.$refs.exportContent;
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
                
                const canvas = await html2canvas(this.$refs.exportContent, {
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
        add1(str1) {
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
            
            //const oldloc = this.$refs.input.selectionEnd
            //const list = this.mdtext.split("\n")
            //console.log(list[list.length - 1].search('# ') != -1)
            //var text = ''
            //if (list[list.length - 1].slice(0, 1) == '#') {
            //    for (var i = 0; i < list.length - 1; i++) {
            //        text += list[i] + '\n'
            //    }
            //    if (list[list.length - 1].search('###### ') != -1) {
            //        this.mdtext = text + '#' + list[list.length - 1].slice(6)
            //    } else {
            //        this.mdtext = text + '#' + list[list.length - 1]
            //    }
            //   var enter = 0
            //} else {
            //    for (var i = 0; i < list.length - 1; i++) {
            //        text += list[i] + '\n'
            //    }
            //    this.mdtext = text + '# ' + list[list.length - 1]
            //    var enter = 1
            //}
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
