"use strict";

const { Plugin, MarkdownRenderer, MarkdownRenderChild } = require("obsidian");

// 分节符：=== 标题（tabs 与 qa 共用）
const DELIMITER = /^\s*={3,}\s*(.*)$/;
const CACHE_LIMIT = 200;

/**
 * 把代码块内容按 === 切成若干节。
 * 第一个分隔符之前的内容作为前言保留，不会被丢弃。
 */
function parseSections(source, fallbackLabel) {
  const preamble = [];
  const sections = [];
  let current = null;

  for (const line of String(source).replace(/\r\n?/g, "\n").split("\n")) {
    const match = DELIMITER.exec(line);
    if (match) {
      current = { title: match[1].trim(), lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push(line);
    } else {
      preamble.push(line);
    }
  }

  return {
    preamble: preamble.join("\n").trim(),
    sections: sections.map((section, index) => ({
      title: section.title || fallbackLabel + " " + (index + 1),
      markdown: section.lines.join("\n").trim(),
    })),
  };
}

class TabsBlockPlugin extends Plugin {
  async onload() {
    this.activeTabs = new Map();

    this.registerMarkdownCodeBlockProcessor("tabs", (source, el, ctx) => {
      this.renderTabs(source, el, ctx);
    });

    this.registerMarkdownCodeBlockProcessor("qa", (source, el, ctx) => {
      this.renderQa(source, el, ctx);
    });

    this.addCommand({
      id: "insert-tabs-block",
      name: "插入 tabs 代码块",
      editorCallback: (editor) => {
        editor.replaceSelection("```tabs\n=== 第一个页签\n\n=== 第二个页签\n\n```");
      },
    });

    this.addCommand({
      id: "insert-qa-block",
      name: "插入 qa 代码块",
      editorCallback: (editor) => {
        editor.replaceSelection("```qa\n=== 问题 1\n\n=== 问题 2\n\n```");
      },
    });
  }

  onunload() {
    if (this.activeTabs) this.activeTabs.clear();
  }

  /* ---------------- tabs ---------------- */

  renderTabs(source, el, ctx) {
    // 生命周期挂到当前渲染上下文：文件关闭或重渲染时自动清理
    const child = new MarkdownRenderChild(el);
    ctx.addChild(child);

    const { preamble, sections } = parseSections(source, "Tab");

    // 没有分隔符：整块当普通 Markdown 渲染，不生成页签
    if (!sections.length) {
      if (source.trim()) {
        MarkdownRenderer.render(this.app, source, el, ctx.sourcePath, child);
      }
      return;
    }

    if (preamble) {
      const intro = el.createDiv({ cls: "tabs-block-intro" });
      MarkdownRenderer.render(this.app, preamble, intro, ctx.sourcePath, child);
    }

    const root = el.createDiv({ cls: "tabs-block" });
    const nav = root.createDiv({ cls: "tabs-block-nav", attr: { role: "tablist" } });
    const body = root.createDiv({ cls: "tabs-block-body" });

    const tabEls = [];
    const panes = [];
    const stateKey = this.stateKey(ctx, el, sections);

    const activate = (index) => {
      tabEls.forEach((tabEl, i) => {
        const active = i === index;
        tabEl.toggleClass("is-active", active);
        tabEl.setAttribute("aria-selected", active ? "true" : "false");
        tabEl.tabIndex = active ? 0 : -1;
        panes[i].toggleClass("is-active", active);
      });
      this.rememberState(stateKey, index);
    };

    sections.forEach((section, index) => {
      // 用 div 而不是 button：button 会被 Obsidian 的默认按钮样式塞进背景色
      const tabEl = nav.createEl("div", {
        cls: "tabs-block-tab",
        text: section.title,
        attr: { role: "tab", tabindex: "-1" },
      });
      const pane = body.createDiv({ cls: "tabs-block-pane", attr: { role: "tabpanel" } });

      tabEls.push(tabEl);
      panes.push(pane);

      tabEl.addEventListener("click", () => activate(index));
      tabEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate(index);
          return;
        }
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const offset = event.key === "ArrowRight" ? 1 : sections.length - 1;
        const next = (index + offset) % sections.length;
        activate(next);
        tabEls[next].focus();
      });

      // 用 Obsidian 自己的渲染器渲染页签内容，双链、嵌入、表格才能正常工作
      if (section.markdown) {
        MarkdownRenderer.render(this.app, section.markdown, pane, ctx.sourcePath, child);
      }
    });

    const cached = this.activeTabs.get(stateKey);
    const initial = Number.isInteger(cached) && cached >= 0 && cached < sections.length ? cached : 0;
    activate(initial);
  }

  stateKey(ctx, el, sections) {
    const info = ctx.getSectionInfo(el);
    const anchor = info ? info.lineStart : ctx.docId;
    return [ctx.sourcePath, anchor, sections.map((section) => section.title).join("\u0001")].join("::");
  }

  rememberState(key, index) {
    if (!this.activeTabs) return;
    this.activeTabs.set(key, index);
    if (this.activeTabs.size > CACHE_LIMIT) {
      this.activeTabs.delete(this.activeTabs.keys().next().value);
    }
  }

  /* ---------------- qa ---------------- */

  renderQa(source, el, ctx) {
    const child = new MarkdownRenderChild(el);
    ctx.addChild(child);

    const { preamble, sections } = parseSections(source, "问题");

    if (!sections.length) {
      if (source.trim()) {
        MarkdownRenderer.render(this.app, source, el, ctx.sourcePath, child);
      }
      return;
    }

    if (preamble) {
      const intro = el.createDiv({ cls: "qa-block-intro" });
      MarkdownRenderer.render(this.app, preamble, intro, ctx.sourcePath, child);
    }

    const list = el.createDiv({ cls: "qa-block" });

    sections.forEach((section) => {
      // 原生 details/summary：展开收起、键盘操作由浏览器负责
      const item = list.createEl("details", { cls: "qa-item" });
      item.createEl("summary", { cls: "qa-question", text: section.title });

      const answer = item.createDiv({ cls: "qa-answer" });
      if (section.markdown) {
        MarkdownRenderer.render(this.app, section.markdown, answer, ctx.sourcePath, child);
      }
    });
  }
}

module.exports = TabsBlockPlugin;
module.exports.default = TabsBlockPlugin;
