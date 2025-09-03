# 项目结构说明

## 新的模块化结构

本项目遵循模块化理念，将不同类型的文件组织到相应的目录中：

### 📁 pages/
存放所有HTML页面文件：
- `index.html` - 主界面
- `about.html` - 关于页面  
- `heart-rate.html` - 心率监测浮动窗口
- `test.html` - 测试页面
- `test-ui.html` - UI测试页面

### 📁 utils/
存放工具函数和资源文件：
- `preload.js` - 主窗口预加载脚本
- `heart-rate-preload.js` - 心率窗口预加载脚本
- `renderer.js` - 渲染进程脚本
- `styles.css` - 样式文件

### 📁 assets/
存放静态资源文件：
- 图片、图标等资源文件

### 📁 build/
存放构建相关文件：
- `installer.nsh` - NSIS安装脚本

## 文件引用说明

### HTML文件引用
所有HTML文件中的CSS和JS引用都已更新为相对路径：
- CSS文件：`../utils/styles.css`
- JS文件：`../utils/renderer.js`

### Electron主进程引用
主进程中的preload文件路径已更新：
- 主窗口：`utils/preload.js`
- 心率窗口：`utils/heart-rate-preload.js`

## 优势

1. **更好的组织性**：按功能类型分类文件
2. **易于维护**：相关文件集中存放
3. **清晰的架构**：页面、工具、资源分离
4. **便于扩展**：新增功能时容易找到对应位置

## 开发规范

- 新增页面请放置在 `pages/` 目录
- 新增工具函数请放置在 `utils/` 目录
- 新增资源文件请放置在 `assets/` 目录
- 保持文件命名规范性和一致性