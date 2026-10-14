# dsh-keyboard-shortcut

为 DeepSeek Harness（DSH）提供「快捷键」设置页，以及权限模式切换、思考强度调节、输入跳转和可选的输入框按键重映射。

[English](README.md)

## 概述

`dsh-keyboard-shortcut` 在 DSH 的设置面板中增加一个页面，并为应用增加五个快捷键。该页面会列出当前运行中的所有按键，允许你修改本插件拥有的按键，并提供一个用于重映射输入框 Enter 键行为的开关。

本插件添加的每个快捷键都是一个普通的 DSH 命令：它会出现在快捷键参考中，可以被重新绑定，并遵守与内置命令相同的冲突规则。

## 环境要求

| 项目 | 最低版本 |
|---|---|
| DeepSeek Harness | `0.2.0-rc.2` |
| Node.js（仅从源码构建时需要） | `22.12.0` |

本插件是**客户端插件**：所有功能都发生在浏览器半侧。它的宿主半侧是一个空的 `apply`，存在的唯一目的是让 DSH 提供浏览器包。

## 安装

使用 DSH 插件命令安装到指定 profile：

```sh
dsh plugin --profile <profile> add dsh-keyboard-shortcut
```

然后重启该 profile；如果该 profile 支持热重载，也可以在**设置 → 插件**中把该 bundle 关闭再打开。

## 功能

### 快捷键设置页

**设置 → 快捷键**位于「通用」之后。页面包含三个区域：

- **插件快捷键** —— 本插件拥有的命令，每行都可编辑。点击某一行，按下组合键即可保存；按 Esc 取消。
- **输入优化** —— 下文所述的输入框按键开关。
- **应用快捷键** —— 其他所有已注册命令，只读。这张表让按键冲突变得可解释：当某个组合被拒绝时，已经占用它的那一行就展示在旁边。

### 快捷键

| 快捷键 | 操作 | 平台 |
|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>Q</kbd> | 切换到下一个权限模式 | 桌面版 Windows、macOS |
| <kbd>Ctrl</kbd>+<kbd>1</kbd> | 降低一档思考强度 | 桌面版 |
| <kbd>Ctrl</kbd>+<kbd>2</kbd> | 提高一档思考强度 | 桌面版 |
| <kbd>PgUp</kbd> | 跳到上一条输入 | 全部（直接读取） |
| <kbd>PgDn</kbd> | 跳到下一条输入 | 全部（直接读取） |
| <kbd>Ctrl</kbd>+<kbd>/</kbd> | 打开本插件的设置页 | 全部 |

<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>/</kbd> 是内置快捷键参考的默认绑定。本插件通过快捷键偏好层接管它：参考弹窗不再占用该按键，但仍可从**设置 → 通用 → 编辑快捷键**进入。关闭开关即可恢复原始绑定。

### 输入优化

开启后，输入框的三种 Enter 手势会轮换：

| 按键 | 默认行为 | 开启输入优化后 |
|---|---|---|
| <kbd>Enter</kbd> | 发送 | 换行 |
| <kbd>Ctrl</kbd>+<kbd>Enter</kbd> | 互补的 Queue／Steer | 发送 |
| <kbd>Shift</kbd>+<kbd>Enter</kbd> | 换行 | 互补的 Queue／Steer |

该开关默认关闭。

## 配置

插件从浏览器存储读取两个偏好项。除快捷键接管外均默认关闭，且均为按设备保存。

| 键 | 默认值 | 含义 |
|---|---|---|
| `optimizeComposerKeys` | `false` | 轮换输入框的 Enter 手势 |
| `takeOverShortcutKey` | `true` | 将 <kbd>Ctrl</kbd>+<kbd>/</kbd> 交给本插件 |

偏好项保存在 `localStorage` 的 `dsh.keyboard-shortcut.v1` 中，与 DSH 自身按设备保存的按键配置放在一起。它们不在宿主设置文档中，因此一台机器的选择不会改写另一台机器的。

在设置页修改绑定，会写入 DSH 快捷键编辑器使用的同一存储：Web 使用 `localStorage`，Electron 使用 `userData/keybindings.json`。

## 权限

本插件不申请任何提权。它只读取 DSH 已经推送给浏览器的会话投影，并运行与内置选择器相同的 `/permission` 命令。它不进行文件系统访问，也不发起网络请求。

## 已知限制

- **模式切换与思考强度快捷键默认仅在桌面版可用。** DSH 在桌面版 Windows 和 macOS 之外保留了 <kbd>Ctrl</kbd>+<kbd>Q</kbd>，而浏览器会占用 <kbd>Ctrl</kbd>+<kbd>1</kbd>…<kbd>Ctrl</kbd>+<kbd>8</kbd> 切换标签页。这两个命令在所有平台都存在、可手动绑定，只是在无法工作的平台上默认不绑定。
- **输入跳转驱动的是轮次导航条。** DSH 没有公开「跳转到某一轮」的服务，因此该快捷键触发导航条自身的刻度。一轮以其第一条用户消息为锚点，所以「上一条输入」等同于「上一轮」。
- **翻页键无法注册，因此直接读取原始输入。** DSH 的快捷键注册表会用一份封闭白名单校验每个声明的键码（`Key*`、`Digit*`、`F1`–`F24`，以及一组固定命名键，其中**不含**翻页键），`registerFixed` 会预先规范化绑定并抛出 `Unsupported shortcut code: PageUp`，注册注定失败。<kbd>PgUp</kbd>/<kbd>PgDn</kbd> 因此通过 `observeFixedInput` 处理：键盘层在派发前把每次 keydown 都交给该观察者，与注册无关。这两个键在所有平台都可用，只是没有目录行，设置页从本地表把它们渲染为只读行。
- **输入框重映射是 DOM 层集成。** 输入框的键位表由 `dsh-client-ui-conversation` 私有持有；该选项改写事件的修饰键标志，而不是重新实现发送逻辑。原因与失效场景见 [docs/design.md](docs/design.md)。
- **设置页导航图标是 DOM 补丁。** DSH 通过按分区 id 硬编码的分支选择导航图标，且注册项没有图标字段，因此图标通过 CSS mask 应用。
- **录制会丢失 React 状态。** 重新绑定会重新注册命令并重新渲染页面，与任何目录变更一样。

## 开发

```sh
npm install
npm run build      # 生成 lib/index.js 与 lib/client.js
npm test           # 构建校验 + 单元测试
npm run watch      # 监听并重建客户端半侧
```

参见 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [docs/development.md](docs/development.md)。

## 文档

- [docs/design.md](docs/design.md) —— 架构与背后的决策
- [docs/shortcuts.md](docs/shortcuts.md) —— 每个绑定、其归属与失效场景
- [docs/development.md](docs/development.md) —— 构建、测试与发布

## 许可证

[MIT](LICENSE)
