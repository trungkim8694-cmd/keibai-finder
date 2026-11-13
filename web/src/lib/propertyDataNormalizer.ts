/**
 * Japanese Court & Tax Auction Property Data Normalizer
 * =====================================================
 * Cleanses, standardizes, and enriches raw scraped data from Supreme Court (BIT)
 * and National Tax Agency (NTA Koubai), resolving multi-parcel sales, accurate
 * asset types, dual area specifications, and professional Japanese B2B legal formatting.
 */

export interface DualAreasAndYear {
  landAreaSqm: number | null;
  buildingAreaSqm: number | null;
  structure: string | null;
  buildYearWestern: number | null;
  buildYearJapanese: string | null;
}

export interface ValuationSummary {
  isNta: boolean;
  priceLabel: string;
  priceSubLabel: string;
  startPriceYen: number;
  minimumBidPriceYen: number | null;
  depositYen: number | null;
  depositDeadline?: string | null;
  bidStartDate?: string | null;
  bidEndDate?: string | null;
  openDate?: string | null;
  decisionDate?: string | null;
  saleDivisionNo?: string | null;
  caseNumber?: string | null;
  method?: string | null;
}

export interface ExpandedHistoryItem {
  round: number;
  saleUnitId: string;
  method: string;
  price: number;
  dropFromPrevYen: number;
  isCurrent: boolean;
  result: string;
  date?: Date | string;
}

export interface RelistSummary {
  totalRounds: number;
  biddingMethod: string;
  currentPriceYen: number;
  previousPriceYen: number | null;
  initialPriceYen: number | null;
  priceDropYen: number;
  priceDropPercent: number;
  cumulativeDropYen: number;
  cumulativeDropPercent: number;
  caseNumberJa: string | null;
  history: ExpandedHistoryItem[];
}

export interface FormattedDataRow {
  key: string;
  value: string;
  isSpecial?: boolean;
  isParagraph?: boolean;
}

/**
 * Zenkaku to Hankaku character & number converter (Japanese NFKC)
 * Converts full-width digits, letters, and punctuation (，．：／％（）〜).
 */
export function normalizeZenkaku(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/[Ａ-Ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/[ａ-ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/，/g, ',')
    .replace(/．/g, '.')
    .replace(/：/g, ':')
    .replace(/／/g, '/')
    .replace(/％/g, '%')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/～/g, '〜')
    .replace(/　/g, ' ')
    .replace(/m\s*2/gi, 'm²')
    .replace(/平方メートル/g, 'm²')
    .replace(/\n[ \t]+/g, '\n');
}

/**
 * Robust numerical area parser handling commas and full-width decimals
 */
