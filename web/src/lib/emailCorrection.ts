/**
 * Email typo correction utility
 * Helps Japanese users catch common typos in major email domains
 */

const COMMON_DOMAINS: Record<string, string> = {
  // Gmail typos
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gemail.com': 'gmail.com',
  'gmaik.com': 'gmail.com',

  // Yahoo Japan typos
  'yaho.co.jp': 'yahoo.co.jp',
  'yahoo.ne.jp': 'yahoo.co.jp',
  'yahoo.com.jp': 'yahoo.co.jp',
  'yahoo.jp': 'yahoo.co.jp',
  'yhaoo.co.jp': 'yahoo.co.jp',
  'yaho.jp': 'yahoo.co.jp',

  // iCloud typos
  'icould.com': 'icloud.com',
  'iclud.com': 'icloud.com',
  'icoud.com': 'icloud.com',

  // Outlook / Hotmail typos
  'outlok.com': 'outlook.com',
  'outlok.jp': 'outlook.jp',
  'hotmial.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',

  // Japanese mobile carriers
  'docmo.ne.jp': 'docomo.ne.jp',
  'softbak.ne.jp': 'softbank.ne.jp',
  'ezweb.ne.com': 'ezweb.ne.jp',
  'ezwed.ne.jp': 'ezweb.ne.jp',
};

export function checkEmailTypo(email: string): string | null {
  if (!email || !email.includes('@')) return null;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return null;

  const [localPart, domainPart] = parts;
  if (!domainPart || !localPart) return null;

  if (COMMON_DOMAINS[domainPart]) {
    return `${localPart}@${COMMON_DOMAINS[domainPart]}`;
  }

  // Common TLD typos for Japanese .co.jp
  if (domainPart.endsWith('.co.jpp') || domainPart.endsWith('.co.pj')) {
    return `${localPart}@${domainPart.replace(/\.co\.(jpp|pj)$/, '.co.jp')}`;
  }

  return null;
}
