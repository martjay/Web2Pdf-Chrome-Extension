/**
 * Web2PDF Chrome Extension - Content Script
 * 将网页转换为 PDF，支持阅读模式和编辑功能
 */

// ============================================
// 常量定义
// ============================================
const A4_WIDTH_PX = 794;   // 210mm = 794px (96 DPI)
const A4_HEIGHT_PX = 1123; // 297mm = 1123px
const PAGE_MARGIN = 40;
const EFFECTIVE_HEIGHT = A4_HEIGHT_PX - (PAGE_MARGIN * 2);

// 内容提取选择器
const CONTENT_SELECTORS = [
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

// 需要移除的元素选择器
const REMOVE_SELECTORS = [
  'script', 'style', 'iframe', 'nav', 'header', 'footer',
  '.advertisement', '.ads', '.social-share', '.comments',
  '#comments', '.sidebar', '.related-posts', '.nav',
  '.navigation', '.menu', '.share', '.social',
  'button', 'input', 'form'
];

// 懒加载图片属性
const LAZY_LOAD_ATTRS = [
  'data-src',
  'data-original',
  'data-lazy-src',
  'data-lazy-loaded',
  'data-url'
];

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
    console.log('[Web2PDF] History manager initialized');
  },

  saveState() {
    if (!this.isRecording || !this.contentElement) {
      console.log('[Web2PDF] Skip save: recording=' + this.isRecording + ', element=' + !!this.contentElement);
      return;
    }
    
    // 克隆内容并移除 UI 元素后再保存
    const clone = this.contentElement.cloneNode(true);
    clone.querySelectorAll('.element-controls, .image-resizer, .image-wrapper').forEach(el => {
      if (el.classList.contains('image-wrapper')) {
        // 保留图片，只移除包装器
        const img = el.querySelector('img');
        if (img) {
          el.parentNode.insertBefore(img, el);
        }
        el.remove();
      } else {
        el.remove();
      }
    });
    
    const state = clone.innerHTML;
    
    // 避免保存重复状态
    if (state === this.lastSavedState) {
      return;
    }
    
    this.lastSavedState = state;
    this.undoStack.push(state);
    this.redoStack = []; // 新操作清空重做栈
    
    // 限制历史记录数量
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    
    console.log('[Web2PDF] State saved, undo stack size:', this.undoStack.length);
  },

  undo() {
    console.log('[Web2PDF] Undo called, stack size:', this.undoStack.length);
    
    if (this.undoStack.length <= 1 || !this.contentElement) {
      console.log('[Web2PDF] Cannot undo');
      return false;
    }
    
    this.isRecording = false;
    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState);
    
    const previousState = this.undoStack[this.undoStack.length - 1];
    this.lastSavedState = previousState;
    this.contentElement.innerHTML = previousState;
    
    // 重新添加元素控制按钮
    this._refreshControls();
    
    // 延迟恢复录制，避免 MutationObserver 触发保存
    setTimeout(() => {
      this.isRecording = true;
    }, 100);
    
    console.log('[Web2PDF] Undo successful, redo stack size:', this.redoStack.length);
    return true;
  },

  redo() {
    console.log('[Web2PDF] Redo called, stack size:', this.redoStack.length);
    
    if (this.redoStack.length === 0 || !this.contentElement) {
      console.log('[Web2PDF] Cannot redo');
      return false;
    }
    
    this.isRecording = false;
    const nextState = this.redoStack.pop();
    this.undoStack.push(nextState);
    this.lastSavedState = nextState;
    this.contentElement.innerHTML = nextState;
    
    // 重新添加元素控制按钮
    this._refreshControls();
    
    // 延迟恢复录制，避免 MutationObserver 触发保存
    setTimeout(() => {
      this.isRecording = true;
    }, 100);
    
    console.log('[Web2PDF] Redo successful');
    return true;
  },

  // 刷新控制按钮
  async _refreshControls() {
    if (!this.contentElement) return;
    
    // 移除旧的控制按钮
    this.contentElement.querySelectorAll('.element-controls').forEach(el => el.remove());
    this.contentElement.querySelectorAll('.image-resizer').forEach(el => el.remove());
    
    // 重新添加
    await addElementControls(this.contentElement);
  },

  canUndo() {
    return this.undoStack.length > 1;
  },

  canRedo() {
    return this.redoStack.length > 0;
  },

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.contentElement = null;
    this.lastSavedState = null;
    console.log('[Web2PDF] History cleared');
  }
};

// ============================================
// 工具函数
// ============================================

/**
 * 计算颜色亮度 (0-255)
 * 使用相对亮度公式
 */
function getColorBrightness(color) {
  // 处理 rgb/rgba 格式
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    // 使用感知亮度公式
    return (r * 299 + g * 587 + b * 114) / 1000;
  }
  
  // 处理 hex 格式
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    const r = parseInt(hexMatch[1], 16);
    const g = parseInt(hexMatch[2], 16);
    const b = parseInt(hexMatch[3], 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  }
  
  // 处理简写 hex
  const shortHexMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    const r = parseInt(shortHexMatch[1] + shortHexMatch[1], 16);
    const g = parseInt(shortHexMatch[2] + shortHexMatch[2], 16);
    const b = parseInt(shortHexMatch[3] + shortHexMatch[3], 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  }
  
  // 默认返回中等亮度
  return 128;
}

/**
 * 判断颜色是否太亮（在白色背景上难以阅读）
 */
function isColorTooLight(color) {
  return getColorBrightness(color) > 200;
}

/**
 * 判断颜色是否接近白色/透明
 */
function isNearWhiteOrTransparent(color) {
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
    return true;
  }
  return getColorBrightness(color) > 240;
}

/**
 * 智能修正文字颜色
 * 只修正在白色背景上看不清的浅色文字
 * 注意：不移除用户编辑时添加的高亮色
 */
