/**
 * Keibai Lens - Cloudflare Worker Proxy
 * Nhiệm vụ: Đứng làm bia đỡ đạn (Proxy & Cache) cho Vercel. 
 * Nhận request từ Chrome Extension -> Check Cache -> Gọi lên MLIT / Vercel -> Trả về Extension
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // Xử lý CORS Preflight 
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Xác định đích đến (Vercel API)
    // Thay thế bằng domain thật của dự án: https://keibai-koubai.com
    const BACKEND_URL = "https://keibai-koubai.com";
    
    // Ví dụ: Nhận /api/hazard-check?lat=x&lng=y
    const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

    // Tạo request forward
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
    });

    // 1. Kiểm tra Cache trong Cloudflare (Tiết kiệm 90% resource)
    const cache = caches.default;
    let response = await cache.match(proxyRequest);

    if (!response) {
      // 2. Nếu không có cache, gọi về Vercel gốc
      response = await fetch(proxyRequest);

      // Clone response để thêm Header CORS và lưu Cache
      response = new Response(response.body, response);
      
      // Cache 24 tiếng (86400s) cho dữ liệu Địa lý
      response.headers.append("Cache-Control", "s-maxage=86400");
      
      // Lưu vào Cloudflare Cache (Không block request chính nhờ ctx.waitUntil)
      ctx.waitUntil(cache.put(proxyRequest, response.clone()));
    }

    // 3. Đảm bảo gắn Header CORS cho Extesnion đọc được
    const finalHeaders = new Headers(response.headers);
    finalHeaders.set("Access-Control-Allow-Origin", origin || "*");
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: finalHeaders
    });
  },
};
