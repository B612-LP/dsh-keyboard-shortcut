/**
 * @module dsh-keyboard-shortcut/locales
 *
 * Bilingual copy for the Settings page and the shortcut reference rows.
 *
 * The dictionaries are registered through `ctx.locale.register(NS, {en, zh})`
 * and read through `ctx.locale.bind(NS)`, so the page follows the application
 * language without re-registering on every locale change.
 *
 * `en` is the key-set source of truth: `zh` must carry exactly the same keys,
 * and `test/locales.test.mjs` enforces that.
 */

/** Dictionary namespace owned by this plugin. */
export const NS = 'keyboard-shortcut'

/** English copy. */
export const en = {
  // Navigation and page chrome.
  'nav.title': 'Keyboard shortcuts',
  'page.title': 'Keyboard shortcuts',
  'page.description':
    'Review the bindings this plugin adds, change them, and choose how the composer reacts to Enter.',

  // Sections.
  'section.plugin.title': 'Plugin shortcuts',
  'section.plugin.description':
    'Bindings contributed by this plugin. Select a row to record a different combination.',
  'section.core.title': 'Application shortcuts',
  'section.core.description':
    'Bindings contributed by other plugins and by DSH itself. They are listed here for reference and stay owned by their own settings.',
  'section.input.title': 'Input optimisation',
  'section.input.description':
    'Change what the composer keys do. Leave this off to keep the stock Enter behaviour.',

  // Binding rows.
  'row.unbound': 'No shortcut',
  'row.recording': 'Recording…',
  'row.recordHint': 'Recording — press a combination, or Escape to cancel',
  'row.remove': 'Remove',
  'row.restore': 'Restore default',
  'row.restoreAll': 'Restore all defaults',
  'row.change': 'Change',
  'row.cancel': 'Cancel',
  'row.conflict': 'Conflicts with {ids}',
  'row.reserved': 'Reserved by the system',
  'row.unsupported': 'Not available here',
  'row.edit': 'Change binding for {label}',
  'row.fixedHint': 'Handled directly by this plugin and cannot be rebound.',
  'section.fixed.title': 'Input navigation',
  'section.fixed.description':
    'Keys this plugin reads straight from the input stream. They are not part of the shortcut registry, so they stay fixed.',

  // Group titles.
  'group.application': 'Application',
  'group.input': 'Message input',
  'group.menus': 'Menus and dialogs',

  // Input optimisation.
  'input.optimize.label': 'Use the optimised composer keys',
  'input.optimize.description':
    'Sends with Ctrl+Enter, inserts a line break with Enter, and uses the complementary Queue or Steer action with Shift+Enter.',

  // Save feedback.
  'status.saving': 'Saving…',
  'status.saved': 'Saved',
  'status.failed': 'The application did not accept the change.',
  'status.unreadable':
    'Key bindings could not be read, so editing is disabled. Repair the stored file and reopen the application.',

  // Shortcut command labels.
  'command.openSettings': 'Open keyboard shortcut settings',
  'command.cyclePermission': 'Cycle permission mode',
  'command.effortUp': 'Increase reasoning effort',
  'command.effortDown': 'Decrease reasoning effort',
  'command.cycleModel': 'Cycle to the next model',
  'command.previousInput': 'Go to previous input',
  'command.nextInput': 'Go to next input',
  'command.statusPage': 'Open the DeepSeek status page',
  'command.toggleTodos': 'Expand or collapse the task list',

  // Runtime feedback.
  'toast.permission': 'Permission mode: {name}',
  'toast.permissionUnavailable': 'Permission modes are unavailable in this session.',
  'toast.noSession': 'No session is open.',
  'toast.effortUp': 'Reasoning effort: {name}',
  'toast.effortDown': 'Reasoning effort: {name}',
  'toast.effortAtTop': 'Already at the highest reasoning effort.',
  'toast.effortAtBottom': 'Already at the lowest reasoning effort.',
  'toast.effortUnavailable': 'This model has no reasoning effort levels.',
  'toast.model': 'Switched to {name}',
  'toast.modelNone': 'No other model is available to cycle to.',
  'toast.modelUnavailable': 'The model directory is not available in this deployment.',
  'toast.navUnavailable': 'No turn navigator is available for this session.',
  'toast.navAtEdge': 'No {direction} input to move to.',
  'toast.previous': 'previous',
  'toast.next': 'next',
  'toast.sidebarUnavailable': 'The sidebar is unavailable in this window.',
  'toast.todoUnavailable': 'This session has no task list.'
}

