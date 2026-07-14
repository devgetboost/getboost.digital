/**
 * Blog content helpers.
 * Supports legacy Markdown content and normalizes imported HTML so the editor
 * preserves headings, paragraphs and spacing when existing articles are reopened.
 */
const HTML_BLOCK_TAG_RE = /<\/(p|div|h[1-6]|ul|ol|li|blockquote|table|hr)>/i;

export function isHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith('<') && HTML_BLOCK_TAG_RE.test(trimmed);
}

export function normalizeHtmlForEditor(html: string): string {
  if (!html) return '';

  return html
    .replace(/\r\n/g, '\n')
    .replace(/<p>\s*(?:<br\s*\/?>\s*)+/gi, '<p>')
    .replace(/(?:<br\s*\/?>\s*){2,}/gi, '</p><p>')
    .replace(/(?:<br\s*\/?>\s*)+(<\/p>)/gi, '$1')
    .replace(/<p>\s*<\/p>/gi, '')
    .trim();
}

export function prepareContentForEditor(content: string): string {
  if (!content) return '';
  return isHtmlContent(content) ? normalizeHtmlForEditor(content) : markdownToHtml(content);
}

export function markdownToHtml(md: string): string {
  if (!md) return '';

  if (isHtmlContent(md)) {
    return normalizeHtmlForEditor(md);
  }

  const lines = md.split('\n');
  const htmlLines: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === '') {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      continue;
    }

    if (line.trim() === '---') {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push('<hr>');
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      const level = headingMatch[1].length;
      htmlLines.push(`<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    if (line.startsWith('> ')) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push(`<blockquote><p>${inlineMarkdown(line.slice(2))}</p></blockquote>`);
      continue;
    }

    if (line.match(/^[-•]\s+/)) {
      if (!inList) {
        htmlLines.push('<ul>');
        inList = true;
      }
      htmlLines.push(`<li>${inlineMarkdown(line.replace(/^[-•]\s+/, ''))}</li>`);
      continue;
    }

    if (line.match(/^\d+\.\s+/)) {
      if (!inList) {
        htmlLines.push('<ul>');
        inList = true;
      }
      htmlLines.push(`<li>${inlineMarkdown(line.replace(/^\d+\.\s+/, ''))}</li>`);
      continue;
    }

    if (inList) {
      htmlLines.push('</ul>');
      inList = false;
    }
    htmlLines.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  if (inList) htmlLines.push('</ul>');

  return htmlLines.join('\n');
}

function inlineMarkdown(text: string): string {
  let parsed = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  parsed = parsed.replace(/\*(.+?)\*/g, '<em>$1</em>');
  parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return parsed;
}
