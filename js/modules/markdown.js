/**
 * Small Markdown renderer for blog posts: headings (with anchors), paragraphs,
 * nested lists, tables, blockquotes, images, fenced code with light syntax
 * highlighting, and inline code/bold/italic/strikethrough/links.
 * Pure string output, so it runs in the browser and at build time.
 */

export const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const slugify = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// --- Inline ---

const isSafeUrl = (url) => /^(https?:\/\/|\/|#|mailto:)/i.test(url);

const formatInline = (escaped) => escaped
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>')
  .replace(/~~([^~]+)~~/g, '<del>$1</del>')
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, url) => {
    if (!isSafeUrl(url)) return label;
    const external = /^https?:\/\//i.test(url);
    return `<a href="${url}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
  });

export const inlineMarkdown = (text) => String(text ?? '')
  .split(/(`[^`]+`)/g)
  .map((part) => (/^`[^`]+`$/.test(part)
    ? `<code>${escapeHtml(part.slice(1, -1))}</code>`
    : formatInline(escapeHtml(part))))
  .join('');

// Plain text of a heading, for ids and the table of contents.
const plainText = (text) => String(text).replace(/[`*~]/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

// --- Syntax highlighting ---

const KEYWORDS = {
  bash: 'if then else elif fi for while do done case esac function in sudo echo cd export return exit',
  python: 'def class return if elif else for while in import from as with try except finally raise lambda pass break continue not and or is None True False',
  js: 'const let var function return if else for while of in new class import from export default async await try catch throw typeof null true false undefined',
  php: 'function return if else elseif foreach for while echo class new public private static use namespace try catch throw null true false',
  sql: 'select from where and or insert into values update set delete join left right inner outer on group by order limit union drop table create'
};