export function parseAreaNumber(str: string | null | undefined): number | null {
  if (!str) return null;
  const normalized = normalizeZenkaku(str);
  // Remove commas used as thousands separators e.g. "3,763.54" -> "3763.54"
  const noComma = normalized.replace(/,/g, '');
  const match = noComma.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

/**
 * Resolves accurate Japanese real estate classification from DB + raw data.
 * Distinguishes Commercial/Hotel (店舗・旅館), Office (事務所・ビル), Warehouse/Factory (工場・倉庫),
 * Entire Building (一棟マンション・アパート), Condos (マンション), Detached Houses (戸建て), Land (土地), Farm (農地).
 */
export function resolveAccuratePropertyType(property: any): string {
  const rawData = property?.raw_display_data;
  let textToInspect = '';

  if (typeof rawData === 'string') {
    textToInspect = rawData;
  } else if (rawData && typeof rawData === 'object') {
    textToInspect = JSON.stringify(rawData);
  }

  // 1. Check NTA overview & details specific fields
  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    const overview = rawData.overview || {};
    const details = rawData.details || {};
    const mainType = overview['主たる種類'] || details['種類（登記簿表示内容）'] || details['主たる種類'];
    if (mainType) {
      const cleanMain = mainType.trim();
      if (cleanMain.includes('旅館') || cleanMain.includes('ホテル') || cleanMain.includes('店舗')) {
        return cleanMain.includes('店舗') && cleanMain.includes('旅館') ? '店舗・旅館' : cleanMain;
      }
      if (cleanMain.includes('事務所') || cleanMain.includes('オフィス')) return '事務所・ビル';
      if (cleanMain.includes('工場') || cleanMain.includes('倉庫')) return '工場・倉庫';
      if (cleanMain.includes('共同住宅') || cleanMain.includes('アパート') || cleanMain.includes('一棟')) return '一棟マンション・アパート';
      if (cleanMain.includes('区分所有') || cleanMain.includes('マンション')) return 'マンション';
      if (cleanMain.includes('居宅') || cleanMain.includes('住宅') || cleanMain.includes('戸建')) return '戸建て';
    }
  }

  // 2. Check BIT sections
  if (Array.isArray(rawData)) {
    let hasCondo = false;
    let hasBuilding = false;
    let hasLand = false;
    let buildingKind = '';

    for (const sec of rawData) {
      const title = sec.asset_title || '';
      const data = sec.data || {};
      const typeStr = (sec.asset_type || '') + ' ' + (data['種別'] || '') + ' ' + (data['種類（登記）'] || '') + ' ' + (data['種類（現況）'] || '');

      if (title.includes('区分所有') || typeStr.includes('区分所有') || title.includes('マンション')) {
        hasCondo = true;
      }
      if (title.includes('建物') || sec.asset_type === '建物') {
        hasBuilding = true;
        if (typeStr.includes('旅館') || typeStr.includes('ホテル') || typeStr.includes('店舗')) buildingKind = '店舗・旅館';
        else if (typeStr.includes('事務所')) buildingKind = '事務所・ビル';
        else if (typeStr.includes('共同住宅')) buildingKind = '一棟マンション・アパート';
        else if (typeStr.includes('工場') || typeStr.includes('倉庫')) buildingKind = '工場・倉庫';
      }
      if (title.includes('土地') || sec.asset_type === '土地') {
        hasLand = true;
      }
    }

    if (hasCondo) return 'マンション';
    if (buildingKind) return buildingKind;
    if (hasBuilding && hasLand) return '戸建て';
    if (hasBuilding) return '戸建て';
    if (hasLand) {
      if (textToInspect.includes('田') || textToInspect.includes('畑') || textToInspect.includes('農地')) return '農地';
      if (textToInspect.includes('宅地')) return '宅地（更地）';
      return '土地';
    }
  }

  // Fallback to property.property_type
  const baseType = property?.property_type;
  if (baseType && baseType !== 'その他' && baseType !== 'Unknown') {
    return baseType;
  }

  return '不動産一般';
}

/**
 * Extracts Dual Areas (Land + Building Floor Space), Structure, and Build Year
 * Properly accumulates multi-parcel land and building spaces.
 */
