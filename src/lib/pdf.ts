// A tiny text-only PDF writer (Letter size, Helvetica). No dependencies, so it stays small on the Worker.

const W = 612;
const H = 792;
const M = 54;

// Helvetica glyph widths for ASCII 32–126, in 1/1000 em.
const WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584,
  556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278,
  278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500,
  334, 260, 334, 584,
];

// Characters outside plain ASCII that the standard font can show (WinAnsi byte values).
const WIN_ANSI: Record<string, number> = { "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "…": 0x85, "€": 0x80 };

/** Text as WinAnsi code points (one byte each), replacing what the font can't show with "?". */
function clean(s: string) {
  let out = "";
  for (const ch of s.replace(/\r\n?/g, "\n").replace(/\t/g, "  ")) {
    const c = ch.codePointAt(0)!;
    if (ch === "\n" || (c >= 32 && c < 127) || (c >= 160 && c <= 255)) out += ch;
    else if (WIN_ANSI[ch]) out += String.fromCharCode(WIN_ANSI[ch]);
    else if (c >= 127) out += "?";
  }
  return out;
}

const charWidth = (ch: string, size: number, bold: boolean) => {
  const c = ch.charCodeAt(0);
  return (((c >= 32 && c < 127 ? WIDTHS[c - 32] : 556) * (bold ? 1.06 : 1)) / 1000) * size;
};
const textWidth = (s: string, size: number, bold: boolean) => [...s].reduce((n, ch) => n + charWidth(ch, size, bold), 0);

function wrap(text: string, size: number, bold: boolean, width: number) {
  const lines: string[] = [];
  for (const para of clean(text).split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (textWidth(next, size, bold) <= width) {
        line = next;
        continue;
      }
      if (line) lines.push(line);
      line = word;
      // A single word wider than the line (a long link): break it by character.
      while (textWidth(line, size, bold) > width) {
        let i = 1;
        while (i < line.length && textWidth(line.slice(0, i + 1), size, bold) <= width) i++;
        lines.push(line.slice(0, i));
        line = line.slice(i);
      }
    }
    lines.push(line);
  }
  return lines;
}

const esc = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`);

export type PdfBlock =
  | { kind: "title"; text: string }
  | { kind: "subtitle"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "field"; label: string; value: string };

/** Builds a PDF from simple blocks, flowing onto more pages as needed. */
export function buildPdf(blocks: PdfBlock[], footer: string): Uint8Array {
  const pages: string[][] = [[]];
  let y = H - M;
  const ensure = (needed: number) => {
    if (y - needed < M + 20) {
      pages.push([]);
      y = H - M;
    }
  };
  const put = (text: string, x: number, size: number, bold: boolean, gray = 0) => {
    pages[pages.length - 1].push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${gray} g ${x} ${y.toFixed(1)} Td (${esc(text)}) Tj ET`);
  };
  const rule = () => pages[pages.length - 1].push(`0.8 g ${M} ${(y).toFixed(1)} ${W - 2 * M} 0.6 re f`);

  for (const b of blocks) {
    if (b.kind === "title") {
      for (const l of wrap(b.text, 20, true, W - 2 * M)) {
        ensure(26);
        y -= 22;
        put(l, M, 20, true);
      }
      y -= 4;
    } else if (b.kind === "subtitle") {
      for (const l of wrap(b.text, 10.5, false, W - 2 * M)) {
        ensure(15);
        y -= 14;
        put(l, M, 10.5, false, 0.4);
      }
      y -= 6;
      rule();
      y -= 6;
    } else if (b.kind === "heading") {
      ensure(40);
      y -= 24;
      put(clean(b.text).toUpperCase(), M, 9.5, true, 0.4);
      y -= 2;
    } else {
      const label = wrap(b.label, 9.5, true, W - 2 * M);
      const value = wrap(b.value || "—", 11, false, W - 2 * M);
      ensure(label.length * 13 + 15 + 8);
      y -= 6;
      for (const l of label) {
        y -= 13;
        put(l, M, 9.5, true, 0.35);
      }
      for (const l of value) {
        ensure(15);
        y -= 15;
        put(l, M, 11, false);
      }
    }
  }

  // Objects: 1 catalog, 2 pages, 3/4 fonts, then a content + page object per page.
  const objects: string[] = [];
  const pageIds: number[] = [];
  pages.forEach((ops, i) => {
    const stream = [...ops, `BT /F1 8.5 Tf 0.5 g ${M} 30 Td (${esc(clean(footer))}   |   Page ${i + 1} of ${pages.length}) Tj ET`].join("\n");
    const contentId = 5 + i * 2;
    objects[contentId - 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[contentId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    pageIds.push(contentId + 1);
  });
  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  objects[2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  // Every character is one byte (WinAnsi), so Latin-1 encoding is exact.
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return bytes;
}
