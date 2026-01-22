# Web2PDF

一个强大的网页内容导出工具，支持 Chrome 扩展和 Tampermonkey 脚本两种方式使用。可将网页转换为 PDF、Word、HTML、Markdown 等多种格式，支持阅读模式、编辑模式和多语言。

**GitHub**: https://github.com/martjay/Web2Pdf-Chrome-Extension

## ✨ 功能特点

### 核心功能
- 🔍 智能提取网页主要内容
- 📖 阅读模式，去除广告和干扰元素
- ✏️ 编辑模式，支持丰富的文本编辑
- 📤 多格式导出：PDF、Word、HTML、Markdown
- 🌐 支持中英文界面切换
- 🎯 可拖动的悬浮按钮，位置自动记忆

### 编辑功能
- **文字格式**：粗体、斜体、下划线、删除线
- **标题设置**：H1、H2、H3、段落
- **段落格式**：引用块、代码块
- **对齐方式**：左对齐、居中、右对齐、两端对齐
- **列表**：有序列表、无序列表、增减缩进
- **插入**：链接、图片、水平分割线
- **文字样式**：上标、下标、文字颜色、高亮颜色
- **其他**：清除格式、撤销/重做 (Ctrl+Z/Y)
- **元素操作**：删除内容块、调整图片大小

### 导出功能
- **PDF**：通过打印预览导出，支持自定义打印设置
- **Word**：导出为 .doc 格式，图片自动嵌入
- **HTML**：完整离线页面，图片转为 Base64
- **Markdown**：保留格式和颜色样式

## 📦 Chrome 扩展安装

1. 下载项目代码
2. 打开 Chrome 浏览器，进入 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目文件夹

## 🔧 Tampermonkey 脚本安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击 Tampermonkey 图标 → 添加新脚本
3. 复制 `tampermonkey/web2pdf.user.js` 的内容并保存

## 📖 使用方法

1. 访问任意网页，页面左下角会出现绿色悬浮按钮
2. 点击按钮打开功能菜单
3. 选择「阅读模式」进入编辑界面
4. 使用工具栏编辑内容（自动进入编辑模式）
5. 点击「导出为...」选择导出格式
6. 按 `ESC` 键可退出阅读模式

### 快捷键
- `Ctrl + Z`：撤销
- `Ctrl + Y`：重做
- `ESC`：退出阅读模式

## 📁 项目结构

```
Web2PDF/
├── manifest.json          # Chrome 扩展配置
├── content.js             # 主要功能脚本
├── i18n.js               # 国际化模块
├── styles.css            # 样式表
├── lib/
│   ├── html2pdf.bundle.min.js
│   ├── docx.min.js
│   └── FileSaver.min.js
├── tampermonkey/
│   └── web2pdf.user.js   # Tampermonkey 脚本
├── LICENSE               # 许可证
└── README.md
```

## 🛠️ 技术特性

- Chrome Manifest V3 规范
- 智能内容提取算法
- 懒加载图片预处理
- 跨域图片 Base64 转换
- 选区保持的富文本编辑
- 完整的颜色选择器
- 响应式设计

## 📝 更新日志

### v2.0.0
- 新增 Tampermonkey 脚本版本
- 新增 Word、HTML、Markdown 导出格式
- 新增完整的颜色选择器（文字颜色、高亮颜色）
- 新增更多编辑功能：删除线、上下标、引用块、代码块等
- 优化选区保持，修复工具栏按钮失效问题
- 优化子菜单交互体验
- 修复撤销/重做功能
- 修复暗色主题网页的文字颜色问题

### v1.0.0
- 初始版本发布
- 支持阅读模式和编辑模式
- 支持中英文切换
- PDF 导出功能

## 📄 许可证

本项目采用 **CC BY-NC 4.0** (知识共享署名-非商业性使用 4.0 国际许可协议)

- ✅ 允许：复制、分发、展示和演出作品
- ✅ 允许：创作演绎作品
- ⚠️ 要求：署名原作者
- ❌ 禁止：商业用途

详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## ⭐ Star History

如果这个项目对你有帮助，请给个 Star ⭐ 支持一下！
