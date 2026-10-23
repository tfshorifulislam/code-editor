import type * as Monaco from "monaco-editor";
import expand from "emmet";

// Standard HTML tags for suggestion catalogs
export const COMMON_HTML_TAGS = [
  "div", "section", "span", "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "button", "a", "main", "article", "aside", "header", "footer", "nav",
  "form", "input", "textarea", "select", "option", "optgroup", "label",
  "ul", "ol", "li", "dl", "dt", "dd",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "pre", "code", "blockquote", "strong", "em", "b", "i", "small", "mark", "time", "kbd",
  "img", "video", "audio", "source", "track", "canvas", "iframe", "figure", "figcaption",
  "svg", "path", "g", "circle", "rect", "line", "polyline", "polygon", "text", "defs",
  "details", "summary", "dialog", "fieldset", "legend", "datalist", "output", "progress",
  "hr", "br", "Fragment", "Suspense"
];

export const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr"
]);

const JS_KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "import", "export", "from",
  "default", "class", "extends", "if", "else", "for", "while", "do",
  "switch", "case", "break", "continue", "new", "this", "super", "try",
  "catch", "finally", "throw", "typeof", "instanceof", "void", "delete",
  "in", "of", "async", "await", "yield", "null", "undefined", "true", "false",
  "interface", "type", "namespace", "as", "is", "keyof", "readonly"
]);

type EmmetSyntax = "html" | "jsx" | "css";

export function getSyntaxForLanguage(languageId: string): EmmetSyntax {
  if (languageId === "css") return "css";
  if (languageId === "html") return "html";
  return "jsx"; // typescript, javascript, jsx, tsx
}

/**
 * Expands an Emmet abbreviation into a snippet with cursor / tab stop fields.
 */
export function expandEmmetAbbreviation(
  abbr: string,
  syntax: EmmetSyntax
): string | null {
  try {
    if (JS_KEYWORDS.has(abbr)) {
      return null;
    }

    const isStyle = syntax === "css";
    const expanded = expand(abbr, {
      syntax,
      type: isStyle ? "stylesheet" : "markup",
      options: {
        "output.field": (idx: number, ph: string) => (ph ? `\${${idx}:${ph}}` : `\${${idx}}`),
        "jsx.enabled": syntax === "jsx",
      },
    });

    if (expanded && expanded !== abbr) {
      return expanded;
    }
  } catch {
    // Invalid Emmet abbreviation syntax
  }
  return null;
}

/**
 * Scans backwards from the cursor column on a line to extract a candidate Emmet abbreviation.
 */