function fixTextColors(container) {
  if (!container) return;
  
  const elements = container.querySelectorAll('*');
  
  elements.forEach(el => {
    // 跳过特定元素
    if (el.tagName === 'IMG' || el.tagName === 'SVG' || el.tagName === 'VIDEO') {
      return;
    }
    
    const style = window.getComputedStyle(el);
    const color = style.color;
    
    // 如果文字颜色太亮，调整为深色
    if (isColorTooLight(color)) {
      // 检查是否是有意义的彩色（不是灰色系）
      const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        
        // 计算颜色饱和度（简化版）
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        
        if (saturation > 0.2) {
          // 有颜色的文字，降低亮度但保留色相
          const factor = 0.5;
          el.style.color = `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
        } else {
          // 接近白色/灰色的文字，改为深灰色
          el.style.color = '#333';
        }
      } else {
        el.style.color = '#333';
      }
    }
    
    // 只移除大块元素的暗色背景，保留内联元素的背景（可能是高亮）
    // 跳过 span、mark、font 等可能包含用户高亮的元素
    const inlineTags = ['SPAN', 'MARK', 'FONT', 'A', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL', 'SUB', 'SUP'];
    if (!inlineTags.includes(el.tagName)) {
      const bgColor = style.backgroundColor;
      // 只移除暗色背景（亮度 < 200），保留浅色/高亮背景
      if (!isNearWhiteOrTransparent(bgColor)) {
        const brightness = getColorBrightness(bgColor);
        if (brightness < 200) {
          el.style.backgroundColor = 'transparent';
        }
      }
    }
  });
}

/**
 * 创建加载提示元素
 * @param {string} message - 提示消息
 * @returns {HTMLElement}
 */
function createLoadingTip(message) {
  const tip = document.createElement('div');
  tip.className = 'web2pdf-loading-tip';
  tip.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px;
    border-radius: 10px;
    z-index: 100001;
    text-align: center;
  `;
  tip.textContent = message;
  document.body.appendChild(tip);
  return tip;
}

/**
 * 更新加载提示状态
 * @param {HTMLElement} tip - 提示元素
 * @param {string} status - 状态类型 'success' | 'error'
 * @param {string} message - 消息
 * @param {number} delay - 延迟移除时间（毫秒）
 */
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
// 浮动按钮相关
// ============================================

/**
 * 创建浮动按钮
 */
function createFloatingButton() {
  // 检查是否已存在
  if (document.querySelector('.web2pdf-floating-button')) return;
  
  const button = document.createElement('button');
  button.className = 'web2pdf-floating-button';
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
      <path d="M0 0h24v24H0z" fill="none"/>
      <path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
    </svg>
  `;

  // 从存储中获取保存的位置
  chrome.storage.local.get(['buttonPosition'], function(result) {
    if (result.buttonPosition) {
      button.style.left = result.buttonPosition.left;
      button.style.top = result.buttonPosition.top;
      button.style.bottom = 'auto';
    } else {
      button.style.left = '20px';
      button.style.bottom = '20px';
    }
  });

  // 添加拖动功能
  setupDraggable(button);
  
  button.addEventListener('click', showMenu);
  document.body.appendChild(button);
}

/**
 * 设置元素可拖动
 * @param {HTMLElement} element - 要设置拖动的元素
 */
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
      chrome.storage.local.set({
        buttonPosition: {
          left: element.style.left,
          top: element.style.top
        }
      });
    }
  });
}

// ============================================
// 菜单相关
// ============================================

/**
 * 创建主菜单
 */
async function createMenu() {
  // 检查是否已存在
  const existingMenu = document.querySelector('.web2pdf-menu');
  if (existingMenu) existingMenu.remove();
  
  const menu = document.createElement('div');
  menu.className = 'web2pdf-menu';
  menu.innerHTML = `
    <div class="menu-item" id="readMode">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
      </svg>
      <span>${await t('readMode')}</span>
    </div>
    <div class="menu-item has-submenu" id="exportMenu">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      <span>${await t('exportAs')}</span>
      <svg class="arrow" viewBox="0 0 24 24" width="16" height="16">
        <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
      </svg>
      <div class="submenu">
        <div class="menu-item" id="exportPDF">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
          </svg>
          <span>${await t('exportPDF')}</span>
        </div>
        <div class="menu-item" id="exportWord">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
          </svg>
          <span>${await t('exportWord')}</span>
        </div>
        <div class="menu-item" id="exportHTML">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
          </svg>
          <span>${await t('exportHTML')}</span>
        </div>
        <div class="menu-item" id="exportMarkdown">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41zM6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.89v6.38h1.92zM19.69 12h-1.92V8.81h-1.92V12h-1.93l2.89 3.28L19.69 12z"/>
          </svg>
          <span>${await t('exportMarkdown')}</span>
        </div>
      </div>
    </div>
    <div class="menu-item" id="switchLang">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
      </svg>
      <span>${await t('switchLang')}</span>
    </div>
  `;
  document.body.appendChild(menu);

  // 添加事件监听
  document.getElementById('readMode').addEventListener('click', toggleReadMode);
  document.getElementById('exportPDF').addEventListener('click', () => exportContent('pdf'));
  document.getElementById('exportWord').addEventListener('click', () => exportContent('word'));
  document.getElementById('exportHTML').addEventListener('click', () => exportContent('html'));
  document.getElementById('exportMarkdown').addEventListener('click', () => exportContent('markdown'));
  document.getElementById('switchLang').addEventListener('click', handleLanguageSwitch);
  
  // 设置子菜单的 hover 行为
  setupSubmenuHover(menu);
}

/**
 * 设置子菜单的 hover 行为，防止意外关闭
 */
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
      }, 100); // 100ms 延迟，给用户时间移动到子菜单
    };
    
    item.addEventListener('mouseenter', showSubmenu);
    item.addEventListener('mouseleave', hideSubmenu);
    
    // 子菜单本身也需要处理
    submenu.addEventListener('mouseenter', showSubmenu);
    submenu.addEventListener('mouseleave', hideSubmenu);
  });
}

/**
 * 处理语言切换
 */
async function handleLanguageSwitch() {
  const currentLang = await getUserLanguage();
  const newLang = currentLang === 'zh' ? 'en' : 'zh';
  await setUserLanguage(newLang);
  
  // 重新创建菜单以更新语言
  await createMenu();
  
  // 如果在阅读模式中，也更新阅读模式的菜单
  const readerMode = document.querySelector('.web2pdf-reader-mode');
  if (readerMode) {
    const oldMenu = readerMode.querySelector('.web2pdf-menu');
    if (oldMenu) oldMenu.remove();
    await createReaderModeMenu(readerMode);
  }
}

/**
 * 显示/隐藏菜单
 */
function showMenu(event) {
  event.stopPropagation();
  const button = event.currentTarget;
  const menu = document.querySelector('.web2pdf-menu');
  const readerMode = document.querySelector('.web2pdf-reader-mode');
  
  if (!menu) return;
  
  const buttonRect = button.getBoundingClientRect();
  
  // 根据按钮位置调整菜单位置和子菜单方向
  if (buttonRect.left < window.innerWidth / 2) {
    menu.style.left = (buttonRect.right + 10) + 'px';
    menu.style.right = 'auto';
    menu.classList.remove('submenu-left');
  } else {
    menu.style.right = (window.innerWidth - buttonRect.left + 10) + 'px';
    menu.style.left = 'auto';
    menu.classList.add('submenu-left');
  }

  // 垂直位置调整
  const menuHeight = menu.offsetHeight || 120;
  if (buttonRect.top + menuHeight > window.innerHeight) {
    menu.style.bottom = (window.innerHeight - buttonRect.top + 10) + 'px';
    menu.style.top = 'auto';
  } else {
    menu.style.top = buttonRect.top + 'px';
    menu.style.bottom = 'auto';
  }

  const isShowing = menu.classList.toggle('show');
  
  // 菜单显示时禁用编辑控件的 hover 效果
  if (readerMode) {
    if (isShowing) {
      readerMode.classList.add('menu-open');
    } else {
      readerMode.classList.remove('menu-open');
    }
  }
  
  // 点击其他地方关闭菜单
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

/**
 * 切换阅读模式
 */
async function toggleReadMode() {
  const existingReader = document.querySelector('.web2pdf-reader-mode');
  if (existingReader) {
    exitReaderMode(existingReader);
    return;
  }

  const loadingTip = createLoadingTip(await t('loading'));

  try {
    const content = extractMainContent();
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = content;

    // 预加载图片
    await preloadImages(tempContainer, loadingTip);

    // 创建阅读模式容器
    const readerMode = document.createElement('div');
    readerMode.className = 'web2pdf-reader-mode';
    readerMode.innerHTML = tempContainer.innerHTML;
    
    // 智能修正文字颜色（处理暗色主题网页）
    fixTextColors(readerMode.querySelector('.web2pdf-content'));

    // 添加关闭按钮
    await addCloseButton(readerMode);

    // 添加 ESC 快捷键支持
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

    // 移除原始按钮和菜单
    document.querySelector('.web2pdf-floating-button')?.remove();
    document.querySelector('body > .web2pdf-menu')?.remove();

    // 在阅读模式中创建新的浮动按钮和菜单
    await createReaderModeControls(readerMode);

    // 显示成功提示
    updateLoadingTip(loadingTip, 'success', await t('loadComplete'));
    
    // 自动开启编辑模式
    setTimeout(() => toggleEditMode(readerMode), 2000);

  } catch (error) {
    console.error('Error loading content:', error);
    updateLoadingTip(loadingTip, 'error', await t('loadFailed'));
  }
}

/**
 * 退出阅读模式
 */
function exitReaderMode(readerMode) {
  readerMode.remove();
  document.body.style.overflow = '';
  createFloatingButton();
  createMenu();
}

/**
 * 添加关闭按钮
 */
async function addCloseButton(readerMode) {
  const closeButton = document.createElement('button');
  closeButton.className = 'web2pdf-close-button';
  closeButton.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
    <span>${await t('close')}</span>
  `;
  closeButton.addEventListener('click', () => exitReaderMode(readerMode));
  readerMode.appendChild(closeButton);
}

/**
 * 在阅读模式中创建控制元素
 */
async function createReaderModeControls(readerMode) {
  // 创建浮动按钮
  const button = document.createElement('button');
  button.className = 'web2pdf-floating-button';
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
      <path d="M0 0h24v24H0z" fill="none"/>
      <path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
    </svg>
  `;

  // 应用保存的位置
  chrome.storage.local.get(['buttonPosition'], function(result) {
    if (result.buttonPosition) {
      button.style.left = result.buttonPosition.left;
      button.style.top = result.buttonPosition.top;
      button.style.bottom = 'auto';
    } else {
      button.style.left = '20px';
      button.style.bottom = '20px';
    }
  });

  setupDraggable(button);
  button.addEventListener('click', showMenu);
  readerMode.appendChild(button);

  // 创建菜单
  await createReaderModeMenu(readerMode);
}

/**
 * 创建阅读模式的菜单
 */
async function createReaderModeMenu(readerMode) {
  const menu = document.createElement('div');
  menu.className = 'web2pdf-menu';
  menu.innerHTML = `
    <div class="menu-item" id="toggleEdit">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
      <span>${await t('editMode')}</span>
    </div>
    <div class="menu-item has-submenu" id="exportMenu">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      <span>${await t('exportAs')}</span>
      <svg class="arrow" viewBox="0 0 24 24" width="16" height="16">
        <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
      </svg>
      <div class="submenu">
        <div class="menu-item" id="exportPDF">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
          </svg>
          <span>${await t('exportPDF')}</span>
        </div>
        <div class="menu-item" id="exportWord">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
          </svg>
          <span>${await t('exportWord')}</span>
        </div>
        <div class="menu-item" id="exportHTML">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
          </svg>
          <span>${await t('exportHTML')}</span>
        </div>
        <div class="menu-item" id="exportMarkdown">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41zM6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.89v6.38h1.92zM19.69 12h-1.92V8.81h-1.92V12h-1.93l2.89 3.28L19.69 12z"/>
          </svg>
          <span>${await t('exportMarkdown')}</span>
        </div>
      </div>
    </div>
    <div class="menu-item" id="switchLang">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
      </svg>
      <span>${await t('switchLang')}</span>
    </div>
  `;
  readerMode.appendChild(menu);

  // 添加事件监听
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

  menu.querySelector('#switchLang').addEventListener('click', async function() {
    const currentLang = await getUserLanguage();
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    await setUserLanguage(newLang);
    
    const oldMenu = readerMode.querySelector('.web2pdf-menu');
    if (oldMenu) oldMenu.remove();
    await createReaderModeMenu(readerMode);
  });

  // 设置子菜单的 hover 行为
  setupSubmenuHover(menu);

  return menu;
}

// ============================================
// 图片预加载
// ============================================

/**
 * 预加载图片
 * @param {HTMLElement} container - 包含图片的容器
 * @param {HTMLElement} loadingTip - 加载提示元素
 */
async function preloadImages(container, loadingTip) {
  const images = container.getElementsByTagName('img');
  const totalImages = images.length;
  let loadedCount = 0;

  if (totalImages === 0) {
    if (loadingTip) {
      loadingTip.textContent = await t('noImages');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return;
  }

  // 创建进度条
  if (loadingTip) {
    loadingTip.innerHTML = `
      <div>${await t('loadingImages')} (0/${totalImages})</div>
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
      ">${await t('preparing')}</div>
    `;
  }

  const imageLoadPromises = Array.from(images).map((img) => {
    return new Promise((resolve) => {
      // 获取真实图片源
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
          // 清除懒加载属性
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

/**
 * 提取网页主要内容
 * @returns {string} HTML 字符串
 */
function extractMainContent() {
  let mainContent = null;
  
  // 查找最匹配的内容容器
  for (const selector of CONTENT_SELECTORS) {
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

  // 创建容器
  const container = document.createElement('div');
  container.className = 'web2pdf-content';
  
  // 添加标题
  const title = document.createElement('h1');
  title.style.marginBottom = '20px';
  title.textContent = document.title;
  container.appendChild(title);

  // 克隆并清理内容
  const contentClone = mainContent.cloneNode(true);

  REMOVE_SELECTORS.forEach(selector => {
    contentClone.querySelectorAll(selector).forEach(el => {
      el.parentNode?.removeChild(el);
    });
  });

  // 确保图片使用完整 URL
  contentClone.querySelectorAll('img').forEach(img => {
    if (img.src) {
      img.src = img.src;
    }
  });

  container.appendChild(contentClone);
  return container.outerHTML;
}

// ============================================
// PDF 打印相关
// ============================================

/**
 * 计算 A4 分页
 * @param {HTMLElement} container - 内容容器
 * @returns {HTMLElement[]} 分页后的页面数组
 */
function calculateA4Pages(container) {
  const tempDiv = document.createElement('div');
  tempDiv.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    width: ${A4_WIDTH_PX - (PAGE_MARGIN * 2)}px;
    visibility: hidden;
  `;
  document.body.appendChild(tempDiv);

  const contentClone = container.cloneNode(true);
  tempDiv.appendChild(contentClone);

  // 处理图片等宽
  const images = tempDiv.getElementsByTagName('img');
  Array.from(images).forEach(img => {
    img.style.width = '100%';
    img.style.height = 'auto';
    if (img.parentElement.classList.contains('img-container')) {
      img.parentElement.style.width = '100%';
    }
  });

  const pages = [];
  let currentPage = document.createElement('div');
  let currentHeight = 0;
  
  Array.from(contentClone.children).forEach(element => {
    const elementHeight = element.offsetHeight;
    const isImage = element.tagName.toLowerCase() === 'img' || 
                   element.querySelector('img') !== null;

    if (currentHeight + elementHeight > EFFECTIVE_HEIGHT) {
      if (currentPage.children.length > 0) {
        pages.push(currentPage);
      }
      currentPage = document.createElement('div');
      currentPage.appendChild(element.cloneNode(true));
      currentHeight = elementHeight;
    } else {
      currentPage.appendChild(element.cloneNode(true));
      currentHeight += elementHeight;
    }
  });

  if (currentPage.children.length > 0) {
    pages.push(currentPage);
  }

  document.body.removeChild(tempDiv);
  return pages;
}

// ============================================
// 导出功能
// ============================================

/**
 * 获取清理后的内容用于导出
 */
function getCleanContent() {
  const readerMode = document.querySelector('.web2pdf-reader-mode');
  let content;
  
  if (readerMode) {
    const clone = readerMode.cloneNode(true);
    // 移除 UI 元素
    clone.querySelectorAll('.web2pdf-floating-button, .web2pdf-menu, .web2pdf-close-button, .editing-toolbar, .element-controls, .image-resizer').forEach(el => el.remove());
    
    // 处理图片包装器
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
  
  // 清理编辑属性
  content.querySelectorAll('*').forEach(el => {
    el.removeAttribute('contenteditable');
    el.classList.remove('editing');
  });
  
  return content;
}

/**
 * 获取文件名（不含扩展名）
 */
function getFileName() {
  return document.title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100) || 'webpage';
}

/**
 * 导出内容
 */
async function exportContent(format) {
  // 不在这里创建 loadingTip，让各个导出函数自己管理
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
    const errorTip = createLoadingTip(await t('pdfError'));
    updateLoadingTip(errorTip, 'error', await t('pdfError'));
  }
}

/**
 * 导出为 PDF（使用打印预览方式）
 */
async function exportToPDF(content, fileName) {
  // 预加载图片
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
          /* 保留高亮和颜色样式 */
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
  
  // 等待内容加载完成后打印
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
}

/**
 * 导出为 Word（.docx 格式，使用 HTML 转换）
 */
async function exportToWord(content, fileName) {
  const loadingTip = createLoadingTip('正在处理图片...');
  
  try {
    // 克隆内容以避免修改原始内容
    const clone = content.cloneNode(true);
    
    // 获取阅读模式中的原始图片元素（用于 canvas 绘制）
    const readerMode = document.querySelector('.web2pdf-reader-mode');
    const originalContent = readerMode ? 
      (readerMode.querySelector('.web2pdf-content') || readerMode) : 
      document.body;
    
    const cloneImages = clone.querySelectorAll('img');
    const totalImages = cloneImages.length;
    
    let imageCount = 0;
    let failedCount = 0;
    
    // 转换所有图片为 base64
    for (let i = 0; i < cloneImages.length; i++) {
      const cloneImg = cloneImages[i];
      
      // 更新进度
      if (loadingTip) {
        loadingTip.textContent = `正在处理图片 (${i + 1}/${totalImages})...`;
      }
      
      // 尝试在原始内容中找到对应的图片元素
      let originalImg = null;
      if (cloneImg.src) {
        // 通过 src 匹配原始图片
        originalImg = originalContent.querySelector(`img[src="${cloneImg.src}"]`);
        if (!originalImg) {
          // 尝试通过部分 src 匹配
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
          // 移除无法转换的图片，避免显示损坏图标
          cloneImg.style.display = 'none';
        }
      } catch (e) {
        console.warn('[Web2PDF] Failed to convert image:', cloneImg.src, e);
        failedCount++;
        cloneImg.style.display = 'none';
      }
    }
    
    console.log(`[Web2PDF] Converted ${imageCount}/${totalImages} images to base64, ${failedCount} failed`);
    
    if (loadingTip) {
      loadingTip.textContent = '正在生成文档...';
    }
    
    // 创建 Word 兼容的 HTML
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
    
    // 使用 Blob 下载，MIME 类型使用 Word 格式
    const blob = new Blob(['\ufeff' + html], { 
      type: 'application/vnd.ms-word;charset=utf-8' 
    });
    downloadBlob(blob, fileName + '.doc');
    
    // 显示成功提示
    updateLoadingTip(loadingTip, 'success', `导出成功！(${imageCount}张图片)`);
    
  } catch (error) {
    console.error('[Web2PDF] Export to Word failed:', error);
    updateLoadingTip(loadingTip, 'error', '导出失败: ' + error.message);
  }
}

/**
 * 将图片 URL 转换为 base64
 * 支持多种方式：直接从已加载的 img 元素、fetch、canvas 回退
 * @param {string} src - 图片 URL
 * @param {HTMLImageElement} [imgElement] - 可选的已加载图片元素
 */
async function imageToBase64(src, imgElement = null) {
  if (!src || src.startsWith('data:')) {
    return src; // 已经是 base64
  }
  
  // 方法1: 如果提供了已加载的图片元素，尝试直接用 canvas 绘制
  // 注意：这只对同源图片或设置了 crossOrigin 的图片有效
  if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0);
      // 尝试获取数据，如果图片是跨域的会抛出错误
      const dataUrl = canvas.toDataURL('image/png');
      if (dataUrl && dataUrl !== 'data:,' && dataUrl.length > 100) {
        console.log('[Web2PDF] Image converted via canvas (existing element):', src.substring(0, 50));
        return dataUrl;
      }
    } catch (e) {
      // 跨域图片会在这里失败，继续尝试其他方法
      console.log('[Web2PDF] Canvas from element failed (likely CORS):', src.substring(0, 50));
    }
  }
  
  // 方法2: 尝试使用 fetch（Chrome 扩展有 host_permissions 应该可以跨域）
  try {
    const response = await fetch(src, { 
      mode: 'cors',
      credentials: 'omit',
      cache: 'force-cache'
    });
    if (response.ok) {
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (dataUrl && dataUrl.length > 100) {
        console.log('[Web2PDF] Image converted via fetch:', src.substring(0, 50));
        return dataUrl;
      }
    }
  } catch (e) {
    console.log('[Web2PDF] Fetch failed for:', src.substring(0, 50));
  }
  
  // 方法3: 使用 XMLHttpRequest（某些情况下比 fetch 更兼容）
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', src, true);
      xhr.responseType = 'blob';
      xhr.timeout = 10000;
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('FileReader failed'));
          reader.readAsDataURL(xhr.response);
        } else {
          reject(new Error('XHR status: ' + xhr.status));
        }
      };
      
      xhr.onerror = () => reject(new Error('XHR error'));
      xhr.ontimeout = () => reject(new Error('XHR timeout'));
      xhr.send();
    });
    
    if (dataUrl && dataUrl.length > 100) {
      console.log('[Web2PDF] Image converted via XHR:', src.substring(0, 50));
      return dataUrl;
    }
  } catch (e) {
    console.log('[Web2PDF] XHR failed for:', src.substring(0, 50));
  }
  
  // 方法4: 创建新图片元素并用 canvas 绘制（设置 crossOrigin）
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      console.warn('[Web2PDF] Image load timeout:', src.substring(0, 50));
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
          console.log('[Web2PDF] Image converted via canvas (new element):', src.substring(0, 50));
          resolve(dataUrl);
        } else {
          console.warn('[Web2PDF] Canvas produced empty result');
          resolve(null);
        }
      } catch (e) {
        console.warn('[Web2PDF] Canvas conversion failed:', e.message);
        resolve(null);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      console.warn('[Web2PDF] Image load failed:', src.substring(0, 50));
      resolve(null);
    };
    
    // 添加时间戳避免缓存问题
    const separator = src.includes('?') ? '&' : '?';
    img.src = src + separator + '_t=' + Date.now();
  });
}