export function extractDualAreasAndYear(property: any): DualAreasAndYear {
  let landAreaSqm: number | null = null;
  let buildingAreaSqm: number | null = null;
  let structure: string | null = null;
  let buildYearWestern: number | null = property?.build_year_western ? Number(property.build_year_western) : null;
  let buildYearJapanese: string | null = null;

  const rawData = property?.raw_display_data;
  let rawText = '';
  if (typeof rawData === 'string') rawText = rawData;
  else if (rawData) rawText = JSON.stringify(rawData);

  // 1. Check NTA Format
  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    const overview = rawData.overview || {};
    const details = rawData.details || {};

    // Land Area
    const landStr = overview['面積（地積）合計'] || details['面積（地積）合計'] || details['面積（登記簿表示内容）'];
    landAreaSqm = parseAreaNumber(landStr);

    // Building Area
    const bldStr = overview['床面積合計'] || details['床面積合計'] || details['床面積（登記簿表示内容）'];
    buildingAreaSqm = parseAreaNumber(bldStr);

    // Structure
    if (details['構造（登記簿表示内容）']) {
      structure = normalizeZenkaku(details['構造（登記簿表示内容）']).trim();
    }

    // Build Year from text (e.g., 昭和48年頃建築 in 使用状況)
    const usageText = details['使用状況'] || rawText;
    const yearMatch = usageText.match(/(昭和|平成|令和)\s*([0-9０-９元]+)\s*年/);
    if (yearMatch) {
      buildYearJapanese = `${yearMatch[1]}${normalizeZenkaku(yearMatch[2])}年`;
      const era = yearMatch[1];
      const yearNum = yearMatch[2] === '元' ? 1 : parseInt(normalizeZenkaku(yearMatch[2]), 10);
      if (era === '昭和') buildYearWestern = 1925 + yearNum;
      else if (era === '平成') buildYearWestern = 1988 + yearNum;
      else if (era === '令和') buildYearWestern = 2018 + yearNum;
    }
  }

  // 2. Check BIT Format (Accumulate across parcels)
  if (Array.isArray(rawData)) {
    let accumulatedBitLand = 0;
    let accumulatedBitBuilding = 0;

    for (const sec of rawData) {
      const d = sec.data || {};
      // Land
      if (sec.asset_type === '土地' || (sec.asset_title && sec.asset_title.includes('土地'))) {
        const aStr = d['土地面積（登記）'] || d['土地面積（現況）'];
        const num = parseAreaNumber(aStr);
        if (num && num > 0) accumulatedBitLand += num;
      }
      // Building
      if (sec.asset_type === '建物' || (sec.asset_title && (sec.asset_title.includes('建物') || sec.asset_title.includes('区分所有')))) {
        const aStr = d['床面積（登記）'] || d['専有面積（登記）'] || d['床面積（現況）'];
        const num = parseAreaNumber(aStr);
        if (num && num > 0) accumulatedBitBuilding += num;

        if (!structure && (d['構造（登記）'] || d['構造（現況）'])) {
          structure = normalizeZenkaku(d['構造（登記）'] || d['構造（現況）']).trim();
        }
        if (!buildYearWestern && d['築年月']) {
          const m = d['築年月'].match(/(昭和|平成|令和)\s*([0-9０-９元]+)\s*年/);
          if (m) {
            buildYearJapanese = `${m[1]}${normalizeZenkaku(m[2])}年`;
            const era = m[1];
            const yearNum = m[2] === '元' ? 1 : parseInt(normalizeZenkaku(m[2]), 10);
            if (era === '昭和') buildYearWestern = 1925 + yearNum;
            else if (era === '平成') buildYearWestern = 1988 + yearNum;
            else if (era === '令和') buildYearWestern = 2018 + yearNum;
          }
        }
      }
    }

    if (accumulatedBitLand > 0) landAreaSqm = accumulatedBitLand;
    if (accumulatedBitBuilding > 0) buildingAreaSqm = accumulatedBitBuilding;
  }

  // Fallback to property.area or compare with accumulated DB area
  if (property?.area) {
    const dbAreaNum = Number(property.area);
    if (dbAreaNum > 0) {
      if (property.property_type === 'マンション' && !buildingAreaSqm) {
        buildingAreaSqm = dbAreaNum;
      } else if (!landAreaSqm || (landAreaSqm && dbAreaNum > landAreaSqm * 1.05)) {
        // If DB area represents multi-parcel total, prioritize the total
        landAreaSqm = dbAreaNum;
      }
    }
  }

  return {
    landAreaSqm: landAreaSqm ? Math.round(landAreaSqm * 100) / 100 : null,
    buildingAreaSqm: buildingAreaSqm ? Math.round(buildingAreaSqm * 100) / 100 : null,
    structure,
    buildYearWestern,
    buildYearJapanese
  };
}

/**
 * Extracts legal financial benchmarks and schedule for Hero Box
 */
