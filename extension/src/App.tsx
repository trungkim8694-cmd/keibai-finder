import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, AlertTriangle, TrendingDown, LineChart, ExternalLink, Shell, Droplets, Waves, MountainSnow, ShieldAlert, Globe, ChevronDown } from 'lucide-react';

interface HazardResult {
  flood: string;
  landslide: string;
  tsunami: string;
  storm_surge: string;
  shelter: string;
}

function App() {
  const { t, i18n } = useTranslation();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [hazardData, setHazardData] = useState<HazardResult | null>(null);

  const mapHazardValue = (val: string) => {
    if (!val) return val;
    if (val.includes("危険なし")) return t("hazard_safe");
    if (val.includes("未連携")) return t("hazard_nodata");
    if (val.includes("エラー")) return t("hazard_error");
    if (val.includes("浸水想定区域内")) return t("hazard_flood_zone");
    if (val.includes("土砂災害警戒区域内")) return t("hazard_landslide_zone");
    if (val.includes("土砂災害特別警戒区域内")) return t("hazard_landslide_special");
    if (val.includes("津波浸水想定区域内")) return t("hazard_tsunami_zone");
    return val;
  };

  useEffect(() => {
    // Lấy text bôi đen từ Tab hiện tại
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "GET_HIGHLIGHTED_TEXT" }, (response) => {
          if (chrome.runtime.lastError) {
             // Handle script not injected error silently
             console.log(chrome.runtime.lastError.message);
          } else if (response && response.text) {
             setAddress(response.text);
          }
        });
      }
    });
  }, []);

  const handleScan = async () => {
    const rawAddress = address.trim();
    if (!rawAddress) {
      setError(t("error_empty"));
      return;
    }

    setHasSearched(true);

    // Japanese Address Detail Validation: must contain hyphens, '番', '号', or digits after '丁目'
    const isDetailed = /[-\u2010-\u2015\uFF0D番号]/.test(rawAddress) || /丁目.*[0-9０-９]+/.test(rawAddress);
    
    if (!isDetailed) {
       setError(t("error_generic"));
       return;
    }
    
    setLoading(true);
    setError('');
    setHazardData(null);

    try {
      // 1. Geocoding (Quốc gia Nhật Bản - GSI API hoàn toàn miễn phí)
      const geoUrl = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (!geoData || geoData.length === 0) {
        throw new Error('Không tìm thấy tọa độ của địa chỉ này.');
      }

      const lng = geoData[0].geometry.coordinates[0];
      const lat = geoData[0].geometry.coordinates[1];

      // 2. Fetch Hazard Data từ máy chủ Vercel / Cloudflare
      const backendUrl = "https://www.keibai-koubai.com"; // Deploy production
      const targetUrl = `${backendUrl}/api/hazard-check?lat=${lat}&lng=${lng}`;
      
      const hazardRes = await fetch(targetUrl);
      const hazardJson = await hazardRes.json();
      
      setHazardData(hazardJson);

      // Async Telemetry Tracking (Fire and Forget)
      fetch(`${backendUrl}/api/extension-track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "scan_clicked",
          address: rawAddress,
          language: i18n.language
        })
      }).catch(e => console.log('Telemetry offline'));

    } catch (err: any) {
      setError(t("error_fetch"));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes("危険なし") || status.includes("Không có dữ liệu")) return "bg-green-100/50 text-emerald-800 border-green-200";
    if (status.includes("未連携") || status.includes("エラー")) return "bg-gray-100 border-gray-200 text-gray-500";
    return "bg-rose-100/50 text-red-800 border-rose-200";
  };

  const getStatusIconColor = (status: string) => {
    if (status.includes("危険なし") || status.includes("Không có dữ liệu")) return "text-emerald-500";
    if (status.includes("未連携") || status.includes("エラー")) return "text-gray-400";
    return "text-rose-500 animate-pulse";
  };

  return (
    <div className="w-[400px] min-h-[500px] flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-5 border-b border-white/50 bg-white/40 backdrop-blur-md relative z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Search className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">{t("app_name")}</h1>
          </div>
          <div className="flex items-center gap-2">
             <div className="relative group/lang cursor-pointer">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-full transition-colors">
                   <Globe className="w-3 h-3" />
                   {i18n.language === 'zh-CN' ? 'ZH' : i18n.language.toUpperCase()}
                   <ChevronDown className="w-3 h-3 opacity-50" />
                </div>
                <div className="absolute top-full right-0 mt-1 w-24 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover/lang:opacity-100 group-hover/lang:pointer-events-auto transition-all z-50 overflow-hidden">
                   <button onClick={() => i18n.changeLanguage('ja')} className={`w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-slate-50 ${i18n.language === 'ja' ? 'text-indigo-600' : 'text-slate-600'}`}>日本語</button>
                   <button onClick={() => i18n.changeLanguage('en')} className={`w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-slate-50 border-t border-slate-100 ${i18n.language === 'en' ? 'text-indigo-600' : 'text-slate-600'}`}>English</button>
                   <button onClick={() => i18n.changeLanguage('vi')} className={`w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-slate-50 border-t border-slate-100 ${i18n.language === 'vi' ? 'text-indigo-600' : 'text-slate-600'}`}>Tiếng Việt</button>
                   <button onClick={() => i18n.changeLanguage('zh-CN')} className={`w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-slate-50 border-t border-slate-100 ${i18n.language === 'zh-CN' ? 'text-indigo-600' : 'text-slate-600'}`}>中文 (简)</button>
                </div>
             </div>
             <span className="text-[10px] font-semibold tracking-widest text-indigo-600 uppercase bg-indigo-100/50 px-2 py-1 rounded-full border border-indigo-200/50">PRO</span>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <main className="flex-1 p-6 relative z-10 flex flex-col gap-6">
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {t("target_address_label")}
          </label>
          <div className="relative group">
            <textarea
              className="w-full h-20 px-4 py-3 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm group-hover:shadow-md text-sm text-slate-700 font-medium"
              placeholder={t("address_placeholder")}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          
          <button 
            onClick={handleScan}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-xl font-semibold shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Shell className="w-5 h-5" /> {t("scan_button")}
              </>
            )}
          </button>
          
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-sm animate-in fade-in zoom-in-95 duration-200">
               <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
               <p>{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="space-y-5 animate-in slide-in-from-bottom-4 fade-in duration-500">
            {/* Fake MLIT Teaser (Chim Mồi) */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3 shadow-sm relative overflow-hidden group">
              <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 transition-transform duration-500">
                <TrendingDown className="w-24 h-24 text-indigo-600" />
              </div>
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-indigo-50 relative z-10">
                 <TrendingDown className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="space-y-1 z-10">
                <h3 className="text-sm font-bold text-indigo-950">{t("keibai_teaser_title")}</h3>
                <p className="text-xs text-indigo-700/80 font-medium leading-relaxed">{t("keibai_teaser_desc")} <span className="font-bold text-rose-600 bg-rose-100 px-1 rounded inline-block">{t("keibai_teaser_highlight")}</span> {t("keibai_teaser_desc2")}</p>
                <a href={`https://www.keibai-koubai.com/features/trade-price-search?utm_source=keibai_lens_ext&utm_medium=popup_button&utm_campaign=keibai_teaser`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors mt-1 group-hover:underline">
                  {t("keibai_teaser_cta")} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* MLIT Valuation & Zoning Teaser */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3 shadow-sm relative overflow-hidden group">
              <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 transition-transform duration-500">
                <LineChart className="w-24 h-24 text-emerald-600" />
              </div>
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-emerald-50 relative z-10">
                 <LineChart className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-1 z-10">
                <h3 className="text-sm font-bold text-emerald-950">{t("mlit_teaser_title")}</h3>
                <p className="text-xs text-emerald-700/80 font-medium leading-relaxed">{t("mlit_teaser_desc")} <span className="font-bold text-emerald-700 bg-emerald-100/50 px-1 rounded inline-block">{t("mlit_teaser_highlight")}</span> {t("mlit_teaser_desc2")}</p>
                <a href={`https://www.keibai-koubai.com/trade-find?utm_source=keibai_lens_ext&utm_medium=popup_button&utm_campaign=mlit_teaser`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors mt-1 group-hover:underline">
                  {t("mlit_teaser_cta")} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Hazard Indicators */}
            {hazardData && (
              <div className="bg-white/60 backdrop-blur-md border border-white rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100/50">
               <div className="px-4 py-3 bg-white/40 flex items-center gap-2">
                 <ShieldAlert className="w-4 h-4 text-slate-500" />
                 <h3 className="text-xs font-bold text-slate-700 tracking-wider">{t("hazard_title")}</h3>
               </div>
               
               <div className="p-4 flex flex-col gap-3">
                  {/* Flood */}
                  <div className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${getStatusColor(hazardData.flood)}`}>
                     <Droplets className={`w-5 h-5 ${getStatusIconColor(hazardData.flood)}`} />
                     <div className="flex-1">
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-0.5">{t("flood_label")}</p>
                        <p className="text-sm font-bold">{mapHazardValue(hazardData.flood)}</p>
                     </div>
                  </div>

                  {/* Landslide */}
                  <div className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${getStatusColor(hazardData.landslide)}`}>
                     <MountainSnow className={`w-5 h-5 ${getStatusIconColor(hazardData.landslide)}`} />
                     <div className="flex-1">
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-0.5">{t("landslide_label")}</p>
                        <p className="text-sm font-bold">{mapHazardValue(hazardData.landslide)}</p>
                     </div>
                  </div>

                  {/* Tsunami */}
                  <div className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${getStatusColor(hazardData.tsunami)}`}>
                     <Waves className={`w-5 h-5 ${getStatusIconColor(hazardData.tsunami)}`} />
                     <div className="flex-1">
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-0.5">{t("tsunami_label")}</p>
                        <p className="text-sm font-bold">{mapHazardValue(hazardData.tsunami)}</p>
                     </div>
                  </div>
               </div>

               <div className="px-4 py-3 bg-slate-50/50 flex flex-col items-center gap-2 border-t border-slate-100/50">
                  <a href={`https://www.keibai-koubai.com/area-map?utm_source=keibai_lens_ext&utm_medium=popup_button&utm_campaign=map_teaser`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                     {t("map_link")} <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-[9px] text-slate-400 text-center leading-relaxed">
                     {t("disclaimer")}
                  </p>
               </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
