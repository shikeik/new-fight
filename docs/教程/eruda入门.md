# eruda 入门教程

## 是什么
eruda 是手机浏览器上的前端调试面板，相当于把 PC 上 F12 开发者工具的部分功能搬到了手机里。

## 引入方式

### 方式一：CDN 直接引入（推荐，最简单）
在 HTML 的 `</head>` 前加入：

```html
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
```

### 方式二：npm 安装（项目能正常 npm install 时用）
```bash
npm install eruda
```

然后在入口 JS 里：
```js
import eruda from 'eruda';
eruda.init();
```

## 界面说明
引入后页面右下角会出现一个灰色小齿轮/圆形按钮，点击打开面板。

### 主要 Tab
- **Console**：看 log、执行 JS 指令
- **Elements**：查看和修改 DOM、CSS
- **Network**：查看 HTTP 请求和响应
- **Resources**：查看 LocalStorage、SessionStorage、Cookie、IndexedDB
- **Sources**：查看源码、运行代码片段（Snippets）
- **Info**：当前页面 URL、UserAgent、屏幕尺寸等基本信息

## 常用操作速查

### 在 Console 里输指令
打开 Console Tab，底部有个输入框，直接输 JS 回车即可：
```js
document.title
window.innerWidth
navigator.userAgent
```

### 运行代码片段（Snippets）
1. 切换到 Sources Tab
2. 点击 "New" 新建片段
3. 写一段 JS，比如操作 localStorage：
   ```js
   localStorage.setItem('test', 'hello');
   console.log(localStorage.getItem('test'));
   ```
4. 点击运行按钮，结果会输出到 Console

### 查看存储数据
切换到 Resources Tab：
- **LocalStorage**：键值对，永久保存
- **SessionStorage**：键值对，关闭标签页即消失
- **Cookie**：当前域名下的 Cookie 列表
- **IndexedDB**：结构化数据库，可存大量数据

点击对应条目即可查看内容，支持增删改查。

## 隐藏/销毁
如果正式发布时不想要这个按钮：
```js
eruda.destroy(); // 完全移除
```

或者只在特定条件下初始化：
```js
if (location.hash === '#debug') {
  eruda.init();
}
```