export function extractValuationSummary(property: any): ValuationSummary {
  const isNta = property?.source_provider === 'NTA';
  const startPriceYen = property?.starting_price ? Number(property.starting_price) : 0;
  const rawData = property?.raw_display_data;

  if (isNta) {
    const overview = (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) ? rawData.overview || {} : {};
    let depositYen: number | null = null;
    if (overview['公売保証金']) {
      const cl = normalizeZenkaku(overview['公売保証金']).replace(/[^0-9]/g, '');
      if (cl) depositYen = parseInt(cl, 10);
    }

    return {
      isNta: true,
      priceLabel: '見積価額',
      priceSubLabel: '国税庁公売基準額',
      startPriceYen,
      minimumBidPriceYen: null,
      depositYen,
      depositDeadline: overview['公売保証金の納付期限'] ? normalizeZenkaku(overview['公売保証金の納付期限']).trim() : null,
      bidStartDate: overview['入札期間'] || null,
      bidEndDate: overview['入札期間'] || null,
      openDate: overview['開札期日'] ? normalizeZenkaku(overview['開札期日']).trim() : null,
      saleDivisionNo: overview['売却区分番号'] ? normalizeZenkaku(overview['売却区分番号']).trim() : null,
      method: overview['公売の方法'] || '期間入札'
    };
  }

  // BIT Court Auction
  let parsedRaw = rawData;
  if (typeof parsedRaw === 'string') {
    try { parsedRaw = JSON.parse(parsedRaw); } catch {}
  }
  let summaryData: Record<string, string> = {};
  let hasTokubetsuSection = false;
  if (Array.isArray(parsedRaw)) {
    const sum = parsedRaw.find((s: any) => s?.asset_title === 'Summary');
    if (sum?.data) summaryData = sum.data;
    hasTokubetsuSection = parsedRaw.some((s: any) => s?.asset_title === '特別売却');
  }

  let minimumBidPriceYen = Math.round(startPriceYen * 0.8);
  if (summaryData['買受可能価額']) {
    const cl = summaryData['買受可能価額'].replace(/[^0-9]/g, '');
    if (cl) minimumBidPriceYen = parseInt(cl, 10);
  }

  let depositYen = Math.round(startPriceYen * 0.2);
  if (summaryData['買受申出保証金']) {
    const cl = summaryData['買受申出保証金'].replace(/[^0-9]/g, '');
    if (cl) depositYen = parseInt(cl, 10);
  }

  const hasNyusatsu = Boolean(summaryData['入札期間']);
  const method = (hasTokubetsuSection && !hasNyusatsu) ? '特別売却' : '期間入札';
  const { caseNumberJa } = extractBitCaseInfo(property);

  return {
    isNta: false,
    priceLabel: '売却基準価額',
    priceSubLabel: '裁判所評価額',
    startPriceYen,
    minimumBidPriceYen,
    depositYen,
    openDate: summaryData['開札期日'] || null,
    decisionDate: summaryData['売却決定期日'] || null,
    caseNumber: summaryData['事件番号'] || caseNumberJa || null,
    method
  };
}

/**
 * Extracts BIT Court Case Code (e.g. TYO_R07K00600_1) and formatted Japanese Case Number (令和07年(ケ)第600号)
 * from BIT image filenames or raw_display_data.
 */
export function extractBitCaseInfo(property: any): { caseCode: string | null; caseNumberJa: string | null } {
  if (!property) return { caseCode: null, caseNumberJa: null };
  try {
    const rawStr = typeof property.raw_display_data === 'string'
      ? property.raw_display_data
      : JSON.stringify(property.raw_display_data || '');
    const imgStr = Array.isArray(property.images) ? property.images.join(' ') : '';
    const combined = `${property.thumbnailUrl || ''} ${imgStr} ${rawStr}`;

    const m = combined.match(/([A-Z]{2,4})_([RH])(\d{2})([KN])(\d{5})_(\d+)/);
    if (!m) return { caseCode: null, caseNumberJa: null };

    const [, courtCode, eraChar, yearDigits, typeChar, caseNumDigits, unitNo] = m;
    const caseCode = `${courtCode}_${eraChar}${yearDigits}${typeChar}${caseNumDigits}_${unitNo}`;
    const eraJa = eraChar === 'R' ? '令和' : '平成';
    const typeJa = typeChar === 'K' ? '(ケ)' : '(ヌ)';
    const caseNumInt = parseInt(caseNumDigits, 10);
    const caseNumberJa = `${eraJa}${yearDigits}年${typeJa}第${caseNumInt}号`;

    return { caseCode, caseNumberJa };
  } catch {
    return { caseCode: null, caseNumberJa: null };
  }
}