export function extractAbbreviation(
  lineText: string,
  cursorCol: number,
  syntax: EmmetSyntax = "jsx"
): { abbr: string; startColumn: number; endColumn: number; expanded: string } | null {
  const textBefore = lineText.substring(0, cursorCol - 1);
  if (!textBefore.trim()) return null;

  // 1. Comments and closing tags
  if (textBefore.trim().startsWith("//") || textBefore.trim().startsWith("/*") || /<\/[a-zA-Z0-9_\-]*$/.test(textBefore)) {
    return null;
  }

  // 2. Inside attributes: <tag attr="...
  const lastOpen = textBefore.lastIndexOf("<");
  const lastClose = textBefore.lastIndexOf(">");
  if (lastOpen !== -1 && lastClose < lastOpen) {
    if (lastOpen < textBefore.length - 1 && !/<[a-zA-Z0-9_\-]+$/.test(textBefore)) {
      return null;
    }
  }

  // 3. Scan backwards to find abbreviation boundary
  let i = textBefore.length - 1;
  let inBrackets = 0; // [...]
  let inBraces = 0;   // {...}
  let inParens = 0;   // (...)

  while (i >= 0) {
    const ch = textBefore[i];
    if (ch === "]") inBrackets++;
    else if (ch === "[") {
      if (inBrackets > 0) inBrackets--;
      else break;
    } else if (ch === "}") inBraces++;
    else if (ch === "{") {
      if (inBraces > 0) inBraces--;
      else break;
    } else if (ch === ")") inParens++;
    else if (ch === "(") {
      if (inParens > 0) inParens--;
      else break;
    } else if (inBrackets === 0 && inBraces === 0 && inParens === 0) {
      if (/[\s"'=;,`$]/.test(ch)) {
        break;
      }
      if (ch === "<") {
        break;
      }
    }
    i--;
  }

  let candidate = textBefore.substring(i + 1).trim();
  // Strip leading symbols
  candidate = candidate.replace(/^[^a-zA-Z0-9_#.(]+/, "");

  if (!candidate || candidate.length < 1) return null;

  const expanded = expandEmmetAbbreviation(candidate, syntax);
  if (expanded) {
    return {
      abbr: candidate,
      startColumn: cursorCol - candidate.length,
      endColumn: cursorCol,
      expanded,
    };
  }

  return null;
}

let registeredDisposables: Monaco.IDisposable[] = [];

/**
 * Registers VS Code-style HTML, JSX, TSX, and CSS Emmet and Tag Completion providers.
 */
export function registerHtmlJsxTagCompletion(monaco: typeof Monaco): void {
  registeredDisposables.forEach((d) => d.dispose());
  registeredDisposables = [];

  const languages = [
    { id: "html", syntax: "html" as EmmetSyntax },
    { id: "typescript", syntax: "jsx" as EmmetSyntax },
    { id: "javascript", syntax: "jsx" as EmmetSyntax },
    { id: "css", syntax: "css" as EmmetSyntax },
  ];

  for (const { id: lang, syntax } of languages) {
    const disposable = monaco.languages.registerCompletionItemProvider(lang, {
      triggerCharacters: [
        "<", ">", "/", ".", "#", ">", "*", "+", "{", "}", "[", "]",
        ...Array.from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
      ],

      provideCompletionItems: (model, position) => {
        const lineContent = model.getLineContent(position.lineNumber);
        const textBeforeCursor = lineContent.substring(0, position.column - 1);

        // Closing tag check
        if (/<\/[a-zA-Z0-9_\-]*$/.test(textBeforeCursor)) {
          return { suggestions: [] };
        }

        // Comments check
        const trimmedBefore = textBeforeCursor.trim();
        if (trimmedBefore.startsWith("//") || trimmedBefore.startsWith("/*") || trimmedBefore.startsWith("<!--")) {
          return { suggestions: [] };
        }

        // Inside tag attributes check: e.g. <div class="..." |
        const lastOpenAngle = textBeforeCursor.lastIndexOf("<");
        const lastCloseAngle = textBeforeCursor.lastIndexOf(">");
        const hasOpeningBracket = lastOpenAngle !== -1 && lastCloseAngle < lastOpenAngle;

        const word = model.getWordUntilPosition(position);
        if (hasOpeningBracket && lastOpenAngle < word.startColumn - 2) {
          return { suggestions: [] };
        }

        const suggestions: Monaco.languages.CompletionItem[] = [];

        // 1. Check for compound Emmet abbreviation at cursor (e.g. div.container, ul>li*3, m10)
        const extracted = extractAbbreviation(lineContent, position.column, syntax);
        if (extracted) {
          const charBeforeAbbr = extracted.startColumn > 1 ? lineContent.charAt(extracted.startColumn - 2) : "";
          const startsWithAngle = charBeforeAbbr === "<";
          const startCol = startsWithAngle ? extracted.startColumn - 1 : extracted.startColumn;

          const range: Monaco.IRange = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: startCol,
            endColumn: extracted.endColumn,
          };

          const previewClean = extracted.expanded.replace(/\$\{\d+(?::([^}]+))?\}/g, "$1").replace(/\$\d+/g, "");

          suggestions.push({
            label: extracted.abbr,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            insertText: extracted.expanded,
            detail: "Emmet Abbreviation",
            documentation: {
              value: `**Emmet Abbreviation**\n\n\`\`\`${syntax === "css" ? "css" : "html"}\n${previewClean}\n\`\`\``,
            },
            range,
            sortText: "!0000_" + extracted.abbr,
            filterText: extracted.abbr,
          });
        }

        // 2. In HTML and JSX/TSX: provide suggestions for standard HTML tags
        if (syntax !== "css") {
          const charBeforeWord = word.startColumn > 1 ? lineContent.charAt(word.startColumn - 2) : "";
          const startsWithAngle = charBeforeWord === "<";
          const startColumn = startsWithAngle ? word.startColumn - 1 : word.startColumn;

          const range: Monaco.IRange = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn,
            endColumn: word.endColumn,
          };

          const currentWord = word.word.toLowerCase();

          for (const tag of COMMON_HTML_TAGS) {
            if (!currentWord || tag.toLowerCase().startsWith(currentWord)) {
              let insertSnippet: string | null = null;
              if (tag === "Fragment") {
                insertSnippet = `<>$0</>`;
              } else {
                insertSnippet = expandEmmetAbbreviation(tag, syntax);
              }

              if (insertSnippet) {
                const preview = insertSnippet.replace(/\$\{\d+(?::([^}]+))?\}/g, "$1").replace(/\$\d+/g, "");
                suggestions.push({
                  label: tag,
                  kind: monaco.languages.CompletionItemKind.Snippet,
                  insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                  insertText: insertSnippet,
                  detail: preview,
                  documentation: {
                    value: `**HTML \`<${tag}>\` Element**\n\n\`\`\`html\n${preview}\n\`\`\``,
                  },
                  range,
                  sortText: currentWord === tag.toLowerCase() ? "!0001_" + tag : "!0002_" + tag,
                  filterText: tag,
                });
              }
            }
          }

          // 3. Dynamic custom components (e.g. Card, Modal, Sidebar)
          if (word.word && word.word[0] === word.word[0].toUpperCase() && !COMMON_HTML_TAGS.includes(word.word)) {
            const comp = word.word;
            suggestions.push({
              label: comp,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              insertText: `<${comp}>$0</${comp}>`,
              detail: `<${comp}>...</${comp}>`,
              documentation: {
                value: `**Component \`<${comp}>\`**\n\n\`\`\`tsx\n<${comp}>\n  $0\n</${comp}>\n\`\`\``,
              },
              range,
              sortText: "!0000_" + comp,
              filterText: comp,
            });

            suggestions.push({
              label: `${comp} /`,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              insertText: `<${comp} $0/>`,
              detail: `<${comp} />`,
              documentation: {
                value: `**Self-closing \`<${comp} />\`**\n\n\`\`\`tsx\n<${comp} />\n\`\`\``,
              },
              range,
              sortText: "!0001_" + comp,
              filterText: comp,
            });
          }
        }

        return { suggestions };
      },
    });

    registeredDisposables.push(disposable);
  }
}

