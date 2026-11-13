/**
 * Japanese Real Estate Smart Keyword & Natural Language Intent Parser
 * Specialized for Japanese Court Auction (BIT) & National Tax Agency (NTA) Data.
 */

export interface ParsedSearchQuery {
  originalQuery: string;
  cleanedQuery: string;
  textTokens: string[];
  tokenVariants: Record<string, string[]>;
  extractedFilters: {
    minPrice?: number;
    maxPrice?: number;
    maxWalkTime?: number;
    minArea?: number;
    types?: string[];
  };
}

// Kanji to Arabic numerals for Chome (1丁目 <-> 一丁目)
const KANJI_NUMERALS: Record<string, number> = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
  '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20
};

const NUMERAL_TO_KANJI: Record<number, string> = Object.entries(KANJI_NUMERALS).reduce(
  (acc, [kanji, num]) => {
    acc[num] = kanji;
    return acc;
  },
  {} as Record<number, string>
);

// Common B2B Real Estate Synonyms
const SYNONYMS: Record<string, string[]> = {
  'rc': ['鉄筋コンクリート', 'RC造', 'RC'],
  'rc造': ['鉄筋コンクリート', 'RC'],
  '鉄筋コンクリート': ['RC', 'RC造'],
  'src': ['鉄骨鉄筋コンクリート', 'SRC造', 'SRC'],
  'src造': ['鉄骨鉄筋コンクリート', 'SRC'],
  's造': ['鉄骨', '鉄骨造'],
  '戸建': ['戸建て', '一戸建て', '戸建'],
  '戸建て': ['戸建', '一戸建て', '戸建て'],
  '一戸建て': ['戸建て', '戸建'],
  'マンション': ['マンション', '集合住宅'],
  '借地': ['借地権', '敷地利用権', '借地'],
  '借地権': ['借地', '敷地権'],
};

/**
 * Normalize Full-width characters (Zenkaku) to Half-width (Hankaku),
 * replace Japanese spaces \u3000 and punctuation with clean spaces.
 */
export function normalizeJapaneseText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKC') // Converts Zenkaku ０-９, Ａ-Ｚ to 0-9, A-Z and Hankaku katakana
    .replace(/[\u3000、,]/g, ' ')
    .trim();
}

/**
 * Parse smart intent and extract quantitative filters (price, area, walk time, types)
 * from a raw free-keyword search string.
 */