/**
 * Resolves full multi-round auction history (including 期間入札 & 特別売却 cycles)
 * and calculates exact price drop (値下げ額) from previous round and initial valuation.
 */
export function resolveAuctionRelistHistory(currentProperty: any, rawCandidates: any[]): RelistSummary {
  const currentId = String(currentProperty?.sale_unit_id || '');
  const currentPriceYen = currentProperty?.starting_price ? Number(currentProperty.starting_price) : 0;
  const currentArea = currentProperty?.area ? Number(currentProperty.area) : null;
  const { caseCode: currentCaseCode, caseNumberJa } = extractBitCaseInfo(currentProperty);

  // Filter candidates to disambiguate different condo units while tolerating float rounding (e.g. 699.12 vs 699.0)
  const validCandidates = (rawCandidates || []).filter((p: any) => {
    if (!p) return false;
    if (String(p.sale_unit_id) === currentId) return true;
    const { caseCode: pCaseCode } = extractBitCaseInfo(p);
    if (currentCaseCode && pCaseCode && currentCaseCode === pCaseCode) return true;

    const pArea = p.area ? Number(p.area) : null;
    if (currentArea && currentArea > 0 && pArea && pArea > 0) {
      const diff = Math.abs(currentArea - pArea);
      const tolerance = Math.max(5, currentArea * 0.15);
      if (diff > tolerance) return false;
    }
    return true;
  });

  // Ensure currentProperty is in the list
  if (!validCandidates.some((p: any) => String(p.sale_unit_id) === currentId)) {
    validCandidates.push(currentProperty);
  }

  // Deduplicate by sale_unit_id
  const uniqueById = new Map<string, any>();
  for (const c of validCandidates) {
    uniqueById.set(String(c.sale_unit_id), c);
  }
  const deduped = Array.from(uniqueById.values());

  // Sort chronologically:
  // 1. Past records (status !== 'ACTIVE' and id !== currentId) come before current active record
  // 2. Higher starting_price comes before lower starting_price (court re-auctions decrease price)
  // 3. Smaller sale_unit_id comes first
  deduped.sort((a: any, b: any) => {
    const aIsCurrent = String(a.sale_unit_id) === currentId || a.status === 'ACTIVE' ? 1 : 0;
    const bIsCurrent = String(b.sale_unit_id) === currentId || b.status === 'ACTIVE' ? 1 : 0;
    if (aIsCurrent !== bIsCurrent) return aIsCurrent - bIsCurrent;

    const priceA = a.starting_price ? Number(a.starting_price) : 0;
    const priceB = b.starting_price ? Number(b.starting_price) : 0;
    if (priceA !== priceB) return priceB - priceA;

    return String(a.sale_unit_id).localeCompare(String(b.sale_unit_id));
  });

  const rawOfferings: Array<{
    saleUnitId: string;
    method: string;
    price: number;
    isCurrent: boolean;
    result: string;
    date?: Date | string;
  }> = [];

  for (const p of deduped) {
    const isCurrentProp = String(p.sale_unit_id) === currentId;
    const pPrice = p.starting_price ? Number(p.starting_price) : 0;
    let parsedRaw = p.raw_display_data;
    if (typeof parsedRaw === 'string') {
      try { parsedRaw = JSON.parse(parsedRaw); } catch {}
    }

    const rawList = Array.isArray(parsedRaw) ? parsedRaw : [];
    const summarySec = rawList.find((s: any) => s?.asset_title === 'Summary');
    const summaryData = summarySec?.data || {};
    const tokubetsuSec = rawList.find((s: any) => s?.asset_title === '特別売却');
    const tokubetsuData = tokubetsuSec?.data || {};

    const hasNyusatsu = Boolean(summaryData['入札期間']);
    const hasTokubetsuOnly = Boolean(tokubetsuSec && !hasNyusatsu);

    const extractShortPeriod = (str: string | undefined): string | null => {
      if (!str) return null;
      const hw = normalizeZenkaku(str);
      const matches = hw.match(/(\d+)月(\d+)日/g);
      if (matches && matches.length >= 2) {
        return `${matches[0]}〜${matches[matches.length - 1]}`;
      }
      return matches ? matches[0] : null;
    };

    const nyusatsuPeriod = extractShortPeriod(summaryData['入札期間']);
    const tokubetsuPeriod = extractShortPeriod(tokubetsuData['特別売却期間'] || summaryData['特別売却期間']);

    if (hasTokubetsuOnly) {
      // Cycle went through both 期間入札 (Round N) and 特別売却 (Round N+1)
      rawOfferings.push({
        saleUnitId: String(p.sale_unit_id),
        method: '期間入札',
        price: pPrice,
        isCurrent: false,
        result: '不売（入札なし）',
        date: p.created_at
      });
      rawOfferings.push({
        saleUnitId: String(p.sale_unit_id),
        method: '特別売却',
        price: pPrice,
        isCurrent: isCurrentProp,
        result: isCurrentProp
          ? (tokubetsuPeriod ? `特別売却中（${tokubetsuPeriod}）` : '特別売却受付中')
          : (tokubetsuPeriod ? `不売（${tokubetsuPeriod}）` : '不売（特別売却終了）'),
        date: p.created_at
      });
    } else {
      const methodLabel = p.source_provider === 'NTA' ? '公売入札' : '期間入札';
      rawOfferings.push({
        saleUnitId: String(p.sale_unit_id),
        method: methodLabel,
        price: pPrice,
        isCurrent: isCurrentProp,
        result: isCurrentProp
          ? (nyusatsuPeriod ? `出品中（${nyusatsuPeriod}）` : '出品・受付中')
          : (nyusatsuPeriod ? `不売（${nyusatsuPeriod}）` : '不売（入札なし）'),
        date: p.created_at
      });
    }
  }

  // Build final history with round numbers and per-step price drops
  const history: ExpandedHistoryItem[] = rawOfferings.map((item, idx) => {
    const prevPrice = idx > 0 ? rawOfferings[idx - 1].price : item.price;
    const dropFromPrevYen = prevPrice > item.price ? prevPrice - item.price : 0;
    return {
      round: idx + 1,
      saleUnitId: item.saleUnitId,
      method: item.method,
      price: item.price,
      dropFromPrevYen,
      isCurrent: item.isCurrent,
      result: item.result,
      date: item.date
    };
  });

  const currentItem = history.find(h => h.isCurrent) || history[history.length - 1];
  const currentRoundPrice = currentItem ? currentItem.price : currentPriceYen;
  const biddingMethod = currentItem ? currentItem.method : '期間入札';

  // Find most recent previous round with a higher price
  let previousPriceYen: number | null = null;
  for (let i = history.length - 2; i >= 0; i--) {
    if (history[i].price > currentRoundPrice) {
      previousPriceYen = history[i].price;
      break;
    }
  }

  const initialPriceYen = history.length > 0 && history[0].price > currentRoundPrice ? history[0].price : previousPriceYen;
  const priceDropYen = previousPriceYen && previousPriceYen > currentRoundPrice ? previousPriceYen - currentRoundPrice : 0;
  const priceDropPercent = previousPriceYen && previousPriceYen > 0 ? Math.round((priceDropYen / previousPriceYen) * 1000) / 10 : 0;

  const cumulativeDropYen = initialPriceYen && initialPriceYen > currentRoundPrice ? initialPriceYen - currentRoundPrice : 0;
  const cumulativeDropPercent = initialPriceYen && initialPriceYen > 0 ? Math.round((cumulativeDropYen / initialPriceYen) * 1000) / 10 : 0;

  return {
    totalRounds: history.length,
    biddingMethod,
    currentPriceYen: currentRoundPrice,
    previousPriceYen,
    initialPriceYen,
    priceDropYen,
    priceDropPercent,
    cumulativeDropYen,
    cumulativeDropPercent,
    caseNumberJa,
    history
  };
}

