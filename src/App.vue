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
    <td><button v-if="!jpgdown" :disabled="mdtext==''" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" @click="to_jpg()">
            导出jpg
        </button>
        <button v-if="jpgdown" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" aria-disabled="true"><span>Loading</span><span class="AnimatedEllipsis"></span></button></td>
    
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
            <label>文件名：</label>
            <input v-model="filename" class="form-control input-sm" type="text" placeholder="导出文件名" style="flex: 1;" />
            <label>缩放倍率：</label>
            <input v-model.number="exportScale" class="form-control input-sm" type="number" min="0.5" max="3" step="0.1" value="1.0" style="width: 80px;" />
            <small class="text-gray">(1.0 = 标准A4宽度)</small>
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
        <div v-html="get_md(mdtext)">
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

/* 移动端导出设置布局：分两行显示 */
.export-settings {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
}

.export-settings > div {
    display: flex;
    align-items: center;
    gap: 8px;
}

.export-settings label {
    min-width: 80px;
    flex-shrink: 0;
}

.export-settings input[type="text"] {
    flex: 1;
}

.export-settings input[type="number"] {
    width: 60px !important;
}

.export-settings small {
    font-size: 12px;
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
        const contentElement = this.$refs.md;
        const A4_WIDTH_PX = 794; // A4宽度对应的像素值（210mm * 3.78px/mm）
        
        // 保存原始样式
        this.originalStyles = {
            width: contentElement.style.width,
            maxWidth: contentElement.style.maxWidth,
            margin: contentElement.style.margin,
            padding: contentElement.style.padding
        };
        
        // 设置为A4宽度
        contentElement.style.width = `${A4_WIDTH_PX * this.exportScale}px`;
        contentElement.style.maxWidth = `${A4_WIDTH_PX * this.exportScale}px`;
        contentElement.style.margin = '0 auto';
        contentElement.style.padding = '20px';
        
        // 强制重新布局
        contentElement.offsetHeight;
    },
    
    // 恢复原始宽度
    restoreOriginalWidth() {
        if (!this.originalStyles) return;
        
        const contentElement = this.$refs.md;
        contentElement.style.width = this.originalStyles.width;
        contentElement.style.maxWidth = this.originalStyles.maxWidth;
        contentElement.style.margin = this.originalStyles.margin;
        contentElement.style.padding = this.originalStyles.padding;
        
        this.originalStyles = null;
    },

    async to_pdf(length = 20) {
        this.pdfdown = true;
        this.count = 0;
        
        try {
            // 设置A4宽度
            this.setA4Width();
            
            // 等待布局稳定
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const pdf = new jsPDF('', 'pt', 'a4');
            const pageWidth = 595.28;  // A4宽度(pt)
            const pageHeight = 841.89; // A4高度(pt)
            const margin = length;
            
            const contentElement = this.$refs.md;
            const contentHeight = contentElement.scrollHeight;
            const contentWidth = contentElement.scrollWidth;
            
            // 计算参数
            const scale = 2; // 高质量截图
            const pdfContentWidth = pageWidth - margin * 2;
            
            // 关键：正确的比例计算
            const widthRatio = pdfContentWidth / contentWidth;
            const pageHeightInPixels = pageHeight / widthRatio;
            
            // 计算总页数
            const totalPages = Math.ceil(contentHeight / pageHeightInPixels);
            this.sum = totalPages;
            
            for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
                const startY = pageIndex * pageHeightInPixels;
                const endY = Math.min(startY + pageHeightInPixels, contentHeight);
                const currentPageHeight = endY - startY;
                
                // 检查canvas大小限制
                const maxCanvasSize = 16000;
                let actualScale = scale;
                let actualWidth = contentWidth;
                let actualHeight = currentPageHeight;
                
                if (contentWidth * scale > maxCanvasSize || currentPageHeight * scale > maxCanvasSize) {
                    actualScale = Math.min(
                        maxCanvasSize / contentWidth,
                        maxCanvasSize / currentPageHeight
                    );
                    console.warn(`Canvas size too large, reducing scale to ${actualScale}`);
                }
                
                try {
                    const canvas = await html2canvas(contentElement, {
                        logging: false,
                        scale: actualScale,
                        width: contentWidth,
                        height: currentPageHeight,
                        x: 0,
                        y: startY,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff'
                    });
                    
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    
                    // 重要：保持正确的宽高比
                    const pdfImageWidth = pdfContentWidth;
                    const pdfImageHeight = (canvas.height / canvas.width) * pdfImageWidth;
                    
                    if (pageIndex > 0) {
                        pdf.addPage();
                    }
                    
                    pdf.addImage(
                        imgData, 'JPEG',
                        margin, 0,
                        pdfImageWidth, Math.min(pdfImageHeight, pageHeight)
                    );
                    
                    this.count = pageIndex + 1;
                    
                } catch (error) {
                    console.error(`Error rendering page ${pageIndex + 1}:`, error);
                    
                    // 降级处理：更小的片段
                    if (currentPageHeight * actualScale > maxCanvasSize) {
                        await this.renderOversizedPage(
                            contentElement, startY, currentPageHeight,
                            pdf, margin, pdfContentWidth, pageIndex > 0,
                            contentWidth
                        );
                    }
                }
            }
            
            // 保存PDF
            const blob = pdf.output('blob');
            const finalBlob = blob.slice(0, blob.size, 'application/octet-stream');
            FileSaver.saveAs(finalBlob, (this.filename || 'undefined') + '.pdf');
            
        } finally {
            // 确保恢复原始宽度
            this.restoreOriginalWidth();
            this.pdfdown = false;
        }
    },

    async to_jpg() {
        this.jpgdown = true;
        
        try {
            // 设置A4宽度
            this.setA4Width();
            
            // 等待布局稳定
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const canvas = await html2canvas(this.$refs.md, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });
            
            const blob = canvas.toDataURL('image/jpeg', 0.95);
            FileSaver.saveAs(blob, (this.filename || 'undefined') + '.jpg');
            
        } finally {
            this.restoreOriginalWidth();
            this.jpgdown = false;
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
                delimiters: 'dollars',
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