/**
 * 导出为 HTML（完整离线页面）
 */
async function exportToHTML(content, fileName) {
  const loadingTip = createLoadingTip('正在处理图片...');
  
  try {
    // 克隆内容以避免修改原始内容
    const clone = content.cloneNode(true);
    
    // 获取阅读模式中的原始图片元素
    const readerMode = document.querySelector('.web2pdf-reader-mode');
    const originalContent = readerMode ? 
      (readerMode.querySelector('.web2pdf-content') || readerMode) : 
      document.body;
    
    const cloneImages = clone.querySelectorAll('img');
    const totalImages = cloneImages.length;
    
    let imageCount = 0;
    
    // 转换所有图片为 base64
    for (let i = 0; i < cloneImages.length; i++) {
      const cloneImg = cloneImages[i];
      
      if (loadingTip) {
        loadingTip.textContent = `正在处理图片 (${i + 1}/${totalImages})...`;
      }
      
      // 尝试在原始内容中找到对应的图片元素
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

/**
 * 导出为 Markdown
 */
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

/**
 * HTML 转 Markdown
 * 支持颜色和样式（使用内联 HTML）
 */
function htmlToMarkdown(element) {
  let md = `# ${document.title}\n\n`;
  md += `> 来源: ${window.location.href}\n\n`;
  md += `---\n\n`;
  
  /**
   * 获取元素的颜色样式
   */
  const getColorStyles = (node) => {
    const styles = [];
    
    // 检查 style 属性
    const styleAttr = node.getAttribute('style') || '';
    const colorMatch = styleAttr.match(/(?:^|;)\s*color:\s*([^;]+)/i);
    const bgColorMatch = styleAttr.match(/(?:^|;)\s*background(?:-color)?:\s*([^;]+)/i);
    
    if (colorMatch) styles.push(`color:${colorMatch[1].trim()}`);
    if (bgColorMatch) styles.push(`background-color:${bgColorMatch[1].trim()}`);
    
    // 检查 bgcolor 属性（某些浏览器使用）
    const bgColorAttr = node.getAttribute('bgcolor');
    if (bgColorAttr && !bgColorMatch) {
      styles.push(`background-color:${bgColorAttr}`);
    }
    
    // 检查 color 属性（font 标签）
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
    
    // 包装带颜色的内容
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
        // 高亮文本
        const markStyles = colorStyles.length > 0 ? colorStyles : ['background-color:yellow'];
        return `<mark style="${markStyles.join(';')}">${children}</mark>`;
      case 'font':
        // 旧式 font 标签
        if (colorStyles.length > 0) {
          return `<span style="${colorStyles.join(';')}">${children}</span>`;
        }
        return children;
      case 'span':
        // span 标签，检查颜色样式
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
        // 其他标签，如果有颜色样式也保留
        if (colorStyles.length > 0) {
          return `<span style="${colorStyles.join(';')}">${children}</span>`;
        }
        return children;
    }
  };
  
  md += processNode(element);
  
  // 清理多余空行
  md = md.replace(/\n{3,}/g, '\n\n');
  
  return md;
}

/**
 * 下载 Blob 文件
 */
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

/**
 * 打印为 PDF（旧方法，保留作为备用）
 */
async function printToPDF() {
  await exportContent('pdf');
}

// ============================================
// 编辑模式相关
// ============================================

/**
 * 切换编辑模式
 */
async function toggleEditMode(readerMode) {
  const content = readerMode.querySelector('.web2pdf-content') || readerMode;
  const isEditing = content.getAttribute('contenteditable') === 'true';
  
  console.log('[Web2PDF] toggleEditMode called, isEditing:', isEditing);
  
  if (isEditing) {
    content.setAttribute('contenteditable', 'false');
    content.classList.remove('editing');
    removeEditingToolbar();
    removeElementControls();
    
    // 清理 MutationObserver
    if (content._web2pdfObserver) {
      content._web2pdfObserver.disconnect();
      delete content._web2pdfObserver;
    }
    
    historyManager.clear();
  } else {
    content.setAttribute('contenteditable', 'true');
    content.classList.add('editing');
    historyManager.init(content);
    await createEditingToolbar(readerMode, content);
    await addElementControls(content);
    
    // 监听内容变化，自动保存状态
    setupContentChangeListener(content);
  }
}

/**
 * 设置内容变化监听器
 */
function setupContentChangeListener(content) {
  let saveTimeout = null;
  
  const saveState = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      console.log('[Web2PDF] Auto-saving state...');
      historyManager.saveState();
    }, 300); // 防抖，300ms 后保存
  };
  
  // 使用 MutationObserver 监听 DOM 变化
  const observer = new MutationObserver((mutations) => {
    if (historyManager.isRecording) {
      console.log('[Web2PDF] Content changed, scheduling save');
      saveState();
    }
  });
  
  observer.observe(content, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true
  });
  
  // 存储 observer 以便后续清理
  content._web2pdfObserver = observer;
  
  // 也监听 input 事件作为备份
  content.addEventListener('input', () => {
    console.log('[Web2PDF] Input event fired');
    saveState();
  });
  
  // 支持 Ctrl+Z / Ctrl+Y 快捷键
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
  
  console.log('[Web2PDF] Content change listener setup complete');
}