/**
 * Normalizes text formatting for structured legal display
 */
export function formatJapaneseLegalText(key: string, value: string): { formatted: string; isParagraph: boolean } {
  if (!value) return { formatted: '-', isParagraph: false };
  let cleaned = normalizeZenkaku(value).trim();

  // 1. If key is 床面積 with multiple floors, format each floor on its own line
  if (key.includes('床面積') && (cleaned.includes('階') || cleaned.includes('地下'))) {
    cleaned = cleaned
      .replace(/([0-9]+階|地下[0-9]+階)/g, '\n$1: ')
      .replace(/^\n/, '')
      .replace(/([0-9.]+)m²/g, '$1 m²');
    return { formatted: cleaned, isParagraph: true };
  }

  // 2. If key is 使用状況:
  if (key.includes('使用状況')) {
    // Separate initial target objects
    cleaned = cleaned.replace(/^対象物件([1-3一二三](?:及び[1-3一二三])?)/, '【対象物件$1】\n');
    cleaned = cleaned.replace(/([^0-9a-zA-Z])対象物件([1-3一二三])(?=[1-9１-９]|\s*[:：])/g, '$1\n\n【対象物件$2】\n');
    
    // Separate numbered points 1. 2. 3. ... 9.
    cleaned = cleaned.replace(/【対象物件([1-3])】\s*([1-9])/g, '【対象物件$1】\n$2. ');
    cleaned = cleaned.replace(/。([1-9])\s*/g, '。\n\n$1. ');
    cleaned = cleaned.replace(/。(対象物件[1-3])/g, '。\n\n【$1】\n');
    
    // Separate rental contract terms
    cleaned = cleaned.replace(/(賃貸借契約書の内容は次のとおりです[。:：]?)/g, '\n\n$1\n');
    cleaned = cleaned.replace(/(契約年月日|契約形態|所在|契約期間|賃料|敷金)/g, '\n・$1: ');
    cleaned = cleaned.replace(/(ただし[、,])/g, '\n\n$1');
    cleaned = cleaned.replace(/(また[、,]敷金の返還義務)/g, '\n$1');

    return { formatted: cleaned.trim(), isParagraph: true };
  }

  // 3. If key is 一括換価について:
  if (key.includes('一括換価')) {
    cleaned = cleaned
      .replace(/(対象物件[0-9]+(?:及び[0-9]+)?\s*[(（](?:土地|建物)[)）])/g, '\n・$1: ')
      .replace(/([0-9,]+円)(?=\s*対象物件)/g, '$1\n');
    return { formatted: cleaned.trim(), isParagraph: true };
  }

  // 4. If key is 留意事項:
  if (key.includes('留意事項')) {
    cleaned = cleaned.replace(/([0-9]+)\s+/g, '\n\n$1. ').replace(/^\n+/, '');
    return { formatted: cleaned.trim(), isParagraph: true };
  }

  // 5. If key is 公法上の規制:
  if (key.includes('公法上の規制')) {
    cleaned = cleaned
      .replace(/(建ぺい率)/g, '\n$1')
      .replace(/(容積率)/g, ' / $1')
      .replace(/(準防火地域|防火地域|宅地造成等工事規制区域)/g, '\n$1')
      .replace(/(上越市景観計画|景観計画|立地適正化計画)/g, '\n$1')
      .replace(/([^\n]+ハザードマップ)/g, '\n$1')
      .replace(/^\n+/, '');
    return { formatted: cleaned.trim(), isParagraph: true };
  }

  // 6. Clean newlines for short labels like 実施局署
  if (cleaned.length < 30 && cleaned.includes('\n')) {
    cleaned = cleaned.replace(/\s*\n\s*/g, ' ').trim();
  }

  // If value is a long sentence (> 60 chars) or already has newlines
  if (cleaned.includes('\n') || cleaned.length > 60) {
    return { formatted: cleaned, isParagraph: true };
  }

  return { formatted: cleaned, isParagraph: false };
}

