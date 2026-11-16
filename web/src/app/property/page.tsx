import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '競売・公売物件一覧 | Keibai Finder',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.keibai-koubai.com/map',
  },
};

export default function PropertyIndexPage() {
  permanentRedirect('/map');
}
