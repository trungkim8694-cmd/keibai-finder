const { Client } = require('pg');
const client = new Client(process.env.DATABASE_URL || "postgresql://keibai_user:keibai_password@localhost:5433/keibai_db");

async function geocodeOSM(address) {
  // Strip numbers (１７６番３７, 12番2, etc.) to get basic city/ward/chome for OSM
  const cleanAddress = address.replace(/[\s　]*[０-９0-9]+.*$/, '').trim();
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanAddress)}&format=json&limit=1`;
  
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'KeibaiFinder/1.1' } });
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch(e) {
    console.error("OSM Error:", e.message);
  }
  return { lat: null, lng: null };
}

async function geocodeYahooJapan(address) {
  // Fallback map query using external public scraping API (Yahoo Geocoder is robust in Japan without keys)
  const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 0 && data[0].geometry) {
       // GeoJSON coordinate order is [longitude, latitude]
       return { 
          lat: parseFloat(data[0].geometry.coordinates[1]), 
          lng: parseFloat(data[0].geometry.coordinates[0]) 
       };
    }
  } catch(e) {
     // fallback
  }
  return { lat: null, lng: null };
}

async function run() {
  await client.connect();
  const res = await client.query('SELECT sale_unit_id, prefecture, city, address FROM "Property" WHERE lat IS NULL');
  console.log(`Found ${res.rows.length} un-geocoded properties.`);
  
  for (const p of res.rows) {
    const fullAddress = `${p.prefecture || ''}${p.city || ''}${p.address || ''}`;
    
    // Attempt 1: Japan GSI API (Official Japanese Map API, amazing, free, no key needed!)
    let loc = await geocodeYahooJapan(fullAddress);
    
    if (!loc.lat) {
       // Attempt 2: Strip numbers and try GSI again
       const stripped = fullAddress.replace(/[\s　]*[０-９0-9]+.*$/, '').trim();
       loc = await geocodeYahooJapan(stripped);
    }
    
    if (!loc.lat) {
       // Attempt 3: OSM
       loc = await geocodeOSM(fullAddress);
    }
    
    if (loc.lat && loc.lng) {
      await client.query('UPDATE "Property" SET lat = $1, lng = $2 WHERE sale_unit_id = $3', [loc.lat, loc.lng, p.sale_unit_id]);
      process.stdout.write(`✅ ${fullAddress} -> ${loc.lat}, ${loc.lng}\n`);
    } else {
      process.stdout.write(`❌ Failed for ${fullAddress}\n`);
    }
    
    // GSI and OSM polite delay
    await new Promise(r => setTimeout(r, 1000));
  }
  
  await client.end();
  console.log("Done!");
}

run();
