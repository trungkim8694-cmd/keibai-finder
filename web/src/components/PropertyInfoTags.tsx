import { type SharedProperty, getPropertyTypeColor } from '../types';
import { CourtContactLink } from './CourtContactLink';
import { AsyncStationInfo } from './AsyncStationInfo';
import { formatBidPeriod } from '../utils/dateFormatter';

interface InfoTagsProps {
  property: SharedProperty;
  displayArea?: string | null;
  children?: React.ReactNode;
  showCourtTag?: boolean;
}

export function PropertyInfoTags({ property, displayArea, children, showCourtTag = false }: InfoTagsProps) {
  let formattedArea = displayArea;

  let formattedSchedule = property.auctionSchedule || (property as any).extractedSchedule;
  if (!formattedSchedule && ((property as any).bid_start_date || (property as any).bid_end_date)) {
     formattedSchedule = formatBidPeriod((property as any).bid_start_date, (property as any).bid_end_date);
  }
  const rawData = (property as any).raw_display_data;

  // contact_url pre-extracted by server action; fallback to raw_display_data parsing for detail page
  let courtContactUrl: string | null = (property as any).contact_url || null;
  if (!courtContactUrl && rawData && Array.isArray(rawData)) {
    const summary = rawData.find((s: any) => s?.asset_title === 'Summary');
    if (summary?.data?.contact_url) courtContactUrl = summary.data.contact_url;
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

  // 1. Station label formatting
  const stationName = property.nearest_station;
  const walkTime = (property as any).walk_time_to_station;
  const lineName = (property as any).line_name;
  let staticStationLabel = null;
  if (stationName) {
    staticStationLabel = (lineName ? `${lineName} / ` : '') + (walkTime ? `${stationName} 徒歩${walkTime}分` : stationName);
  }

  return (
    <div className="flex flex-col gap-1 w-full pb-1">
      {/* Line 1: Type, Area, Round, Views */}
      <div className="flex flex-row flex-wrap items-center gap-1 w-full">
        <span className={`text-[10px] font-black border px-1 py-[1px] rounded-sm shrink-0 ${color.bg} ${color.text} ${color.border} inline-block dark:bg-opacity-20 leading-none`}>
          {typeLabel}
        </span>
        {formattedArea && formattedArea !== '0m²' && (
          <span className="text-[10px] font-bold border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1 py-[1px] rounded-sm shrink-0 inline-flex items-center gap-0.5 leading-none">
            <span className="text-[9px]">📐</span>
            <span>{formattedArea}</span>
          </span>
        )}
        {children || (
          <span className={`text-[10px] font-bold border px-1 py-[1px] rounded-sm shrink-0 inline-flex items-center justify-center ${roundColor} dark:bg-opacity-20 leading-none`}>
            {roundText}
          </span>
        )}
        <span className="text-[10px] font-bold border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 px-1 py-[1px] rounded-sm shrink-0 inline-flex items-center gap-0.5 leading-none ml-auto">
          <span className="text-[9px]">👁️</span>
          <span>{(property.views || 0).toLocaleString()}</span>
        </span>
      </div>

      {/* Line 2: Schedule & CourtTag */}
      {(formattedSchedule || showCourtTag) && (
        <div className="flex flex-row flex-wrap items-center gap-1 w-full">
          {formattedSchedule && (
            <span className="relative text-[10px] font-bold border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-1 py-[1px] rounded-sm shrink-0 inline-flex items-center gap-0.5 leading-none overflow-hidden">
              <span className="relative z-10 flex items-center gap-0.5">
                <span>{formattedSchedule}</span>
              </span>
              <span className={`absolute bottom-0 left-0 h-[2px] ${progressColor} transition-all duration-1000 z-0`} style={{ width: progressWidth }} />
            </span>
          )}
          {showCourtTag && property.source_provider === 'NTA' ? (
            <span className="text-[10px] font-bold border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-1 py-[1px] rounded-sm shrink-0 inline-flex items-center leading-none">
              <CourtContactLink
                courtName={property.managing_authority ? property.managing_authority.split('\n').join('').replace(/\s+/g, ' ').trim() : 'NTA 税務署'}
                contactUrl={property.contact_url || property.source_url}
                theme="red"
                className="text-[10px] font-bold"
              />
            </span>
          ) : showCourtTag && property.court_name && property.court_name !== 'Unknown' ? (
            <span className="text-[10px] font-bold border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 px-1 py-[1px] rounded-sm shrink-0 inline-flex items-center leading-none">
              <CourtContactLink
                courtName={property.court_name}
                contactUrl={courtContactUrl}
                className="text-[10px] font-bold text-blue-700 dark:text-blue-400"
              />
            </span>
          ) : null}
        </div>
      )}

      {/* Line 3: Station */}
      {(staticStationLabel || (property.lat && property.lng)) && (
        <div className="flex flex-row items-center w-full mt-0.5">
          <span className="text-[9px] font-bold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1 py-[1px] rounded-sm shrink-0 inline-flex items-center gap-0.5 leading-none w-max max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-emerald-700 dark:text-emerald-500 text-[9px] mr-1">🚉</span>
            <span>
               {staticStationLabel ? staticStationLabel : <AsyncStationInfo lat={property.lat} lng={property.lng} sale_unit_id={property.sale_unit_id} hideIfNoStation={true} />}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