/**
 * 创建编辑工具栏
 */
async function createEditingToolbar(readerMode, content) {
  removeEditingToolbar();

  const toolbar = document.createElement('div');
  toolbar.className = 'editing-toolbar';
  toolbar.innerHTML = `
    <button data-command="bold" title="${await t('bold')}"><b>B</b></button>
    <button data-command="italic" title="${await t('italic')}"><i>I</i></button>
    <button data-command="underline" title="${await t('underline')}"><u>U</u></button>
    <button data-command="strikeThrough" title="${await t('strikethrough')}"><s>S</s></button>
    <span class="toolbar-divider"></span>
    <button data-command="formatBlock" data-value="h1" title="${await t('heading1')}">H1</button>
    <button data-command="formatBlock" data-value="h2" title="${await t('heading2')}">H2</button>
    <button data-command="formatBlock" data-value="h3" title="${await t('heading3')}">H3</button>
    <button data-command="formatBlock" data-value="p" title="${await t('paragraph')}">P</button>
    <button data-command="formatBlock" data-value="blockquote" title="${await t('quote')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
    </button>
    <button data-command="formatBlock" data-value="pre" title="${await t('codeBlock')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
    </button>
    <span class="toolbar-divider"></span>
    <button data-command="justifyLeft" title="${await t('alignLeft')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/></svg>
    </button>
    <button data-command="justifyCenter" title="${await t('alignCenter')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 3h18v2H3V3zm3 4h12v2H6V7zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z"/></svg>
    </button>
    <button data-command="justifyRight" title="${await t('alignRight')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 3h18v2H3V3zm6 4h12v2H9V7zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z"/></svg>
    </button>
    <button data-command="justifyFull" title="${await t('alignJustify')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/></svg>
    </button>
    <span class="toolbar-divider"></span>
    <button data-command="insertUnorderedList" title="${await t('bulletList')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
    </button>
    <button data-command="insertOrderedList" title="${await t('numberList')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
    </button>
    <button data-command="indent" title="${await t('indent')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/></svg>
    </button>
    <button data-command="outdent" title="${await t('outdent')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M11 17h10v-2H11v2zm-8-5l4 4V8l-4 4zm0 9h18v-2H3v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/></svg>
    </button>
    <span class="toolbar-divider"></span>
    <button data-command="createLink" title="${await t('addLink')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
    </button>
    <button data-command="unlink" title="${await t('removeLink')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M17 7h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.43-.98 2.63-2.31 2.98l1.46 1.46C20.88 15.61 22 13.95 22 12c0-2.76-2.24-5-5-5zm-1 4h-2.19l2 2H16v-2zM2 4.27l3.11 3.11C3.29 8.12 2 9.91 2 12c0 2.76 2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1 0-1.59 1.21-2.9 2.76-3.07L8.73 11H8v2h2.73L13 15.27V17h1.73l4.01 4L20 19.74 3.27 3 2 4.27z"/></svg>
    </button>
    <button data-command="insertHorizontalRule" title="${await t('horizontalLine')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 11h18v2H3z"/></svg>
    </button>
    <button data-command="insertImage" title="${await t('insertImage')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
    </button>
    <span class="toolbar-divider"></span>
    <button data-command="subscript" title="${await t('subscript')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M22 18h-2v1h3v1h-4v-2.5c0-.55.45-1 1-1h2v-1h-3v-1h3c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1zM5.88 18h2.66l3.4-5.42h.12l3.4 5.42h2.66l-4.65-7.27L17.81 4h-2.68l-3.07 4.99h-.12L8.85 4H6.19l4.32 6.73L5.88 18z"/></svg>
    </button>
    <button data-command="superscript" title="${await t('superscript')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M22 7h-2v1h3v1h-4V6.5c0-.55.45-1 1-1h2v-1h-3v-1h3c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1zM5.88 20h2.66l3.4-5.42h.12l3.4 5.42h2.66l-4.65-7.27L17.81 6h-2.68l-3.07 4.99h-.12L8.85 6H6.19l4.32 6.73L5.88 20z"/></svg>
    </button>
    <button data-command="removeFormat" title="${await t('clearFormat')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.55 5.27 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z"/></svg>
    </button>
    <span class="toolbar-divider"></span>
    <button data-command="foreColor" title="${await t('textColor')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M11 2L5.5 16h2.25l1.12-3h6.25l1.12 3h2.25L13 2h-2zm-1.38 9L12 4.67 14.38 11H9.62z"/><path fill="#f44336" d="M3 20h18v3H3z"/></svg>
    </button>
    <button data-command="hiliteColor" title="${await t('highlightColor')}">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21z"/><path fill="#ffeb3b" d="M3 20h18v3H3z"/></svg>
    </button>
    <span class="toolbar-divider"></span>
    <button data-command="undo" title="${await t('undo')} (Ctrl+Z)">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
    </button>
    <button data-command="redo" title="${await t('redo')} (Ctrl+Y)">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
    </button>
  `;

  // 保存当前选区 - 存储在 content 元素上以便全局访问
  content._savedSelection = null;
  
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0 && sel.toString().length > 0) {
      content._savedSelection = sel.getRangeAt(0).cloneRange();
      console.log('[Web2PDF] Selection saved:', sel.toString().substring(0, 20));
    }
  };
  
  const restoreSelection = () => {
    if (content._savedSelection) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(content._savedSelection);
      console.log('[Web2PDF] Selection restored');
      return true;
    }
    return false;
  };

  // 在 mousedown 时立即保存选区，然后阻止默认行为
  toolbar.addEventListener('mousedown', (e) => {
    // 先保存当前选区
    saveSelection();
    // 阻止按钮获取焦点
    e.preventDefault();
  });

  toolbar.addEventListener('click', async (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    e.preventDefault();
    e.stopPropagation();
    
    const command = button.dataset.command;
    const value = button.dataset.value;
    
    console.log('[Web2PDF] Toolbar button clicked:', command);

    // 先恢复选区，再执行命令
    restoreSelection();
    
    // 确保内容区域获得焦点
    content.focus();

    if (command === 'undo') {
      const result = historyManager.undo();
      console.log('[Web2PDF] Undo result:', result);
    } else if (command === 'redo') {
      const result = historyManager.redo();
      console.log('[Web2PDF] Redo result:', result);
    } else if (command === 'createLink') {
      saveSelection();
      const url = prompt(await t('enterLink'), 'https://');
      if (url) {
        restoreSelection();
        document.execCommand(command, false, url);
        historyManager.saveState();
      }
    } else if (command === 'insertImage') {
      saveSelection();
      const url = prompt(await t('enterImageUrl'), 'https://');
      if (url) {
        restoreSelection();
        document.execCommand(command, false, url);
        historyManager.saveState();
      }
    } else if (command === 'foreColor') {
      const button = e.target.closest('button');
      showColorPicker('foreColor', (color) => {
        // 恢复选区
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
      const button = e.target.closest('button');
      showColorPicker('hiliteColor', (color) => {
        // 恢复选区
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
      const result = document.execCommand(command, false, value);
      console.log('[Web2PDF] execCommand result:', command, result);
      historyManager.saveState();
    }
  });
  
  // 监听内容区域的选区变化，持续保存选区
  content.addEventListener('mouseup', () => {
    setTimeout(saveSelection, 10); // 延迟一点确保选区已更新
  });
  content.addEventListener('keyup', saveSelection);
  
  // 监听 selectionchange 事件
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0 && content.contains(sel.anchorNode)) {
      saveSelection();
    }
  });

  readerMode.appendChild(toolbar);
}