export function parseSmartKeyword(rawQuery: string): ParsedSearchQuery {
  if (!rawQuery || !rawQuery.trim()) {
    return {
      originalQuery: rawQuery || '',
      cleanedQuery: '',
      textTokens: [],
      tokenVariants: {},
      extractedFilters: {}
    };
  }

  let text = normalizeJapaneseText(rawQuery);
  const extractedFilters: ParsedSearchQuery['extractedFilters'] = {};

  // 1. Extract Price Range (e.g., 2000万以下, 1000万円未満, 500万〜1000万, 3000万以上)
  // Range: 500万〜1000万 or 500-1000万
  const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:万|万円)?\s*(?:〜|~|-)\s*(\d+(?:\.\d+)?)\s*(?:万|万円)/);
  if (rangeMatch) {
    const minP = Math.round(parseFloat(rangeMatch[1]) * 10000);
    const maxP = Math.round(parseFloat(rangeMatch[2]) * 10000);
    extractedFilters.minPrice = minP;
    extractedFilters.maxPrice = maxP;
    text = text.replace(rangeMatch[0], ' ');
  } else {
    // Max price: 2000万以下, 1500万円未満
    const maxMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:万|万円)\s*(?:以下|未満)/);
    if (maxMatch) {
      extractedFilters.maxPrice = Math.round(parseFloat(maxMatch[1]) * 10000);
      text = text.replace(maxMatch[0], ' ');
    }
    // Min price: 1000万以上
    const minMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:万|万円)\s*(?:以上|超)/);
    if (minMatch) {
      extractedFilters.minPrice = Math.round(parseFloat(minMatch[1]) * 10000);
      text = text.replace(minMatch[0], ' ');
    }
  }

  // 2. Extract Walk Time to Station (e.g., 徒歩10分, 徒歩5分以内, 駅10分)
  const walkMatch = text.match(/(?:徒歩|駅)\s*(\d+)\s*分\s*(?:以内)?/);
  if (walkMatch) {
    extractedFilters.maxWalkTime = parseInt(walkMatch[1], 10);
    text = text.replace(walkMatch[0], ' ');
  } else if (/駅近/.test(text)) {
    extractedFilters.maxWalkTime = 7; // Eki-chika default <= 7 mins
    text = text.replace(/駅近/, ' ');
  }

  // 3. Extract Area (e.g., 100平米, 100m2, 100㎡, 30坪)
  const sqmMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:m2|m²|㎡|平米)\s*(?:以上)?/);
  if (sqmMatch) {
    extractedFilters.minArea = Math.round(parseFloat(sqmMatch[1]));
    text = text.replace(sqmMatch[0], ' ');
  } else {
    const tsuboMatch = text.match(/(\d+(?:\.\d+)?)\s*坪\s*(?:以上)?/);
    if (tsuboMatch) {
      // 1 Tsubo = ~3.30578 m²
      extractedFilters.minArea = Math.round(parseFloat(tsuboMatch[1]) * 3.30578);
      text = text.replace(tsuboMatch[0], ' ');
    }
  }

  // 4. Extract Property Types if explicitly mentioned in query
  const typesFound: string[] = [];
  if (/マンション/.test(text)) typesFound.push('マンション');
  if (/戸建て|一戸建て|戸建/.test(text)) typesFound.push('戸建て');
  if (/土地/.test(text)) typesFound.push('土地');
  if (/農地|田|畑/.test(text)) typesFound.push('農地');
  if (typesFound.length > 0) {
    extractedFilters.types = Array.from(new Set(typesFound));
  }

  // 5. Split remaining text into discrete tokens
  const rawTokens = text.split(/\s+/).filter(t => t.length > 0);
  const textTokens: string[] = [];
  const tokenVariants: Record<string, string[]> = {};

  for (const token of rawTokens) {
    textTokens.push(token);
    const variants = new Set<string>([token]);

    // Check Chome (e.g., "1丁目" <-> "一丁目")
    const chomeNumberMatch = token.match(/^(\d+)丁目$/);
    if (chomeNumberMatch) {
      const num = parseInt(chomeNumberMatch[1], 10);
      const kanji = NUMERAL_TO_KANJI[num];
      if (kanji) variants.add(`${kanji}丁目`);
    } else {
      const chomeKanjiMatch = token.match(/^([一二三四五六七八九十]+)丁目$/);
      if (chomeKanjiMatch) {
        const kanji = chomeKanjiMatch[1];
        const num = KANJI_NUMERALS[kanji];
        if (num) variants.add(`${num}丁目`);
      }
    }

    // Check general Chome embedded inside token (e.g. "大曲1丁目" -> "大曲一丁目")
    const embeddedNum = token.match(/(.+?)(\d+)丁目(.*)/);
    if (embeddedNum) {
      const num = parseInt(embeddedNum[2], 10);
      const kanji = NUMERAL_TO_KANJI[num];
      if (kanji) variants.add(`${embeddedNum[1]}${kanji}丁目${embeddedNum[3]}`);
    } else {
      const embeddedKanji = token.match(/(.+?)([一二三四五六七八九十]+)丁目(.*)/);
      if (embeddedKanji) {
        const num = KANJI_NUMERALS[embeddedKanji[2]];
        if (num) variants.add(`${embeddedKanji[1]}${num}丁目${embeddedKanji[3]}`);
      }
    }

    // Check B2B Synonyms (case insensitive)
    const lower = token.toLowerCase();
    if (SYNONYMS[lower]) {
      SYNONYMS[lower].forEach(syn => variants.add(syn));
    }

    tokenVariants[token] = Array.from(variants);
  }

  return {
    originalQuery: rawQuery,
    cleanedQuery: textTokens.join(' '),
    textTokens,
    tokenVariants,
    extractedFilters
  };
}
