# 🎮 Qilei (棋类游戏合集)

这是一个基于原生 JavaScript、HTML5 和 CSS3 开发的经典棋类游戏集合仓库。所有游戏均可在浏览器中直接运行，无需复杂配置，是学习游戏逻辑和前端开发的绝佳参考。

## 🕹️ 包含游戏

目前仓库内集成了以下 5 种经典的棋类游戏：

1.  **🇨🇳 中国象棋 (Chinese Chess)**：
    -   文件：`chinese-chess.html` / `chinese-chess.js`
    -   特点：完整的棋盘布局，包含“将、士、象、马、车、炮、卒”的全套逻辑。

2.  **🐱 斗兽棋 (Animal Chess)**：
    -   文件：`animal-chess.html` / `animal-chess.js`
    -   特点：模拟大象到老鼠的等级克制关系，包含河流地形逻辑。

3.  **🎖️ 陆军棋 / 军棋 (Military Chess)**：
    -   文件：`military-chess.html` / `military-chess.js`
    -   特点：包含完整的军阶大小判定及特殊棋子（炸弹、地雷）逻辑。

4.  **🏁 五子棋 (Gomoku)**：
    -   文件：`gomoku.html` / `gomoku.js`
    -   特点：支持双人对弈，包含经典的五连珠判定算法。

5.  **♟️ 国际象棋 (Chess)**：
    -   文件：`chess.html` / `chess.js`
    -   特点：实现国际标准的 8x8 棋盘及各棋移动规则。

## ✨ 技术特点

-   **原生开发**：未使用任何第三方游戏引擎，完全基于原生 JavaScript 逻辑实现。
-   **模块化 UI**：统一使用 `common.css` 进行样式管理，界面简洁明了。
-   **轻量化**：每个游戏仅由两个核心文件（HTML + JS）组成，加载速度极快。

## 🚀 快速开始

1.  **克隆仓库**：
    ```bash
    git clone https://github.com/shi-tou1234/qilei.git
    ```
2.  **直接运行**：
    在浏览器中直接打开任意一个 `.html` 文件即可开始游戏。例如：
    - 双击 `chinese-chess.html` 即可开始中国象棋对弈。

## 🛠️ 项目结构

```text
.
├── common.css            # 通用棋盘与界面样式
├── chinese-chess.js      # 中国象棋逻辑
├── animal-chess.js       # 斗兽棋逻辑
├── military-chess.js     # 军棋逻辑
├── gomoku.js             # 五子棋逻辑
└── chess.js              # 国际象棋逻辑
```

---
制作人：shi-tou1234
