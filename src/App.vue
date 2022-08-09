<template>
<div class="markdown-body" style="margin-top: 15px;margin-inline-start: 15px;">
    <h1>markdown编辑器</h1>
</div>
<div style="margin-top: 15px;margin-inline-start: 15px;">
    <b>请输入导出文件名：</b>
    <input v-model="filename" class="form-control input-sm" type="text" placeholder="导出文件名" aria-label="导出文件名" />
</div>
<div style="margin-top: 5px;">
    <a v-if="!mdup" style="margin-inline-start: 15px;" href="javascript:;" class="a-upload btn btn-primary btn-sm"><input type="file" accept=".md," ref="mdfile" @change="up_md()">上传markdown</a>
    <button v-if="mdup" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" aria-disabled="true"><span>Loading</span><span class="AnimatedEllipsis"></span></button>
    <button v-if="!mddown" :disabled="filename=='' || mdtext==''" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" @click="to_md()">
        导出markdown
    </button>
    <button v-if="mddown" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" aria-disabled="true"><span>Loading</span><span class="AnimatedEllipsis"></span></button>
    <button v-if="!htmldown" :disabled="filename=='' || mdtext==''" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" @click="to_html()">
        导出html
    </button>
    <button v-if="htmldown" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" aria-disabled="true"><span>Loading</span><span class="AnimatedEllipsis"></span></button>

    <button v-if="!pdfdown" :disabled="filename=='' || mdtext==''" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" @click="to_pdf(20)">
        导出pdf
    </button>
    <button v-if="pdfdown" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" aria-disabled="true"><span>Loading</span><span class="AnimatedEllipsis"></span></button>
    <button v-if="!jpgdown" :disabled="filename=='' || mdtext==''" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" @click="to_jpg()">
        导出jpg
    </button>
    <button v-if="jpgdown" style="margin-inline-start: 15px;" class="btn btn-primary btn-sm" aria-disabled="true"><span>Loading</span><span class="AnimatedEllipsis"></span></button>

</div>
<div class="markdown-body" style="margin-top: 15px;margin-inline-start: 15px;">
    <h4>请输入markdown内容：</h4>
</div>
<span class="BtnGroup d-block mb-2" style="margin-top: 5px;margin-inline-start: 15px;white-space:nowrap;overflow:auto;">
    <button class="BtnGroup-item btn btn-sm" @click="add1('**')">粗体</button>
    <button class="BtnGroup-item btn btn-sm" @click="add1('*')">斜体</button>
    <button class="BtnGroup-item btn btn-sm" @click="add1('~~')">删除线</button>
    <button class="BtnGroup-item btn btn-sm" @click="title()">标题</button>
    <button class="BtnGroup-item btn btn-sm" @click="add1('\`')">单行代码</button>
    <button class="BtnGroup-item btn btn-sm" @click="add1('\n\`\`\`\n')">代码块</button>
    <button class="BtnGroup-item btn btn-sm" @click="add2('> ')">引用</button>
    <button class="BtnGroup-item btn btn-sm" @click="add2('- ')">无序列表</button>
    <button class="BtnGroup-item btn btn-sm" @click="add2('- [ ] ')">任务列表</button>
    <button class="BtnGroup-item btn btn-sm" @click="add3('[[TOC]]')">目录</button>
    <button class="BtnGroup-item btn btn-sm" @click="add3('------')">分割线</button>
</span>
<div>
    <textarea style="margin-top: 5px;width: 100%;height: 250px" class="form-control" v-model="mdtext" ref="input"></textarea>
</div>
<div class="markdown-body" style="margin-top: 15px;margin-inline-start: 15px;">
    <h4>预览：</h4>
</div>
<div style="margin-top: 15px;" class="markdown-body" ref="md">
    <div v-html="get_md(mdtext)">
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
            mdup: false
        }
    },

    methods: {
        to_pdf(length) {
            this.pdfdown = true
            html2canvas(this.$refs.md).then((canvas) => {
                var contentWidth = canvas.width;
                var contentHeight = canvas.height;

                //一页pdf显示html页面生成的canvas高度;
                var pageHeight = contentWidth / 592.28 * 841.89;
                //未生成pdf的html页面高度
                var leftHeight = contentHeight;
                //页面偏移
                var position = 0;
                //a4纸的尺寸[595.28,841.89]，html页面生成的canvas在pdf中图片的宽高
                var imgWidth = 595.28 - length * 2;
                var imgHeight = (595.28 - length * 2) / contentWidth * contentHeight;

                var pageData = canvas.toDataURL('image/jpeg', 1.0);

                var pdf = new jsPDF('', 'pt', 'a4');

                //有两个高度需要区分，一个是html页面的实际高度，和生成pdf的页面高度(841.89)
                //当内容未超过pdf一页显示的范围，无需分页
                if (leftHeight < pageHeight) {
                    pdf.addImage(pageData, 'JPEG', length, 0, imgWidth, imgHeight);
                } else {
                    while (leftHeight > 0) {
                        pdf.addImage(pageData, 'JPEG', length, position, imgWidth, imgHeight)
                        leftHeight -= pageHeight;
                        position -= 841.89;
                        //避免添加空白页
                        if (leftHeight > 0) {
                            pdf.addPage();
                        }
                    }
                }
                let blob = pdf.output('blob')
                blob = blob.slice(0, blob.size, 'application/octet-stream')
                FileSaver.saveAs(blob, this.filename + '.pdf')
                //window.open(pdf.output("bloburl", { filename: "xqy-markdown.pdf" }));
                this.pdfdown = false
            });

        },
        to_jpg() {
            this.jpgdown = true
            html2canvas(this.$refs.md).then((canvas) => {
                let blob = canvas.toDataURL('image/jpeg', 1.0);
                FileSaver.saveAs(blob, this.filename + '.jpg')
                this.jpgdown = false
            });
        },
        to_md() {
            this.mddown = true
            var blob = new Blob([this.mdtext])
            FileSaver.saveAs(blob, this.filename + '.md')
            this.mddown = false

        },
        to_html() {
            this.htmldown = true
            var blob = new Blob(['<head>\n<link href=\"https://unpkg.com/@primer/css@^20.2.4/dist/primer.css\" rel=\"stylesheet\" />\n<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css\" integrity=\"sha384-Xi8rHCmBmhbuyyhbI88391ZKP2dmfnOl4rT9ZfRI7mLTdk1wblIUnrIq35nqwEvC\" crossorigin=\"anonymous\">\n<style type="text/css">\n' + github + '\n</style>\n</head>\n<div class=\"markdown-body\">\n' + this.get_md(this.mdtext) + '\n</div>'])
            FileSaver.saveAs(blob, this.filename + '.html')
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
                breaks: true,
                highlight: function (str, lang) {
                    if (lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(str, {
                                language: lang
                            }).value;
                        } catch (__) {}
                    }

                    return ''; // use external default escaping
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

            if (end == -1) {
                end = taval.length;
            }

            return [start, end - start];
        }
    },
}
</script>
