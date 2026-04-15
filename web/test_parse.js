const fs = require('fs');
const rawStr = `[{"data": {"contact_url": "https://www.bit.courts.go.jp/app/../info/info_38311.html", "入札期間": "令和08年04月27日 〜 令和08年05月08日"}, "images": ["https://www.bit.courts.go.jp/data/image/ASA_R07N01002_1_d.jpg"], "asset_type": "Summary", "asset_title": "Summary"}]`;
const rawObj = JSON.parse(rawStr);
let bitContactUrl = undefined;
if (Array.isArray(rawObj)) {
  const summary = rawObj.find((s) => s.asset_title === 'Summary');
  if (summary?.data?.contact_url) bitContactUrl = summary.data.contact_url;
}
console.log(bitContactUrl);
const match = bitContactUrl ? bitContactUrl.match(/info_([A-Za-z0-9_]+)\.html/) : null;
console.log(match ? match[1] : null);
