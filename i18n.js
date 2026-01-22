/**
 * Web2PDF Chrome Extension - 国际化模块
 * 支持中英文界面
 */

// 语言配置
window.i18n = {
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
    loadComplete: '加载完成，现在可以打印PDF了',
    loadFailed: '加载失败，请重试',
    deleteBlock: '删除此块',
    confirmDelete: '确定要删除这个内容块吗？',
    enterLink: '请输入链接地址:',
    enterImageUrl: '请输入图片地址:',
    enterColor: '请输入颜色值 (如 #ff0000 或 red):',
    enterHighlightColor: '请输入高亮颜色值 (如 #ffff00 或 yellow):',
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
    pdfError: '生成PDF时出错，请重试',
    close: '关闭 (ESC)'
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
    loadComplete: 'Loading complete, you can print PDF now',
    loadFailed: 'Loading failed, please try again',
    deleteBlock: 'Delete Block',
    confirmDelete: 'Are you sure you want to delete this block?',
    enterLink: 'Please enter the link URL:',
    enterImageUrl: 'Please enter the image URL:',
    enterColor: 'Enter color value (e.g. #ff0000 or red):',
    enterHighlightColor: 'Enter highlight color (e.g. #ffff00 or yellow):',
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
    pdfError: 'Error generating PDF, please try again',
    close: 'Close (ESC)'
  }
};

/**
 * 获取用户语言设置
 * @returns {Promise<string>} 语言代码 'zh' 或 'en'
 */
window.getUserLanguage = function() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['userLanguage'], function(result) {
      if (result.userLanguage) {
        resolve(result.userLanguage);
      } else {
        // 使用系统语言作为默认值
        const lang = navigator.language.toLowerCase();
        const defaultLang = lang.startsWith('zh') ? 'zh' : 'en';
        resolve(defaultLang);
      }
    });
  });
};

/**
 * 设置用户语言
 * @param {string} lang - 语言代码 'zh' 或 'en'
 * @returns {Promise<void>}
 */
window.setUserLanguage = function(lang) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ userLanguage: lang }, resolve);
  });
};

/**
 * 获取翻译文本
 * @param {string} key - 翻译键
 * @returns {Promise<string>} 翻译后的文本
 */
window.t = async function(key) {
  const lang = await getUserLanguage();
  return window.i18n[lang]?.[key] || window.i18n.en[key] || key;
};
