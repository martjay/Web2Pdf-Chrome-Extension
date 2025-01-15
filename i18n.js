// 语言配置
window.i18n = {
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
window.getUserLanguage = function() {
  // 优先使用用户设置的语言
  return new Promise((resolve) => {
    chrome.storage.local.get(['userLanguage'], function(result) {
      if (result.userLanguage) {
        resolve(result.userLanguage);
      } else {
        // 如果没有设置，使用系统语言
        const lang = navigator.language.toLowerCase();
        const defaultLang = lang.startsWith('zh') ? 'zh' : 'en';
        resolve(defaultLang);
      }
    });
  });
};

// 设置用户语言
window.setUserLanguage = function(lang) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ userLanguage: lang }, function() {
      resolve();
    });
  });
};

// 获取翻译文本
window.t = async function(key) {
  const lang = await getUserLanguage();
  return window.i18n[lang][key] || window.i18n.en[key];
}; 