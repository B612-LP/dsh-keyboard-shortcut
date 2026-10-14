/**
 * dsh-keyboard-shortcut — browser half.
 * GENERATED FILE — do not edit. Source lives in src/client/; run `npm run build`.
 */
window.__ModuleLoader__.load({
  id: "dsh-keyboard-shortcut",
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

    // src/client/index.js
    var index_exports = {};
    __export(index_exports, {
      apply: () => apply,
      inject: () => inject
    });
    module.exports = __toCommonJS(index_exports);

    // src/client/locales.js
    var NS = "keyboard-shortcut";
    var en = {
      // Navigation and page chrome.
      "nav.title": "Keyboard shortcuts",
      "page.title": "Keyboard shortcuts",
      "page.description": "Review the bindings this plugin adds, change them, and choose how the composer reacts to Enter.",
      // Sections.
      "section.plugin.title": "Plugin shortcuts",
      "section.plugin.description": "Bindings contributed by this plugin. Select a row to record a different combination.",
      "section.core.title": "Application shortcuts",
      "section.core.description": "Bindings contributed by other plugins and by DSH itself. They are listed here for reference and stay owned by their own settings.",
      "section.input.title": "Input optimisation",
      "section.input.description": "Change what the composer keys do. Leave this off to keep the stock Enter behaviour.",
      // Binding rows.
      "row.unbound": "No shortcut",
      "row.recording": "Recording\u2026",
      "row.recordHint": "Recording \u2014 press a combination, or Escape to cancel",
      "row.remove": "Remove",
      "row.restore": "Restore default",
      "row.restoreAll": "Restore all defaults",
      "row.change": "Change",
      "row.cancel": "Cancel",
      "row.conflict": "Conflicts with {ids}",
      "row.reserved": "Reserved by the system",
      "row.unsupported": "Not available here",
      "row.edit": "Change binding for {label}",
      "row.fixedHint": "Handled directly by this plugin and cannot be rebound.",
      "section.fixed.title": "Input navigation",
      "section.fixed.description": "Keys this plugin reads straight from the input stream. They are not part of the shortcut registry, so they stay fixed.",
      // Group titles.
      "group.application": "Application",
      "group.input": "Message input",
      "group.menus": "Menus and dialogs",
      // Input optimisation.
      "input.optimize.label": "Use the optimised composer keys",
      "input.optimize.description": "Sends with Ctrl+Enter, inserts a line break with Enter, and uses the complementary Queue or Steer action with Shift+Enter.",
      // Save feedback.
      "status.saving": "Saving\u2026",
      "status.saved": "Saved",
      "status.failed": "The application did not accept the change.",
      "status.unreadable": "Key bindings could not be read, so editing is disabled. Repair the stored file and reopen the application.",
      // Shortcut command labels.
      "command.openSettings": "Open keyboard shortcut settings",
      "command.cyclePermission": "Cycle permission mode",
      "command.effortUp": "Increase reasoning effort",
      "command.effortDown": "Decrease reasoning effort",
      "command.previousInput": "Go to previous input",
      "command.nextInput": "Go to next input",
      // Runtime feedback.
      "toast.permission": "Permission mode: {name}",
      "toast.permissionUnavailable": "Permission modes are unavailable in this session.",
      "toast.noSession": "No session is open.",
      "toast.effortUp": "Reasoning effort: {name}",
      "toast.effortDown": "Reasoning effort: {name}",
      "toast.effortAtTop": "Already at the highest reasoning effort.",
      "toast.effortAtBottom": "Already at the lowest reasoning effort.",
      "toast.effortUnavailable": "This model has no reasoning effort levels.",
      "toast.navUnavailable": "No turn navigator is available for this session.",
      "toast.navAtEdge": "No {direction} input to move to.",
      "toast.previous": "previous",
      "toast.next": "next"
    };
    var zh = {
      "nav.title": "\u5FEB\u6377\u952E",
      "page.title": "\u5FEB\u6377\u952E",
      "page.description": "\u67E5\u770B\u548C\u4FEE\u6539\u672C\u63D2\u4EF6\u63D0\u4F9B\u7684\u5FEB\u6377\u952E\uFF0C\u5E76\u9009\u62E9\u8F93\u5165\u6846\u7684 Enter \u884C\u4E3A\u3002",
      "section.plugin.title": "\u63D2\u4EF6\u5FEB\u6377\u952E",
      "section.plugin.description": "\u672C\u63D2\u4EF6\u63D0\u4F9B\u7684\u6309\u952E\u3002\u70B9\u51FB\u67D0\u4E00\u884C\u5373\u53EF\u5F55\u5236\u65B0\u7684\u7EC4\u5408\u952E\u3002",
      "section.core.title": "\u5E94\u7528\u5FEB\u6377\u952E",
      "section.core.description": "\u6765\u81EA\u5176\u4ED6\u63D2\u4EF6\u4E0E DSH \u672C\u8EAB\u7684\u6309\u952E\uFF0C\u6B64\u5904\u4EC5\u4F9B\u67E5\u770B\uFF0C\u4ECD\u7531\u5404\u81EA\u7684\u8BBE\u7F6E\u9875\u7BA1\u7406\u3002",
      "section.input.title": "\u8F93\u5165\u4F18\u5316",
      "section.input.description": "\u6539\u53D8\u8F93\u5165\u6846\u6309\u952E\u7684\u884C\u4E3A\u3002\u5173\u95ED\u65F6\u4FDD\u6301\u539F\u6709\u7684 Enter \u884C\u4E3A\u3002",
      "row.unbound": "\u672A\u8BBE\u7F6E",
      "row.recording": "\u5F55\u5236\u4E2D\u2026",
      "row.recordHint": "\u5F55\u5236\u4E2D \u2014\u2014 \u8BF7\u6309\u4E0B\u7EC4\u5408\u952E\uFF0C\u6216\u6309 Esc \u53D6\u6D88",
      "row.remove": "\u6E05\u9664",
      "row.restore": "\u6062\u590D\u9ED8\u8BA4",
      "row.restoreAll": "\u5168\u90E8\u6062\u590D\u9ED8\u8BA4",
      "row.change": "\u4FEE\u6539",
      "row.cancel": "\u53D6\u6D88",
      "row.conflict": "\u4E0E {ids} \u51B2\u7A81",
      "row.reserved": "\u7CFB\u7EDF\u4FDD\u7559",
      "row.unsupported": "\u5F53\u524D\u73AF\u5883\u4E0D\u53EF\u7528",
      "row.edit": "\u4FEE\u6539\u300C{label}\u300D\u7684\u6309\u952E",
      "row.fixedHint": "\u7531\u672C\u63D2\u4EF6\u76F4\u63A5\u5904\u7406\uFF0C\u65E0\u6CD5\u6539\u952E\u3002",
      "section.fixed.title": "\u8F93\u5165\u8DF3\u8F6C",
      "section.fixed.description": "\u672C\u63D2\u4EF6\u76F4\u63A5\u4ECE\u8F93\u5165\u6D41\u8BFB\u53D6\u7684\u6309\u952E\u3002\u5B83\u4EEC\u4E0D\u5C5E\u4E8E\u5FEB\u6377\u952E\u6CE8\u518C\u8868\uFF0C\u56E0\u6B64\u56FA\u5B9A\u4E0D\u53D8\u3002",
      "group.application": "\u5E94\u7528",
      "group.input": "\u6D88\u606F\u8F93\u5165",
      "group.menus": "\u83DC\u5355\u4E0E\u5BF9\u8BDD\u6846",
      "input.optimize.label": "\u542F\u7528\u8F93\u5165\u4F18\u5316",
      "input.optimize.description": "Ctrl+Enter \u53D1\u9001\u6D88\u606F\uFF0CEnter \u6362\u884C\uFF0CShift+Enter \u4F7F\u7528\u4E92\u8865\u7684 Queue\uFF0FSteer \u65B9\u5F0F\u3002",
      "status.saving": "\u4FDD\u5B58\u4E2D\u2026",
      "status.saved": "\u5DF2\u4FDD\u5B58",
      "status.failed": "\u5E94\u7528\u6CA1\u6709\u63A5\u53D7\u8FD9\u6B21\u4FEE\u6539\u3002",
      "status.unreadable": "\u65E0\u6CD5\u8BFB\u53D6\u6309\u952E\u914D\u7F6E\uFF0C\u7F16\u8F91\u5DF2\u7981\u7528\u3002\u8BF7\u4FEE\u590D\u914D\u7F6E\u6587\u4EF6\u540E\u91CD\u65B0\u6253\u5F00\u5E94\u7528\u3002",
      "command.openSettings": "\u6253\u5F00\u5FEB\u6377\u952E\u8BBE\u7F6E",
      "command.cyclePermission": "\u5207\u6362\u6743\u9650\u6A21\u5F0F",
      "command.effortUp": "\u63D0\u9AD8\u601D\u8003\u5F3A\u5EA6",
      "command.effortDown": "\u964D\u4F4E\u601D\u8003\u5F3A\u5EA6",
      "command.previousInput": "\u8DF3\u5230\u4E0A\u4E00\u6761\u8F93\u5165",
      "command.nextInput": "\u8DF3\u5230\u4E0B\u4E00\u6761\u8F93\u5165",
      "toast.permission": "\u6743\u9650\u6A21\u5F0F\uFF1A{name}",
      "toast.permissionUnavailable": "\u5F53\u524D\u4F1A\u8BDD\u65E0\u6CD5\u4F7F\u7528\u6743\u9650\u6A21\u5F0F\u3002",
      "toast.noSession": "\u5F53\u524D\u6CA1\u6709\u6253\u5F00\u7684\u4F1A\u8BDD\u3002",
      "toast.effortUp": "\u601D\u8003\u5F3A\u5EA6\uFF1A{name}",
      "toast.effortDown": "\u601D\u8003\u5F3A\u5EA6\uFF1A{name}",
      "toast.effortAtTop": "\u5DF2\u7ECF\u662F\u6700\u9AD8\u601D\u8003\u5F3A\u5EA6\u3002",
      "toast.effortAtBottom": "\u5DF2\u7ECF\u662F\u6700\u4F4E\u601D\u8003\u5F3A\u5EA6\u3002",
      "toast.effortUnavailable": "\u5F53\u524D\u6A21\u578B\u6CA1\u6709\u601D\u8003\u5F3A\u5EA6\u7B49\u7EA7\u3002",
      "toast.navUnavailable": "\u5F53\u524D\u4F1A\u8BDD\u6CA1\u6709\u53EF\u7528\u7684\u8F6E\u6B21\u5BFC\u822A\u3002",
      "toast.navAtEdge": "\u6CA1\u6709{direction}\u4E00\u6761\u8F93\u5165\u4E86\u3002",
      "toast.previous": "\u4E0A",
      "toast.next": "\u4E0B"
    };

    // src/client/nav-icon.js
    var STYLE_TAG = "dsh-keyboard-shortcut/nav-icon.css";
    var MARK = "data-dsh-keyboard-shortcut-nav";
    var PANEL_SELECTOR = '[data-shortcut-modal="settings"]';
    var LIST_SELECTOR = '[class*="navList"]';
    var CELL_SELECTOR = '[class*="navCell"]';
    var LABEL_SELECTOR = '[class*="navLabel"]';
    function svgMaskUri(svg) {
      const source = svg.trim();
      if (source === "") return "";
      const namespaced = /<svg[^>]*\sxmlns=/iu.test(source) ? source : source.replace(/<svg\b/iu, '<svg xmlns="http://www.w3.org/2000/svg"');
      return `url("data:image/svg+xml,${encodeURIComponent(namespaced.split("currentColor").join("#000"))}")`;
    }
    function cssFor(glyph) {
      return [
        `/* Keyboard glyph on this plugin's Settings row: see src/client/nav-icon.js */`,
        `[${MARK}] [class*="navIcon"]{display:none}`,
        `[${MARK}]::before{content:"";flex:none;width:16px;height:16px;background-color:currentColor;-webkit-mask:${glyph} center/16px 16px no-repeat;mask:${glyph} center/16px 16px no-repeat}`
      ].join("\n");
    }
    function injectCss(doc, glyph) {
      if (doc.querySelector(`style[data-plugin-css="${STYLE_TAG}"]`) !== null) return;
      const tag = doc.createElement("style");
      tag.dataset.plugin = "dsh-keyboard-shortcut";
      tag.dataset.pluginCss = STYLE_TAG;
      tag.textContent = cssFor(glyph);
      doc.head.appendChild(tag);
    }
    function labelOf(cell) {
      return cell.querySelector(LABEL_SELECTOR)?.textContent?.trim() ?? "";
    }
    function installNavIcon(target, readIndex) {
      const doc = typeof document === "undefined" ? void 0 : document;
      const Observer = typeof MutationObserver === "undefined" ? void 0 : MutationObserver;
      if (doc === void 0 || Observer === void 0 || doc.body === null) {
        console.warn("[dsh-keyboard-shortcut] Settings navigation icon unavailable: no document, body, or MutationObserver");
        return () => {
        };
      }
      let glyph;
      try {
        glyph = svgMaskUri(target.renderSvg());
      } catch (error) {
        console.warn(`[dsh-keyboard-shortcut] Settings navigation icon unavailable: ${describe(error)}`);
        return () => {
        };
      }
      if (glyph === "") {
        console.warn("[dsh-keyboard-shortcut] Settings navigation icon unavailable: the glyph rendered empty");
        return () => {
        };
      }
      injectCss(doc, glyph);
      let warned = false;
      const markPanel = (panel) => {
        try {
          const list = panel.querySelector(LIST_SELECTOR);
          if (list === null) return;
          const cells = [...list.querySelectorAll(`:scope > ${CELL_SELECTOR}`)];
          if (cells.length === 0) return;
          const wanted = target.label();
          const index = readIndex?.();
          if (typeof index === "number" && index >= 0 && index < cells.length) {
            const candidate = cells[index];
            if (wanted === "" || labelOf(candidate) === wanted) {
              candidate.toggleAttribute(MARK, true);
              return;
            }
          }
          if (wanted === "") {
            if (!warned) {
              warned = true;
              console.warn("[dsh-keyboard-shortcut] Settings navigation icon: the section label is empty, so only the ledger index can identify the row");
            }
            return;
          }
          const byLabel = cells.find((cell) => labelOf(cell) === wanted);
          if (byLabel === void 0) return;
          byLabel.toggleAttribute(MARK, true);
        } catch (error) {
          if (warned) return;
          warned = true;
          console.warn(`[dsh-keyboard-shortcut] Settings navigation icon failed: ${describe(error)}`);
        }
      };
      const scan = () => {
        for (const panel of doc.querySelectorAll(PANEL_SELECTOR)) markPanel(panel);
      };
      const observer = new Observer(scan);
      observer.observe(doc.body, { childList: true, subtree: true });
      scan();
      return () => {
        observer.disconnect();
      };
    }
    function describe(error) {
      return error instanceof Error ? error.message : String(error);
    }

    // src/client/icons.js
    var ICON_MEDIUM_STROKE = 1.3;
    function keyboardIconSvg({ size = 16, strokeWidth = ICON_MEDIUM_STROKE } = {}) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.65" y="4.5" width="12.7" height="7" rx="1.5" stroke="currentColor"/><path d="M4.15 6.65h.01" stroke="currentColor"/><path d="M6.95 6.65h.01" stroke="currentColor"/><path d="M9.75 6.65h.01" stroke="currentColor"/><path d="M11.85 6.65h.01" stroke="currentColor"/><path d="M4.15 8.35h.01" stroke="currentColor"/><path d="M6.95 8.35h.01" stroke="currentColor"/><path d="M9.75 8.35h.01" stroke="currentColor"/><path d="M4.65 10.05h6.7" stroke="currentColor"/></svg>`;
    }

    // src/client/prefs.js
    var STORAGE_KEY = "dsh.keyboard-shortcut.v1";
    var DEFAULTS = Object.freeze({
      /** Rotate the composer's Enter gestures. See `composer-keys.js`. */
      optimizeComposerKeys: false,
      /** Give Ctrl+/ to this plugin's Settings page. See `open-settings.js`. */
      takeOverShortcutKey: true
    });
    function readPrefs(storage) {
      if (storage === void 0) return { ...DEFAULTS };
      let raw;
      try {
        raw = storage.getItem(STORAGE_KEY);
      } catch {
        return { ...DEFAULTS };
      }
      if (raw === null) return { ...DEFAULTS };
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          return { ...DEFAULTS };
        }
        const resolved = { ...DEFAULTS };
        for (const key of Object.keys(DEFAULTS)) {
          if (typeof parsed[key] === "boolean") resolved[key] = parsed[key];
        }
        return resolved;
      } catch {
        return { ...DEFAULTS };
      }
    }
    function createPrefs(storage) {
      let value = readPrefs(storage);
      const listeners = /* @__PURE__ */ new Set();
      const publish = (next) => {
        value = next;
        for (const listener of [...listeners]) {
          try {
            listener();
          } catch (error) {
            console.error("[dsh-keyboard-shortcut] preference listener failed", error);
          }
        }
      };
      return {
        getSnapshot: () => value,
        subscribe: (listener) => {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
        set: (key, next) => {
          if (!(key in DEFAULTS)) throw new Error(`unknown preference: ${key}`);
          if (value[key] === next) return;
          const updated = { ...value, [key]: next };
          publish(updated);
          if (storage === void 0) return;
          try {
            storage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch (error) {
            console.warn("[dsh-keyboard-shortcut] preference was not persisted", error);
          }
        },
        adopt: (event) => {
          if (event.key !== STORAGE_KEY) return;
          publish(readPrefs(storage));
        }
      };
    }

    // src/client/notices.js
    var import_react = require("react");
    var STYLE_TAG2 = "dsh-keyboard-shortcut/notices.css";
    var CSS = {
      root: "dshKbdToastRoot",
      toast: "dshKbdToast"
    };
    var STYLESHEET = `
    .${CSS.root}{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--dsh-composer-height,152px) + 24px);z-index:1200;pointer-events:none;display:flex;justify-content:center}
    .${CSS.toast}{box-sizing:border-box;max-width:min(420px,calc(100vw - 48px));border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);box-shadow:var(--dsw-elevation-prominent);padding:8px 14px;font-size:13px;line-height:20px;animation:dshKbdToastIn .12s ease-out}
    @keyframes dshKbdToastIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
    @media (prefers-reduced-motion:reduce){.${CSS.toast}{animation:none}}
    `;
    function injectStyles(doc) {
      if (doc.querySelector(`style[data-plugin-css="${STYLE_TAG2}"]`) !== null) return;
      const tag = doc.createElement("style");
      tag.dataset.plugin = "dsh-keyboard-shortcut";
      tag.dataset.pluginCss = STYLE_TAG2;
      tag.textContent = STYLESHEET;
      doc.head.appendChild(tag);
    }
    var VISIBLE_MS = 2200;
    function createNotices() {
      let current;
      let timer;
      const listeners = /* @__PURE__ */ new Set();
      const publish = (next) => {
        current = next;
        for (const listener of [...listeners]) {
          try {
            listener();
          } catch (error) {
            console.error("[dsh-keyboard-shortcut] notice listener failed", error);
          }
        }
      };
      const clear = () => {
        if (timer !== void 0) {
          clearTimeout(timer);
          timer = void 0;
        }
        if (current !== void 0) publish(void 0);
      };
      return {
        get: () => current,
        subscribe: (listener) => {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
        /**
         * Show one notice.
         *
         * @param text - Message text. An empty string is ignored.
         * @returns Nothing.
         */
        show: (text) => {
          if (typeof text !== "string" || text === "") return;
          if (current?.text === text) return;
          if (timer !== void 0) clearTimeout(timer);
          publish({ text, seq: (current?.seq ?? 0) + 1 });
          timer = setTimeout(() => {
            timer = void 0;
            if (current?.text === text) publish(void 0);
          }, VISIBLE_MS);
        },
        dispose: () => {
          if (timer !== void 0) clearTimeout(timer);
          timer = void 0;
          listeners.clear();
        }
      };
    }
    function createNoticeOverlay(notices) {
      return function KeyboardShortcutNotices() {
        const notice = (0, import_react.useSyncExternalStore)(notices.subscribe, notices.get);
        (0, import_react.useEffect)(() => {
          if (typeof document !== "undefined") injectStyles(document);
        }, []);
        if (notice === void 0) return null;
        return (0, import_react.createElement)(
          "div",
          { className: CSS.root, role: "status", "aria-live": "polite" },
          (0, import_react.createElement)("div", { className: CSS.toast, key: notice.seq }, notice.text)
        );
      };
    }

    // src/client/composer-keys.js
    var COMPOSER_SELECTOR = "[data-composer-input]";
    var MENU_SELECTOR = "[data-trigger-menu]";
    var FLAGS = ["shiftKey", "ctrlKey", "metaKey"];
    function applyFlags(event, next) {
      for (const flag of FLAGS) {
        try {
          Object.defineProperty(event, flag, {
            value: next[flag] ?? false,
            configurable: true,
            enumerable: true,
            writable: true
          });
        } catch {
          return false;
        }
      }
      return FLAGS.every((flag) => event[flag] === (next[flag] ?? false));
    }
    function rewriteFor(event) {
      const { altKey, ctrlKey, metaKey, shiftKey } = event;
      if (altKey || ctrlKey && metaKey) return void 0;
      if (ctrlKey || metaKey) {
        return { shiftKey: false, ctrlKey: false, metaKey: false };
      }
      if (shiftKey) {
        return { shiftKey: false, ctrlKey: true, metaKey: false };
      }
      return { shiftKey: true, ctrlKey: false, metaKey: false };
    }
    function isComposerEvent(event) {
      for (const node of event.composedPath()) {
        if (!(node instanceof Element)) continue;
        if (node.closest("[inert]") !== null) return false;
        if (!node.matches(COMPOSER_SELECTOR)) continue;
        const editable = node.getAttribute("contenteditable");
        return editable === "true" || editable === "";
      }
      return false;
    }
    function isMenuOpen(doc) {
      return doc.querySelector(MENU_SELECTOR) !== null;
    }
    function installComposerKeys(doc, isEnabled) {
      const view = doc.defaultView;
      if (view === null) return () => {
      };
      const onKeyDown = (event) => {
        if (!isEnabled()) return;
        if (event.key !== "Enter" || event.code !== "Enter") return;
        if (event.isComposing || event.keyCode === 229) return;
        if (event.defaultPrevented) return;
        if (!isComposerEvent(event)) return;
        if (isMenuOpen(doc)) return;
        const next = rewriteFor(event);
        if (next === void 0) return;
        applyFlags(event, next);
      };
      view.addEventListener("keydown", onKeyDown, true);
      return () => {
        view.removeEventListener("keydown", onKeyDown, true);
      };
    }

    // src/client/permission-cycle.js
    var PERMISSION_REMOTE = "permissionPresets";
    var PERMISSION_SERVICE = `remote.${PERMISSION_REMOTE}`;
    var CATALOG_CHANGED = "permission-presets/catalog-changed";
    var PERMISSION_PROJECTION = "permissions";
    function readPermissionMode(session) {
      if (session === void 0) return void 0;
      return session.projections.faceOf(PERMISSION_PROJECTION).getSnapshot()?.currentValue;
    }
    function createPermissionCatalog(ctx) {
      let options;
      let failure;
      let epoch = 0;
      let disposed = false;
      const namespace = () => {
        try {
          return ctx.get?.(PERMISSION_SERVICE);
        } catch {
          return void 0;
        }
      };
      const load = async () => {
        const remote = namespace();
        if (typeof remote?.catalog !== "function") {
          failure = new Error("the permission catalog is not available in this deployment");
          return options;
        }
        const mine = ++epoch;
        try {
          const result = await remote.catalog();
          if (disposed || mine !== epoch) return options;
          if (!result.ok) {
            failure = new Error(`${result.error.code}: ${result.error.message}`);
            return options;
          }
          failure = void 0;
          options = result.value.options.map((option) => ({ ...option }));
          return options;
        } catch (error) {
          if (!disposed && mine === epoch) failure = error;
          return options;
        }
      };
      let off;
      try {
        off = ctx.get?.("remote")?.$on?.(CATALOG_CHANGED, () => {
          void load();
        });
      } catch {
        off = void 0;
      }
      void load();
      return {
        load,
        get: () => options,
        failure: () => failure,
        dispose: () => {
          disposed = true;
          off?.();
        }
      };
    }
    async function cyclePermissionMode(ctx, catalog, session) {
      const options = catalog.get() ?? await catalog.load();
      if (options === void 0) {
        throw catalog.failure() ?? new Error("the permission catalog has no complete value");
      }
      if (options.length === 0) throw new Error("no permission modes are available");
      const current = readPermissionMode(session);
      const at = options.findIndex((option) => option.value === current);
      const next = options[(at + 1) % options.length];
      if (next === void 0) throw new Error("the permission catalog advertised no usable option");
      const result = await session.command(`/permission ${next.value}`);
      if (!result.ok) {
        throw new Error(`permission switch failed: ${result.error.code}: ${result.error.message}`);
      }
      if (!result.value.matched) throw new Error("the Host offers no /permission command");
      return next;
    }
    function permissionLabel(catalog, value) {
      return catalog.get()?.find((option) => option.value === value)?.name ?? value;
    }

    // src/client/effort-step.js
    var MODEL_SELECTION = "modelSelection";
    function readSelection(ctx, sessionId) {
      const binding = ctx.get("sessions")?.binding?.(sessionId);
      if (binding === void 0) return void 0;
      const projection = binding.session.projections.faceOf(MODEL_SELECTION).getSnapshot();
      return projection?.next ?? projection?.lastUsed ?? void 0;
    }
    function reasoningFor(groups, selection) {
      const model = groups.find((group) => group.id === selection.provider)?.models.find((candidate) => candidate.id === selection.model);
      const reasoning = model?.reasoning;
      if (reasoning === void 0 || reasoning.efforts.length === 0) return void 0;
      return reasoning;
    }
    async function stepEffort(ctx, sessionId, delta) {
      const selection = readSelection(ctx, sessionId);
      if (selection === void 0) throw new Error("this session has no model selection yet");
      const directories = ctx.get("modelDirectories");
      if (directories === void 0) throw new Error("the model directory is not available in this deployment");
      const directory = directories.directoryFor(sessionId);
      await directory.load();
      const state = directory.store.getSnapshot();
      const reasoning = reasoningFor(state.groups ?? [], selection);
      if (reasoning === void 0) throw new Error("this model advertises no reasoning effort levels");
      const levels = reasoning.efforts;
      const effective = selection.reasoningEffort ?? reasoning.defaultEffort;
      const index = levels.findIndex((level) => level.id === effective);
      if (index === -1) {
        if (delta < 0) {
          const error = new Error("already at the lowest reasoning effort");
          error.code = "effort-at-bottom";
          throw error;
        }
      }
      const from = index === -1 ? -1 : index;
      const to = Math.min(Math.max(from + delta, 0), levels.length - 1);
      if (to === index) {
        const limit = delta > 0 ? "top" : "bottom";
        const error = new Error(`already at the ${limit} reasoning effort`);
        error.code = limit === "top" ? "effort-at-top" : "effort-at-bottom";
        throw error;
      }
      const target = levels[to];
      if (target === void 0) throw new Error("this model advertises no reasoning effort levels");
      const result = await directory.select({
        provider: selection.provider,
        model: selection.model,
        reasoningEffort: target.id
      });
      if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
      return target.name;
    }

    // src/client/prompt-nav.js
    var SCROLLER_SELECTOR = '[class*="scroller"]';
    var TURN_ROW_SELECTOR = "[data-chat-turn]";
    var CONVERSATION_REGION = "[data-conversation-region]";
    var MARK_PITCH_PX = 10;
    var RAIL_INSET_PX = 6;
    var MOUNT_FRAME_BUDGET = 30;
    function nextFrame(doc) {
      return new Promise((resolve) => {
        const view = doc.defaultView;
        if (view === null || typeof view.requestAnimationFrame !== "function") {
          setTimeout(resolve, 16);
          return;
        }
        view.requestAnimationFrame(() => {
          resolve();
        });
      });
    }
    function findRail(doc) {
      const rails = [...doc.querySelectorAll("nav")].filter(
        (nav) => nav.querySelector("button[data-index]") !== null
      );
      if (rails.length === 0) return void 0;
      const region = doc.querySelector(CONVERSATION_REGION);
      const rail = (region === null ? void 0 : rails.find((nav) => region.contains(nav))) ?? rails[0];
      if (rail === void 0) return void 0;
      const marks = [...rail.querySelectorAll("button[data-index]")].map((element) => ({ element, index: Number(element.dataset.index) })).filter((mark) => Number.isInteger(mark.index)).sort((left, right) => left.index - right.index);
      return marks.length === 0 ? void 0 : { rail, marks };
    }
    function activeIndex(marks) {
      return marks.find((mark) => mark.element.getAttribute("aria-current") === "true")?.index;
    }
    function scrollRailTo(rail, index) {
      const scroller = rail.querySelector(SCROLLER_SELECTOR) ?? rail;
      const centred = RAIL_INSET_PX + index * MARK_PITCH_PX - scroller.clientHeight / 2;
      const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      scroller.scrollTop = Math.min(Math.max(centred, 0), max);
    }
    function scrollTranscript(doc, delta, currentTurn) {
      const rows = [...doc.querySelectorAll(TURN_ROW_SELECTOR)].map((element) => ({ element, turn: Number(element.dataset.chatTurn) })).filter((row) => Number.isInteger(row.turn)).sort((left, right) => left.turn - right.turn);
      if (rows.length === 0) return false;
      const target = currentTurn === void 0 ? delta < 0 ? rows[rows.length - 1] : rows[0] : delta < 0 ? [...rows].reverse().find((row) => row.turn < currentTurn) : rows.find((row) => row.turn > currentTurn);
      if (target === void 0) return false;
      target.element.scrollIntoView({ block: "start", behavior: "smooth" });
      return true;
    }
    async function navigateInput(doc, delta) {
      const rail = findRail(doc);
      if (rail === void 0) {
        return scrollTranscript(doc, delta) ? "moved" : "unavailable";
      }
      const current = activeIndex(rail.marks);
      const first = rail.marks[0]?.index;
      const last = rail.marks[rail.marks.length - 1]?.index;
      if (current === void 0) {
        if (first === void 0 || last === void 0) return "unavailable";
        return clickMark(rail, delta < 0 ? first : last, doc) ? "moved" : "unavailable";
      }
      const target = current + delta;
      if (target < 0) return "edge";
      if (await clickMarkAsync(rail, target, doc)) return "moved";
      const moved = scrollTranscript(doc, delta, current);
      return moved ? "moved" : target === 0 ? "edge" : "unavailable";
    }
    function clickMark(rail, index, doc) {
      const mark = rail.marks.find((candidate) => candidate.index === index);
      if (mark === void 0) return false;
      mark.element.click();
      return true;
    }
    async function clickMarkAsync(rail, index, doc) {
      if (clickMark(rail, index, doc)) return true;
      scrollRailTo(rail.rail, index);
      for (let frame = 0; frame < MOUNT_FRAME_BUDGET; frame += 1) {
        await nextFrame(doc);
        const refreshed = findRail(doc);
        if (refreshed !== void 0 && clickMark(refreshed, index, doc)) return true;
      }
      return false;
    }

    // src/client/settings-page.js
    var import_react2 = require("react");

    // src/client/slots.js
    function entries(ctx, key) {
      try {
        const value = ctx.slots?.entries?.(key);
        return Array.isArray(value) ? value : [];
      } catch {
        return [];
      }
    }
    function findSectionEntry(ctx, key, id) {
      const all = entries(ctx, key);
      if (id === void 0) return all[0];
      return all.find((entry) => entry?.options?.id === id);
    }
    function sectionIndex(ctx, key, id) {
      const all = entries(ctx, key);
      if (all.length === 0) return void 0;
      const sorted = [...all].sort((left, right) => {
        const byPriority = (left?.options?.priority ?? 0) - (right?.options?.priority ?? 0);
        if (byPriority !== 0) return byPriority;
        return (left?.options?.order ?? 0) - (right?.options?.order ?? 0);
      });
      const at = sorted.findIndex((entry) => entry?.options?.id === id);
      return at === -1 ? void 0 : at;
    }
    function labelText(label) {
      try {
        const value = typeof label === "function" ? label() : label;
        return typeof value === "string" ? value : "";
      } catch {
        return "";
      }
    }

    // src/client/settings-page.js
    var STYLE_TAG3 = "dsh-keyboard-shortcut/settings-page.css";
    var CSS2 = {
      root: "dshKbd_root",
      intro: "dshKbd_intro",
      section: "dshKbd_section",
      sectionTitle: "dshKbd_sectionTitle",
      sectionText: "dshKbd_sectionText",
      row: "dshKbd_row",
      rowText: "dshKbd_rowText",
      rowTitle: "dshKbd_rowTitle",
      rowHint: "dshKbd_rowHint",
      control: "dshKbd_control",
      keys: "dshKbd_keys",
      key: "dshKbd_key",
      separator: "dshKbd_separator",
      button: "dshKbd_button",
      buttonQuiet: "dshKbd_buttonQuiet",
      recording: "dshKbd_recording",
      error: "dshKbd_error",
      empty: "dshKbd_empty",
      switchRow: "dshKbd_switchRow",
      switchTrack: "dshKbd_switchTrack",
      switchKnob: "dshKbd_switchKnob",
      switchOn: "dshKbd_switchOn"
    };
    var STYLESHEET2 = `
    .${CSS2.root}{display:flex;flex-direction:column;gap:20px;padding:0 0 4px;min-width:0}
    .${CSS2.intro}{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0}
    .${CSS2.section}{display:flex;flex-direction:column;gap:4px;min-width:0}
    .${CSS2.sectionTitle}{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px;margin:0}
    .${CSS2.sectionText}{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0 0 4px}
    .${CSS2.row}{box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:52px;padding:12px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}
    .${CSS2.rowText}{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
    .${CSS2.rowTitle}{color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .${CSS2.rowHint}{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin:0}
    .${CSS2.control}{display:flex;align-items:center;gap:8px;flex:none}
    .${CSS2.keys}{display:inline-flex;align-items:center;gap:4px;border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);padding:3px 8px;font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}
    .${CSS2.key}{font-family:inherit}
    .${CSS2.separator}{font:inherit;color:var(--dsw-alias-label-tertiary)}
    .${CSS2.button}{border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);border:none;cursor:pointer;font:inherit;font-size:13px;line-height:20px;height:30px;padding:0 12px;white-space:nowrap}
    .${CSS2.button}:hover{background:var(--dsw-alias-interactive-bg-hover)}
    .${CSS2.buttonQuiet}{background:0 0;color:var(--dsw-alias-label-secondary);padding:0 8px}
    .${CSS2.buttonQuiet}:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
    .${CSS2.recording}{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
    .${CSS2.error}{border:1px solid var(--dsw-alias-state-error-primary);background:0 0;color:var(--dsw-alias-state-error-primary)}
    .${CSS2.empty}{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;padding:8px 0}
    .${CSS2.switchRow}{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:4px 0}
    .${CSS2.switchTrack}{box-sizing:border-box;flex:none;width:36px;height:20px;border-radius:999px;background:var(--dsw-alias-border-l4,var(--dsw-alias-border-l2));border:none;cursor:pointer;padding:0;position:relative;transition:background-color .12s}
    .${CSS2.switchOn}{background:var(--dsw-alias-brand-primary)}
    .${CSS2.switchKnob}{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .12s}
    .${CSS2.switchOn} .${CSS2.switchKnob}{transform:translateX(16px)}
    `;
    function injectStyles2(doc) {
      if (doc.querySelector(`style[data-plugin-css="${STYLE_TAG3}"]`) !== null) return;
      const tag = doc.createElement("style");
      tag.dataset.plugin = "dsh-keyboard-shortcut";
      tag.dataset.pluginCss = STYLE_TAG3;
      tag.textContent = STYLESHEET2;
      doc.head.appendChild(tag);
    }
    var MODIFIER_CODES = /* @__PURE__ */ new Set([
      "ShiftLeft",
      "ShiftRight",
      "ControlLeft",
      "ControlRight",
      "AltLeft",
      "AltRight",
      "MetaLeft",
      "MetaRight"
    ]);
    function keycaps(keys, t) {
      if (!Array.isArray(keys) || keys.length === 0) {
        return (0, import_react2.createElement)("span", { className: CSS2.keys }, t("row.unbound"));
      }
      return (0, import_react2.createElement)(
        "span",
        { className: CSS2.keys },
        keys.map(
          (key, index) => (0, import_react2.createElement)("span", { className: key === "+" ? CSS2.separator : CSS2.key, key: `${key}:${index}` }, key)
        )
      );
    }
    function PreferenceRow(props) {
      const { label, description, value, onChange } = props;
      return (0, import_react2.createElement)(
        "div",
        { className: CSS2.switchRow },
        (0, import_react2.createElement)(
          "div",
          { className: CSS2.rowText },
          (0, import_react2.createElement)("div", { className: CSS2.rowTitle }, label),
          (0, import_react2.createElement)("p", { className: CSS2.rowHint }, description)
        ),
        (0, import_react2.createElement)("button", {
          type: "button",
          role: "switch",
          "aria-checked": value,
          "aria-label": label,
          className: value === true ? `${CSS2.switchTrack} ${CSS2.switchOn}` : CSS2.switchTrack,
          onClick: () => {
            onChange(value !== true);
          }
        }, (0, import_react2.createElement)("span", { className: CSS2.switchKnob }))
      );
    }
    function makeRecorder(props) {
      const { onCommit, onCancel } = props;
      return (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
          return;
        }
        if (MODIFIER_CODES.has(event.code)) return;
        event.preventDefault();
        event.stopPropagation();
        const modifiers = [];
        if (event.ctrlKey || event.metaKey) modifiers.push("primary");
        if (event.altKey) modifiers.push("alt");
        if (event.shiftKey) modifiers.push("shift");
        if (modifiers.length === 0) {
          onCommit(void 0, "A shortcut needs at least one modifier key.");
          return;
        }
        onCommit({ code: event.code, modifiers });
      };
    }
    function EditableRow(props) {
      const { row, t, recordingId, setRecordingId, save, describeBinding } = props;
      const [failure, setFailure] = (0, import_react2.useState)(void 0);
      const active = recordingId === row.id;
      const commit = (0, import_react2.useCallback)(
        async (binding, message) => {
          setRecordingId(void 0);
          if (message !== void 0) {
            setFailure(message);
            return;
          }
          const outcome = await save(row.id, binding);
          setFailure(outcome === "saved" ? void 0 : t("status.failed"));
        },
        [row.id, save, setRecordingId, t]
      );
      const cancel = (0, import_react2.useCallback)(() => {
        setRecordingId(void 0);
        setFailure(void 0);
      }, [setRecordingId]);
      (0, import_react2.useEffect)(() => {
        if (!active) return void 0;
        const handler = makeRecorder({ onCommit: commit, onCancel: cancel });
        window.addEventListener("keydown", handler, true);
        return () => {
          window.removeEventListener("keydown", handler, true);
        };
      }, [active, commit, cancel]);
      const conflict = (0, import_react2.useMemo)(() => {
        if (row.binding === null || row.binding === void 0) return void 0;
        const conflicts = describeBinding?.(row.binding)?.conflicts ?? [];
        return conflicts.filter((id) => id !== row.id);
      }, [row.binding, row.id, describeBinding]);
      const issue = row.issue ?? void 0;
      const hint = failure ?? (issue === "reserved" ? t("row.reserved") : issue === "unsupported-browser" ? t("row.unsupported") : void 0);
      return (0, import_react2.createElement)(
        "div",
        { className: CSS2.row },
        (0, import_react2.createElement)(
          "div",
          { className: CSS2.rowText },
          (0, import_react2.createElement)("div", { className: CSS2.rowTitle }, labelText(row.label) || row.id),
          hint === void 0 ? null : (0, import_react2.createElement)("p", { className: CSS2.rowHint }, hint),
          conflict !== void 0 && conflict.length > 0 ? (0, import_react2.createElement)("p", { className: CSS2.rowHint }, t("row.conflict", { ids: conflict.join(", ") })) : null
        ),
        (0, import_react2.createElement)(
          "div",
          { className: CSS2.control },
          active ? (0, import_react2.createElement)("span", { className: `${CSS2.keys} ${CSS2.recording}` }, t("row.recording")) : keycaps(row.keys, t),
          active ? (0, import_react2.createElement)("button", { type: "button", className: `${CSS2.button} ${CSS2.buttonQuiet}`, onClick: cancel }, t("row.cancel")) : (0, import_react2.createElement)("button", {
            type: "button",
            className: `${CSS2.button} ${failure === void 0 ? CSS2.buttonQuiet : CSS2.error}`,
            "aria-label": t("row.edit", { label: labelText(row.label) || row.id }),
            onClick: () => {
              setFailure(void 0);
              setRecordingId(row.id);
            }
          }, t("row.change")),
          row.modified === true && !active ? (0, import_react2.createElement)("button", {
            type: "button",
            className: `${CSS2.button} ${CSS2.buttonQuiet}`,
            onClick: () => {
              void save(row.id, "reset");
            }
          }, t("row.restore")) : null
        )
      );
    }
    function ReferenceRow(props) {
      const { row, t } = props;
      return (0, import_react2.createElement)(
        "div",
        { className: CSS2.row },
        (0, import_react2.createElement)(
          "div",
          { className: CSS2.rowText },
          (0, import_react2.createElement)("div", { className: CSS2.rowTitle }, labelText(row.label) || row.id),
          row.hint === void 0 ? null : (0, import_react2.createElement)("p", { className: CSS2.rowHint }, row.hint)
        ),
        (0, import_react2.createElement)("div", { className: CSS2.control }, keycaps(row.keys, t))
      );
    }
    function createSettingsPage(service) {
      return function KeyboardShortcutPage(props) {
        const { t } = props;
        const [recordingId, setRecordingId] = (0, import_react2.useState)(void 0);
        const [status, setStatus] = (0, import_react2.useState)(void 0);
        const catalog = (0, import_react2.useSyncExternalStore)(service.subscribeCatalog, service.getCatalog, service.getCatalog);
        const prefs = (0, import_react2.useSyncExternalStore)(service.subscribePrefs, service.getPrefs, service.getPrefs);
        (0, import_react2.useEffect)(() => {
          if (typeof document !== "undefined") injectStyles2(document);
        }, []);
        (0, import_react2.useEffect)(() => {
          void service.setRecording(recordingId !== void 0);
          return () => {
            if (recordingId !== void 0) void service.setRecording(false);
          };
        }, [recordingId]);
        const rows = (0, import_react2.useMemo)(() => Array.isArray(catalog) ? catalog : [], [catalog]);
        const fixed = (0, import_react2.useMemo)(
          () => typeof service.fixedKeys === "function" ? service.fixedKeys() : [],
          [service, t]
        );
        const mine = (0, import_react2.useMemo)(
          () => rows.filter((row) => service.ownedCommandIds.has(row.id)).sort((l, r) => l.id.localeCompare(r.id)),
          [rows]
        );
        const others = (0, import_react2.useMemo)(
          () => rows.filter((row) => !service.ownedCommandIds.has(row.id)).sort((l, r) => l.id.localeCompare(r.id)),
          [rows]
        );
        const save = (0, import_react2.useCallback)(
          async (id, binding) => {
            setStatus("saving");
            const outcome = await service.saveBinding(id, binding);
            setStatus(outcome === "saved" ? "saved" : "failed");
            return outcome;
          },
          []
        );
        return (0, import_react2.createElement)(
          "div",
          { className: CSS2.root },
          (0, import_react2.createElement)("p", { className: CSS2.intro }, t("page.description")),
          (0, import_react2.createElement)(
            "section",
            { className: CSS2.section },
            (0, import_react2.createElement)("h3", { className: CSS2.sectionTitle }, t("section.plugin.title")),
            (0, import_react2.createElement)("p", { className: CSS2.sectionText }, t("section.plugin.description")),
            mine.length === 0 ? (0, import_react2.createElement)("p", { className: CSS2.empty }, t("row.unbound")) : mine.map(
              (row) => (0, import_react2.createElement)(EditableRow, {
                key: row.id,
                row,
                t,
                recordingId,
                setRecordingId,
                save,
                describeBinding: service.describeBinding
              })
            )
          ),
          (0, import_react2.createElement)(
            "section",
            { className: CSS2.section },
            (0, import_react2.createElement)("h3", { className: CSS2.sectionTitle }, t("section.fixed.title")),
            (0, import_react2.createElement)("p", { className: CSS2.sectionText }, t("section.fixed.description")),
            fixed.length === 0 ? (0, import_react2.createElement)("p", { className: CSS2.empty }, t("row.unbound")) : fixed.map((row) => (0, import_react2.createElement)(ReferenceRow, { key: row.id, row, t }))
          ),
          (0, import_react2.createElement)(
            "section",
            { className: CSS2.section },
            (0, import_react2.createElement)("h3", { className: CSS2.sectionTitle }, t("section.input.title")),
            (0, import_react2.createElement)("p", { className: CSS2.sectionText }, t("section.input.description")),
            (0, import_react2.createElement)(PreferenceRow, {
              label: t("input.optimize.label"),
              description: t("input.optimize.description"),
              value: prefs.optimizeComposerKeys === true,
              onChange: (next) => {
                service.setPref("optimizeComposerKeys", next);
              }
            })
          ),
          (0, import_react2.createElement)(
            "section",
            { className: CSS2.section },
            (0, import_react2.createElement)("h3", { className: CSS2.sectionTitle }, t("section.core.title")),
            (0, import_react2.createElement)("p", { className: CSS2.sectionText }, t("section.core.description")),
            others.length === 0 ? (0, import_react2.createElement)("p", { className: CSS2.empty }, t("row.unbound")) : others.map((row) => (0, import_react2.createElement)(ReferenceRow, { key: row.id, row, t }))
          ),
          status === void 0 ? null : (0, import_react2.createElement)(
            "p",
            { className: CSS2.sectionText },
            status === "saving" ? t("status.saving") : status === "saved" ? t("status.saved") : t("status.failed")
          )
        );
      };
    }

    // src/client/open-settings.js
    var SECTION_ID = "keyboard-shortcut";
    var OPEN_COMMAND_ID = "keyboard-shortcut.open";
    var BUILTIN_COMMAND_ID = "shortcuts.open";
    var SHORTCUT_BINDING = { code: "Slash", modifiers: ["primary"] };
    var NAV_CELL_SELECTOR = '[class*="navCell"]';
    var NAV_LABEL_SELECTOR = '[class*="navLabel"]';
    var WRITE_ATTEMPTS = 4;
    var PANEL_FRAME_BUDGET = 30;
    function settingsStore(ctx) {
      const entry = findSectionEntry(ctx, "sidebar.settings");
      const handle = entry?.store;
      if (handle === void 0 || typeof handle.create !== "function") return void 0;
      try {
        const instance = handle.create();
        return typeof instance?.actions?.openSection === "function" ? instance : void 0;
      } catch {
        return void 0;
      }
    }
    function nextFrame2(doc) {
      return new Promise((resolve) => {
        const view = doc.defaultView;
        if (view === null || typeof view.requestAnimationFrame !== "function") {
          setTimeout(resolve, 16);
          return;
        }
        view.requestAnimationFrame(() => {
          resolve();
        });
      });
    }
    function clickNavRow(doc, label) {
      if (label === "") return false;
      const panel = doc.querySelector('[data-shortcut-modal="settings"]');
      if (panel === null) return false;
      const cells = [...panel.querySelectorAll(NAV_CELL_SELECTOR)];
      const target = cells.find((cell) => cell.querySelector(NAV_LABEL_SELECTOR)?.textContent?.trim() === label);
      if (target === void 0) return false;
      target.click();
      return true;
    }
    async function openShortcutSection(ctx, label) {
      const store = settingsStore(ctx);
      if (store !== void 0) {
        store.actions.openSection(SECTION_ID);
        return true;
      }
      const doc = typeof document === "undefined" ? void 0 : document;
      if (doc === void 0) return false;
      if (clickNavRow(doc, label())) return true;
      const trigger = [...doc.querySelectorAll('button[aria-haspopup="dialog"]')].find(
        (button) => button.closest('[data-shortcut-modal="settings"]') === null
      );
      if (trigger === void 0) return false;
      trigger.click();
      for (let frame = 0; frame < PANEL_FRAME_BUDGET; frame += 1) {
        await nextFrame2(doc);
        if (clickNavRow(doc, label())) return true;
      }
      return false;
    }
    function catalogById(ctx) {
      const rows = ctx.shortcuts?.catalog?.getSnapshot?.();
      if (!Array.isArray(rows)) return void 0;
      return new Map(rows.map((row) => [row.id, row]));
    }
    function isWantedBinding(row) {
      const binding = row?.binding;
      if (binding === void 0 || binding === null) return false;
      if (binding.code !== "Slash") return false;
      return binding.modifiers.length === 1 && ["control", "meta"].includes(binding.modifiers[0]);
    }
    async function writeShortcut(ctx, edit) {
      const shortcuts = ctx.shortcuts;
      if (typeof shortcuts?.edit !== "function") return "unavailable";
      for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt += 1) {
        const snapshot = shortcuts.config.getSnapshot();
        if (snapshot.status === "loading") {
          await new Promise((resolve) => setTimeout(resolve, 50));
          continue;
        }
        if (snapshot.status === "unreadable") return "unreadable";
        const result = await shortcuts.edit(edit, snapshot.revision);
        if (result.status === "saved") return "saved";
        if (result.status !== "stale") return result.status;
      }
      return "stale";
    }
    async function reconcileShortcutKey(ctx, enabled) {
      const rows = catalogById(ctx);
      if (rows === void 0) return "unavailable";
      const mine = rows.get(OPEN_COMMAND_ID);
      const builtin = rows.get(BUILTIN_COMMAND_ID);
      if (mine === void 0) return "not-registered";
      const mineIsBound = isWantedBinding(mine);
      const builtinHolds = isWantedBinding(builtin);
      if (!enabled) {
        if (mine.modified !== true && builtin?.modified !== true) return "done";
        const released = await writeShortcut(ctx, { type: "reset", id: OPEN_COMMAND_ID });
        if (released !== "saved") return released;
        if (builtin?.modified === true) {
          const restored = await writeShortcut(ctx, { type: "reset", id: BUILTIN_COMMAND_ID });
          if (restored !== "saved") return restored;
        }
        return "done";
      }
      if (mineIsBound && !builtinHolds) return "done";
      if (builtinHolds && builtin?.modified === true && !mineIsBound) return "skipped";
      if (builtinHolds) {
        const cleared = await writeShortcut(ctx, { type: "set", id: BUILTIN_COMMAND_ID, binding: null });
        if (cleared !== "saved") return cleared;
      }
      if (!mineIsBound) {
        const claimed = await writeShortcut(ctx, { type: "set", id: OPEN_COMMAND_ID, binding: SHORTCUT_BINDING });
        if (claimed !== "saved") return claimed;
      }
      return "done";
    }

    // src/client/index.js
    var inject = ["slots", "locale", "shortcuts"];
    var SECTION_ORDER = 5;
    var OWNED_COMMANDS = [
      OPEN_COMMAND_ID,
      "keyboard-shortcut.cycle-permission",
      "keyboard-shortcut.effort-up",
      "keyboard-shortcut.effort-down"
    ];
    var PERMISSION_DEFAULTS = {
      "desktop:windows": { code: "KeyQ", modifiers: ["control"] },
      "desktop:macos": { code: "KeyQ", modifiers: ["control"] }
    };
    var EFFORT_DOWN_DEFAULTS = {
      "desktop:windows": { code: "Digit1", modifiers: ["control"] },
      "desktop:macos": { code: "Digit1", modifiers: ["control"] },
      "desktop:linux": { code: "Digit1", modifiers: ["control"] }
    };
    var EFFORT_UP_DEFAULTS = {
      "desktop:windows": { code: "Digit2", modifiers: ["control"] },
      "desktop:macos": { code: "Digit2", modifiers: ["control"] },
      "desktop:linux": { code: "Digit2", modifiers: ["control"] }
    };
    var NAV_KEYS = [
      { id: "nav.keyboard-shortcut.previous", code: "PageUp", cap: "PgUp", labelKey: "command.previousInput" },
      { id: "nav.keyboard-shortcut.next", code: "PageDown", cap: "PgDn", labelKey: "command.nextInput" }
    ];
    var RECONCILE_ATTEMPTS = 20;
    var RECONCILE_DELAY_MS = 250;
    function activeSessionId(ctx) {
      const current = ctx.get("uiSession")?.adapter?.current?.getSnapshot?.();
      if (typeof current?.key === "string") return current.key;
      const sessions = ctx.get("sessions");
      const list = sessions?.list?.getSnapshot?.();
      const ids = list?.byId === void 0 ? [] : Object.keys(list.byId);
      return ids[0];
    }
    function sessionFace(ctx, sessionId) {
      if (sessionId === void 0) return void 0;
      return ctx.get("sessions")?.binding?.(sessionId)?.session;
    }
    function apply(ctx) {
      const doc = typeof document === "undefined" ? void 0 : document;
      ctx.effect(() => ctx.locale.register(NS, { en, zh }), "keyboard-shortcut: dictionaries");
      const t = ctx.locale.bind(NS);
      const sectionLabel = () => t("nav.title");
      const warn = (message, error) => {
        if (typeof ctx.logger?.warn === "function") ctx.logger.warn(message, error);
        else console.warn(`[dsh-keyboard-shortcut] ${message}`, error);
      };
      const prefs = createPrefs(safeStorage());
      if (typeof window !== "undefined") {
        const onStorage = (event) => {
          prefs.adopt(event);
        };
        window.addEventListener("storage", onStorage);
        ctx.effect(
          () => () => {
            window.removeEventListener("storage", onStorage);
          },
          "keyboard-shortcut: cross-tab preferences"
        );
      }
      const notices = createNotices();
      ctx.effect(() => () => {
        notices.dispose();
      }, "keyboard-shortcut: notices");
      ctx.slots.inject(
        "shell.overlay",
        () => ctx.slots.register(
          { name: "shell.overlay", id: "keyboard-shortcut-notices", order: 100 },
          createNoticeOverlay(notices)
        )
      );
      const permissionCatalog = createPermissionCatalog(ctx);
      ctx.effect(() => () => {
        permissionCatalog.dispose();
      }, "keyboard-shortcut: permission catalog");
      const report = (error, fallbackKey) => {
        if (fallbackKey !== void 0 && error?.code === "effort-at-top") {
          notices.show(t("toast.effortAtTop"));
          return;
        }
        if (fallbackKey !== void 0 && error?.code === "effort-at-bottom") {
          notices.show(t("toast.effortAtBottom"));
          return;
        }
        console.error("[dsh-keyboard-shortcut]", error);
        if (fallbackKey !== void 0) notices.show(t(fallbackKey));
      };
      const currentSessionId = () => activeSessionId(ctx);
      const register = (command) => {
        try {
          ctx.effect(() => ctx.shortcuts.register(command), `keyboard-shortcut: ${command.id}`);
        } catch (error) {
          warn(`command "${command.id}" was not registered`, error);
        }
      };
      register({
        id: OPEN_COMMAND_ID,
        label: () => t("command.openSettings"),
        aliases: ["keyboard shortcuts", "keybindings", "hotkeys"],
        // No default: the built-in `shortcuts.open` already owns Ctrl+/. The
        // binding is claimed through the preference layer instead, so this command
        // does not make registration throw.
        defaults: {},
        regions: ["page", "editable", "terminal"],
        modals: [],
        resolve: () => ({
          status: "handled",
          run: () => {
            void openShortcutSection(ctx, sectionLabel).catch((error) => {
              warn("could not open the shortcut settings", error);
            });
          }
        })
      });
      register({
        id: "keyboard-shortcut.cycle-permission",
        label: () => t("command.cyclePermission"),
        aliases: ["permission", "sandbox", "approval"],
        defaults: PERMISSION_DEFAULTS,
        regions: ["page", "editable"],
        modals: [],
        resolve: () => {
          const sessionId = currentSessionId();
          const session = sessionFace(ctx, sessionId);
          if (session === void 0) {
            return { status: "blocked", reason: t("toast.noSession") };
          }
          return {
            status: "handled",
            run: () => {
              void cyclePermissionMode(ctx, permissionCatalog, session).then(
                (mode) => {
                  notices.show(t("toast.permission", { name: permissionLabel(permissionCatalog, mode.value) }));
                },
                (error) => {
                  report(error, "toast.permissionUnavailable");
                }
              );
            }
          };
        }
      });
      const effortCommand = (id, delta, defaults, labelKey, toastKey) => ({
        id,
        label: () => t(labelKey),
        aliases: ["reasoning effort", "thinking level"],
        defaults,
        regions: ["page", "editable"],
        modals: [],
        resolve: () => {
          const sessionId = currentSessionId();
          const sessions = ctx.get("sessions");
          if (sessionId === void 0 || sessions?.binding?.(sessionId) === void 0) {
            return { status: "blocked", reason: t("toast.noSession") };
          }
          if (sessions.subagentAddress?.(sessionId) !== void 0) {
            return { status: "blocked", reason: t("toast.effortUnavailable") };
          }
          if (ctx.get("modelDirectories") === void 0) {
            return { status: "blocked", reason: t("toast.effortUnavailable") };
          }
          return {
            status: "handled",
            run: () => {
              void stepEffort(ctx, sessionId, delta).then(
                (name) => {
                  notices.show(t(toastKey, { name }));
                },
                (error) => {
                  report(error, "toast.effortUnavailable");
                }
              );
            }
          };
        }
      });
      register(
        effortCommand(
          "keyboard-shortcut.effort-down",
          -1,
          EFFORT_DOWN_DEFAULTS,
          "command.effortDown",
          "toast.effortDown"
        )
      );
      register(
        effortCommand("keyboard-shortcut.effort-up", 1, EFFORT_UP_DEFAULTS, "command.effortUp", "toast.effortUp")
      );
      ctx.effect(
        () => ctx.shortcuts.observeFixedInput((input) => {
          if (input.type !== "keydown") return;
          const { gesture, context } = input;
          if (gesture.composing || gesture.defaultPrevented) return;
          if (gesture.alt || gesture.control || gesture.meta || gesture.shift) return;
          if (gesture.code !== "PageUp" && gesture.code !== "PageDown") return;
          if (context.modal !== null) return;
          if (context.region === "terminal") return;
          if (doc === void 0) return;
          input.consume();
          const delta = gesture.code === "PageUp" ? -1 : 1;
          void navigateInput(doc, delta).then(
            (outcome) => {
              if (outcome === "edge") {
                notices.show(t("toast.navAtEdge", { direction: t(delta < 0 ? "toast.previous" : "toast.next") }));
              } else if (outcome === "unavailable") {
                notices.show(t("toast.navUnavailable"));
              }
            },
            (error) => {
              report(error, "toast.navUnavailable");
            }
          );
        }),
        "keyboard-shortcut: prompt navigation"
      );
      if (doc !== void 0) {
        ctx.effect(
          () => installComposerKeys(doc, () => prefs.getSnapshot().optimizeComposerKeys === true),
          "keyboard-shortcut: composer keys"
        );
      }
      const service = createService(ctx, prefs, t, notices, warn);
      ctx.slots.inject(
        "settings.section",
        () => ctx.slots.register(
          {
            name: "settings.section",
            id: SECTION_ID,
            order: SECTION_ORDER,
            label: sectionLabel,
            locale: NS
          },
          createSettingsPage(service)
        )
      );
      if (doc !== void 0) {
        ctx.effect(
          () => installNavIcon(
            { id: SECTION_ID, label: sectionLabel, renderSvg: () => keyboardIconSvg() },
            () => sectionIndex(ctx, "settings.section", SECTION_ID)
          ),
          "keyboard-shortcut: settings navigation icon"
        );
      }
      let wanted = prefs.getSnapshot().takeOverShortcutKey === true;
      ctx.effect(
        () => prefs.subscribe(() => {
          const next = prefs.getSnapshot().takeOverShortcutKey === true;
          if (next === wanted) return;
          wanted = next;
          void reconcileShortcutKey(ctx, next);
        }),
        "keyboard-shortcut: shortcut ownership"
      );
      const reconcileWhenReady = (attempt) => {
        void reconcileShortcutKey(ctx, wanted).then((outcome) => {
          if (outcome === "done" || outcome === "skipped") return;
          if (attempt >= RECONCILE_ATTEMPTS) {
            if (outcome !== "not-registered") {
              warn(`Ctrl+/ was left with its built-in binding (${outcome})`);
            }
            return;
          }
          setTimeout(() => {
            reconcileWhenReady(attempt + 1);
          }, RECONCILE_DELAY_MS);
        });
      };
      if (wanted) reconcileWhenReady(0);
    }
    function createService(ctx, prefs, t, notices, warn) {
      return {
        /** Command ids editable from the page. */
        ownedCommandIds: new Set(OWNED_COMMANDS),
        /**
         * Fixed keys this plugin handles outside the shortcut registry.
         *
         * They have no catalog row — the registry cannot hold their codes — so the
         * page reads them from here. They are shown as reference rows because a
         * binding that cannot be registered cannot be rebound either.
         *
         * @returns One entry per fixed key, localized at read time.
         */
        fixedKeys: () => NAV_KEYS.map((key) => ({
          id: key.id,
          label: t(key.labelKey),
          keys: [key.cap],
          hint: t("row.fixedHint")
        })),
        getCatalog: () => ctx.shortcuts.catalog.getSnapshot(),
        subscribeCatalog: (listener) => ctx.shortcuts.catalog.subscribe(listener),
        getPrefs: () => prefs.getSnapshot(),
        subscribePrefs: (listener) => prefs.subscribe(listener),
        setPref: (key, value) => {
          prefs.set(key, value);
        },
        describeBinding: (binding) => ctx.shortcuts.describeBinding(binding),
        /**
         * Persist one binding change.
         *
         * @param id - Command id.
         * @param binding - The new binding, or the string `'reset'` to restore the
         * command's own default.
         * @returns `'saved'` or a failure classification.
         */
        saveBinding: async (id, binding) => {
          const snapshot = ctx.shortcuts.config.getSnapshot();
          if (snapshot.status === "unreadable") return "unreadable";
          const edit = binding === "reset" ? { type: "reset", id } : { type: "set", id, binding };
          const result = await ctx.shortcuts.edit(edit, snapshot.revision);
          if (result.status !== "saved") {
            notices.show(t(result.status === "conflict" ? "status.failed" : "status.failed"));
          }
          return result.status;
        },
        /**
         * Suspend or resume the shortcut service's own interception.
         *
         * @param active - Whether a recorder is open.
         * @returns Nothing.
         */
        setRecording: async (active) => {
          try {
            await ctx.shortcuts.recording(active);
          } catch (error) {
            warn("could not change recording state", error);
          }
        }
      };
    }
    function safeStorage() {
      try {
        return typeof localStorage === "undefined" ? void 0 : localStorage;
      } catch {
        return void 0;
      }
    }

    return module.exports
  },
})