/**
 * Binds Tab key for Emmet expansion when the autocomplete suggestion widget is NOT visible.
 * If text before the cursor is a valid Emmet abbreviation (e.g. div.container, ul>li*3),
 * it expands it directly using Monaco's snippet controller.
 * Otherwise, it falls back to normal Tab indentation.
 */
export function setupEmmetTabExpansion(
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco: typeof Monaco
): Monaco.IDisposable {
  const command = editor.addCommand(
    monaco.KeyCode.Tab,
    () => {
      const model = editor.getModel();
      const position = editor.getPosition();
      if (!model || !position) return;

      const lineContent = model.getLineContent(position.lineNumber);
      const syntax = getSyntaxForLanguage(model.getLanguageId());
      const extracted = extractAbbreviation(lineContent, position.column, syntax);

      if (extracted) {
        // Expand using Monaco's built-in snippet controller
        const snippetController = (editor as unknown as { getContribution: (id: string) => { insert?: (s: string, opts?: { range?: Monaco.Range }) => void } }).getContribution("snippetController2");
        const range = new monaco.Range(
          position.lineNumber,
          extracted.startColumn,
          position.lineNumber,
          extracted.endColumn
        );

        if (snippetController?.insert) {
          snippetController.insert(extracted.expanded, { range });
          return;
        }

        // Fallback: execute edits and place cursor
        const cleanText = extracted.expanded.replace(/\$\{\d+(?::([^}]+))?\}/g, "$1").replace(/\$\d+/g, "");
        editor.executeEdits("emmet-expand", [{ range, text: cleanText }]);
        return;
      }

      // Normal Tab indentation fallback
      editor.trigger("keyboard", "tab", null);
    },
    "!suggestWidgetVisible"
  );

  return {
    dispose: () => {
      // Disposed when editor unmounts
    },
  };
}

/**
 * Attaches automatic tag closing listener when user types `>` on an opening tag.
 */
export function setupAutoCloseTagOnTyping(
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco: typeof Monaco
): Monaco.IDisposable {
  return editor.onDidChangeModelContent((event) => {
    for (const change of event.changes) {
      if (change.text === ">") {
        const model = editor.getModel();
        if (!model) continue;

        const position = editor.getPosition();
        if (!position) continue;

        const lineContent = model.getLineContent(position.lineNumber);
        const textBefore = lineContent.substring(0, position.column - 1);

        if (textBefore.endsWith("/>") || textBefore.includes("</")) {
          continue;
        }

        const match = textBefore.match(/<([a-zA-Z][a-zA-Z0-9_\-]*)(?:\s+[^<>]*)?$/);
        if (match) {
          const tagName = match[1];
          if (VOID_ELEMENTS.has(tagName.toLowerCase())) {
            continue;
          }

          const closingTag = `</${tagName}>`;
          editor.executeEdits("auto-close-tag", [
            {
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
              text: closingTag,
            },
          ]);

          editor.setPosition(position);
        }
      }
    }
  });
}
