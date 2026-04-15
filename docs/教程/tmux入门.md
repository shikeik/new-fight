# tmux 入门教程

`tmux`（Terminal Multiplexer，终端复用器）是一款极其实用的命令行工具。它能让你：

1. **在后台持久运行程序**——即使断开 SSH 或关闭终端，程序也不会被杀死。
2. **一屏多用**——把一个终端窗口拆成多个面板（Pane）和窗口（Window），同时查看多个进程。
3. **高效切换**——在一个会话里快速切换不同的工作任务。

---

## 核心概念：三层结构

用 tmux 前，先理解它的三层结构：

| 层级 | 类比 | 说明 |
|------|------|------|
| **Session（会话）** | 一个项目 / workspace | 最顶层容器。你可以把会话 detach（分离）到后台，里面的程序继续运行。 |
| **Window（窗口）** | 浏览器标签页 | 一个会话里可以有多个窗口，每个窗口默认占满整个屏幕。 |
| **Pane（面板）** | 浏览器分屏 | 一个窗口可以拆成多个小格子，每个格子里跑独立的终端。 |

---

## 安装

### Ubuntu / Debian
```bash
sudo apt update && sudo apt install tmux
```

### macOS
```bash
brew install tmux
```

### Termux (Android)
```bash
pkg install tmux
```

---

## 会话管理（Session）

```bash
# 创建新会话
tmux new -s mysession

# 列出所有会话
tmux ls

# 重新 attach 某个会话
tmux attach -t mysession
# 简写
tmux a -t mysession

# 杀掉某个会话
tmux kill-session -t mysession
```

### 关键操作：detach

在 tmux 里按 `<Ctrl+B>` 松开后按 `d`，即可"分离"当前会话。此时：
- 终端回到了普通 shell。
- 但 tmux 会话里的程序**仍在后台运行**。
- 稍后你可以用 `tmux attach -t mysession` 再连回去。

> 💡 **这是 tmux 最强大的功能之一**：适合跑需要长时间运行的任务（如编译、训练模型、开 dev server）。

---

## 窗口管理（Window）

先按前缀键 **`<Ctrl+B>`**，再按下面的键：

| 按键 | 作用 |
|------|------|
| `c` | 创建新窗口 |
| `n` | 切换到下一个窗口（next） |
| `p` | 切换到上一个窗口（previous） |
| `0` ~ `9` | 直接跳到对应编号的窗口 |
| `,` | 重命名当前窗口 |
| `&` | 关闭当前窗口（会提示确认） |
| `w` | 打开窗口列表，用方向键选择 |

窗口底部状态栏会显示类似：`[0] bash* 1:node- 2:vim`，星号 `*` 表示当前所在窗口。

---

## 面板分屏（Pane）

这是提高效率的利器，让你在一个屏幕里同时看多终端。

先按 **`<Ctrl+B>`**，再按：

| 按键 | 作用 |
|------|------|
| `%` | **左右**分屏 |
| `"` | **上下**分屏 |
| `方向键`（↑↓←→） | 切换焦点到相邻面板 |
| `o` | 按顺序切换面板 |
| `x` | 关闭当前面板 |
| `z` | **最大化/还原**当前面板（ zoom ） |
| `Space` | 切换面板布局（水平、垂直、网格等） |
| `{` / `}` | 交换当前面板与上一个/下一个面板 |

> 💡 **记不住 `%` 和 `"`？** 口诀：`%` 像垂直切一刀（左右），`"` 像水平切一刀（上下）。

---

## 滚动与复制模式

tmux 默认不支持鼠标滚轮直接滚动（可配置开启）。如果你要查看历史输出：

1. 按 `<Ctrl+B>`，再按 `[` 进入复制模式。
2. 用 `↑↓←→` 或 `PgUp` / `PgDn` 滚动。
3. 按 `q` 退出复制模式。

在复制模式下，按 `v` 开始选区，`y` 复制（具体行为取决于 tmux 版本和配置）。

---

## 常用快捷键速查表

所有操作都需要先按 **前缀键 `<Ctrl+B>`**，松开后再按目标键。

| 按键 | 作用 |
|------|------|
| `d` | detach（分离会话，后台继续运行） |
| `c` | 新建窗口 |
| `n` / `p` | 下/上一个窗口 |
| `0`~`9` | 跳到对应窗口 |
| `,` | 重命名窗口 |
| `&` | 关闭窗口 |
| `%` | 左右分屏 |
| `"` | 上下分屏 |
| `方向键` | 切换面板 |
| `x` | 关闭面板 |
| `z` | 最大化/还原面板 |
| `[` | 进入复制/滚动模式 |
| `q` | 退出复制模式 |
| `:` | 进入命令模式（输入 tmux 命令） |
| `t` | 在当前面板显示一个时钟（按任意键退出） |
| `?` | 显示所有快捷键帮助 |

---

## 典型工作流示例

### 场景 1：SSH 远程跑长任务

```bash
# 登录服务器后
tmux new -s train

# 在里面跑你的训练脚本
python train.py

# 按 Ctrl+B, d  detach
# 关闭笔记本电脑，去睡觉

# 第二天重新 SSH 登录
tmux attach -t train
# 训练日志还在跑！
```

### 场景 2：本地前后端同时开发

```bash
tmux new -s webdev

# 左侧面板
cd frontend && npm run dev

# 按 Ctrl+B, % 分屏出右侧面板
cd backend && npm run server

# 按 Ctrl+B, z 可以临时放大其中一个面板看全屏日志
```

---

## 进阶：自定义配置（`.tmux.conf`）

在用户主目录下创建 `~/.tmux.conf`，可以让 tmux 更好用：

```conf
# 把前缀键从 Ctrl+B 改成 Ctrl+A（和 screen 一样，按起来更顺手）
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# 开启鼠标支持（滚轮滚动、点击切换面板、拖动调整分屏）
set -g mouse on

# 面板编号从 1 开始（而不是 0，方便左手按）
set -g base-index 1
setw -g pane-base-index 1

# 状态栏美化
set -g status-bg colour235
set -g status-fg colour250
set -g status-left "[#S] "
set -g status-right "%H:%M %Y-%m-%d"

# 使用 vim 风格的按键在复制模式下移动
setw -g mode-keys vi
```

修改配置后，在 tmux 里按 `<Ctrl+B>` 再按 `:`，输入：
```
source-file ~/.tmux.conf
```
即可生效（或退出 tmux 重新进入）。

---

## tmux vs screen

| 特性 | tmux | screen |
|------|------|--------|
 分屏 | 更直观（Pane + Window） | 较简单 |
 配置灵活性 | 高 | 中 |
 预装率 | 大部分现代系统有 | 几乎所有 Linux 都有 |
 社区生态 | 更活跃（插件多，如 tpm） | 较老 |

如果你刚开始学，**直接选 tmux** 即可。

---

## 下一步

熟悉了基础操作后，可以了解：
- **tpm**（tmux plugin manager）：安装主题、状态栏插件、自动保存会话等。
- **tmux-resurrect**：关机后也能恢复之前的会话布局。
- 和 **vim/neovim** 配合使用，打造全键盘终端开发环境。
