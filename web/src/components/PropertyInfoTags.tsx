import { type SharedProperty, getPropertyTypeColor } from '../types';
import { CourtContactLink } from './CourtContactLink';

interface InfoTagsProps {
  property: SharedProperty;
  displayArea?: string | null;
  children?: React.ReactNode;
  showCourtTag?: boolean;
}

export function PropertyInfoTags({ property, displayArea, children, showCourtTag = false }: InfoTagsProps) {
  let formattedArea = displayArea;

  let formattedSchedule = property.auctionSchedule || (property as any).extractedSchedule;
  const rawData = (property as any).raw_display_data;

  // contact_url pre-extracted by server action; fallback to raw_display_data parsing for detail page
  let courtContactUrl: string | null = (property as any).contact_url || null;
  if (!courtContactUrl && rawData && Array.isArray(rawData)) {
    const summary = rawData.find((s: any) => s?.asset_title === 'Summary');
    if (summary?.contact_url) courtContactUrl = summary.contact_url;
  }
  
  // Progress computation
  let progressWidth = '0%';
  let progressColor = 'bg-emerald-500';
  const endDateStr = (property as any).bid_end_date;
  if (endDateStr) {
      const now = new Date().getTime();
      const end = new Date(endDateStr).getTime();
      const created_at = (property as any).created_at;
      const start = created_at ? new Date(created_at).getTime() : end - (45 * 24 * 60 * 60 * 1000);
      
      const percent = Math.min(Math.max(((now - start) / (end - start)) * 100, 0), 100);
      progressWidth = `${percent}%`;
      
      const nowObj = new Date();
      nowObj.setHours(0, 0, 0, 0);
      const endObj = new Date(end);
      endObj.setHours(0, 0, 0, 0);
      const diffDays = Math.round((endObj.getTime() - nowObj.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) progressColor = 'bg-zinc-500';
      else if (diffDays <= 2) progressColor = 'bg-red-500 animate-pulse';
      else if (diffDays <= 5) progressColor = 'bg-amber-500';
  }

  let typeLabel = !property.property_type || property.property_type === 'Unknown' ? '種類不明' : property.property_type;
  
  // If normalized as その他 from NTA, display the true original label (like 山林, 原野)
  if (typeLabel === 'その他' && property.source_provider === 'NTA' && rawData) {
     try {
         const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
         if (parsed && typeof parsed === 'object') {
             const overview = parsed.overview || {};
             const rawName = overview["財産種別"] || overview["主たる地目"];
             if (rawName && typeof rawName === 'string' && rawName.length <= 15) {
                 typeLabel = rawName;
             }
         }
     } catch (e) {
         // ignore parsing error
     }
  }

  const color = getPropertyTypeColor(property.property_type || 'Unknown');
  const roundNum = property.auctionRound || 1;
  const roundText = roundNum === 1 ? '(初)' : `(${roundNum})`;
  const roundColor = roundNum === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:text-emerald-400' : 'bg-red-50 text-red-600 border-red-200 dark:text-red-400';

  return (
    <div className="flex flex-row flex-nowrap items-center gap-[6px] overflow-x-auto scrollbar-hide whitespace-nowrap w-full pb-1">
      <span className={`text-[11px] font-black border px-[6px] py-[2px] rounded-sm shrink-0 ${color.bg} ${color.text} ${color.border} inline-block dark:bg-opacity-20 leading-tight`}>
        {typeLabel}
      </span>
      {formattedArea && formattedArea !== '0m²' && (
        <span className="text-[11px] font-bold border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-[6px] py-[2px] rounded-sm shrink-0 inline-flex items-center gap-1 leading-tight">
          <span>📐</span>
          <span>{formattedArea}</span>
        </span>
      )}
      {formattedSchedule && (
        <span className="relative text-[11px] font-bold border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-[6px] py-[2px] rounded-sm shrink-0 inline-flex items-center gap-1 leading-tight overflow-hidden">
          <span className="relative z-10 flex items-center gap-1">
            <span>{formattedSchedule}</span>
          </span>
          <span className={`absolute bottom-0 left-0 h-[2px] ${progressColor} transition-all duration-1000 z-0`} style={{ width: progressWidth }} />
        </span>
      )}
      {showCourtTag && property.source_provider === 'NTA' ? (
        <span className="text-[11px] font-bold border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-[6px] py-[2px] rounded-sm shrink-0 inline-flex items-center leading-tight">
          <CourtContactLink
            courtName={property.managing_authority ? property.managing_authority.split('\n').join('').replace(/\s+/g, ' ').trim() : 'NTA 税務署'}
            contactUrl={property.contact_url || property.source_url}
            theme="red"
            className="text-[11px] font-bold"
          />
        </span>
      ) : showCourtTag && property.court_name && property.court_name !== 'Unknown' ? (
        <span className="text-[11px] font-bold border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 px-[6px] py-[2px] rounded-sm shrink-0 inline-flex items-center leading-tight">
          <CourtContactLink
            courtName={property.court_name}
            contactUrl={courtContactUrl}
            className="text-[11px] font-bold text-blue-700 dark:text-blue-400"
          />
        </span>
      ) : null}
      {children || (
        <span className={`text-[11px] font-bold border px-[6px] py-[2px] rounded-sm shrink-0 inline-block ${roundColor} dark:bg-opacity-20 leading-tight`}>
          {roundText}
        </span>
      )}
      <span className="text-[11px] font-bold border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 px-[6px] py-[2px] rounded-sm shrink-0 inline-flex items-center gap-1 leading-tight ml-auto">
        <span>👁️</span>
        <span>{(property.views || 0).toLocaleString()}</span>
      </span>
    </div>
  );
}
