import type { BookPage } from "./book";
const escape = (text: string) => text.replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"})[ch]!);
export function wrapText(text: string, width: number): string[] {
  return text.split("\n").flatMap(paragraph => {
    if (!paragraph) return [""];
    const lines: string[] = [];
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (line && line.length + word.length + 1 > width) { lines.push(line); line = ""; }
      let rest = word;
      while (rest.length > width) { lines.push(rest.slice(0,width)); rest = rest.slice(width); }
      line += (line ? " " : "") + rest;
    }
    if (line) lines.push(line);
    return lines;
  });
}
export function pageLayout(page: BookPage) {
  const headings = wrapText(page.title, 42);
  const lines = wrapText(page.text, 65);
  const top = 165 + headings.length * 36;
  const leading = Math.min(25, (990 - top) / Math.max(1, lines.length - 1));
  return {headings, lines, top, leading};
}
export function pageSvg(title: string, page: BookPage) {
  const {headings, lines, top, leading} = pageLayout(page);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="1100" viewBox="0 0 850 1100"><rect width="850" height="1100" fill="#fffef9"/><text x="70" y="80" font-family="Georgia,serif" font-size="13" fill="#777">${escape(title)}</text><line x1="70" y1="100" x2="780" y2="100" stroke="#d8d3c7"/><g font-family="Georgia,serif" font-size="28" fill="#222">${headings.map((line,i)=>`<text x="70" y="${150+i*36}">${escape(line)}</text>`).join("")}</g><g font-family="monospace" font-size="17" fill="#333" xml:space="preserve">${lines.map((line,i)=>`<text x="70" y="${top+i*leading}">${escape(line)}</text>`).join("")}</g><text x="425" y="1040" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#555">${escape(page.label)}</text></svg>`;
}
