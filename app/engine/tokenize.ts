import type { Token } from "./types";

// CJK Unified Ideographs and common extension blocks; U+3000 is ideographic space (used as range endpoint)
const CJK_RE = /[一-鿿㐀-䶿豈-﫿\u{20000}-\u{2A6DF}\u{2A700}-\u{2CEAF}]/u;

function isCJKChar(ch: string): boolean {
  return CJK_RE.test(ch);
}

export function tokenize(passage: string): Token[] {
  if (!passage) return [];

  const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
  const segments = Array.from(segmenter.segment(passage));

  // Expand multi-character CJK segments into individual character tokens first
  const raw: Token[] = [];
  for (const seg of segments) {
    const isWordLike = seg.isWordLike ?? false;
    if (isWordLike && seg.segment.length > 1 && isCJKChar(seg.segment[0])) {
      for (let c = 0; c < seg.segment.length; c++) {
        const ch = seg.segment[c];
        raw.push({
          text: ch,
          start: seg.index + c,
          end: seg.index + c + 1,
          isWord: true,
        });
      }
    } else {
      raw.push({
        text: seg.segment,
        start: seg.index,
        end: seg.index + seg.segment.length,
        isWord: isWordLike,
      });
    }
  }

  // Post-pass: merge contractions (word + apostrophe + word) and hyphenated compounds
  // Skip merges when either side starts with a CJK character
  const merged: Token[] = [];
  let i = 0;
  while (i < raw.length) {
    const cur = raw[i];
    if (
      cur.isWord &&
      !isCJKChar(cur.text[0]) &&
      i + 2 < raw.length &&
      !raw[i + 1].isWord &&
      (raw[i + 1].text === "'" || raw[i + 1].text === "’" || raw[i + 1].text === "-") &&
      raw[i + 2].isWord &&
      !isCJKChar(raw[i + 2].text[0])
    ) {
      merged.push({
        text: cur.text + raw[i + 1].text + raw[i + 2].text,
        start: cur.start,
        end: raw[i + 2].end,
        isWord: true,
      });
      i += 3;
    } else {
      merged.push(cur);
      i++;
    }
  }

  return merged;
}
