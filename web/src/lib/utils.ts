// Shared utilities for Keibai Finder

export function extractTotalArea(rawDisplayData: any): number | null {
  if (!rawDisplayData) return null;
  try {
     let parsed = typeof rawDisplayData === 'string' ? JSON.parse(rawDisplayData) : rawDisplayData;
     if (typeof parsed === 'string') parsed = JSON.parse(parsed);

     let totalArea = 0;
     const checkValue = (k: string, v: string) => {
        if (k.includes('面積') && !k.includes('現況')) {
           // Parse "１６５．２９m 2" or "1500m2" to float
           const hw = v.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0)).replace(/[．]/g, '.');
           const m = hw.match(/([\d\.]+)/);
           if (m) {
             const area = parseFloat(m[1]);
             if (!isNaN(area)) totalArea += area;
           }
        }
     };

     if (Array.isArray(parsed)) {
       parsed.forEach((item: any) => {
          if (item.data) {
            Object.entries(item.data).forEach(([k, v]) => checkValue(k, String(v)));
          } else if (item.key) {
            checkValue(item.key, String(item.value));
          }
       });
     }
     return totalArea > 0 ? totalArea : null;
  } catch { return null; }
}


export function convertToWesternYear(jpDate: string | null | undefined): number {
  if (!jpDate) return 1990;
  
  const match = jpDate.match(/(昭和|平成|令和)(\d+|元)年/);
  if (!match) return 1990;
  
  const era = match[1];
  const yearStr = match[2];
  const yearNum = yearStr === '元' ? 1 : parseInt(yearStr, 10);
  
  if (era === '昭和') return 1925 + yearNum;
  if (era === '平成') return 1988 + yearNum;
  if (era === '令和') return 2018 + yearNum;
  
  return 1990;
}

export function extractAuctionSchedule(rawDisplayData: any): string | null {
  if (!rawDisplayData) return null;
  try {
     let parsed = typeof rawDisplayData === 'string' ? JSON.parse(rawDisplayData) : rawDisplayData;
     if (typeof parsed === 'string') parsed = JSON.parse(parsed);

     let schedule: string | null = null;
     const findSchedule = (val: string) => {
         const matches = val.match(/(\d+)月(\d+)日/g);
         if (matches) {
            if (matches.length >= 2) {
               const m1 = matches[0].match(/(\d+)月(\d+)日/);
               const m2 = matches[matches.length - 1].match(/(\d+)月(\d+)日/);
               if (m1 && m2) {
                   schedule = `${parseInt(m1[1], 10)}/${parseInt(m1[2], 10)} - ${parseInt(m2[1], 10)}/${parseInt(m2[2], 10)}`;
               }
            } else {
               const m1 = matches[0].match(/(\d+)月(\d+)日/);
               if (m1) {
                   schedule = `~ ${parseInt(m1[1], 10)}/${parseInt(m1[2], 10)}`;
               }
            }
        } else {
           schedule = val;
        }
     };

     if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
        const overview = parsed.overview || {};
        const periodStr = overview['入札期間'] || overview['特別売却期間'];
        if (periodStr) {
           const val = String(periodStr).replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
           const matches = val.match(/令和(\d+)年(\d+)月(\d+)日/g);
           if (matches && matches.length >= 2) {
              const m1 = matches[0].match(/令和(\d+)年(\d+)月(\d+)日/);
              const m2 = matches[matches.length - 1].match(/令和(\d+)年(\d+)月(\d+)日/);
              if (m1 && m2) {
                  schedule = `${parseInt(m1[2], 10)}/${parseInt(m1[3], 10)} - ${parseInt(m2[2], 10)}/${parseInt(m2[3], 10)}`;
              }
           } else {
               const singleMatch = val.match(/令和(\d+)年(\d+)月(\d+)日/);
               if (singleMatch) {
                   schedule = `~ ${parseInt(singleMatch[2], 10)}/${parseInt(singleMatch[3], 10)}`;
               }
           }
        }
        return schedule;
     }

     if (Array.isArray(parsed)) {
       parsed.forEach((item: any) => {
          if (item.data) {
             Object.entries(item.data).forEach(([k, v]) => {
                if (k.includes('入札期間') || k === '期間入札' || k.includes('特別売却期間') || k === '特別売却') findSchedule(String(v));
             });
          } else if (item.key && (item.key.includes('入札期間') || item.key === '期間入札' || item.key.includes('特別売却期間') || item.key === '特別売却')) {
             findSchedule(String(item.value));
          }
       });
     }
     return schedule;
  } catch { return null; }
}