/**
 * 移除编辑工具栏
 */
function removeEditingToolbar() {
  document.querySelectorAll('.editing-toolbar').forEach(el => el.remove());
  document.querySelectorAll('.color-picker-popup').forEach(el => el.remove());
}

/**
 * 创建颜色选择器弹窗
 * @param {string} type - 'foreColor' 或 'hiliteColor'
 * @param {Function} onSelect - 选择颜色后的回调
 * @param {HTMLElement} anchorButton - 锚定按钮
 */
async function showColorPicker(type, onSelect, anchorButton) {
  // 移除已存在的颜色选择器
  document.querySelectorAll('.color-picker-popup').forEach(el => el.remove());
  
  const isTextColor = type === 'foreColor';
  const title = isTextColor ? await t('textColor') : await t('highlightColor');
  
  // 预设颜色
  const presetColors = [
    // 基础色
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    // 红色系
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    // 浅色系
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
    // 中等色
    '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
    // 深色系
    '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
    // 更深色
    '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
    // 最深色
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
      <label>${await t('customColor')}:</label>
      <div class="color-input-row">
        <input type="color" class="color-input-picker" value="${isTextColor ? '#ff0000' : '#ffff00'}">
        <input type="text" class="color-input-text" placeholder="#000000" value="${isTextColor ? '#ff0000' : '#ffff00'}">
        <button class="color-apply-btn">${await t('apply')}</button>
      </div>
    </div>
    <div class="color-picker-actions">
      <button class="color-cancel-btn">${await t('cancel')}</button>
      ${!isTextColor ? `<button class="color-clear-btn">${await t('clearHighlight')}</button>` : ''}
    </div>
  `;
  
  // 定位弹窗
  const rect = anchorButton.getBoundingClientRect();
  popup.style.position = 'fixed';
  popup.style.top = (rect.bottom + 5) + 'px';
  popup.style.left = Math.max(10, rect.left - 100) + 'px';
  popup.style.zIndex = '100005';
  
  document.body.appendChild(popup);
  
  // 阻止弹窗内的 mousedown 导致选区丢失
  popup.addEventListener('mousedown', (e) => {
    // 只对颜色预设和按钮阻止默认行为，输入框需要正常工作
    if (!e.target.matches('input[type="text"]')) {
      e.preventDefault();
    }
  });
  
  // 同步颜色输入
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
  
  // 预设颜色点击
  popup.querySelectorAll('.color-preset').forEach(preset => {
    preset.addEventListener('click', () => {
      const color = preset.dataset.color;
      onSelect(color);
      popup.remove();
    });
  });
  
  // 应用自定义颜色
  popup.querySelector('.color-apply-btn').addEventListener('click', () => {
    const color = colorText.value || colorPicker.value;
    if (color) {
      onSelect(color);
      popup.remove();
    }
  });
  
  // 取消
  popup.querySelector('.color-cancel-btn').addEventListener('click', () => {
    popup.remove();
  });
  
  // 清除高亮（仅高亮色有此选项）
  const clearBtn = popup.querySelector('.color-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      onSelect('transparent');
      popup.remove();
    });
  }
  
  // 点击外部关闭
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

/**
 * 为内容块添加控制按钮
 */
async function addElementControls(container) {
  const blockElements = container.querySelectorAll('p, div, section, article, aside, h1, h2, h3, h4, h5, h6');
  
  for (const element of blockElements) {
    if (!element.classList.contains('web2pdf-content') && 
        !element.querySelector('.element-controls')) {
      await addElementControl(element);
    }
  }

  // 为图片添加调整大小功能
  container.querySelectorAll('img').forEach(img => {
    if (!img.closest('.image-wrapper')) {
      addImageResize(img);
    }
  });
}

/**
 * 为单个元素添加控制按钮
 */
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
    element.remove();
    // 保存历史状态以支持撤销
    historyManager.saveState();
  });
}

/**
 * 为图片添加缩放功能
 */
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
    // 保存历史状态以支持撤销
    historyManager.saveState();
  };

  resizer.addEventListener('mousedown', initResize);
}

/**
 * 移除元素控制
 */
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

/**
 * 处理窗口大小改变
 */
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

  chrome.storage.local.set({
    buttonPosition: {
      left: button.style.left,
      top: button.style.top
    }
  });
});

// ============================================
// 初始化
// ============================================

/**
 * 初始化扩展
 */
function initializeExtension() {
  // 避免重复初始化
  if (document.querySelector('.web2pdf-floating-button')) return;
  
  createFloatingButton();
  createMenu();
}

// 等待 DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}
