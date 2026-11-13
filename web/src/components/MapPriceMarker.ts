import L from 'leaflet';
import { getSourceProviderMeta } from '@/lib/sourceProviderConfig';

export interface PropertyMarkerData {
  sale_unit_id: string;
  starting_price?: number | null;
  source_provider?: string | null;
  mlit_investment_gap?: number | null;
  property_type?: string | null;
  address?: string | null;
}

// Icon instance cache to prevent allocating thousands of DivIcon objects
const iconCache = new Map<string, L.DivIcon>();

/**
 * Format price for compact B2B map markers (e.g., 380万, 1,250万, 5億)
 */
export function formatMarkerPrice(startingPrice?: number | null): string {
  if (startingPrice === null || startingPrice === undefined || startingPrice <= 0) {
    return '未定';
  }
  const man = startingPrice / 10000;
  if (man >= 10000) {
    const oku = man / 10000;
    return `${oku.toFixed(1).replace(/\.0$/, '')}億`;
  }
  if (man >= 1000) {
    return `${Math.round(man).toLocaleString('en-US')}万`;
  }
  return `${Math.round(man)}万`;
}

/**
 * Create a crisp, high-density Japanese B2B Price Pill Marker (Zillow / SUUMO style)
 */
export function createPricePillIcon(property: PropertyMarkerData): L.DivIcon {
  const priceText = formatMarkerPrice(property.starting_price);
  const meta = getSourceProviderMeta(property.source_provider);
  const isHighGap = (property.mlit_investment_gap ?? 0) >= 20;
  
  const cacheKey = `${priceText}_${meta.id}_${isHighGap ? '1' : '0'}`;
  const cached = iconCache.get(cacheKey);
  if (cached) return cached;

  const bgClass = meta.markerBgClass;
  const arrowBorder = meta.markerArrowClass;
  const gapIndicator = isHighGap 
    ? '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white shadow-xs"></span>' 
    : '';

  const html = `
    <div class="price-marker-pill group relative flex flex-col items-center cursor-pointer transition-transform duration-150 pointer-events-auto select-none" data-marker-id="${property.sale_unit_id}">
      <div class="pill-badge relative px-1.5 py-0.5 rounded-sm shadow-md text-[11px] font-mono tabular-nums font-bold flex items-center justify-center border border-white/90 text-white whitespace-nowrap transition-colors duration-150 ${bgClass}">
        ${gapIndicator}
        <span class="leading-tight">${priceText}</span>
      </div>
      <div class="pill-arrow w-0 h-0 border-x-4 border-x-transparent border-t-[5px] ${arrowBorder} transition-colors duration-150 -mt-[0.5px]"></div>
    </div>
  `;

  const icon = L.divIcon({
    className: 'bg-transparent border-0',
    html,
    iconSize: [54, 22],
    iconAnchor: [27, 22],
    popupAnchor: [0, -22],
  });

  iconCache.set(cacheKey, icon);
  return icon;
}

/**
 * High-performance Leaflet MarkerCluster custom icon with corporate Navy theme
 */
export function createClusterCustomIcon(cluster: any): L.DivIcon {
  const count = cluster.getChildCount();
  let size = 36;
  let bgClass = 'bg-[#1B4F8A]';
  let ringClass = 'ring-2 ring-[#1B4F8A]/30';

  if (count >= 100) {
    size = 44;
    bgClass = 'bg-[#143D6C]';
    ringClass = 'ring-4 ring-[#143D6C]/30';
  } else if (count >= 30) {
    size = 40;
    bgClass = 'bg-[#18487E]';
    ringClass = 'ring-3 ring-[#18487E]/30';
  }

  const html = `
    <div class="flex items-center justify-center w-full h-full cursor-pointer select-none">
      <div class="${bgClass} ${ringClass} text-white font-mono tabular-nums font-bold text-xs rounded-full shadow-lg border-2 border-white flex items-center justify-center" style="width: ${size}px; height: ${size}px;">
        <span>${count.toLocaleString()}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'bg-transparent border-0',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Direct DOM highlighter to sync hover/click states with zero React re-render overhead
 */
export function syncHoveredMarkerDOM(
  map: L.Map | null,
  activeItemId: string | null,
  clickedItemId: string | null
) {
  if (!map) return;
  const targetId = activeItemId || clickedItemId ? String(activeItemId || clickedItemId) : null;

  const container = map.getContainer();
  if (!container) return;

  const markerPills = container.querySelectorAll<HTMLElement>('.price-marker-pill');
  markerPills.forEach(pill => {
    const markerId = pill.getAttribute('data-marker-id');
    const badge = pill.querySelector<HTMLElement>('.pill-badge');
    const arrow = pill.querySelector<HTMLElement>('.pill-arrow');

    if (!badge || !arrow) return;

    if (targetId && markerId === targetId) {
      pill.style.transform = 'scale(1.2) translateY(-3px)';
      pill.style.zIndex = '9999';
      badge.style.backgroundColor = '#EA580C'; // Vivid corporate Orange
      badge.style.borderColor = '#FFFFFF';
      badge.style.boxShadow = '0 6px 16px rgba(234, 88, 12, 0.45)';
      arrow.style.borderTopColor = '#EA580C';

      // Ensure parent leaflet marker has high z-index
      const parentMarker = pill.closest('.leaflet-marker-icon') as HTMLElement | null;
      if (parentMarker) parentMarker.style.zIndex = '9999';
    } else {
      pill.style.transform = '';
      pill.style.zIndex = '';
      badge.style.backgroundColor = '';
      badge.style.borderColor = '';
      badge.style.boxShadow = '';
      arrow.style.borderTopColor = '';

      const parentMarker = pill.closest('.leaflet-marker-icon') as HTMLElement | null;
      if (parentMarker) parentMarker.style.zIndex = '';
    }
  });
}