export function extractAuctionEndDate(rawDisplayData: any): Date | null {
  if (!rawDisplayData) return null;
  try {
     let parsed = typeof rawDisplayData === 'string' ? JSON.parse(rawDisplayData) : rawDisplayData;
     if (typeof parsed === 'string') parsed = JSON.parse(parsed);

     let endDate: Date | null = null;
     const findEndDate = (val: string) => {
        // Expected val: "令和6年12月20日 から 令和7年1月7日"
        const matches = val.match(/(令和\d+年\d+月\d+日)/g);
        if (matches && matches.length >= 2) {
           const endStr = matches[matches.length - 1]; // "令和7年1月7日"
           const yearMatch = endStr.match(/令和(\d+)年(\d+)月(\d+)日/);
           if (yearMatch) {
              const year = 2018 + parseInt(yearMatch[1], 10);
              const month = parseInt(yearMatch[2], 10) - 1; // JS months are 0-indexed
              const day = parseInt(yearMatch[3], 10);
              endDate = new Date(year, month, day, 23, 59, 59);
           }
        }
     };

     if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
        const overview = parsed.overview || {};
        const periodStr = overview['入札期間'] || overview['特別売却期間'];
        if (periodStr) {
           findEndDate(String(periodStr).replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0)));
        }
        return endDate;
     }

     if (Array.isArray(parsed)) {
       parsed.forEach((item: any) => {
          if (item.data) {
             Object.entries(item.data).forEach(([k, v]) => {
                if (k.includes('入札期間') || k === '期間入札' || k.includes('特別売却期間') || k === '特別売却') findEndDate(String(v));
             });
          } else if (item.key && (item.key.includes('入札期間') || item.key === '期間入札' || item.key.includes('特別売却期間') || item.key === '特別売却')) {
             findEndDate(String(item.value));
          }
       });
     }
     return endDate;
  } catch { return null; }
}

export function extractAuctionRoundFromData(rawDisplayData: any): number {
  if (!rawDisplayData) return 1;
  try {
     let parsed = typeof rawDisplayData === 'string' ? JSON.parse(rawDisplayData) : rawDisplayData;
     if (typeof parsed === 'string') parsed = JSON.parse(parsed);

     let round = 1;
     const checkKey = (k: string, v: string) => {
        if (k.includes('回数')) {
           const hw = v.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
           const m = hw.match(/(\d+)/);
           if (m) {
             const r = parseInt(m[1]);
             if (r > round) round = r;
           }
        }
     };

     if (Array.isArray(parsed)) {
       parsed.forEach((item: any) => {
          if (item.data) {
            Object.entries(item.data).forEach(([k, v]) => checkKey(k, String(v)));
          } else if (item.key) {
            checkKey(item.key, String(item.value));
          }
       });
     }
     return round;
  } catch { return 1; }
}

export function calculateRoi(
  startingPrice: number | bigint | null | undefined,
  prefecture: string | null | undefined,
  westernYear: number,
  propertyType?: string | null
): number {
  if (!startingPrice) return 0;
  const price = Number(startingPrice);
  if (price <= 0) return 0;
  
  // Land logic (Capital Gain)
  const landTypes = ['土地', '山林', '農地', '宅地'];
  if (propertyType && landTypes.includes(propertyType)) {
    const highYieldPref = ['北海道', '青森県'];
    if (prefecture && highYieldPref.includes(prefecture)) {
       return 50; // Hokkaido/Aomori land discrepancy
    }
    return 20; // Urban land default discrepancy
  }
  
  // Residential logic (Yield)
  let adjustedYield = 10;
  const highYieldPref = ['北海道', '青森県'];
  
  if (prefecture && highYieldPref.includes(prefecture)) {
    adjustedYield = 15;
  } else if (prefecture === '東京都') {
    adjustedYield = 5;
  }
  
  // Adjust by Build Year (Kyushin vs Shin-Taishin)
  if (westernYear < 1981) {
    adjustedYield += 5; // Older building = cheaper = higher yield
  } else if (westernYear >= 2010) {
    adjustedYield -= 2; // Newer building = expensive = lower yield
  }
  
  // Mathematical reduction of: ((BasePrice * 1.3 * (Yield/100)) / (BasePrice * 1.3)) * 100
  return adjustedYield;
}

export function cleanAddress(address: string | null | undefined, prefecture?: string | null, city?: string | null): string {
  if (!address || address === 'Unknown') return '住所不明';
  
  let result = address.trim();
  
  // Use known prefecture and city if provided to strip duplicated prefixes
  if (prefecture && city) {
    const fullPrefix = prefecture + city;
    while (result.startsWith(prefecture) || result.startsWith(city) || result.startsWith(fullPrefix)) {
       if (result.startsWith(fullPrefix)) result = result.substring(fullPrefix.length).trim();
       else if (result.startsWith(prefecture)) result = result.substring(prefecture.length).trim();
       else if (result.startsWith(city)) result = result.substring(city.length).trim();
    }
    return `${prefecture}${city}${result}`;
  }
  
  // Heuristic regex to find Prefecture + City
  const match = result.match(/^(.+?[都道府県])\s*(.+?[市区町村])/);
  if (match) {
    const pref = match[1].trim();
    const cty = match[2].trim();
    const full = pref + cty;
    
    let sub = result.substring(match[0].length).trim();
    while (sub.startsWith(pref) || sub.startsWith(cty) || sub.startsWith(full)) {
       if (sub.startsWith(full)) sub = sub.substring(full.length).trim();
       else if (sub.startsWith(pref)) sub = sub.substring(pref.length).trim();
       else if (sub.startsWith(cty)) sub = sub.substring(cty.length).trim();
    }
    return `${pref} ${cty}${sub}`;
  }

  // Handle just Prefecture case (e.g. Tokyo-to followed by Tokyo-to)
  const prefMatch = result.match(/^(.+?[都道府県])/);
  if (prefMatch) {
     const pref = prefMatch[1].trim();
     let sub = result.substring(prefMatch[0].length).trim();
     while (sub.startsWith(pref)) {
        sub = sub.substring(pref.length).trim();
     }
     return `${pref} ${sub}`;
  }
  
  return result;
}