/**
 * Business-priority ordering for Property Detail sections
 */
const OVERVIEW_KEY_PRIORITY: Record<string, number> = {
  '管轄裁判所': 0,
  '売却区分番号': 1,
  '事件番号': 1,
  '住居表示等': 2,
  '所在地': 2,
  '主たる種類': 3,
  '種別': 3,
  '主たる地目': 4,
  '面積（地積）合計': 5,
  '床面積合計': 6,
  '見積価額': 7,
  '売却基準価額': 7,
  '買受可能価額': 8,
  '公売保証金': 9,
  '買受申出保証金': 9,
  '公売保証金の納付期限': 10,
  '入札期間': 11,
  '開札期日': 12,
  '売却決定の日時': 13,
  '売却決定期日': 13,
  '買受代金納付期限': 14,
  '公売の方法': 15,
  '入札の場所': 16,
  '開札の場所': 17,
  '交通機関': 18
};

const DETAILS_KEY_PRIORITY: Record<string, number> = {
  '財産番号': 1,
  '物件番号': 1,
  '所在地（登記簿表示内容）': 2,
  '家屋番号（登記簿表示内容）': 3,
  '種別': 4,
  '種類（登記簿表示内容）': 5,
  '地目（登記簿表示内容）': 6,
  '構造（登記簿表示内容）': 7,
  '面積（登記簿表示内容）': 8,
  '床面積（登記簿表示内容）': 9,
  '専有面積（登記）': 9,
  'バルコニー面積': 10,
  '間取り': 11,
  '階': 12,
  '総戸数': 13,
  '接道状況': 14,
  '地盤・地勢': 15,
  '公法上の規制': 16,
  '一括換価について': 17,
  '特記事項': 18,
  '管理状況': 19,
  '管理費等': 20,
  '駐車場': 21,
  '使用状況': 22,
  '占有者': 22,
  'その他事項': 23,
  '留意事項': 24
};

