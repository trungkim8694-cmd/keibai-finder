'use client';

export default function imageLoader({ src, width, quality }: { src: string, width: number, quality?: number }) {
  // Bỏ qua nếu là hình ảnh base64 hoặc SVG
  if (src.startsWith('data:') || src.endsWith('.svg')) {
    return src;
  }

  // Bỏ qua đồ họa tĩnh nội bộ (trong thư mục /public)
  if (src.startsWith('/')) {
    return src;
  }

  // Định tuyến qua wsrn.nl proxy
  // output=webp sẽ tự động nén image thành WebP. Tốn 0 Đồng trên Cloudflare Fastly Edge.
  const urlParams = new URLSearchParams({
    url: src,
    w: width.toString(),
    q: (quality || 75).toString(),
    output: 'webp'
  });

  return `https://wsrv.nl/?${urlParams.toString()}`;
}
