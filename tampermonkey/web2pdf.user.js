// ==UserScript==
// @name         Web2PDF
// @name:zh-CN   网页转PDF
// @name:zh-TW   網頁轉換為PDF
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Convert web pages to PDF with support for reading mode, editing, and custom styles.
// @description:zh-CN  将网页转换为PDF，支持阅读模式、编辑和自定义样式。
// @description:zh-TW  將網頁轉換為PDF，支援閱讀模式、編輯和自定義樣式。
// @author       martjay
// @match        *://*/*
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0Ij48cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PHBhdGggZmlsbD0iIzRDQUY1MCIgZD0iTTIwIDJIOGMtMS4xIDAtMiAuOS0yIDJ2MTJjMCAxLjEuOSAyIDIgMmgxMmMxLjEgMCAyLS45IDItMlY0YzAtMS4xLS45LTItMi0yem0tOC41IDcuNWMwIC44My0uNjcgMS41LTEuNSAxLjVIOXYySDcuNVY3SDEwYy44MyAwIDEuNS42NyAxLjUgMS41djF6bTUgMmMwIC44My0uNjcgMS41LTEuNSAxLjVoLTIuNVY3SDE1Yy44MyAwIDEuNS42NyAxLjUgMS41djN6bTQtM0gxOXYxaDEuNVYxMUgxOXYyaC0xLjVWN2gzdjEuNXpNOSA5LjVoMXYtMUg5djF6TTQgNkgydjE0YzAgMS4xLjkgMiAyIDJoMTR2LTJINFY2em0xMCA1LjVoMXYtM2gtMXYzeiIvPjwvc3ZnPg==
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @license      GPL-3.0 License
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @downloadURL https://update.greasyfork.org/scripts/523995/Web2PDF.user.js
// @updateURL https://update.greasyfork.org/scripts/523995/Web2PDF.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // i18n 配置
    const i18n = {
        zh: {
            readMode: '阅读模式',
            printPDF: '打印PDF',
            editMode: '编辑模式',
            switchLang: '中/En',
            loading: '正在加载页面内容和图片，请稍候...',
            loadingImages: '正在加载图片',
            noImages: '没有找到需要加载的图片',
            loadComplete: '加载完成，现在可以打印PDF了',
            loadFailed: '加载失败，请重试',
            deleteBlock: '删除此块',
            confirmDelete: '确定要删除这个内容块吗？',
            enterLink: '请输入链接地址:',
            bold: '加粗',
            italic: '斜体',
            underline: '下划线',
            heading1: '标题1',
            heading2: '标题2',
            paragraph: '段落',
            alignLeft: '左对齐',
            alignCenter: '居中',
            alignRight: '右对齐',
            bulletList: '无序列表',
            numberList: '有序列表',
            addLink: '添加链接',
            undo: '撤销',
            redo: '重做',
            pdfError: '生成PDF时出错，请重试',
            close: '关闭 (ESC)'
        },
        en: {
            readMode: 'Reading Mode',
            printPDF: 'Print PDF',
            editMode: 'Edit Mode',
            switchLang: '中/En',
            loading: 'Loading content and images, please wait...',
            loadingImages: 'Loading images',
            noImages: 'No images found to load',
            loadComplete: 'Loading complete, you can print PDF now',
            loadFailed: 'Loading failed, please try again',
            deleteBlock: 'Delete Block',
            confirmDelete: 'Are you sure you want to delete this block?',
            enterLink: 'Please enter the link URL:',
            bold: 'Bold',
            italic: 'Italic',
            underline: 'Underline',
            heading1: 'Heading 1',
            heading2: 'Heading 2',
            paragraph: 'Paragraph',
            alignLeft: 'Align Left',
            alignCenter: 'Center',
            alignRight: 'Align Right',
            bulletList: 'Bullet List',
            numberList: 'Number List',
            addLink: 'Add Link',
            undo: 'Undo',
            redo: 'Redo',
            pdfError: 'Error generating PDF, please try again',
            close: 'Close (ESC)'
        }
    };

    // 获取用户语言
    async function getUserLanguage() {
        const userLang = GM_getValue('userLanguage');
        if (userLang) {
            return userLang;
        }
        const lang = navigator.language.toLowerCase();
        const defaultLang = lang.startsWith('zh') ? 'zh' : 'en';
        return defaultLang;
    }

    // 设置用户语言
    async function setUserLanguage(lang) {
        GM_setValue('userLanguage', lang);
    }

    // 获取翻译文本
    async function t(key) {
        const lang = await getUserLanguage();
        return i18n[lang][key] || i18n.en[key];
    }

    // 添加样式
    GM_addStyle(`
        .web2pdf-floating-button {
            position: fixed;
            z-index: 10000;
            width: 48px;
            height: 48px;
            border-radius: 24px;
            background: white;
            border: none;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            cursor: move;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
            user-select: none;
            touch-action: none;
            color: #333;
        }

        .web2pdf-floating-button:hover {
            background: #f5f5f5;
        }

        .web2pdf-floating-button.dragging {
            opacity: 0.8;
            cursor: grabbing;
        }

        .web2pdf-menu {
            position: fixed;
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: none;
            z-index: 10001;
            min-width: 180px;
            max-width: 250px;
        }

        .web2pdf-menu.show {
            display: block;
        }

        .menu-item {
            padding: 10px 15px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            color: #333;
            transition: background-color 0.2s;
            white-space: nowrap;
        }

        .menu-item:hover {
            background-color: #f5f5f5;
        }

        .web2pdf-reader-mode {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            z-index: 100000;
            padding: 40px;
            overflow-y: auto;
            line-height: 1.6;
            font-family: Arial, sans-serif;
        }

        .web2pdf-content.editing {
            outline: 2px solid #4CAF50;
            padding: 10px;
        }

        .editing-toolbar {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 5px;
            z-index: 100002;
            display: flex;
            gap: 5px;
        }

        .editing-toolbar button {
            width: 30px;
            height: 30px;
            border: none;
            background: #f0f0f0;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
        }

        .element-controls {
            position: absolute;
            top: 0;
            right: 0;
            display: none;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
        }

        .image-wrapper {
            position: relative;
            display: inline-block;
        }

        .image-resizer {
            position: absolute;
            right: -5px;
            bottom: -5px;
            width: 10px;
            height: 10px;
            background: #4CAF50;
            border-radius: 50%;
            cursor: se-resize;
            display: none;
        }
    `);

    // 原有的功能函数
    // 将 content.js 的代码粘贴到这里
    // 创建浮动按钮和菜单
    function createFloatingButton() {
        const button = document.createElement('button');
        button.className = 'web2pdf-floating-button';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                <path d="M0 0h24v24H0z" fill="none"/>
                <path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
            </svg>
        `;

        // 从存储中获取保存的位置
        const buttonPosition = GM_getValue('buttonPosition', { left: '20px', top: '20px' });
        button.style.left = buttonPosition.left;
        button.style.top = buttonPosition.top;

        // 添加拖动功能
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        button.addEventListener('mousedown', function(e) {
            if (e.target.closest('.web2pdf-menu')) return;
            
            isDragging = true;
            button.style.transition = 'none';
            
            const rect = button.getBoundingClientRect();
            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;
            
            button.classList.add('dragging');
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;

            e.preventDefault();
            
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            const buttonRect = button.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // 优化边界处理逻辑
            currentX = Math.max(0, Math.min(currentX, viewportWidth - buttonRect.width));
            currentY = Math.max(0, Math.min(currentY, viewportHeight - buttonRect.height));
            
            button.style.left = currentX + 'px';
            button.style.top = currentY + 'px';
            button.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', function() {
            if (!isDragging) return;
            
            isDragging = false;
            button.style.transition = 'background-color 0.2s';
            button.classList.remove('dragging');
            
            // 保存新位置到 storage，这样主页面的按钮也会使用这个位置
            GM_setValue('buttonPosition', {
                left: button.style.left,
                top: button.style.top
            });
        });

        button.addEventListener('click', showMenu);
        document.body.appendChild(button);
    }

    // 创建菜单
    async function createMenu() {
        const menu = document.createElement('div');
        menu.className = 'web2pdf-menu';
        menu.innerHTML = `
            <div class="menu-item" id="readMode">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
                ${await t('readMode')}
            </div>
            <div class="menu-item" id="printPDF">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                </svg>
                ${await t('printPDF')}
            </div>
            <div class="menu-item" id="switchLang">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                </svg>
                ${await t('switchLang')}
            </div>
        `;
        document.body.appendChild(menu);

        // 添加事件监听
        document.getElementById('readMode').addEventListener('click', toggleReadMode);
        document.getElementById('printPDF').addEventListener('click', printToPDF);
        document.getElementById('switchLang').addEventListener('click', async function() {
            const currentLang = await getUserLanguage();
            const newLang = currentLang === 'zh' ? 'en' : 'zh';
            await setUserLanguage(newLang);
            
            // 重新创建菜单以更新语言
            const oldMenu = document.querySelector('.web2pdf-menu');
            if (oldMenu) oldMenu.remove();
            createMenu();
        });
    }

    // 显示/隐藏菜单
    function showMenu(event) {
        event.stopPropagation();
        const button = event.currentTarget;
        const menu = document.querySelector('.web2pdf-menu');
        const buttonRect = button.getBoundingClientRect();
        
        // 根据按钮位置调整菜单位置
        if (buttonRect.left < window.innerWidth / 2) {
            // 按钮在左半边，菜单显示在按钮右边
            menu.style.left = (buttonRect.right + 10) + 'px';
            menu.style.right = 'auto';
        } else {
            // 按钮在右半边，菜单显示在按钮左边
            menu.style.right = (window.innerWidth - buttonRect.left + 10) + 'px';
            menu.style.left = 'auto';
        }

        // 垂直位置调整
        const menuHeight = menu.offsetHeight || 100; // 预估高度
        if (buttonRect.top + menuHeight > window.innerHeight) {
            // 如果菜单会超出底部，就显示在按钮上方
            menu.style.bottom = (window.innerHeight - buttonRect.top + 10) + 'px';
            menu.style.top = 'auto';
        } else {
            // 否则显示在按钮下方
            menu.style.top = buttonRect.top + 'px';
            menu.style.bottom = 'auto';
        }

        menu.classList.toggle('show');
        
        // 点击其他地方关闭菜单
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && !e.target.closest('.web2pdf-floating-button')) {
                menu.classList.remove('show');
                document.removeEventListener('click', closeMenu);
            }
        });
    }

    // 切换阅读模式
    async function toggleReadMode() {
        const existingReader = document.querySelector('.web2pdf-reader-mode');
        if (existingReader) {
            existingReader.remove();
            document.body.style.overflow = '';
            return;
        }

        // 添加加载提示
        const loadingTip = document.createElement('div');
        loadingTip.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 100000;
        `;
        loadingTip.textContent = await t('loading');
        document.body.appendChild(loadingTip);

        try {
            const content = extractMainContent();
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = content;

            // 预加载图片，传入 loadingTip 参数
            await preloadImages(tempContainer, loadingTip);

            // 创建阅读模式容器
            const readerMode = document.createElement('div');
            readerMode.className = 'web2pdf-reader-mode';
            readerMode.innerHTML = tempContainer.innerHTML;

            // 添加关闭按钮
            const closeButton = document.createElement('button');
            closeButton.className = 'web2pdf-close-button';
            closeButton.innerHTML = `
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                <span>${await t('close')}</span>
            `;
            closeButton.addEventListener('click', () => {
                readerMode.remove();
                document.body.style.overflow = '';
                // 重新创建浮动按钮和菜单
                createFloatingButton();
                createMenu();
            });
            readerMode.appendChild(closeButton);

            // 添加 ESC 快捷键支持
            document.addEventListener('keydown', function escKeyHandler(e) {
                if (e.key === 'Escape') {
                    readerMode.remove();
                    document.body.style.overflow = '';
                    // 重新创建浮动按钮和菜单
                    createFloatingButton();
                    createMenu();
                    document.removeEventListener('keydown', escKeyHandler);
                }
            });

            document.body.appendChild(readerMode);
            document.body.style.overflow = 'hidden';
            document.querySelector('.web2pdf-menu')?.classList.remove('show');

            // 获取原始按钮的位置
            const originalButton = document.querySelector('.web2pdf-floating-button');
            const originalMenu = document.querySelector('.web2pdf-menu');
            const buttonPosition = originalButton ? {
                left: originalButton.style.left,
                top: originalButton.style.top,
                bottom: originalButton.style.bottom
            } : null;

            if (originalButton) originalButton.remove();
            if (originalMenu) originalMenu.remove();

            // 在阅读模式中创建新的浮动按钮，使用相同的位置
            const button = document.createElement('button');
            button.className = 'web2pdf-floating-button';
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                    <path d="M0 0h24v24H0z" fill="none"/>
                    <path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
                </svg>
            `;

            // 应用保存的位置或使用默认位置
            const savedPosition = GM_getValue('buttonPosition', { left: '20px', top: '20px' });
            button.style.left = savedPosition.left;
            button.style.top = savedPosition.top;

            // 添加拖动功能
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;

            button.addEventListener('mousedown', function(e) {
                if (e.target.closest('.web2pdf-menu')) return;
                
                isDragging = true;
                button.style.transition = 'none';
                
                const rect = button.getBoundingClientRect();
                initialX = e.clientX - rect.left;
                initialY = e.clientY - rect.top;
                
                button.classList.add('dragging');
            });

            document.addEventListener('mousemove', function(e) {
                if (!isDragging) return;

                e.preventDefault();
                
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                const buttonRect = button.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                currentX = Math.max(0, Math.min(currentX, viewportWidth - buttonRect.width));
                currentY = Math.max(0, Math.min(currentY, viewportHeight - buttonRect.height));
                
                button.style.left = currentX + 'px';
                button.style.top = currentY + 'px';
                button.style.bottom = 'auto';
            });

            document.addEventListener('mouseup', function() {
                if (!isDragging) return;
                
                isDragging = false;
                button.style.transition = 'background-color 0.2s';
                button.classList.remove('dragging');
                
                // 保存新位置到 storage，这样主页面的按钮也会使用这个位置
                GM_setValue('buttonPosition', {
                    left: button.style.left,
                    top: button.style.top
                });
            });

            button.addEventListener('click', showMenu);
            readerMode.appendChild(button);

            // 在阅读模式中创建新的菜单
            const menu = document.createElement('div');
            menu.className = 'web2pdf-menu';
            menu.innerHTML = `
                <div class="menu-item" id="toggleEdit">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    ${await t('editMode')}
                </div>
                <div class="menu-item" id="printPDF">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                    </svg>
                    ${await t('printPDF')}
                </div>
                <div class="menu-item" id="switchLang">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                    </svg>
                    ${await t('switchLang')}
                </div>
            `;
            readerMode.appendChild(menu);

            // 为菜单项添加事件监听
            menu.querySelector('#toggleEdit').addEventListener('click', () => {
                toggleEditMode(readerMode);
                menu.classList.remove('show');
            });

            menu.querySelector('#printPDF').addEventListener('click', () => {
                printToPDF();
                menu.classList.remove('show');
            });

            menu.querySelector('#switchLang').addEventListener('click', async function() {
                const currentLang = await getUserLanguage();
                const newLang = currentLang === 'zh' ? 'en' : 'zh';
                await setUserLanguage(newLang);
                
                // 重新创建菜单以更新语言
                const oldMenu = readerMode.querySelector('.web2pdf-menu');
                if (oldMenu) oldMenu.remove();
                await createReaderModeMenu(readerMode);
            });

            // 显示成功提示
            loadingTip.style.background = 'rgba(76, 175, 80, 0.9)';
            loadingTip.textContent = await t('loadComplete');
            setTimeout(() => {
                loadingTip.remove();
                // 自动开启编辑模式
                toggleEditMode(readerMode);
            }, 2000);

        } catch (error) {
            console.error('Error loading content:', error);
            loadingTip.style.background = 'rgba(244, 67, 54, 0.9)';
            loadingTip.textContent = await t('loadFailed');
            setTimeout(() => {
                loadingTip.remove();
            }, 2000);
        }
    }

    // 添加一个新函数来创建阅读模式的菜单
    async function createReaderModeMenu(readerMode) {
        const menu = document.createElement('div');
        menu.className = 'web2pdf-menu';
        menu.innerHTML = `
            <div class="menu-item" id="toggleEdit">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                ${await t('editMode')}
            </div>
            <div class="menu-item" id="printPDF">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                </svg>
                ${await t('printPDF')}
            </div>
            <div class="menu-item" id="switchLang">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                </svg>
                ${await t('switchLang')}
            </div>
        `;
        readerMode.appendChild(menu);

        // 添加事件监听
        menu.querySelector('#toggleEdit').addEventListener('click', () => {
            toggleEditMode(readerMode);
            menu.classList.remove('show');
        });

        menu.querySelector('#printPDF').addEventListener('click', () => {
            printToPDF();
            menu.classList.remove('show');
        });

        menu.querySelector('#switchLang').addEventListener('click', async function() {
            const currentLang = await getUserLanguage();
            const newLang = currentLang === 'zh' ? 'en' : 'zh';
            await setUserLanguage(newLang);
            
            // 重新创建菜单以更新语言
            const oldMenu = readerMode.querySelector('.web2pdf-menu');
            if (oldMenu) oldMenu.remove();
            await createReaderModeMenu(readerMode);
        });

        return menu;
    }

    // 添加预加载图片的函数
    async function preloadImages(container, loadingTip) {
        const images = container.getElementsByTagName('img');
        const totalImages = images.length;
        const imageLoadPromises = [];
        let loadedCount = 0;

        // 如果没有图片需要加载
        if (totalImages === 0) {
            if (loadingTip) {
                loadingTip.innerHTML = '没有找到需要加载的图片';
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            return;
        }

        // 创建进度条容器
        if (loadingTip) {
            loadingTip.innerHTML = `
                <div style="text-align: center;">
                    <div>正在加载图片 (0/${totalImages})</div>
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
                    ">准备加载...</div>
                </div>
            `;
        }

        // 处理所有图片
        Array.from(images).forEach((img, index) => {
            // 处理懒加载图片
            const originalSrc = img.getAttribute('data-src') || 
                               img.getAttribute('data-original') || 
                               img.getAttribute('data-lazy-src') || 
                               img.getAttribute('data-lazy-loaded') ||
                               img.getAttribute('data-url') ||
                               img.src;
            
            if (originalSrc) {
                // 创建一个加载Promise
                const loadPromise = new Promise((resolve) => {
                    const tempImg = new Image();
                    
                    tempImg.onload = () => {
                        loadedCount++;
                        if (loadingTip) {
                            // 更新加载进度
                            const progress = Math.round((loadedCount / totalImages) * 100);
                            const progressBar = loadingTip.querySelector('.progress');
                            const loadingDetails = loadingTip.querySelector('.loading-details');
                            
                            loadingTip.querySelector('div').textContent = 
                                `正在加载图片 (${loadedCount}/${totalImages})`;
                            
                            if (progressBar) {
                                progressBar.style.width = `${progress}%`;
                            }
                            
                            if (loadingDetails) {
                                loadingDetails.textContent = `正在加载: ${originalSrc.substring(0, 50)}...`;
                            }
                        }

                        img.src = originalSrc;  // 设置实际图片源
                        img.removeAttribute('data-src');
                        img.removeAttribute('data-original');
                        img.removeAttribute('data-lazy-src');
                        img.removeAttribute('data-lazy-loaded');
                        img.removeAttribute('data-url');
                        img.removeAttribute('loading');  // 移除懒加载属性
                        img.classList.remove('lazyload', 'lazy');  // 移除懒加载类
                        resolve();
                    };

                    tempImg.onerror = () => {
                        loadedCount++;
                        if (loadingTip) {
                            // 更新加载进度，即使加载失败
                            const progress = Math.round((loadedCount / totalImages) * 100);
                            const progressBar = loadingTip.querySelector('.progress');
                            const loadingDetails = loadingTip.querySelector('.loading-details');
                            
                            loadingTip.querySelector('div').textContent = 
                                `正在加载图片 (${loadedCount}/${totalImages})`;
                            
                            if (progressBar) {
                                progressBar.style.width = `${progress}%`;
                            }
                            
                            if (loadingDetails) {
                                loadingDetails.textContent = `加载失败: ${originalSrc.substring(0, 50)}...`;
                            }
                        }
                        console.warn('Failed to load image:', originalSrc);
                        resolve();
                    };

                    // 开始加载图片
                    tempImg.src = originalSrc;
                });

                imageLoadPromises.push(loadPromise);
            }
        });

        // 等待所有图片加载完成
        await Promise.all(imageLoadPromises);

        // 显示加载完成信息
        if (loadingTip) {
            loadingTip.innerHTML = `
                <div style="text-align: center;">
                    <div>图片加载完成 (${loadedCount}/${totalImages})</div>
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
                            width: 100%;
                            background: #4CAF50;
                        "></div>
                    </div>
                    <div class="loading-details" style="
                        font-size: 12px;
                        color: rgba(255, 255, 255, 0.8);
                        margin-top: 5px;
                    ">所有图片加载完成</div>
                </div>
            `;
            // 等待一会儿再消失，让用户看到完成状态
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // 添加 A4 尺寸计算和内容分页函数
    function calculateA4Pages(container) {
        // A4 尺寸（以像素为单位，假设 96 DPI）
        // A4 纸张尺寸为 210mm x 297mm
        const A4_WIDTH_PX = 794;  // 210mm = 794px
        const A4_HEIGHT_PX = 1123; // 297mm = 1123px
        const MARGIN = 40; // 页边距
        const EFFECTIVE_HEIGHT = A4_HEIGHT_PX - (MARGIN * 2);
        
        // 创建一个临时容器来计算布局
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: ${A4_WIDTH_PX - (MARGIN * 2)}px;
            visibility: hidden;
        `;
        document.body.appendChild(tempDiv);

        // 克隆内容到临时容器
        const contentClone = container.cloneNode(true);
        tempDiv.appendChild(contentClone);

        // 处理所有图片，使其等宽
        const images = tempDiv.getElementsByTagName('img');
        Array.from(images).forEach(img => {
            img.style.width = '100%';
            img.style.height = 'auto';
            // 确保图片容器也是等宽的
            if (img.parentElement.classList.contains('img-container')) {
                img.parentElement.style.width = '100%';
            }
        });

        // 存储分页后的内容
        const pages = [];
        let currentPage = document.createElement('div');
        let currentHeight = 0;
        
        // 遍历所有子元素
        Array.from(contentClone.children).forEach(element => {
            const elementHeight = element.offsetHeight;
            const isImage = element.tagName.toLowerCase() === 'img' || 
                           element.querySelector('img') !== null;

            // 如果当前元素是图片或包含图片，且会导致超出页面高度
            if (isImage && currentHeight + elementHeight > EFFECTIVE_HEIGHT) {
                // 将当前页添加到页面集合中
                if (currentPage.children.length > 0) {
                    pages.push(currentPage);
                }
                // 创建新页面，并将图片放在新页面的开始
                currentPage = document.createElement('div');
                currentPage.appendChild(element.cloneNode(true));
                currentHeight = elementHeight;
            }
            // 如果是普通元素，且会导致超出页面高度
            else if (currentHeight + elementHeight > EFFECTIVE_HEIGHT) {
                // 将当前页添加到页面集合中
                pages.push(currentPage);
                // 创建新页面
                currentPage = document.createElement('div');
                currentPage.appendChild(element.cloneNode(true));
                currentHeight = elementHeight;
            }
            // 如果不会超出页面高度
            else {
                currentPage.appendChild(element.cloneNode(true));
                currentHeight += elementHeight;
            }
        });

        // 添加最后一页
        if (currentPage.children.length > 0) {
            pages.push(currentPage);
        }

        // 清理临时元素
        document.body.removeChild(tempDiv);

        return pages;
    }

    // 修改 printToPDF 函数
    async function printToPDF() {
        // 创建一个临时容器来存放打印内容
        const tempContainer = document.createElement('div');
        
        if (document.querySelector('.web2pdf-reader-mode')) {
            // 如果在阅读模式下，复制阅读模式的内容
            const readerContent = document.querySelector('.web2pdf-reader-mode').cloneNode(true);
            
            // 清理所有UI元素
            const elementsToRemove = [
                '.web2pdf-floating-button',
                '.web2pdf-menu',
                '.reader-close-button',
                '.editing-toolbar',
                '.element-controls',
                '.image-resizer',
                'button'
            ];
            
            elementsToRemove.forEach(selector => {
                readerContent.querySelectorAll(selector).forEach(el => el.remove());
            });

            // 只保留主要内容
            const mainContent = readerContent.querySelector('.web2pdf-content');
            if (mainContent) {
                // 移除所有编辑相关的属性和类
                mainContent.querySelectorAll('*').forEach(el => {
                    el.removeAttribute('contenteditable');
                    el.classList.remove('editing');
                    if (el.style.position === 'relative') {
                        el.style.position = '';
                    }
                });

                // 处理图片包装器
                mainContent.querySelectorAll('.image-wrapper').forEach(wrapper => {
                    const img = wrapper.querySelector('img');
                    if (img) {
                        const imgContainer = document.createElement('div');
                        imgContainer.className = 'img-container';
                        wrapper.parentNode.insertBefore(imgContainer, wrapper);
                        imgContainer.appendChild(img);
                        wrapper.remove();
                    }
                });

                tempContainer.appendChild(mainContent);
            }
        } else {
            // 如果不在阅读模式下，使用提取的内容
            tempContainer.innerHTML = extractMainContent();
            
            // 为所有图片添加包装容器
            tempContainer.querySelectorAll('img').forEach(img => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'img-container';
                img.parentNode.insertBefore(imgContainer, img);
                imgContainer.appendChild(img);
            });
        }

        // 添加加载提示
        const loadingTip = document.createElement('div');
        loadingTip.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 100000;
        `;
        loadingTip.textContent = '正在加载图片，请稍候...';
        document.body.appendChild(loadingTip);

        try {
            // 预加载所有图片
            await preloadImages(tempContainer);
            
            // 计算分页
            const pages = calculateA4Pages(tempContainer);

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${document.title}</title>
                        <style>
                            @page {
                                size: A4;
                                margin: 40px;
                            }
                            body {
                                font-family: Arial, sans-serif;
                                line-height: 1.6;
                                margin: 0;
                                padding: 0;
                            }
                            .page {
                                width: 21cm;
                                height: 29.7cm;
                                padding: 40px;
                                box-sizing: border-box;
                                margin: 0 auto;
                                background: white;
                            }
                            img {
                                max-width: 100%;
                                height: auto;
                                display: block;
                                margin: 10px auto;
                            }
                            .img-container {
                                width: 100%;
                                margin: 20px 0;
                            }
                            h1, h2, h3, h4, h5, h6 {
                                margin: 1em 0 0.5em;
                            }
                            p {
                                margin: 0.5em 0;
                            }
                            @media print {
                                .page {
                                    page-break-after: always;
                                    margin: 0;
                                    height: auto;
                                }
                                .page:last-child {
                                    page-break-after: avoid;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        ${pages.map(page => `
                            <div class="page">
                                ${page.innerHTML}
                            </div>
                        `).join('')}
                    </body>
                </html>
            `);
            printWindow.document.close();
            
            // 等待一段时间确保图片完全加载和布局完成
            setTimeout(() => {
                printWindow.print();
                loadingTip.remove();
            }, 2000);
        } catch (error) {
            console.error('Error during PDF generation:', error);
            alert('生成PDF时出错，请重试');
        } finally {
            loadingTip.remove();
        }
    }

    // 添加清理打印内容的函数
    function cleanupForPrint(element) {
        // 移除所有UI相关元素
        const removeSelectors = [
            '.web2pdf-floating-button',
            '.web2pdf-menu',
            '.reader-close-button',
            '.editing-toolbar',
            'button',
            '[contenteditable]'
        ];

        removeSelectors.forEach(selector => {
            element.querySelectorAll(selector).forEach(el => el.remove());
        });

        // 移除编辑相关的属性和类
        element.querySelectorAll('*').forEach(el => {
            el.removeAttribute('contenteditable');
            el.classList.remove('editing');
        });

        // 返回清理后的HTML
        return element.innerHTML;
    }

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .web2pdf-floating-button {
            position: fixed;
            z-index: 10000;
            width: 48px;
            height: 48px;
            border-radius: 24px;
            background: white;
            border: none;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            cursor: move;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
            user-select: none;
            touch-action: none;
            color: #333;
        }

        .web2pdf-floating-button:hover {
            background: #f5f5f5;
        }

        .web2pdf-floating-button.dragging {
            opacity: 0.8;
            cursor: grabbing;
        }

        .web2pdf-floating-button svg {
            pointer-events: none;
            fill: currentColor;
        }

        .web2pdf-menu {
            position: fixed;
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: none;
            z-index: 10001;
            min-width: 180px;
            max-width: 250px;
        }

        .web2pdf-menu.show {
            display: block;
        }

        .menu-item {
            padding: 10px 15px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            color: #333;
            transition: background-color 0.2s;
            white-space: nowrap;
        }

        .menu-item:hover {
            background-color: #f5f5f5;
        }

        .menu-item svg {
            flex-shrink: 0;
            fill: currentColor;
        }

        .web2pdf-reader-mode {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            z-index: 100000;
            padding: 40px;
            overflow-y: auto;
            line-height: 1.6;
            font-family: Arial, sans-serif;
        }

        .web2pdf-reader-mode .content {
            max-width: 800px;
            margin: 0 auto;
        }

        .reader-close-button {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 20px;
            border: none;
            background: #f0f0f0;
            cursor: pointer;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100001;
        }

        .reader-close-button:hover {
            background: #e0e0e0;
        }

        .web2pdf-context-menu {
            position: fixed;
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: none;
            z-index: 10000;
            min-width: 150px;
        }

        .context-menu-item {
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .context-menu-item:hover {
            background-color: #f5f5f5;
        }

        .web2pdf-reader-mode .web2pdf-floating-button {
            z-index: 100002;
        }

        .web2pdf-content.editing {
            outline: 2px solid #4CAF50;
            padding: 10px;
        }

        .editing-toolbar {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 5px;
            z-index: 100002;
            display: flex;
            gap: 5px;
        }

        .editing-toolbar button {
            width: 30px;
            height: 30px;
            border: none;
            background: #f0f0f0;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
        }

        .editing-toolbar button:hover {
            background: #e0e0e0;
        }

        [contenteditable=true]:focus {
            outline: none;
        }

        .element-controls {
            position: absolute;
            top: 0;
            right: 0;
            display: none;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
        }

        [contenteditable=true] *:hover > .element-controls {
            display: block;
        }

        .element-controls button {
            padding: 2px 6px;
            background: none;
            border: none;
            color: #ff4444;
            cursor: pointer;
            font-size: 16px;
        }

        .element-controls button:hover {
            background: rgba(255, 0, 0, 0.1);
        }

        .image-wrapper {
            position: relative;
            display: inline-block;
        }

        .image-resizer {
            position: absolute;
            right: -5px;
            bottom: -5px;
            width: 10px;
            height: 10px;
            background: #4CAF50;
            border-radius: 50%;
            cursor: se-resize;
            display: none;
        }

        [contenteditable=true] .image-wrapper:hover .image-resizer {
            display: block;
        }

        #switchLang {
            border-top: 1px solid #eee;
            margin-top: 5px;
            padding-top: 10px;
        }

        #switchLang svg {
            transform: scale(0.9);
        }
    `;
    document.head.appendChild(style);

    // 添加窗口大小改变时的处理
    window.addEventListener('resize', function() {
        const button = document.querySelector('.web2pdf-floating-button');
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 如果按钮位置超出视窗，调整到可见区域
        if (rect.right > viewportWidth) {
            button.style.left = (viewportWidth - rect.width) + 'px';
        }
        if (rect.bottom > viewportHeight) {
            button.style.top = (viewportHeight - rect.height) + 'px';
        }

        // 保存调整后的位置
        GM_setValue('buttonPosition', {
            left: button.style.left,
            top: button.style.top
        });
    });

    // 提取主要内容
    function extractMainContent() {
        // 尝试查找主要内容容器
        const selectors = [
            'article',
            '[role="article"]',
            '.article',
            '.post',
            '.post-content',
            '.article-content',
            '#article-content',
            '.content',
            '.main-content',
            'main',
            '[role="main"]',
            '.entry-content',
            '.blog-post',
            '.story-content'
        ];

        let mainContent = null;
        
        // 查找最匹配的内容容器
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 100) {
                mainContent = element;
                break;
            }
        }

        // 如果没找到合适的容器，使用 body
        if (!mainContent) {
            mainContent = document.body;
        }

        // 创建一个新的容器
        const container = document.createElement('div');
        container.className = 'web2pdf-content';
        
        // 添加标题
        const title = document.createElement('h1');
        title.style.marginBottom = '20px';
        title.textContent = document.title;
        container.appendChild(title);

        // 克隆内容
        const contentClone = mainContent.cloneNode(true);

        // 清理不需要的元素
        const removeSelectors = [
            'script', 'style', 'iframe', 'nav', 'header', 'footer',
            '.advertisement', '.ads', '.social-share', '.comments',
            '#comments', '.sidebar', '.related-posts', '.nav',
            '.navigation', '.menu', '.share', '.social',
            'button', 'input', 'form'
        ];

        removeSelectors.forEach(selector => {
            contentClone.querySelectorAll(selector).forEach(el => {
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });
        });

        // 处理图片
        contentClone.querySelectorAll('img').forEach(img => {
            if (img.src) {
                img.src = img.src; // 确保使用完整URL
            }
        });

        // 添加内容
        container.appendChild(contentClone);

        return container.outerHTML;
    }

    // 添加编辑模式相关的函数
    async function toggleEditMode(readerMode) {
        const content = readerMode.querySelector('.web2pdf-content') || readerMode;
        const isEditing = content.getAttribute('contenteditable') === 'true';
        
        if (isEditing) {
            // 退出编辑模式
            content.setAttribute('contenteditable', 'false');
            content.classList.remove('editing');
            removeEditingToolbar();
            removeElementControls();
        } else {
            // 进入编辑模式
            content.setAttribute('contenteditable', 'true');
            content.classList.add('editing');
            await createEditingToolbar(readerMode);
            await addElementControls(content);
        }
    }

    // 修改创建编辑工具栏函数
    async function createEditingToolbar(readerMode) {
        const existingToolbar = document.querySelector('.editing-toolbar');
        if (existingToolbar) {
            existingToolbar.remove();
        }

        const toolbar = document.createElement('div');
        toolbar.className = 'editing-toolbar';
        toolbar.innerHTML = `
            <button data-command="bold" title="${await t('bold')}">B</button>
            <button data-command="italic" title="${await t('italic')}">I</button>
            <button data-command="underline" title="${await t('underline')}">U</button>
            <button data-command="formatBlock" data-value="h1" title="${await t('heading1')}">H1</button>
            <button data-command="formatBlock" data-value="h2" title="${await t('heading2')}">H2</button>
            <button data-command="formatBlock" data-value="p" title="${await t('paragraph')}">P</button>
            <button data-command="justifyLeft" title="${await t('alignLeft')}">⇤</button>
            <button data-command="justifyCenter" title="${await t('alignCenter')}">⇔</button>
            <button data-command="justifyRight" title="${await t('alignRight')}">⇥</button>
            <button data-command="insertUnorderedList" title="${await t('bulletList')}">•</button>
            <button data-command="insertOrderedList" title="${await t('numberList')}">1.</button>
            <button data-command="createLink" title="${await t('addLink')}">🔗</button>
            <button data-command="undo" title="${await t('undo')}">↩</button>
            <button data-command="redo" title="${await t('redo')}">↪</button>
        `;

        toolbar.addEventListener('click', async (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            e.preventDefault();
            const command = button.dataset.command;
            const value = button.dataset.value;

            if (command === 'createLink') {
                const url = prompt(await t('enterLink'), 'http://');
                if (url) document.execCommand(command, false, url);
            } else {
                document.execCommand(command, false, value);
            }
        });

        readerMode.appendChild(toolbar);
    }

    // 移除编辑工具栏
    function removeEditingToolbar() {
        const toolbar = document.querySelector('.editing-toolbar');
        if (toolbar) {
            toolbar.remove();
        }
    }

    // 修改添加元素控制的函数为异步
    async function addElementControls(container) {
        const blockElements = container.querySelectorAll('p, div, section, article, aside, h1, h2, h3, h4, h5, h6');
        for (const element of blockElements) {
            if (!element.classList.contains('web2pdf-content')) {
                await addElementControl(element);
            }
        }

        // 为图片添加调整大小的功能
        const images = container.querySelectorAll('img');
        images.forEach(img => addImageResize(img));
    }

    // 修改为单个元素添加控制按钮的函数
    async function addElementControl(element) {
        const controls = document.createElement('div');
        controls.className = 'element-controls';
        controls.innerHTML = `
            <button class="delete-btn" title="${await t('deleteBlock')}">×</button>
        `;

        element.style.position = 'relative';
        element.appendChild(controls);

        controls.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 直接删除元素，不需要确认
            element.remove();
        });
    }

    // 为图片添加缩放功能
    function addImageResize(img) {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);

        const resizer = document.createElement('div');
        resizer.className = 'image-resizer';
        wrapper.appendChild(resizer);

        let startX, startY, startWidth, startHeight;

        resizer.addEventListener('mousedown', initResize);

        function initResize(e) {
            startX = e.clientX;
            startY = e.clientY;
            startWidth = img.offsetWidth;
            startHeight = img.offsetHeight;
            
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        }

        function resize(e) {
            const width = startWidth + (e.clientX - startX);
            const height = startHeight * (width / startWidth); // 保持宽高比
            
            img.style.width = width + 'px';
            img.style.height = height + 'px';
        }

        function stopResize() {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
    }

    // 移除元素控制
    function removeElementControls() {
        document.querySelectorAll('.element-controls').forEach(control => control.remove());
        document.querySelectorAll('.image-resizer').forEach(resizer => resizer.remove());
        document.querySelectorAll('.image-wrapper').forEach(wrapper => {
            const img = wrapper.querySelector('img');
            if (img) {
                wrapper.parentNode.insertBefore(img, wrapper);
                wrapper.remove();
            }
        });
    }

    // 将初始化代码包装在一个函数中
    function initializeExtension() {
        createFloatingButton();
        createMenu();
    }

    // 等待 DOM 和 i18n 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeExtension);
    } else {
        initializeExtension();
    }
})(); 