const CONTACT_KEY_PRIORITY: Record<string, number> = {
  'お問い合せ先': 1,
  '担当部署名': 2,
  '電話番号': 3,
  '内線': 4,
  '電話受付時間': 5,
  '郵便番号': 6,
  '所在地': 7
};

/**
 * Filters out raw technical keys and sorts data entries according to Japanese B2B domain standards.
 */
export function sortAndFormatSectionData(sectionTitle: string, rawDataDict: Record<string, string>): FormattedDataRow[] {
  if (!rawDataDict || typeof rawDataDict !== 'object') return [];

  // Filter out internal/technical keys
  const entries = Object.entries(rawDataDict).filter(([key, val]) => {
    if (!key) return false;
    if (['contact_url', 'nta_map_link', 'etax_link'].includes(key)) return false;
    // Hide BIT redundant empty entries
    if (key.includes('（現況）') && (!val || val.trim() === '' || val.trim() === '-')) return false;
    return true;
  });

  // Pick priority dictionary
  let priorityMap: Record<string, number> = {};
  const isDetails = sectionTitle.includes('詳細') || sectionTitle.includes('区分所有') || sectionTitle.includes('土地') || sectionTitle.includes('建物');
  const hasBuildingSpecs = Boolean(rawDataDict['構造（登記簿表示内容）'] || rawDataDict['床面積（登記簿表示内容）']);

  if (sectionTitle.includes('概況') || sectionTitle === 'Summary') {
    priorityMap = OVERVIEW_KEY_PRIORITY;
  } else if (isDetails) {
    priorityMap = DETAILS_KEY_PRIORITY;
  } else if (sectionTitle.includes('連絡先') || sectionTitle.includes('機関')) {
    priorityMap = CONTACT_KEY_PRIORITY;
  }

  entries.sort(([keyA], [keyB]) => {
    const pA = priorityMap[keyA] ?? 999;
    const pB = priorityMap[keyB] ?? 999;
    if (pA !== pB) return pA - pB;
    return keyA.localeCompare(keyB, 'ja');
  });

  return entries.map(([key, val]) => {
    let displayVal = val;
    // Resolve 種別 clash in multi-asset sales (一括換価)
    if (isDetails && hasBuildingSpecs && key === '種別' && (val === '土地' || val.trim() === '土地')) {
      displayVal = '土地・建物（一括換価）';
    }

    const { formatted, isParagraph } = formatJapaneseLegalText(key, displayVal);
    const isSpecial = ['見積価額', '売却基準価額', '買受可能価額', '公売保証金', '買受申出保証金', '使用状況', '一括換価について'].includes(key);
    return {
      key,
      value: formatted,
      isSpecial,
      isParagraph
    };
  });
}
