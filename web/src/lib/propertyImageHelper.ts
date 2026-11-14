/**
 * Helper chuẩn hoá và xử lý thứ tự ảnh tài sản (Property Images & Thumbnail):
 * Quy tắc:
 * 1. Ảnh đại diện (thumbnailUrl) và ảnh hiển thị đầu tiên (images[0]) LUÔN là ảnh lấy từ nguồn về (BIT / NTA / KSI / etc.).
 * 2. Tiếp theo là các ảnh khác lấy từ nguồn.
 * 3. Sau đó mới đến các ảnh bóc tách từ tài liệu/PDF (VPS / Supabase / Cloudflare R2).
 * 4. Trừ khi tài sản KHÔNG có ảnh đại diện từ nguồn, mà có ảnh bóc tách thì mới lấy ảnh bóc tách làm ảnh đại diện & hiển thị đầu tiên.
 */

export function isExtractedImage(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.startsWith('/vps-images/') ||
    url.includes('/vps-images/') ||
    url.includes('r2.dev') ||
    url.includes('supabase.co')
  );
}

export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('./')) {
    return `https://www.koubai.nta.go.jp/auctionx/public${trimmed.substring(1)}`;
  }
  return trimmed.replace('bit.sikkou.jp', 'www.bit.courts.go.jp');
}

export interface ResolveImagesInput {
  thumbnailUrl?: string | null;
  images?: string[] | null;
  raw_display_data?: any;
  source_provider?: string | null;
}

export interface ResolveImagesResult {
  thumbnailUrl: string | null;
  images: string[];
}

export function resolvePropertyImages(property: ResolveImagesInput): ResolveImagesResult {
  if (!property) {
    return { thumbnailUrl: null, images: [] };
  }

  const collectedUrls: string[] = [];

  // 1. Thu thập từ raw_display_data (đặc biệt là section Summary chứa ảnh gốc cào từ BIT/web)
  if (property.raw_display_data) {
    try {
      const parsed = typeof property.raw_display_data === 'string' 
        ? JSON.parse(property.raw_display_data) 
        : property.raw_display_data;

      if (Array.isArray(parsed)) {
        // Ưu tiên section Summary trước
        const summarySec = parsed.find((s: any) => s && s.asset_title === 'Summary');
        if (summarySec && Array.isArray(summarySec.images)) {
          for (const img of summarySec.images) {
            if (typeof img === 'string') collectedUrls.push(img);
          }
        }
        for (const s of parsed) {
          if (s && s.asset_title !== 'Summary' && Array.isArray(s.images)) {
            for (const img of s.images) {
              if (typeof img === 'string') collectedUrls.push(img);
            }
          }
        }
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.images)) {
          for (const img of parsed.images) {
            if (typeof img === 'string') collectedUrls.push(img);
          }
        }
      }
    } catch {
      // Bỏ qua lỗi parse JSON
    }
  }

  // 2. Thu thập từ property.thumbnailUrl
  if (property.thumbnailUrl && typeof property.thumbnailUrl === 'string') {
    collectedUrls.push(property.thumbnailUrl);
  }

  // 3. Thu thập từ property.images
  if (property.images && Array.isArray(property.images)) {
    for (const img of property.images) {
      if (typeof img === 'string') collectedUrls.push(img);
    }
  }

  // 4. Chuẩn hoá, loại bỏ file PDF, dedup
  const uniqueUrls: string[] = [];
  const seen = new Set<string>();

  for (const raw of collectedUrls) {
    if (!raw) continue;
    const normalized = normalizeImageUrl(raw);
    if (!normalized || normalized.toLowerCase().endsWith('.pdf')) continue;
    if (!seen.has(normalized)) {
      seen.add(normalized);
      uniqueUrls.push(normalized);
    }
  }

  // 5. Phân tách thành: Ảnh nguồn gốc (sourceImages) vs Ảnh bóc tách từ PDF/VPS (extractedImages)
  const sourceImages: string[] = [];
  const extractedImages: string[] = [];

  for (const url of uniqueUrls) {
    if (isExtractedImage(url)) {
      extractedImages.push(url);
    } else {
      sourceImages.push(url);
    }
  }

  // 6. Xếp thứ tự theo chuẩn:
  // - Nếu có ảnh nguồn: ảnh nguồn xếp đầu tiên (index 0 làm thumbnail) -> tiếp theo là các ảnh nguồn khác -> sau đó là ảnh bóc tách
  // - Nếu không có ảnh nguồn: ảnh bóc tách được đưa lên đầu làm thumbnail
  let finalImages: string[] = [];
  let finalThumbnail: string | null = null;

  if (sourceImages.length > 0) {
    finalImages = [...sourceImages, ...extractedImages];
    finalThumbnail = sourceImages[0];
  } else if (extractedImages.length > 0) {
    finalImages = [...extractedImages];
    finalThumbnail = extractedImages[0];
  }

  return {
    thumbnailUrl: finalThumbnail,
    images: finalImages,
  };
}
