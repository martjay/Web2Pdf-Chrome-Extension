// ==UserScript==
// @name         Web2PDF 网页转PDF
// @name:zh-CN   Web2PDF 网页转PDF
// @name:zh-TW   Web2PDF 網頁轉PDF
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Convert web pages to PDF/Word/HTML/Markdown with reading mode, rich text editing, and multi-language support.
// @description:zh-CN  将网页转换为PDF/Word/HTML/Markdown，支持阅读模式、富文本编辑和多语言。
// @description:zh-TW  將網頁轉換為PDF/Word/HTML/Markdown，支援閱讀模式、富文本編輯和多語言。
// @author       martjay
// @match        *://*/*
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0Ij48cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PHBhdGggZmlsbD0iIzRDQUY1MCIgZD0iTTIwIDJIOGMtMS4xIDAtMiAuOS0yIDJ2MTJjMCAxLjEuOSAyIDIgMmgxMmMxLjEgMCAyLS45IDItMlY0YzAtMS4xLS45LTItMi0yem0tOC41IDcuNWMwIC44My0uNjcgMS41LTEuNSAxLjVIOXYySDcuNVY3SDEwYy44MyAwIDEuNS42NyAxLjUgMS41djF6bTUgMmMwIC44My0uNjcgMS41LTEuNSAxLjVoLTIuNVY3SDE1Yy44MyAwIDEuNS42NyAxLjUgMS41djN6bTQtM0gxOXYxaDEuNVYxMUgxOHYyaC0xLjVWN2gzdjEuNXpNOSA5LjVoMXYtMUg5djF6TTQgNkgydjE0YzAgMS4xLjkgMiAyIDJoMTR2LTJINFY2em0xMCA1LjVoMXYtM2gtMXYzeiIvPjwvc3ZnPg==
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      *
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/523995/Web2PDF.user.js
// @updateURL    https://update.greasyfork.org/scripts/523995/Web2PDF.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // ============================================
    // 国际化配置
    // ============================================
    const i18n = {
        zh: {
            readMode: '阅读模式',
            editMode: '编辑模式',
            exportAs: '导出为...',
            exportPDF: '导出 PDF',
            exportWord: '导出 Word',
            exportHTML: '导出 HTML',
            exportMarkdown: '导出 Markdown',
            switchLang: '中/En',
            loading: '正在加载页面内容和图片，请稍候...',
            loadingImages: '正在加载图片',
            noImages: '没有找到需要加载的图片',
            preparing: '准备加载...',
            loadComplete: '加载完成',
            loadFailed: '加载失败，请重试',
            deleteBlock: '删除此块',
            enterLink: '请输入链接地址:',
            enterImageUrl: '请输入图片地址:',
            bold: '加粗',
            italic: '斜体',
            underline: '下划线',
            strikethrough: '删除线',
            heading1: '标题1',
            heading2: '标题2',
            heading3: '标题3',
            paragraph: '段落',
            quote: '引用块',
            codeBlock: '代码块',
            alignLeft: '左对齐',
            alignCenter: '居中',
            alignRight: '右对齐',
            alignJustify: '两端对齐',
            bulletList: '无序列表',
            numberList: '有序列表',
            indent: '增加缩进',
            outdent: '减少缩进',
            addLink: '添加链接',
            removeLink: '移除链接',
            horizontalLine: '水平分割线',
            insertImage: '插入图片',
            subscript: '下标',
            superscript: '上标',
            clearFormat: '清除格式',
            textColor: '文字颜色',
            highlightColor: '高亮颜色',
            customColor: '自定义颜色',
            apply: '应用',
            cancel: '取消',
            clearHighlight: '清除高亮',
            undo: '撤销',
            redo: '重做',
            pdfError: '导出时出错，请重试',
            close: '关闭 (ESC)',
            exportSuccess: '导出成功！'
        },
        en: {
            readMode: 'Reading Mode',
            editMode: 'Edit Mode',
            exportAs: 'Export as...',
            exportPDF: 'Export PDF',
            exportWord: 'Export Word',
            exportHTML: 'Export HTML',
            exportMarkdown: 'Export Markdown',
            switchLang: '中/En',
            loading: 'Loading content and images, please wait...',
            loadingImages: 'Loading images',
            noImages: 'No images found to load',
            preparing: 'Preparing...',
            loadComplete: 'Loading complete',
            loadFailed: 'Loading failed, please try again',
            deleteBlock: 'Delete Block',
            enterLink: 'Please enter the link URL:',
            enterImageUrl: 'Please enter the image URL:',
            bold: 'Bold',
            italic: 'Italic',
            underline: 'Underline',
            strikethrough: 'Strikethrough',
            heading1: 'Heading 1',
            heading2: 'Heading 2',
            heading3: 'Heading 3',
            paragraph: 'Paragraph',
            quote: 'Quote Block',
            codeBlock: 'Code Block',
            alignLeft: 'Align Left',
            alignCenter: 'Center',
            alignRight: 'Align Right',
            alignJustify: 'Justify',
            bulletList: 'Bullet List',
            numberList: 'Number List',
            indent: 'Increase Indent',
            outdent: 'Decrease Indent',
            addLink: 'Add Link',
            removeLink: 'Remove Link',
            horizontalLine: 'Horizontal Line',
            insertImage: 'Insert Image',
            subscript: 'Subscript',
            superscript: 'Superscript',
            clearFormat: 'Clear Formatting',
            textColor: 'Text Color',
            highlightColor: 'Highlight Color',
            customColor: 'Custom Color',
            apply: 'Apply',
            cancel: 'Cancel',
            clearHighlight: 'Clear Highlight',
            undo: 'Undo',
            redo: 'Redo',
            pdfError: 'Error exporting, please try again',
            close: 'Close (ESC)',
            exportSuccess: 'Export successful!'
        }
    };

    // ============================================
    // 语言函数
    // ============================================
    function getUserLanguage() {
        const userLang = GM_getValue('userLanguage');
        if (userLang) return userLang;
        const lang = navigator.language.toLowerCase();
        return lang.startsWith('zh') ? 'zh' : 'en';
    }

    function setUserLanguage(lang) {
        GM_setValue('userLanguage', lang);
    }

    function t(key) {
        const lang = getUserLanguage();
        return i18n[lang]?.[key] || i18n.en[key] || key;
    }

    // ============================================
    // 常量定义
    // ============================================
    const CONTENT_SELECTORS = [
        'article', '[role="article"]', '.article', '.post', '.post-content',
        '.article-content', '#article-content', '.content', '.main-content',
        'main', '[role="main"]', '.entry-content', '.blog-post', '.story-content'
    ];

    const REMOVE_SELECTORS = [
        'script', 'style', 'iframe', 'nav', 'header', 'footer',
        '.advertisement', '.ads', '.social-share', '.comments',
        '#comments', '.sidebar', '.related-posts', '.nav',
        '.navigation', '.menu', '.share', '.social', 'button', 'input', 'form'
    ];

    const LAZY_LOAD_ATTRS = ['data-src', 'data-original', 'data-lazy-src', 'data-lazy-loaded', 'data-url'];


    // ============================================
    // 添加样式
    // ============================================
    GM_addStyle(`
/* 浮动按钮 */
.web2pdf-floating-button {
  position: fixed;
  z-index: 10000;
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: #4CAF50;
  color: white;
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, transform 0.2s;
  user-select: none;
  touch-action: none;
  padding: 0;
}

.web2pdf-floating-button:hover {
  background: #45a049;
  transform: scale(1.05);
}

.web2pdf-floating-button.dragging {
  opacity: 0.8;
  cursor: grabbing;
  transform: scale(1.1);
}

.web2pdf-floating-button svg {
  width: 24px;
  height: 24px;
  pointer-events: none;
  fill: currentColor;
}

/* 菜单 */
.web2pdf-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: none;
  z-index: 100003;
  min-width: 180px;
  max-width: 250px;
  padding: 8px 0;
}

.web2pdf-menu.show {
  display: block;
}

.menu-item {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #333;
  transition: background-color 0.2s;
  white-space: nowrap;
  font-size: 14px;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-item:active {
  background-color: #e8e8e8;
}

.menu-item svg {
  flex-shrink: 0;
  fill: currentColor;
  opacity: 0.7;
}

.menu-item#switchLang {
  border-top: 1px solid #eee;
}

/* 阅读模式 */
.web2pdf-reader-mode {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  z-index: 100000;
  padding: 40px;
  overflow-y: auto;
  line-height: 1.8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.web2pdf-reader-mode .web2pdf-content {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 60px;
  color: #333;
}

.web2pdf-reader-mode .web2pdf-content,
.web2pdf-reader-mode .web2pdf-content > * {
  background-color: transparent !important;
  background-image: none !important;
}

.web2pdf-reader-mode .web2pdf-content a {
  color: #1a73e8;
}

.web2pdf-reader-mode .web2pdf-content a:hover {
  color: #1557b0;
}

.web2pdf-reader-mode .web2pdf-floating-button {
  z-index: 100002;
}

.web2pdf-reader-mode img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 20px auto;
}

/* 关闭按钮 */
.web2pdf-close-button {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  z-index: 100001;
  font-size: 14px;
  color: #666;
}

.web2pdf-close-button:hover {
  background: #f5f5f5;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.web2pdf-close-button:active {
  transform: scale(0.98);
}

.web2pdf-close-button svg {
  width: 20px;
  height: 20px;
  color: #666;
}

/* 编辑模式 */
.web2pdf-content.editing {
  outline: 2px dashed #4CAF50;
  outline-offset: 10px;
  padding: 10px;
}

.editing-toolbar {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 8px;
  z-index: 100002;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  max-width: 90vw;
}

.editing-toolbar button {
  min-width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #333;
  padding: 0 8px;
}

.editing-toolbar button svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.editing-toolbar button:hover {
  background: #e0e0e0;
}

.editing-toolbar button:active {
  background: #d0d0d0;
  transform: scale(0.95);
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #ddd;
  margin: 0 4px;
  align-self: center;
}

[contenteditable="true"]:focus {
  outline: none;
}

/* 元素控制 */
.element-controls {
  position: absolute;
  top: -5px;
  right: -5px;
  display: none;
  background: rgba(244, 67, 54, 0.9);
  border-radius: 4px;
  z-index: 100;
  pointer-events: auto;
}

[contenteditable="true"] *:hover > .element-controls {
  display: block;
}

.web2pdf-reader-mode.menu-open [contenteditable="true"] *:hover > .element-controls {
  display: none !important;
}

.web2pdf-reader-mode.menu-open [contenteditable="true"] .image-wrapper:hover .image-resizer {
  display: none !important;
}

.element-controls button {
  padding: 4px 8px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.element-controls button:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 图片调整 */
.image-wrapper {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.image-resizer {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 12px;
  height: 12px;
  background: #4CAF50;
  border: 2px solid white;
  border-radius: 50%;
  cursor: se-resize;
  display: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

[contenteditable="true"] .image-wrapper:hover .image-resizer {
  display: block;
}

/* 加载提示 */
.web2pdf-loading-tip {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 24px 32px;
  border-radius: 12px;
  z-index: 100001;
  text-align: center;
  font-size: 14px;
  min-width: 200px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* 打印样式 */
@media print {
  .web2pdf-floating-button,
  .web2pdf-menu,
  .web2pdf-close-button,
  .editing-toolbar,
  .element-controls,
  .image-resizer {
    display: none !important;
  }
}

/* 子菜单 */
.menu-item.has-submenu {
  position: relative;
}

.menu-item.has-submenu > .arrow {
  margin-left: auto;
  opacity: 0.5;
  flex-shrink: 0;
}

.menu-item.has-submenu > .submenu {
  display: none;
  position: absolute;
  left: 100%;
  top: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 160px;
  z-index: 100004;
  padding: 8px 0;
}

.menu-item.has-submenu > .submenu > .menu-item {
  padding: 10px 16px;
  font-size: 13px;
  cursor: pointer;
}

.menu-item.has-submenu > .submenu > .menu-item:hover {
  background-color: #f5f5f5;
}

.web2pdf-menu.submenu-left .menu-item.has-submenu > .submenu {
  left: auto;
  right: 100%;
}

/* 颜色选择器 */
.color-picker-popup {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  padding: 12px;
  width: 280px;
  font-size: 13px;
}

.color-picker-header {
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.color-picker-presets {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 3px;
  margin-bottom: 12px;
}

.color-preset {
  width: 22px;
  height: 22px;
  border-radius: 3px;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: transform 0.1s, box-shadow 0.1s;
}

.color-preset:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1;
  position: relative;
}

.color-preset[data-color="#ffffff"] {
  border: 1px solid #ccc;
}

.color-picker-custom {
  margin-bottom: 12px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.color-picker-custom label {
  display: block;
  margin-bottom: 6px;
  color: #666;
  font-size: 12px;
}

.color-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input-picker {
  width: 40px;
  height: 32px;
  padding: 2px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  background: white;
}

.color-input-picker::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-input-picker::-webkit-color-swatch {
  border-radius: 2px;
  border: none;
}

.color-input-text {
  flex: 1;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
}

.color-input-text:focus {
  outline: none;
  border-color: #4CAF50;
}

.color-apply-btn {
  height: 32px;
  padding: 0 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.color-apply-btn:hover {
  background: #45a049;
}

.color-picker-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.color-cancel-btn,
.color-clear-btn {
  height: 28px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s;
}

.color-cancel-btn:hover {
  background: #f5f5f5;
}

.color-clear-btn {
  color: #f44336;
  border-color: #f44336;
}

.color-clear-btn:hover {
  background: #fff5f5;
}
    `);


    // ============================================
    // 撤销/重做历史管理
    // ============================================
    const historyManager = {
        undoStack: [],
        redoStack: [],
        maxHistory: 50,
        isRecording: true,
        contentElement: null,
        lastSavedState: null,

        init(element) {
            this.contentElement = element;
            this.undoStack = [];
            this.redoStack = [];
            this.isRecording = true;
            this.lastSavedState = null;
            this.saveState();
        },

        saveState() {
            if (!this.isRecording || !this.contentElement) return;
            
            const clone = this.contentElement.cloneNode(true);
            clone.querySelectorAll('.element-controls, .image-resizer, .image-wrapper').forEach(el => {
                if (el.classList.contains('image-wrapper')) {
                    const img = el.querySelector('img');
                    if (img) el.parentNode.insertBefore(img, el);
                    el.remove();
                } else {
                    el.remove();
                }
            });
            
            const state = clone.innerHTML;
            if (state === this.lastSavedState) return;
            
            this.lastSavedState = state;
            this.undoStack.push(state);
            this.redoStack = [];
            
            if (this.undoStack.length > this.maxHistory) {
                this.undoStack.shift();
            }
        },

        undo() {
            if (this.undoStack.length <= 1 || !this.contentElement) return false;
            
            this.isRecording = false;
            const currentState = this.undoStack.pop();
            this.redoStack.push(currentState);
            
            const previousState = this.undoStack[this.undoStack.length - 1];
            this.lastSavedState = previousState;
            this.contentElement.innerHTML = previousState;
            
            this._refreshControls();
            
            setTimeout(() => { this.isRecording = true; }, 100);
            return true;
        },

        redo() {
            if (this.redoStack.length === 0 || !this.contentElement) return false;
            
            this.isRecording = false;
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            this.lastSavedState = nextState;
            this.contentElement.innerHTML = nextState;
            
            this._refreshControls();
            
            setTimeout(() => { this.isRecording = true; }, 100);
            return true;
        },

        _refreshControls() {
            if (!this.contentElement) return;
            
            this.contentElement.querySelectorAll('.element-controls').forEach(el => el.remove());
            this.contentElement.querySelectorAll('.image-resizer').forEach(el => el.remove());
            
            addElementControls(this.contentElement);
        },

        canUndo() { return this.undoStack.length > 1; },
        canRedo() { return this.redoStack.length > 0; },

        clear() {
            this.undoStack = [];
            this.redoStack = [];
            this.contentElement = null;
            this.lastSavedState = null;
        }
    };

    // ============================================
    // 工具函数
    // ============================================
    
    function getColorBrightness(color) {
        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            return (r * 299 + g * 587 + b * 114) / 1000;
        }
        
        const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (hexMatch) {
            const r = parseInt(hexMatch[1], 16);
            const g = parseInt(hexMatch[2], 16);
            const b = parseInt(hexMatch[3], 16);
            return (r * 299 + g * 587 + b * 114) / 1000;
        }
        
        const shortHexMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
        if (shortHexMatch) {
            const r = parseInt(shortHexMatch[1] + shortHexMatch[1], 16);
            const g = parseInt(shortHexMatch[2] + shortHexMatch[2], 16);
            const b = parseInt(shortHexMatch[3] + shortHexMatch[3], 16);
            return (r * 299 + g * 587 + b * 114) / 1000;
        }
        
        return 128;
    }

    function isColorTooLight(color) {
        return getColorBrightness(color) > 200;
    }

    function isNearWhiteOrTransparent(color) {
        if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return true;
        return getColorBrightness(color) > 240;
    }

    function fixTextColors(container) {
        if (!container) return;
        
        const elements = container.querySelectorAll('*');
        
        elements.forEach(el => {
            if (el.tagName === 'IMG' || el.tagName === 'SVG' || el.tagName === 'VIDEO') return;
            
            const style = window.getComputedStyle(el);
            const color = style.color;
            
            if (isColorTooLight(color)) {
                const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (rgbMatch) {
                    const r = parseInt(rgbMatch[1]);
                    const g = parseInt(rgbMatch[2]);
                    const b = parseInt(rgbMatch[3]);
                    
                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    const saturation = max === 0 ? 0 : (max - min) / max;
                    
                    if (saturation > 0.2) {
                        const factor = 0.5;
                        el.style.color = `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
                    } else {
                        el.style.color = '#333';
                    }
                } else {
                    el.style.color = '#333';
                }
            }
            
            const inlineTags = ['SPAN', 'MARK', 'FONT', 'A', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL', 'SUB', 'SUP'];
            if (!inlineTags.includes(el.tagName)) {
                const bgColor = style.backgroundColor;
                if (!isNearWhiteOrTransparent(bgColor)) {
                    const brightness = getColorBrightness(bgColor);
                    if (brightness < 200) {
                        el.style.backgroundColor = 'transparent';
                    }
                }
            }
        });
    }

    function createLoadingTip(message) {
        const tip = document.createElement('div');
        tip.className = 'web2pdf-loading-tip';
        tip.textContent = message;
        document.body.appendChild(tip);
        return tip;
    }

    function updateLoadingTip(tip, status, message, delay = 2000) {
        if (!tip) return;
        
        tip.style.background = status === 'success' 
            ? 'rgba(76, 175, 80, 0.9)' 
            : 'rgba(244, 67, 54, 0.9)';
        tip.textContent = message;
        
        if (delay > 0) {
            setTimeout(() => tip.remove(), delay);
        }
    }

    // ============================================
    // 存储位置（使用 GM_setValue/GM_getValue）
    // ============================================
    function getButtonPosition() {
        return GM_getValue('buttonPosition', { left: '20px', bottom: '20px' });
    }

    function saveButtonPosition(left, top) {
        GM_setValue('buttonPosition', { left, top });
    }


    // ============================================
    // 浮动按钮相关
    // ============================================
    
    function createFloatingButton() {
        if (document.querySelector('.web2pdf-floating-button')) return;
        
        const button = document.createElement('button');
        button.className = 'web2pdf-floating-button';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
            </svg>
        `;

        const pos = getButtonPosition();
        if (pos.top) {
            button.style.left = pos.left;
            button.style.top = pos.top;
            button.style.bottom = 'auto';
        } else {
            button.style.left = pos.left || '20px';
            button.style.bottom = pos.bottom || '20px';
        }

        setupDraggable(button);
        button.addEventListener('click', showMenu);
        document.body.appendChild(button);
    }

    function setupDraggable(element) {
        let isDragging = false;
        let hasMoved = false;
        let initialX, initialY;

        element.addEventListener('mousedown', function(e) {
            if (e.target.closest('.web2pdf-menu')) return;
            
            isDragging = true;
            hasMoved = false;
            element.style.transition = 'none';
            
            const rect = element.getBoundingClientRect();
            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;
            
            element.classList.add('dragging');
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;

            e.preventDefault();
            hasMoved = true;
            
            let currentX = e.clientX - initialX;
            let currentY = e.clientY - initialY;
            
            const buttonRect = element.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            currentX = Math.max(0, Math.min(currentX, viewportWidth - buttonRect.width));
            currentY = Math.max(0, Math.min(currentY, viewportHeight - buttonRect.height));
            
            element.style.left = currentX + 'px';
            element.style.top = currentY + 'px';
            element.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', function() {
            if (!isDragging) return;
            
            isDragging = false;
            element.style.transition = 'background-color 0.2s';
            element.classList.remove('dragging');
            
            if (hasMoved) {
                saveButtonPosition(element.style.left, element.style.top);
            }
        });
    }

    // ============================================
    // 菜单相关
    // ============================================
    
    function createMenu() {
        const existingMenu = document.querySelector('.web2pdf-menu');
        if (existingMenu) existingMenu.remove();
        
        const menu = document.createElement('div');
        menu.className = 'web2pdf-menu';
        menu.innerHTML = `
            <div class="menu-item" id="readMode">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
                <span>${t('readMode')}</span>
            </div>
            <div class="menu-item has-submenu" id="exportMenu">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                <span>${t('exportAs')}</span>
                <svg class="arrow" viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                </svg>
                <div class="submenu">
                    <div class="menu-item" id="exportPDF">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
                        </svg>
                        <span>${t('exportPDF')}</span>
                    </div>
                    <div class="menu-item" id="exportWord">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                        </svg>
                        <span>${t('exportWord')}</span>
                    </div>
                    <div class="menu-item" id="exportHTML">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                        </svg>
                        <span>${t('exportHTML')}</span>
                    </div>
                    <div class="menu-item" id="exportMarkdown">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41zM6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.89v6.38h1.92zM19.69 12h-1.92V8.81h-1.92V12h-1.93l2.89 3.28L19.69 12z"/>
                        </svg>
                        <span>${t('exportMarkdown')}</span>
                    </div>
                </div>
            </div>
            <div class="menu-item" id="switchLang">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                </svg>
                <span>${t('switchLang')}</span>
            </div>
        `;
        document.body.appendChild(menu);

        document.getElementById('readMode').addEventListener('click', toggleReadMode);
        document.getElementById('exportPDF').addEventListener('click', () => exportContent('pdf'));
        document.getElementById('exportWord').addEventListener('click', () => exportContent('word'));
        document.getElementById('exportHTML').addEventListener('click', () => exportContent('html'));
        document.getElementById('exportMarkdown').addEventListener('click', () => exportContent('markdown'));
        document.getElementById('switchLang').addEventListener('click', handleLanguageSwitch);
        
        setupSubmenuHover(menu);
    }

    function setupSubmenuHover(menu) {
        const submenuItems = menu.querySelectorAll('.menu-item.has-submenu');
        
        submenuItems.forEach(item => {
            let hideTimeout = null;
            const submenu = item.querySelector('.submenu');
            
            const showSubmenu = () => {
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
                submenu.style.display = 'block';
            };
            
            const hideSubmenu = () => {
                hideTimeout = setTimeout(() => {
                    submenu.style.display = 'none';
                }, 100);
            };
            
            item.addEventListener('mouseenter', showSubmenu);
            item.addEventListener('mouseleave', hideSubmenu);
            submenu.addEventListener('mouseenter', showSubmenu);
            submenu.addEventListener('mouseleave', hideSubmenu);
        });
    }

    function handleLanguageSwitch() {
        const currentLang = getUserLanguage();
        const newLang = currentLang === 'zh' ? 'en' : 'zh';
        setUserLanguage(newLang);
        
        createMenu();
        
        const readerMode = document.querySelector('.web2pdf-reader-mode');
        if (readerMode) {
            const oldMenu = readerMode.querySelector('.web2pdf-menu');
            if (oldMenu) oldMenu.remove();
            createReaderModeMenu(readerMode);
        }
    }

    function showMenu(event) {
        event.stopPropagation();
        const button = event.currentTarget;
        const menu = document.querySelector('.web2pdf-menu');
        const readerMode = document.querySelector('.web2pdf-reader-mode');
        
        if (!menu) return;
        
        const buttonRect = button.getBoundingClientRect();
        
        if (buttonRect.left < window.innerWidth / 2) {
            menu.style.left = (buttonRect.right + 10) + 'px';
            menu.style.right = 'auto';
            menu.classList.remove('submenu-left');
        } else {
            menu.style.right = (window.innerWidth - buttonRect.left + 10) + 'px';
            menu.style.left = 'auto';
            menu.classList.add('submenu-left');
        }

        const menuHeight = menu.offsetHeight || 120;
        if (buttonRect.top + menuHeight > window.innerHeight) {
            menu.style.bottom = (window.innerHeight - buttonRect.top + 10) + 'px';
            menu.style.top = 'auto';
        } else {
            menu.style.top = buttonRect.top + 'px';
            menu.style.bottom = 'auto';
        }

        const isShowing = menu.classList.toggle('show');
        
        if (readerMode) {
            if (isShowing) {
                readerMode.classList.add('menu-open');
            } else {
                readerMode.classList.remove('menu-open');
            }
        }
        
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && !e.target.closest('.web2pdf-floating-button')) {
                menu.classList.remove('show');
                if (readerMode) {
                    readerMode.classList.remove('menu-open');
                }
                document.removeEventListener('click', closeMenu);
            }
        };
        
        document.addEventListener('click', closeMenu);
    }


    // ============================================
    // 阅读模式相关
    // ============================================
    
    function toggleReadMode() {
        const existingReader = document.querySelector('.web2pdf-reader-mode');
        if (existingReader) {
            exitReaderMode(existingReader);
            return;
        }

        const loadingTip = createLoadingTip(t('loading'));

        try {
            const content = extractMainContent();
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = content;

            preloadImages(tempContainer, loadingTip).then(() => {
                const readerMode = document.createElement('div');
                readerMode.className = 'web2pdf-reader-mode';
                readerMode.innerHTML = tempContainer.innerHTML;
                
                fixTextColors(readerMode.querySelector('.web2pdf-content'));

                addCloseButton(readerMode);

                const escHandler = (e) => {
                    if (e.key === 'Escape') {
                        exitReaderMode(readerMode);
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                document.addEventListener('keydown', escHandler);

                document.body.appendChild(readerMode);
                document.body.style.overflow = 'hidden';
                document.querySelector('.web2pdf-menu')?.classList.remove('show');

                document.querySelector('.web2pdf-floating-button')?.remove();
                document.querySelector('body > .web2pdf-menu')?.remove();

                createReaderModeControls(readerMode);

                updateLoadingTip(loadingTip, 'success', t('loadComplete'));
                
                setTimeout(() => toggleEditMode(readerMode), 2000);
            });

        } catch (error) {
            console.error('Error loading content:', error);
            updateLoadingTip(loadingTip, 'error', t('loadFailed'));
        }
    }

    function exitReaderMode(readerMode) {
        readerMode.remove();
        document.body.style.overflow = '';
        createFloatingButton();
        createMenu();
    }

    function addCloseButton(readerMode) {
        const closeButton = document.createElement('button');
        closeButton.className = 'web2pdf-close-button';
        closeButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            <span>${t('close')}</span>
        `;
        closeButton.addEventListener('click', () => exitReaderMode(readerMode));
        readerMode.appendChild(closeButton);
    }

    function createReaderModeControls(readerMode) {
        const button = document.createElement('button');
        button.className = 'web2pdf-floating-button';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
            </svg>
        `;

        const pos = getButtonPosition();
        if (pos.top) {
            button.style.left = pos.left;
            button.style.top = pos.top;
            button.style.bottom = 'auto';
        } else {
            button.style.left = pos.left || '20px';
            button.style.bottom = pos.bottom || '20px';
        }

        setupDraggable(button);
        button.addEventListener('click', showMenu);
        readerMode.appendChild(button);

        createReaderModeMenu(readerMode);
    }

    function createReaderModeMenu(readerMode) {
        const menu = document.createElement('div');
        menu.className = 'web2pdf-menu';
        menu.innerHTML = `
            <div class="menu-item" id="toggleEdit">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                <span>${t('editMode')}</span>
            </div>
            <div class="menu-item has-submenu" id="exportMenu">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                <span>${t('exportAs')}</span>
                <svg class="arrow" viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                </svg>
                <div class="submenu">
                    <div class="menu-item" id="exportPDF">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
                        </svg>
                        <span>${t('exportPDF')}</span>
                    </div>
                    <div class="menu-item" id="exportWord">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                        </svg>
                        <span>${t('exportWord')}</span>
                    </div>
                    <div class="menu-item" id="exportHTML">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                        </svg>
                        <span>${t('exportHTML')}</span>
                    </div>
                    <div class="menu-item" id="exportMarkdown">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41zM6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.89v6.38h1.92zM19.69 12h-1.92V8.81h-1.92V12h-1.93l2.89 3.28L19.69 12z"/>
                        </svg>
                        <span>${t('exportMarkdown')}</span>
                    </div>
                </div>
            </div>
            <div class="menu-item" id="switchLang">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                </svg>
                <span>${t('switchLang')}</span>
            </div>
        `;
        readerMode.appendChild(menu);

        menu.querySelector('#toggleEdit').addEventListener('click', () => {
            toggleEditMode(readerMode);
            menu.classList.remove('show');
        });

        menu.querySelector('#exportPDF').addEventListener('click', () => {
            exportContent('pdf');
            menu.classList.remove('show');
        });
        
        menu.querySelector('#exportWord').addEventListener('click', () => {
            exportContent('word');
            menu.classList.remove('show');
        });
        
        menu.querySelector('#exportHTML').addEventListener('click', () => {
            exportContent('html');
            menu.classList.remove('show');
        });
        
        menu.querySelector('#exportMarkdown').addEventListener('click', () => {
            exportContent('markdown');
            menu.classList.remove('show');
        });

        menu.querySelector('#switchLang').addEventListener('click', function() {
            const currentLang = getUserLanguage();
            const newLang = currentLang === 'zh' ? 'en' : 'zh';
            setUserLanguage(newLang);
            
            const oldMenu = readerMode.querySelector('.web2pdf-menu');
            if (oldMenu) oldMenu.remove();
            createReaderModeMenu(readerMode);
        });

        setupSubmenuHover(menu);

        return menu;
    }


    // ============================================
    // 图片预加载
    // ============================================
    
    async function preloadImages(container, loadingTip) {
        const images = container.getElementsByTagName('img');
        const totalImages = images.length;
        let loadedCount = 0;

        if (totalImages === 0) {
            if (loadingTip) {
                loadingTip.textContent = t('noImages');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            return;
        }

        if (loadingTip) {
            loadingTip.innerHTML = `
                <div>${t('loadingImages')} (0/${totalImages})</div>
                <div class="progress-bar" style="
                    width: 200px;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 3px;
                    margin: 10px auto;
                    overflow: hidden;
                ">
                    <div class="progress" style="
                        height: 100%;
                        width: 0%;
                        background: #4CAF50;
                        transition: width 0.3s ease;
                    "></div>
                </div>
                <div class="loading-details" style="
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.8);
                    margin-top: 5px;
                ">${t('preparing')}</div>
            `;
        }

        const imageLoadPromises = Array.from(images).map((img) => {
            return new Promise((resolve) => {
                let originalSrc = img.src;
                for (const attr of LAZY_LOAD_ATTRS) {
                    const lazySrc = img.getAttribute(attr);
                    if (lazySrc) {
                        originalSrc = lazySrc;
                        break;
                    }
                }
                
                if (!originalSrc) {
                    resolve();
                    return;
                }

                const tempImg = new Image();
                
                const onComplete = (success) => {
                    loadedCount++;
                    if (loadingTip) {
                        const progress = Math.round((loadedCount / totalImages) * 100);
                        const progressBar = loadingTip.querySelector('.progress');
                        const countDiv = loadingTip.querySelector('div');
                        
                        if (countDiv) {
                            countDiv.textContent = `${t('loadingImages')} (${loadedCount}/${totalImages})`;
                        }
                        if (progressBar) {
                            progressBar.style.width = `${progress}%`;
                        }
                    }

                    if (success) {
                        img.src = originalSrc;
                        LAZY_LOAD_ATTRS.forEach(attr => img.removeAttribute(attr));
                        img.removeAttribute('loading');
                        img.classList.remove('lazyload', 'lazy');
                    }
                    resolve();
                };

                tempImg.onload = () => onComplete(true);
                tempImg.onerror = () => {
                    console.warn('Failed to load image:', originalSrc);
                    onComplete(false);
                };
                tempImg.src = originalSrc;
            });
        });

        await Promise.all(imageLoadPromises);

        if (loadingTip) {
            const progressBar = loadingTip.querySelector('.progress');
            if (progressBar) {
                progressBar.style.width = '100%';
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // ============================================
    // 内容提取
    // ============================================
    
    function extractMainContent() {
        let mainContent = null;
        
        for (const selector of CONTENT_SELECTORS) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 100) {
                mainContent = element;
                break;
            }
        }

        if (!mainContent) {
            mainContent = document.body;
        }

        const container = document.createElement('div');
        container.className = 'web2pdf-content';
        
        const title = document.createElement('h1');
        title.style.marginBottom = '20px';
        title.textContent = document.title;
        container.appendChild(title);

        const contentClone = mainContent.cloneNode(true);

        REMOVE_SELECTORS.forEach(selector => {
            contentClone.querySelectorAll(selector).forEach(el => {
                el.parentNode?.removeChild(el);
            });
        });

        contentClone.querySelectorAll('img').forEach(img => {
            if (img.src) {
                img.src = img.src;
            }
        });

        container.appendChild(contentClone);
        return container.outerHTML;
    }


    // ============================================
    // 导出功能
    // ============================================
    
    function getCleanContent() {
        const readerMode = document.querySelector('.web2pdf-reader-mode');
        let content;
        
        if (readerMode) {
            const clone = readerMode.cloneNode(true);
            clone.querySelectorAll('.web2pdf-floating-button, .web2pdf-menu, .web2pdf-close-button, .editing-toolbar, .element-controls, .image-resizer').forEach(el => el.remove());
            
            clone.querySelectorAll('.image-wrapper').forEach(wrapper => {
                const img = wrapper.querySelector('img');
                if (img) {
                    wrapper.parentNode.insertBefore(img, wrapper);
                    wrapper.remove();
                }
            });
            
            content = clone.querySelector('.web2pdf-content') || clone;
        } else {
            const temp = document.createElement('div');
            temp.innerHTML = extractMainContent();
            content = temp;
        }
        
        content.querySelectorAll('*').forEach(el => {
            el.removeAttribute('contenteditable');
            el.classList.remove('editing');
        });
        
        return content;
    }

    function getFileName() {
        return document.title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100) || 'webpage';
    }

    async function exportContent(format) {
        try {
            const content = getCleanContent();
            const fileName = getFileName();
            
            switch (format) {
                case 'pdf':
                    await exportToPDF(content, fileName);
                    break;
                case 'word':
                    await exportToWord(content, fileName);
                    break;
                case 'html':
                    await exportToHTML(content, fileName);
                    break;
                case 'markdown':
                    await exportToMarkdown(content, fileName);
                    break;
            }
        } catch (error) {
            console.error('Export error:', error);
            const errorTip = createLoadingTip(t('pdfError'));
            updateLoadingTip(errorTip, 'error', t('pdfError'));
        }
    }

    async function exportToPDF(content, fileName) {
        await preloadImages(content, null);
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            throw new Error('无法打开打印窗口，请检查弹窗拦截设置');
        }
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${document.title}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    * {
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                        line-height: 1.8;
                        color: #333;
                        margin: 0;
                        padding: 20px;
                        max-width: 100%;
                    }
                    img {
                        max-width: 100%;
                        height: auto;
                        display: block;
                        margin: 15px auto;
                        page-break-inside: avoid;
                    }
                    h1, h2, h3, h4, h5, h6 {
                        page-break-after: avoid;
                        margin: 1em 0 0.5em;
                    }
                    p {
                        margin: 0.5em 0;
                        orphans: 3;
                        widows: 3;
                    }
                    pre, blockquote {
                        page-break-inside: avoid;
                    }
                    a {
                        color: #1a73e8;
                        text-decoration: none;
                    }
                    [style*="background"] {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    mark, span[style*="background"], font[style*="background"] {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                </style>
            </head>
            <body>
                ${content.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };
    }

    async function exportToWord(content, fileName) {
        const loadingTip = createLoadingTip('正在处理图片...');
        
        try {
            const clone = content.cloneNode(true);
            
            const readerMode = document.querySelector('.web2pdf-reader-mode');
            const originalContent = readerMode ? 
                (readerMode.querySelector('.web2pdf-content') || readerMode) : 
                document.body;
            
            const cloneImages = clone.querySelectorAll('img');
            const totalImages = cloneImages.length;
            
            let imageCount = 0;
            let failedCount = 0;
            
            for (let i = 0; i < cloneImages.length; i++) {
                const cloneImg = cloneImages[i];
                
                if (loadingTip) {
                    loadingTip.textContent = `正在处理图片 (${i + 1}/${totalImages})...`;
                }
                
                let originalImg = null;
                if (cloneImg.src) {
                    originalImg = originalContent.querySelector(`img[src="${cloneImg.src}"]`);
                    if (!originalImg) {
                        const srcPart = cloneImg.src.split('/').pop();
                        if (srcPart) {
                            originalImg = originalContent.querySelector(`img[src*="${srcPart}"]`);
                        }
                    }
                }
                
                try {
                    const base64 = await imageToBase64(cloneImg.src, originalImg);
                    if (base64) {
                        cloneImg.src = base64;
                        imageCount++;
                    } else {
                        failedCount++;
                        cloneImg.style.display = 'none';
                    }
                } catch (e) {
                    console.warn('[Web2PDF] Failed to convert image:', cloneImg.src, e);
                    failedCount++;
                    cloneImg.style.display = 'none';
                }
            }
            
            if (loadingTip) {
                loadingTip.textContent = '正在生成文档...';
            }
            
            const html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>${document.title}</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        body {
            font-family: "Microsoft YaHei", "SimSun", Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
        }
        h1 { font-size: 22pt; color: #222; margin: 20pt 0 10pt; }
        h2 { font-size: 18pt; color: #222; margin: 16pt 0 8pt; }
        h3 { font-size: 14pt; color: #222; margin: 12pt 0 6pt; }
        p { margin: 6pt 0; }
        img { 
            max-width: 100%; 
            height: auto; 
            display: block;
            margin: 10pt auto;
        }
        a { color: #1a73e8; text-decoration: underline; }
        ul, ol { margin: 6pt 0; padding-left: 20pt; }
        li { margin: 3pt 0; }
        blockquote {
            border-left: 3pt solid #ddd;
            margin: 10pt 0;
            padding-left: 10pt;
            color: #666;
        }
        pre, code {
            font-family: "Consolas", "Courier New", monospace;
            background: #f5f5f5;
            padding: 2pt 4pt;
        }
        pre {
            padding: 10pt;
            overflow-x: auto;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    ${clone.innerHTML}
    <br><br>
    <hr>
    <p style="font-size: 10pt; color: #999;">
        来源: <a href="${window.location.href}">${window.location.href}</a><br>
        导出时间: ${new Date().toLocaleString()}
    </p>
</body>
</html>`;
            
            const blob = new Blob(['\ufeff' + html], { 
                type: 'application/vnd.ms-word;charset=utf-8' 
            });
            downloadBlob(blob, fileName + '.doc');
            
            updateLoadingTip(loadingTip, 'success', `导出成功！(${imageCount}张图片)`);
            
        } catch (error) {
            console.error('[Web2PDF] Export to Word failed:', error);
            updateLoadingTip(loadingTip, 'error', '导出失败: ' + error.message);
        }
    }


    async function imageToBase64(src, imgElement = null) {
        if (!src || src.startsWith('data:')) {
            return src;
        }
        
        // 方法1: 如果提供了已加载的图片元素，尝试直接用 canvas 绘制
        if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = imgElement.naturalWidth;
                canvas.height = imgElement.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(imgElement, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                if (dataUrl && dataUrl !== 'data:,' && dataUrl.length > 100) {
                    return dataUrl;
                }
            } catch (e) {
                // 跨域图片会在这里失败
            }
        }
        
        // 方法2: 使用 GM_xmlhttpRequest（Tampermonkey 特有，可跨域）
        try {
            const dataUrl = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: src,
                    responseType: 'blob',
                    timeout: 10000,
                    onload: function(response) {
                        if (response.status === 200) {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = () => reject(new Error('FileReader failed'));
                            reader.readAsDataURL(response.response);
                        } else {
                            reject(new Error('GM_xmlhttpRequest status: ' + response.status));
                        }
                    },
                    onerror: () => reject(new Error('GM_xmlhttpRequest error')),
                    ontimeout: () => reject(new Error('GM_xmlhttpRequest timeout'))
                });
            });
            
            if (dataUrl && dataUrl.length > 100) {
                return dataUrl;
            }
        } catch (e) {
            console.log('[Web2PDF] GM_xmlhttpRequest failed for:', src.substring(0, 50));
        }
        
        // 方法3: 创建新图片元素并用 canvas 绘制
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            const timeout = setTimeout(() => {
                resolve(null);
            }, 10000);
            
            img.onload = () => {
                clearTimeout(timeout);
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width || 100;
                    canvas.height = img.naturalHeight || img.height || 100;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL('image/png');
                    if (dataUrl && dataUrl !== 'data:,' && dataUrl.length > 100) {
                        resolve(dataUrl);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                resolve(null);
            };
            
            const separator = src.includes('?') ? '&' : '?';
            img.src = src + separator + '_t=' + Date.now();
        });
    }

    async function exportToHTML(content, fileName) {
        const loadingTip = createLoadingTip('正在处理图片...');
        
        try {
            const clone = content.cloneNode(true);
            
            const readerMode = document.querySelector('.web2pdf-reader-mode');
            const originalContent = readerMode ? 
                (readerMode.querySelector('.web2pdf-content') || readerMode) : 
                document.body;
            
            const cloneImages = clone.querySelectorAll('img');
            const totalImages = cloneImages.length;
            
            let imageCount = 0;
            
            for (let i = 0; i < cloneImages.length; i++) {
                const cloneImg = cloneImages[i];
                
                if (loadingTip) {
                    loadingTip.textContent = `正在处理图片 (${i + 1}/${totalImages})...`;
                }
                
                let originalImg = null;
                if (cloneImg.src) {
                    originalImg = originalContent.querySelector(`img[src="${cloneImg.src}"]`);
                    if (!originalImg) {
                        const srcPart = cloneImg.src.split('/').pop();
                        if (srcPart) {
                            originalImg = originalContent.querySelector(`img[src*="${srcPart}"]`);
                        }
                    }
                }
                
                try {
                    const base64 = await imageToBase64(cloneImg.src, originalImg);
                    if (base64) {
                        cloneImg.src = base64;
                        imageCount++;
                    }
                } catch (e) {
                    console.warn('[Web2PDF] Failed to convert image:', cloneImg.src);
                }
            }
            
            if (loadingTip) {
                loadingTip.textContent = '正在生成文档...';
            }
            
            const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.8;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #fff;
        }
        img { max-width: 100%; height: auto; display: block; margin: 20px auto; }
        h1, h2, h3, h4, h5, h6 { color: #222; margin: 1.5em 0 0.5em; }
        h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        a { color: #1a73e8; text-decoration: none; }
        a:hover { text-decoration: underline; }
        pre, code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
        pre { padding: 15px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding-left: 1em; color: #666; }
    </style>
</head>
<body>
    ${clone.innerHTML}
    <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
        <p>来源: <a href="${window.location.href}">${window.location.href}</a></p>
        <p>保存时间: ${new Date().toLocaleString()}</p>
    </footer>
</body>
</html>`;
            
            const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            downloadBlob(blob, fileName + '.html');
            
            updateLoadingTip(loadingTip, 'success', `导出成功！(${imageCount}张图片)`);
            
        } catch (error) {
            console.error('[Web2PDF] Export to HTML failed:', error);
            updateLoadingTip(loadingTip, 'error', '导出失败: ' + error.message);
        }
    }

    async function exportToMarkdown(content, fileName) {
        const loadingTip = createLoadingTip('正在生成 Markdown...');
        
        try {
            const markdown = htmlToMarkdown(content);
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            downloadBlob(blob, fileName + '.md');
            
            updateLoadingTip(loadingTip, 'success', '导出成功！');
        } catch (error) {
            console.error('[Web2PDF] Export to Markdown failed:', error);
            updateLoadingTip(loadingTip, 'error', '导出失败: ' + error.message);
        }
    }


    function htmlToMarkdown(element) {
        let md = `# ${document.title}\n\n`;
        md += `> 来源: ${window.location.href}\n\n`;
        md += `---\n\n`;
        
        const getColorStyles = (node) => {
            const styles = [];
            
            const styleAttr = node.getAttribute('style') || '';
            const colorMatch = styleAttr.match(/(?:^|;)\s*color:\s*([^;]+)/i);
            const bgColorMatch = styleAttr.match(/(?:^|;)\s*background(?:-color)?:\s*([^;]+)/i);
            
            if (colorMatch) styles.push(`color:${colorMatch[1].trim()}`);
            if (bgColorMatch) styles.push(`background-color:${bgColorMatch[1].trim()}`);
            
            const bgColorAttr = node.getAttribute('bgcolor');
            if (bgColorAttr && !bgColorMatch) {
                styles.push(`background-color:${bgColorAttr}`);
            }
            
            const colorAttr = node.getAttribute('color');
            if (colorAttr && !colorMatch) {
                styles.push(`color:${colorAttr}`);
            }
            
            return styles;
        };
        
        const processNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }
            
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return '';
            }
            
            const tag = node.tagName.toLowerCase();
            const children = Array.from(node.childNodes).map(processNode).join('');
            const colorStyles = getColorStyles(node);
            
            const wrapWithColor = (content, isBlock = false) => {
                if (colorStyles.length > 0) {
                    const tag = isBlock ? 'div' : 'span';
                    return `<${tag} style="${colorStyles.join(';')}">${content}</${tag}>`;
                }
                return content;
            };
            
            switch (tag) {
                case 'h1': return `# ${children.trim()}\n\n`;
                case 'h2': return `## ${children.trim()}\n\n`;
                case 'h3': return `### ${children.trim()}\n\n`;
                case 'h4': return `#### ${children.trim()}\n\n`;
                case 'h5': return `##### ${children.trim()}\n\n`;
                case 'h6': return `###### ${children.trim()}\n\n`;
                case 'p': 
                    const pContent = children.trim();
                    if (colorStyles.length > 0) {
                        return `<p style="${colorStyles.join(';')}">${pContent}</p>\n\n`;
                    }
                    return `${pContent}\n\n`;
                case 'br': return '\n';
                case 'hr': return '\n---\n\n';
                case 'strong':
                case 'b': 
                    return wrapWithColor(`**${children}**`);
                case 'em':
                case 'i': 
                    return wrapWithColor(`*${children}*`);
                case 'u': 
                    if (colorStyles.length > 0) {
                        return `<u style="${colorStyles.join(';')}">${children}</u>`;
                    }
                    return `<u>${children}</u>`;
                case 'del':
                case 's': 
                case 'strike': 
                    return wrapWithColor(`~~${children}~~`);
                case 'sub': return `<sub>${children}</sub>`;
                case 'sup': return `<sup>${children}</sup>`;
                case 'code': return `\`${children}\``;
                case 'pre': return `\n\`\`\`\n${node.textContent.trim()}\n\`\`\`\n\n`;
                case 'blockquote': return `> ${children.trim().replace(/\n/g, '\n> ')}\n\n`;
                case 'a': 
                    const href = node.getAttribute('href') || '';
                    return `[${children}](${href})`;
                case 'img':
                    const src = node.getAttribute('src') || '';
                    const alt = node.getAttribute('alt') || 'image';
                    return `![${alt}](${src})\n\n`;
                case 'ul':
                    return Array.from(node.children).map(li => `- ${processNode(li).trim()}`).join('\n') + '\n\n';
                case 'ol':
                    return Array.from(node.children).map((li, i) => `${i + 1}. ${processNode(li).trim()}`).join('\n') + '\n\n';
                case 'li': return children;
                case 'mark':
                    const markStyles = colorStyles.length > 0 ? colorStyles : ['background-color:yellow'];
                    return `<mark style="${markStyles.join(';')}">${children}</mark>`;
                case 'font':
                    if (colorStyles.length > 0) {
                        return `<span style="${colorStyles.join(';')}">${children}</span>`;
                    }
                    return children;
                case 'span':
                    if (colorStyles.length > 0) {
                        return `<span style="${colorStyles.join(';')}">${children}</span>`;
                    }
                    return children;
                case 'div':
                case 'section':
                case 'article':
                    if (colorStyles.length > 0) {
                        return `<div style="${colorStyles.join(';')}">\n\n${children}\n\n</div>\n\n`;
                    }
                    return children;
                default:
                    if (colorStyles.length > 0) {
                        return `<span style="${colorStyles.join(';')}">${children}</span>`;
                    }
                    return children;
            }
        };
        
        md += processNode(element);
        md = md.replace(/\n{3,}/g, '\n\n');
        
        return md;
    }

    function downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }


    // ============================================
    // 编辑模式相关
    // ============================================
    
    function toggleEditMode(readerMode) {
        const content = readerMode.querySelector('.web2pdf-content') || readerMode;
        const isEditing = content.getAttribute('contenteditable') === 'true';
        
        if (isEditing) {
            content.setAttribute('contenteditable', 'false');
            content.classList.remove('editing');
            removeEditingToolbar();
            removeElementControls();
            
            if (content._web2pdfObserver) {
                content._web2pdfObserver.disconnect();
                delete content._web2pdfObserver;
            }
            
            historyManager.clear();
        } else {
            content.setAttribute('contenteditable', 'true');
            content.classList.add('editing');
            historyManager.init(content);
            createEditingToolbar(readerMode, content);
            addElementControls(content);
            
            setupContentChangeListener(content);
        }
    }

    function setupContentChangeListener(content) {
        let saveTimeout = null;
        
        const saveState = () => {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                historyManager.saveState();
            }, 300);
        };
        
        const observer = new MutationObserver((mutations) => {
            if (historyManager.isRecording) {
                saveState();
            }
        });
        
        observer.observe(content, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true
        });
        
        content._web2pdfObserver = observer;
        
        content.addEventListener('input', () => {
            saveState();
        });
        
        content.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    historyManager.undo();
                } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
                    e.preventDefault();
                    historyManager.redo();
                }
            }
        });
    }

    function createEditingToolbar(readerMode, content) {
        removeEditingToolbar();

        const toolbar = document.createElement('div');
        toolbar.className = 'editing-toolbar';
        toolbar.innerHTML = `
            <button data-command="bold" title="${t('bold')}"><b>B</b></button>
            <button data-command="italic" title="${t('italic')}"><i>I</i></button>
            <button data-command="underline" title="${t('underline')}"><u>U</u></button>
            <button data-command="strikeThrough" title="${t('strikethrough')}"><s>S</s></button>
            <span class="toolbar-divider"></span>
            <button data-command="formatBlock" data-value="h1" title="${t('heading1')}">H1</button>
            <button data-command="formatBlock" data-value="h2" title="${t('heading2')}">H2</button>
            <button data-command="formatBlock" data-value="h3" title="${t('heading3')}">H3</button>
            <button data-command="formatBlock" data-value="p" title="${t('paragraph')}">P</button>
            <button data-command="formatBlock" data-value="blockquote" title="${t('quote')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
            </button>
            <button data-command="formatBlock" data-value="pre" title="${t('codeBlock')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
            </button>
            <span class="toolbar-divider"></span>
            <button data-command="justifyLeft" title="${t('alignLeft')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/></svg>
            </button>
            <button data-command="justifyCenter" title="${t('alignCenter')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 3h18v2H3V3zm3 4h12v2H6V7zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z"/></svg>
            </button>
            <button data-command="justifyRight" title="${t('alignRight')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 3h18v2H3V3zm6 4h12v2H9V7zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z"/></svg>
            </button>
            <button data-command="justifyFull" title="${t('alignJustify')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/></svg>
            </button>
            <span class="toolbar-divider"></span>
            <button data-command="insertUnorderedList" title="${t('bulletList')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
            </button>
            <button data-command="insertOrderedList" title="${t('numberList')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
            </button>
            <button data-command="indent" title="${t('indent')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/></svg>
            </button>
            <button data-command="outdent" title="${t('outdent')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M11 17h10v-2H11v2zm-8-5l4 4V8l-4 4zm0 9h18v-2H3v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/></svg>
            </button>
            <span class="toolbar-divider"></span>
            <button data-command="createLink" title="${t('addLink')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
            </button>
            <button data-command="unlink" title="${t('removeLink')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M17 7h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.43-.98 2.63-2.31 2.98l1.46 1.46C20.88 15.61 22 13.95 22 12c0-2.76-2.24-5-5-5zm-1 4h-2.19l2 2H16v-2zM2 4.27l3.11 3.11C3.29 8.12 2 9.91 2 12c0 2.76 2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1 0-1.59 1.21-2.9 2.76-3.07L8.73 11H8v2h2.73L13 15.27V17h1.73l4.01 4L20 19.74 3.27 3 2 4.27z"/></svg>
            </button>
            <button data-command="insertHorizontalRule" title="${t('horizontalLine')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 11h18v2H3z"/></svg>
            </button>
            <button data-command="insertImage" title="${t('insertImage')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
            </button>
            <span class="toolbar-divider"></span>
            <button data-command="subscript" title="${t('subscript')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M22 18h-2v1h3v1h-4v-2.5c0-.55.45-1 1-1h2v-1h-3v-1h3c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1zM5.88 18h2.66l3.4-5.42h.12l3.4 5.42h2.66l-4.65-7.27L17.81 4h-2.68l-3.07 4.99h-.12L8.85 4H6.19l4.32 6.73L5.88 18z"/></svg>
            </button>
            <button data-command="superscript" title="${t('superscript')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M22 7h-2v1h3v1h-4V6.5c0-.55.45-1 1-1h2v-1h-3v-1h3c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1zM5.88 20h2.66l3.4-5.42h.12l3.4 5.42h2.66l-4.65-7.27L17.81 6h-2.68l-3.07 4.99h-.12L8.85 6H6.19l4.32 6.73L5.88 20z"/></svg>
            </button>
            <button data-command="removeFormat" title="${t('clearFormat')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.55 5.27 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z"/></svg>
            </button>
            <span class="toolbar-divider"></span>
            <button data-command="foreColor" title="${t('textColor')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M11 2L5.5 16h2.25l1.12-3h6.25l1.12 3h2.25L13 2h-2zm-1.38 9L12 4.67 14.38 11H9.62z"/><path fill="#f44336" d="M3 20h18v3H3z"/></svg>
            </button>
            <button data-command="hiliteColor" title="${t('highlightColor')}">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21z"/><path fill="#ffeb3b" d="M3 20h18v3H3z"/></svg>
            </button>
            <span class="toolbar-divider"></span>
            <button data-command="undo" title="${t('undo')} (Ctrl+Z)">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
            </button>
            <button data-command="redo" title="${t('redo')} (Ctrl+Y)">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
            </button>
        `;

        content._savedSelection = null;
        
        const saveSelection = () => {
            const sel = window.getSelection();
            if (sel.rangeCount > 0 && sel.toString().length > 0) {
                content._savedSelection = sel.getRangeAt(0).cloneRange();
            }
        };
        
        const restoreSelection = () => {
            if (content._savedSelection) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(content._savedSelection);
                return true;
            }
            return false;
        };

        toolbar.addEventListener('mousedown', (e) => {
            saveSelection();
            e.preventDefault();
        });

        toolbar.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            e.preventDefault();
            e.stopPropagation();
            
            const command = button.dataset.command;
            const value = button.dataset.value;

            restoreSelection();
            content.focus();

            if (command === 'undo') {
                historyManager.undo();
            } else if (command === 'redo') {
                historyManager.redo();
            } else if (command === 'createLink') {
                saveSelection();
                const url = prompt(t('enterLink'), 'https://');
                if (url) {
                    restoreSelection();
                    document.execCommand(command, false, url);
                    historyManager.saveState();
                }
            } else if (command === 'insertImage') {
                saveSelection();
                const url = prompt(t('enterImageUrl'), 'https://');
                if (url) {
                    restoreSelection();
                    document.execCommand(command, false, url);
                    historyManager.saveState();
                }
            } else if (command === 'foreColor') {
                showColorPicker('foreColor', (color) => {
                    if (content._savedSelection) {
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(content._savedSelection);
                    }
                    content.focus();
                    document.execCommand(command, false, color);
                    historyManager.saveState();
                }, button);
            } else if (command === 'hiliteColor') {
                showColorPicker('hiliteColor', (color) => {
                    if (content._savedSelection) {
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(content._savedSelection);
                    }
                    content.focus();
                    document.execCommand(command, false, color);
                    historyManager.saveState();
                }, button);
            } else {
                document.execCommand(command, false, value);
                historyManager.saveState();
            }
        });
        
        content.addEventListener('mouseup', () => {
            setTimeout(saveSelection, 10);
        });
        content.addEventListener('keyup', saveSelection);
        
        document.addEventListener('selectionchange', () => {
            const sel = window.getSelection();
            if (sel.rangeCount > 0 && content.contains(sel.anchorNode)) {
                saveSelection();
            }
        });

        readerMode.appendChild(toolbar);
    }

    function removeEditingToolbar() {
        document.querySelectorAll('.editing-toolbar').forEach(el => el.remove());
        document.querySelectorAll('.color-picker-popup').forEach(el => el.remove());
    }


    function showColorPicker(type, onSelect, anchorButton) {
        document.querySelectorAll('.color-picker-popup').forEach(el => el.remove());
        
        const isTextColor = type === 'foreColor';
        const title = isTextColor ? t('textColor') : t('highlightColor');
        
        const presetColors = [
            '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
            '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
            '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
            '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
            '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
            '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
            '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
        ];
        
        const popup = document.createElement('div');
        popup.className = 'color-picker-popup';
        popup.innerHTML = `
            <div class="color-picker-header">${title}</div>
            <div class="color-picker-presets">
                ${presetColors.map(color => `
                    <div class="color-preset" data-color="${color}" style="background-color: ${color};" title="${color}"></div>
                `).join('')}
            </div>
            <div class="color-picker-custom">
                <label>${t('customColor')}:</label>
                <div class="color-input-row">
                    <input type="color" class="color-input-picker" value="${isTextColor ? '#ff0000' : '#ffff00'}">
                    <input type="text" class="color-input-text" placeholder="#000000" value="${isTextColor ? '#ff0000' : '#ffff00'}">
                    <button class="color-apply-btn">${t('apply')}</button>
                </div>
            </div>
            <div class="color-picker-actions">
                <button class="color-cancel-btn">${t('cancel')}</button>
                ${!isTextColor ? `<button class="color-clear-btn">${t('clearHighlight')}</button>` : ''}
            </div>
        `;
        
        const rect = anchorButton.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.top = (rect.bottom + 5) + 'px';
        popup.style.left = Math.max(10, rect.left - 100) + 'px';
        popup.style.zIndex = '100005';
        
        document.body.appendChild(popup);
        
        popup.addEventListener('mousedown', (e) => {
            if (!e.target.matches('input[type="text"]')) {
                e.preventDefault();
            }
        });
        
        const colorPicker = popup.querySelector('.color-input-picker');
        const colorText = popup.querySelector('.color-input-text');
        
        colorPicker.addEventListener('input', () => {
            colorText.value = colorPicker.value;
        });
        
        colorText.addEventListener('input', () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(colorText.value)) {
                colorPicker.value = colorText.value;
            }
        });
        
        popup.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.dataset.color;
                onSelect(color);
                popup.remove();
            });
        });
        
        popup.querySelector('.color-apply-btn').addEventListener('click', () => {
            const color = colorText.value || colorPicker.value;
            if (color) {
                onSelect(color);
                popup.remove();
            }
        });
        
        popup.querySelector('.color-cancel-btn').addEventListener('click', () => {
            popup.remove();
        });
        
        const clearBtn = popup.querySelector('.color-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                onSelect('transparent');
                popup.remove();
            });
        }
        
        const closeOnClickOutside = (e) => {
            if (!popup.contains(e.target) && e.target !== anchorButton) {
                popup.remove();
                document.removeEventListener('mousedown', closeOnClickOutside);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('mousedown', closeOnClickOutside);
        }, 100);
    }

    function addElementControls(container) {
        const blockElements = container.querySelectorAll('p, div, section, article, aside, h1, h2, h3, h4, h5, h6');
        
        blockElements.forEach(element => {
            if (!element.classList.contains('web2pdf-content') && 
                !element.querySelector('.element-controls')) {
                addElementControl(element);
            }
        });

        container.querySelectorAll('img').forEach(img => {
            if (!img.closest('.image-wrapper')) {
                addImageResize(img);
            }
        });
    }

    function addElementControl(element) {
        const controls = document.createElement('div');
        controls.className = 'element-controls';
        controls.innerHTML = `
            <button class="delete-btn" title="${t('deleteBlock')}">×</button>
        `;

        element.style.position = 'relative';
        element.appendChild(controls);

        controls.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.remove();
            historyManager.saveState();
        });
    }

    function addImageResize(img) {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);

        const resizer = document.createElement('div');
        resizer.className = 'image-resizer';
        wrapper.appendChild(resizer);

        let startX, startWidth;

        const initResize = (e) => {
            e.preventDefault();
            startX = e.clientX;
            startWidth = img.offsetWidth;
            
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        };

        const resize = (e) => {
            const width = startWidth + (e.clientX - startX);
            img.style.width = Math.max(50, width) + 'px';
            img.style.height = 'auto';
        };

        const stopResize = () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            historyManager.saveState();
        };

        resizer.addEventListener('mousedown', initResize);
    }

    function removeElementControls() {
        document.querySelectorAll('.element-controls').forEach(el => el.remove());
        document.querySelectorAll('.image-resizer').forEach(el => el.remove());
        document.querySelectorAll('.image-wrapper').forEach(wrapper => {
            const img = wrapper.querySelector('img');
            if (img) {
                wrapper.parentNode.insertBefore(img, wrapper);
                wrapper.remove();
            }
        });
    }

    // ============================================
    // 窗口事件处理
    // ============================================
    
    window.addEventListener('resize', function() {
        const button = document.querySelector('.web2pdf-floating-button');
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (rect.right > viewportWidth) {
            button.style.left = (viewportWidth - rect.width) + 'px';
        }
        if (rect.bottom > viewportHeight) {
            button.style.top = (viewportHeight - rect.height) + 'px';
        }

        saveButtonPosition(button.style.left, button.style.top);
    });

    // ============================================
    // 初始化
    // ============================================
    
    function initializeExtension() {
        if (document.querySelector('.web2pdf-floating-button')) return;
        
        createFloatingButton();
        createMenu();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeExtension);
    } else {
        initializeExtension();
    }

})();
