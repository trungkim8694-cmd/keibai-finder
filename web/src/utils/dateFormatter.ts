import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const TOKYO_TZ = 'Asia/Tokyo';

/**
 * Format date standalone using UTC to prevent double-shifting by timezones.
 * Prisma treats Naive times as UTC, so we must just read it as UTC to get exactly what's in the DB.
 */
export function formatDateJapan(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  return dayjs.utc(date).format('YYYY年MM月DD日');
}

/**
 * Format bid period natively using dayjs
 */
export function formatBidPeriod(startDate: string | Date | null | undefined, endDate: string | Date | null | undefined): string | null {
  if (!startDate && !endDate) return null;

  let schedule = '';

  if (startDate && endDate) {
    const s = dayjs.utc(startDate);
    const e = dayjs.utc(endDate);
    schedule = `📅 ${s.month() + 1}/${s.date()} ~ ${e.month() + 1}/${e.date()}`;
  } else if (endDate) {
    const e = dayjs.utc(endDate);
    schedule = `📅 ~ ${e.month() + 1}/${e.date()}`;
  } else if (startDate) {
    const s = dayjs.utc(startDate);
    schedule = `📅 ${s.month() + 1}/${s.date()} ~`;
  }

  return schedule ? schedule : null;
}