/** Simplified Chinese copy. Mirrors {@link en} key for key. */
export const zh = {
  'nav.title': '快捷键',
  'page.title': '快捷键',
  'page.description': '查看和修改本插件提供的快捷键，并选择输入框的 Enter 行为。',

  'section.plugin.title': '插件快捷键',
  'section.plugin.description': '本插件提供的按键。点击某一行即可录制新的组合键。',
  'section.core.title': '应用快捷键',
  'section.core.description':
    '来自其他插件与 DSH 本身的按键，此处仅供查看，仍由各自的设置页管理。',
  'section.input.title': '输入优化',
  'section.input.description': '改变输入框按键的行为。关闭时保持原有的 Enter 行为。',

  'row.unbound': '未设置',
  'row.recording': '录制中…',
  'row.recordHint': '录制中 —— 请按下组合键，或按 Esc 取消',
  'row.remove': '清除',
  'row.restore': '恢复默认',
  'row.restoreAll': '全部恢复默认',
  'row.change': '修改',
  'row.cancel': '取消',
  'row.conflict': '与 {ids} 冲突',
  'row.reserved': '系统保留',
  'row.unsupported': '当前环境不可用',
  'row.edit': '修改「{label}」的按键',
  'row.fixedHint': '由本插件直接处理，无法改键。',
  'section.fixed.title': '输入跳转',
  'section.fixed.description': '本插件直接从输入流读取的按键。它们不属于快捷键注册表，因此固定不变。',

  'group.application': '应用',
  'group.input': '消息输入',
  'group.menus': '菜单与对话框',

  'input.optimize.label': '启用输入优化',
  'input.optimize.description':
    'Ctrl+Enter 发送消息，Enter 换行，Shift+Enter 使用互补的 Queue／Steer 方式。',

  'status.saving': '保存中…',
  'status.saved': '已保存',
  'status.failed': '应用没有接受这次修改。',
  'status.unreadable': '无法读取按键配置，编辑已禁用。请修复配置文件后重新打开应用。',

  'command.openSettings': '打开快捷键设置',
  'command.cyclePermission': '切换权限模式',
  'command.effortUp': '提高思考强度',
  'command.effortDown': '降低思考强度',
  'command.cycleModel': '切换到下一个模型',
  'command.previousInput': '跳到上一条输入',
  'command.nextInput': '跳到下一条输入',
  'command.statusPage': '打开 DeepSeek 服务状态页',
  'command.toggleTodos': '展开或收起任务清单',

  'toast.permission': '权限模式：{name}',
  'toast.permissionUnavailable': '当前会话无法使用权限模式。',
  'toast.noSession': '当前没有打开的会话。',
  'toast.effortUp': '思考强度：{name}',
  'toast.effortDown': '思考强度：{name}',
  'toast.effortAtTop': '已经是最高思考强度。',
  'toast.effortAtBottom': '已经是最低思考强度。',
  'toast.effortUnavailable': '当前模型没有思考强度等级。',
  'toast.model': '已切换到 {name}',
  'toast.modelNone': '没有其他可用模型可以切换。',
  'toast.modelUnavailable': '当前部署没有可用的模型目录。',
  'toast.navUnavailable': '当前会话没有可用的轮次导航。',
  'toast.navAtEdge': '没有{direction}一条输入了。',
  'toast.previous': '上',
  'toast.next': '下',
  'toast.sidebarUnavailable': '当前窗口没有可用的侧边栏。',
  'toast.todoUnavailable': '当前会话没有任务清单。'
}