const LANGUAGES = {
  bash: { comment: '#.*', string: '"(?:[^"\\\\]|\\\\.)*"|\'[^\']*\'', variable: '\\$\\{?\\w+\\}?', numbers: false, flag: '(?<=\\s)--?[A-Za-z][\\w-]*', keywords: KEYWORDS.bash },
  python: { comment: '#.*', string: '"""[\\s\\S]*?"""|"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'', keywords: KEYWORDS.python },
  js: { comment: '//.*|/\\*[\\s\\S]*?\\*/', string: '`(?:[^`\\\\]|\\\\.)*`|"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'', keywords: KEYWORDS.js },
  php: { comment: '//.*|#.*|/\\*[\\s\\S]*?\\*/', string: '"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'', variable: '\\$\\w+', keywords: KEYWORDS.php },
  sql: { comment: '--.*', string: '\'(?:[^\'\\\\]|\\\\.)*\'', keywords: KEYWORDS.sql, ignoreCase: true }
};

const LANGUAGE_ALIASES = { sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash', py: 'python', javascript: 'js', json: 'js', ts: 'js' };

export const highlightCode = (code, lang) => {
  const config = LANGUAGES[LANGUAGE_ALIASES[lang] || lang];
  if (!config) return escapeHtml(code);

  const groups = [['comment', config.comment], ['string', config.string]];
  if (config.variable) groups.push(['variable', config.variable]);
  if (config.flag) groups.push(['flag', config.flag]);
  if (config.numbers !== false) groups.push(['number', '\\b\\d+(?:\\.\\d+)*\\b']);
  groups.push(['keyword', `\\b(?:${config.keywords.split(' ').join('|')})\\b`]);

  const pattern = new RegExp(groups.map(([, source]) => `(${source})`).join('|'), `g${config.ignoreCase ? 'i' : ''}m`);
  let result = '';
  let last = 0;
  for (const match of code.matchAll(pattern)) {
    const group = match.findIndex((value, index) => index > 0 && value !== undefined) - 1;
    result += escapeHtml(code.slice(last, match.index));
    result += `<span class="tok-${groups[group][0]}">${escapeHtml(match[0])}</span>`;
    last = match.index + match[0].length;
  }
  return result + escapeHtml(code.slice(last));
};

// --- Blocks ---

const LIST_ITEM = /^(\s*)([-*]|\d+\.)\s+(.*)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_DIVIDER = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

const splitRow = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());

const renderTable = (rows) => {
  const [head, , ...body] = rows;
  const cells = (row, tag) => splitRow(row).map((cell) => `<${tag}>${inlineMarkdown(cell)}</${tag}>`).join('');
  return `<div class="blog-table-wrap"><table><thead><tr>${cells(head, 'th')}</tr></thead><tbody>${body.map((row) => `<tr>${cells(row, 'td')}</tr>`).join('')}</tbody></table></div>`;
};

// Builds nested <ul>/<ol> from consecutive list lines, using indentation for depth.
const renderList = (items) => {
  const build = (start, depth) => {
    const ordered = /\d/.test(items[start].marker);
    let html = '';
    let index = start;
    while (index < items.length && items[index].indent >= depth) {
      if (items[index].indent > depth) {
        const nested = build(index, items[index].indent);
        html = html.replace(/<\/li>$/, `${nested.html}</li>`);
        index = nested.next;
        continue;
      }
      html += `<li>${inlineMarkdown(items[index].text)}</li>`;
      index += 1;
    }
    return { html: `<${ordered ? 'ol' : 'ul'}>${html}</${ordered ? 'ol' : 'ul'}>`, next: index };
  };
  return build(0, items[0].indent).html;
};

const renderImage = (alt, src) => {
  const safeSrc = escapeHtml(src);
  return `<figure><img src="${safeSrc}" alt="${escapeHtml(alt)}" loading="lazy" data-lightbox="${safeSrc}" data-lightbox-title="${escapeHtml(alt)}" role="button" tabindex="0"></figure>`;
};

/** Returns { html, headings: [{ level, id, text }] }. */
export const renderMarkdown = (markdown = '') => {
  const lines = String(markdown).split('\n');
  const html = [];
  const headings = [];
  const usedIds = new Map();

  const uniqueId = (text) => {
    const base = slugify(text) || 'section';
    const count = usedIds.get(base) || 0;
    usedIds.set(base, count + 1);
    return count ? `${base}-${count}` : base;
  };

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];

    // Fenced code
    const fence = line.trim().match(/^```(\w*)/);
    if (fence) {
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      const lang = fence[1].toLowerCase();
      html.push(`<pre${lang ? ` data-lang="${escapeHtml(lang)}"` : ''}><code>${highlightCode(code.join('\n'), lang)}</code></pre>`);
      continue;
    }

    if (!line.trim()) {
      index += 1;
      continue;
    }

    // Image on its own line
    const image = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      html.push(renderImage(image[1], image[2]));
      index += 1;
      continue;
    }

    // Headings (h2-h4)
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const text = plainText(heading[2]);
      const id = uniqueId(text);
      headings.push({ level, id, text });
      html.push(`<h${level} id="${id}">${inlineMarkdown(heading[2])}<a class="heading-anchor" href="#${id}" aria-label="Link to this section">#</a></h${level}>`);
      index += 1;
      continue;
    }

    // Table: a row followed by a divider row
    if (TABLE_ROW.test(line) && index + 1 < lines.length && TABLE_DIVIDER.test(lines[index + 1])) {
      const rows = [];
      while (index < lines.length && TABLE_ROW.test(lines[index])) {
        rows.push(lines[index]);
        index += 1;
      }
      html.push(renderTable(rows));
      continue;
    }

    // Lists (with nesting)
    if (LIST_ITEM.test(line)) {
      const items = [];
      while (index < lines.length && LIST_ITEM.test(lines[index])) {
        const [, indent, marker, text] = lines[index].match(LIST_ITEM);
        items.push({ indent: indent.replace(/\t/g, '  ').length, marker, text });
        index += 1;
      }
      html.push(renderList(items));
      continue;
    }

    // Blockquote (consecutive > lines)
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ''));
        index += 1;
      }
      html.push(`<blockquote>${inlineMarkdown(quote.join(' '))}</blockquote>`);
      continue;
    }

    // Paragraph: run until a blank line or the start of another block
    const paragraph = [];
    while (index < lines.length && lines[index].trim() &&
      !/^(#{2,4}\s|```|>\s?)/.test(lines[index].trim()) &&
      !LIST_ITEM.test(lines[index]) &&
      !/^!\[[^\]]*\]\([^)]+\)$/.test(lines[index].trim())) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
  }

  return { html: html.join('\n'), headings };
};
