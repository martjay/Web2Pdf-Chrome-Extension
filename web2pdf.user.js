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
        closeButton.style.cssText = `
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