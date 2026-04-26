import { Metadata } from 'next';
// Since Next.js dynamic components need client boundary separation, 
// we'll create a simple client component to manage state between search and map.
import ClientWrapper from './ClientWrapper';
import { TradeSocialShare } from '@/components/Trade/TradeSocialShare';
import { PrintButton } from '@/components/PrintButton';

// Define Programmatic Metadata SEO
export async function generateMetadata({ params }: { params: { slug?: string[] } }): Promise<Metadata> {
  const region = params.slug ? params.slug.join(' ') : '全国';
  const prefix = region !== '全国' ? `${region}の` : '';
  
  return {
    metadataBase: new URL('https://keibaifinder.com'),
    title: `【登録不要】${prefix}不動産エリア分析マップ｜災害・都市計画・用途地域 (Keibai Finder)`,
    description: `登録不要で完全無料！${region}の住所を入力するだけで、洪水、土砂などの自然災害リスクと、都市計画・用途地域を1画面で一括確認できます。不動産投資やマイホーム購入前の物件調査に最適。`,
    keywords: `エリア分析, 用途地域, 都市計画, ハザードマップ, 住所検索, ${region}, 不動産, 災害リスク, 面倒な登録なし`,
    alternates: {
      canonical: params.slug ? `/area-map/${params.slug.join('/')}` : '/area-map',
    }
  };
}

export default function HazardMapPage({ params }: { params: { slug?: string[] } }) {
  const region = params.slug?.join(' ') || '全国';

  // Schema.org structured data (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "name": `全国不動産エリア分析マップ (${region})`,
        "url": "https://keibaifinder.com/area-map",
        "description": "住所を入力するだけで、自然災害リスクと都市計画情報を瞬時に可視化し、物件の資産価値と安全性を確認できる不動産プロフェッショナルツールです。",
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "JPY"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "このハザードマップのデータはどこから取得していますか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "本ツールは国土交通省および国土地理院がオープンデータとして提供している「重ねるハザードマップ」のシステムを利用しており、公式かつ最新のハザード情報をリアルタイムに反映しています。"
            }
          },
          {
            "@type": "Question",
            "name": "利用に会員登録や費用は必要ですか？",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "いいえ、完全無料で登録不要です。不動産の検討などで何度でも自由にご利用いただけます。"
            }
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "ホーム",
            "item": "https://keibaifinder.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "エリア分析マップ",
            "item": "https://keibaifinder.com/area-map"
          },
          ...(params.slug ? params.slug.map((slugPart, index) => ({
            "@type": "ListItem",
            "position": index + 3,
            "name": decodeURIComponent(slugPart),
            "item": `https://keibaifinder.com/area-map/${params.slug!.slice(0, index + 1).join('/')}`
          })) : [])
        ]
      }
    ]
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Programmatic SEO Text Block - Visually hidden but readable by Googlebot and Screen Readers */}
      <div className="sr-only">
        <h1>{region !== '全国' ? `${region}の` : ''}不動産エリア分析マップ（災害リスク・都市計画・用途地域）</h1>
        <p>
          {region !== '全国' ? `このページは${region}周辺の` : 'このページは日本全国の'}
          不動産情報を調査するための専門マップツールです。洪水浸水想定区域、土砂災害警戒区域、津波、高潮などの自然災害ハザードマップをはじめ、
          建蔽率（\%）や容積率（\%）を含む都市計画・用途地域情報を1つの地図上でシームレスに確認できます。
          不動産投資、マイホーム購入、土地の資産価値評価の前の地盤・環境調査として完全無料でご利用いただけます。面倒な会員登録は一切不要です。
        </p>
        <h2>{region}のハザードマップ（洪水・土砂・津波）</h2>
        <p>
          国土交通省および国土地理院の最新オープンデータ（重ねるハザードマップ）を活用し、{region}における水害や土砂崩れのリスク、指定緊急避難場所への距離と徒歩分数をAIが自動計算して提示します。
        </p>
        <h2>{region}の都市計画マップと用途地域</h2>
        <p>
          第一種低層住居専用地域から商業地域、工業地域まで、{region}の全13種類の地目を色分け表示。ワンクリックで対象地点の建ぺい率・容積率制限を解析します。
        </p>
        <h3>人気のエリア分析マップ</h3>
        <ul>
           <li><a href="/area-map/東京都">東京都のハザード・都市計画マップ</a></li>
           <li><a href="/area-map/神奈川県">神奈川県のハザード・都市計画マップ</a></li>
           <li><a href="/area-map/大阪府">大阪府のハザード・都市計画マップ</a></li>
           <li><a href="/area-map/愛知県">愛知県のハザード・都市計画マップ</a></li>
           <li><a href="/area-map/福岡県">福岡県のハザード・都市計画マップ</a></li>
           <li><a href="/area-map">全国のハザード・都市計画マップ一覧</a></li>
        </ul>
      </div>

      <ClientWrapper />
    </div>
  );
}
