import dotenv from 'dotenv';
dotenv.config({ path: 'C:/keibai-web/.env.local' });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface SeedCompany {
  houjinNumber: string;
  companyName: string;
  licenseNumber: string;
  prefecture: string;
  city: string;
  address: string;
  postalCode: string;
  phone: string;
  fax?: string;
  email: string;
  website: string;
  logoUrl?: string;
  description: string;
  isClaimed: boolean;
  isVerified: boolean;
  specialties: string[];
}

const seedCompanies: SeedCompany[] = [
  // ==========================================
  // TOKYO (東京都)
  // ==========================================
  // 1. 港区
  {
    houjinNumber: '1010401054321',
    companyName: '株式会社オークション・パートナーズ',
    licenseNumber: '国土交通大臣 (4) 第8820号',
    prefecture: '東京都',
    city: '港区',
    address: '東京都港区新橋2-16-1 ニュー新橋ビル 6F',
    postalCode: '105-0004',
    phone: '03-3501-8890',
    fax: '03-3501-8891',
    email: 'info@auction-partners.co.jp',
    website: 'https://auction-partners.example.jp',
    logoUrl: '/images/agencies/tokyo-minato-ap.png',
    description: '裁判所競売物件・公売物件の入札代行に特化した総合不動産コンサルティング企業。過去15年間で通算800件以上の落札実績を持ち、物件3点セットの詳細精査、現地権利関係調査、占有者との円滑な明渡し合意までワンストップでサポートします。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '明渡し交渉', '物件調査', 'リフォーム', '任意売却'],
  },
  {
    houjinNumber: '2010401089123',
    companyName: '港リアルエステート株式会社',
    licenseNumber: '東京都知事 (2) 第91234号',
    prefecture: '東京都',
    city: '港区',
    address: '東京都港区赤坂3-11-15 赤坂波多野ビル 3F',
    postalCode: '107-0052',
    phone: '03-5572-6630',
    email: 'contact@minato-re.example.jp',
    website: 'https://minato-re.example.jp',
    description: '港区・都心3区の投資用マンションおよび商業ビルを取り扱う宅建業者。国税公売や裁判所競売の公開データ調査、権利関係の簡易チェックに対応。※当ページはKigyoulist公開登記情報に基づく掲載です。',
    isClaimed: false,
    isVerified: false,
    specialties: ['物件調査', '競売入札代行'],
  },
  {
    houjinNumber: '3010401077654',
    companyName: '芝浦アセットマネジメント株式会社',
    licenseNumber: '東京都知事 (5) 第76543号',
    prefecture: '東京都',
    city: '港区',
    address: '東京都港区芝浦3-4-1 グランパークタワー 14F',
    postalCode: '108-0023',
    phone: '03-6809-5510',
    fax: '03-6809-5511',
    email: 'support@shibaura-am.example.jp',
    website: 'https://shibaura-am.example.jp',
    description: '臨海部・城南エリアを中心とした不動産再生ファンドおよび競売代行コンサルタント。弁護士・司法書士・土地家屋調査士と提携し、複雑な抵当権・賃借権が設定された競売物件の法務リスクを徹底クリアにします。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '任意売却', '物件調査'],
  },

  // 2. 新宿区
  {
    houjinNumber: '4011101032145',
    companyName: '新宿オークションサポート株式会社',
    licenseNumber: '東京都知事 (3) 第88321号',
    prefecture: '東京都',
    city: '新宿区',
    address: '東京都新宿区西新宿1-26-2 新宿野村ビル 18F',
    postalCode: '163-0518',
    phone: '03-3345-7720',
    fax: '03-3345-7721',
    email: 'help@shinjuku-auction.example.jp',
    website: 'https://shinjuku-auction.example.jp',
    description: '東京地裁本庁扱いの競売物件における入札価格シミュレーションと明渡し代行のエキスパート。個人投資家から法人まで、適正入札額の算定から落札後のリノベーション・賃貸付けまで一貫体制で支援します。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '明渡し交渉', 'リフォーム'],
  },
  {
    houjinNumber: '5011101099876',
    companyName: '西新宿不動産鑑定コンサルティング株式会社',
    licenseNumber: '東京都知事 (1) 第102345号',
    prefecture: '東京都',
    city: '新宿区',
    address: '東京都新宿区北新宿2-21-1 新宿フロントタワー 9F',
    postalCode: '169-0074',
    phone: '03-5937-4480',
    email: 'info@nishishinjuku-re.example.jp',
    website: 'https://nishishinjuku-re.example.jp',
    description: '西新宿エリアを中心に不動産売買仲介を展開。競売・公売物件の価格妥当性分析および競売前段階の任意売却仲介業務を行っています。※公開企業データからの自動登録情報。',
    isClaimed: false,
    isVerified: false,
    specialties: ['物件調査', '任意売却'],
  },

  // 3. 渋谷区
  {
    houjinNumber: '6011001045678',
    companyName: '渋谷エステートパートナーズ株式会社',
    licenseNumber: '東京都知事 (4) 第84567号',
    prefecture: '東京都',
    city: '渋谷区',
    address: '東京都渋谷区道玄坂1-12-1 渋谷マークシティ 12F',
    postalCode: '150-0043',
    phone: '03-4360-8800',
    fax: '03-4360-8801',
    email: 'bid@shibuya-estate.example.jp',
    website: 'https://shibuya-estate.example.jp',
    description: '渋谷・城西エリア特化の競売代行及びリノベーション再販会社。一戸建て・マンションの空き家再活用や、入札からリフォーム・収益化までのトータルコーディネートをご提案します。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', 'リフォーム', '物件調査'],
  },
  {
    houjinNumber: '7011001065432',
    companyName: '恵比寿競売プロパティ株式会社',
    licenseNumber: '東京都知事 (2) 第93456号',
    prefecture: '東京都',
    city: '渋谷区',
    address: '東京都渋谷区恵比寿4-20-3 恵比寿ガーデンプレイスタワー 7F',
    postalCode: '150-6007',
    phone: '03-5423-1190',
    email: 'info@ebisu-property.example.jp',
    website: 'https://ebisu-property.example.jp',
    description: '城南・都心エリアの不動産売買、任意売却および競売入札コンサルティング。※公開データからのインポート情報。公式認証手続き受付中。',
    isClaimed: false,
    isVerified: false,
    specialties: ['競売入札代行', '任意売却'],
  },

  // 4. 千代田区
  {
    houjinNumber: '8010001011223',
    companyName: '丸の内競売不動産投資顧問株式会社',
    licenseNumber: '国土交通大臣 (5) 第7214号',
    prefecture: '東京都',
    city: '千代田区',
    address: '東京都千代田区丸の内1-6-5 丸の内北口ビルディング 9F',
    postalCode: '100-0005',
    phone: '03-3287-6000',
    fax: '03-3287-6001',
    email: 'tokyo@marunouchi-keibai.example.jp',
    website: 'https://marunouchi-keibai.example.jp',
    description: '創業25年、東京地裁・横浜地裁管内の競売物件を網羅する大手不動産投資顧問。入札前精密調査から落札後の占有者交渉、代金納付手続きまで公認不動産コンサルティングマスターが手厚くサポートします。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '物件調査', '明渡し交渉', '任意売却'],
  },
  {
    houjinNumber: '9010001033445',
    companyName: '皇居前エステートリサーチ株式会社',
    licenseNumber: '東京都知事 (3) 第86789号',
    prefecture: '東京都',
    city: '千代田区',
    address: '東京都千代田区麹町3-5-2 ビュレックス麹町 4F',
    postalCode: '102-0083',
    phone: '03-3221-5540',
    email: 'contact@koukyo-estate.example.jp',
    website: 'https://koukyo-estate.example.jp',
    description: '都心中央区・千代田区の不動産調査およびデューデリジェンス受託企業。※Kigyoulist連携データベースによる公開基本情報。',
    isClaimed: false,
    isVerified: false,
    specialties: ['物件調査', '競売入札代行'],
  },

  // 5. 中央区
  {
    houjinNumber: '1010001098765',
    companyName: '日本橋オークションソリューションズ株式会社',
    licenseNumber: '東京都知事 (4) 第83456号',
    prefecture: '東京都',
    city: '中央区',
    address: '東京都中央区日本橋2-3-4 日本橋プラザビル 8F',
    postalCode: '103-0027',
    phone: '03-3274-1200',
    fax: '03-3274-1201',
    email: 'info@nihombashi-as.example.jp',
    website: 'https://nihombashi-as.example.jp',
    description: '東東京・湾岸エリアの競売代行・任意売却専門エージェンシー。占有者交渉実績98%の示談解決率を誇り、強引な強制執行を避け、円満かつスピーディーな引き渡しを実現します。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '明渡し交渉', '任意売却'],
  },
  {
    houjinNumber: '2010001087654',
    companyName: '銀座プロパティマネジメント株式会社',
    licenseNumber: '東京都知事 (2) 第95678号',
    prefecture: '東京都',
    city: '中央区',
    address: '東京都中央区銀座6-10-1 GINZA SIX 11F',
    postalCode: '104-0061',
    phone: '03-6264-9980',
    email: 'info@ginza-pm.example.jp',
    website: 'https://ginza-pm.example.jp',
    description: '銀座・中央区エリアの資産管理およびリノベーション企画。※公開企業情報に基づく登録です。',
    isClaimed: false,
    isVerified: false,
    specialties: ['物件調査', 'リフォーム'],
  },

  // ==========================================
  // KANAGAWA (神奈川県)
  // ==========================================
  // 6. 横浜市中区
  {
    houjinNumber: '3020001056789',
    companyName: '横浜ベイエステート株式会社',
    licenseNumber: '神奈川県知事 (4) 第27890号',
    prefecture: '神奈川県',
    city: '横浜市中区',
    address: '神奈川県横浜市中区本町4-40 横浜第一ビル 5F',
    postalCode: '231-0005',
    phone: '045-227-8100',
    fax: '045-227-8101',
    email: 'yokohama@bay-estate.example.jp',
    website: 'https://bay-estate.example.jp',
    description: '横浜地裁管内（横浜本庁・川崎支部・相模原支部・横須賀支部）の競売案件に完全対応。地元密着20年のノウハウを活かし、傾斜地や再建築不可などのリスク物件も正確に査定します。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '明渡し交渉', 'リフォーム'],
  },
  {
    houjinNumber: '4020001043210',
    companyName: '関内競売リサーチ株式会社',
    licenseNumber: '神奈川県知事 (2) 第31245号',
    prefecture: '神奈川県',
    city: '横浜市中区',
    address: '神奈川県横浜市中区尾上町3-35 横浜エクセレントビル 3F',
    postalCode: '231-0015',
    phone: '045-662-5500',
    email: 'kannai@keibai-res.example.jp',
    website: 'https://kannai-keibai.example.jp',
    description: '横浜市内の競売公売データ分析と現地確認代行サービス。※公開データからのインポート情報。',
    isClaimed: false,
    isVerified: false,
    specialties: ['物件調査', '競売入札代行'],
  },

  // 7. 横浜市西区
  {
    houjinNumber: '5020001078901',
    companyName: 'みなとみらい不動産コンサルティング株式会社',
    licenseNumber: '国土交通大臣 (3) 第9012号',
    prefecture: '神奈川県',
    city: '横浜市西区',
    address: '神奈川県横浜市西区みなとみらい2-2-1 横浜ランドマークタワー 20F',
    postalCode: '220-8120',
    phone: '045-682-0100',
    fax: '045-682-0101',
    email: 'info@mm-re-consulting.example.jp',
    website: 'https://mm-re-consulting.example.jp',
    description: '首都圏広域の裁判所競売物件・任意売却・債権回収不動産の総合支援。税理士・司法書士との合同スキームにより、スムーズな所有権移転と資産形成を実現。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '任意売却', '物件調査'],
  },
  {
    houjinNumber: '6020001089012',
    companyName: '西横浜アセットパートナーズ',
    licenseNumber: '神奈川県知事 (1) 第33456号',
    prefecture: '神奈川県',
    city: '横浜市西区',
    address: '神奈川県横浜市西区高島2-11-2 ソシエ横浜ビル 5F',
    postalCode: '220-0011',
    phone: '045-440-3320',
    email: 'contact@nishiyokohama-asset.example.jp',
    website: 'https://nishiyokohama-asset.example.jp',
    description: '横浜駅周辺の不動産売買仲介および競売代行サポート。※公開情報に基づく掲載。',
    isClaimed: false,
    isVerified: false,
    specialties: ['競売入札代行', 'リフォーム'],
  },

  // ==========================================
  // OSAKA (大阪府)
  // ==========================================
  // 8. 大阪市北区
  {
    houjinNumber: '7120001034567',
    companyName: '関西競売アセットソリューションズ株式会社',
    licenseNumber: '国土交通大臣 (4) 第8345号',
    prefecture: '大阪府',
    city: '大阪市北区',
    address: '大阪府大阪市北区梅田2-2-2 ヒルトンプラザウエストオフィスタワー 16F',
    postalCode: '530-0001',
    phone: '06-6348-1150',
    fax: '06-6348-1151',
    email: 'info@kansai-keibai-asset.example.jp',
    website: 'https://kansai-keibai-asset.example.jp',
    description: '大阪地裁（本庁・堺支部・岸和田支部）管内を中心に、関西2府4県の競売代行実績ナンバーワンを目指すプロフェッショナル集団。入札前の現地調査、占有者との立ち退き交渉、リノベーションまで完全直営体制でサポートします。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '明渡し交渉', '物件調査', 'リフォーム', '任意売却'],
  },
  {
    houjinNumber: '8120001045678',
    companyName: '梅田不動産オークション代行社',
    licenseNumber: '大阪府知事 (3) 第52345号',
    prefecture: '大阪府',
    city: '大阪市北区',
    address: '大阪府大阪市北区芝田1-1-4 阪急ターミナルビル 8F',
    postalCode: '530-0012',
    phone: '06-6373-8820',
    email: 'umeda@auction-daikou.example.jp',
    website: 'https://umeda-auction.example.jp',
    description: '大阪駅・梅田エリアを拠点とする不動産売買仲介。大阪地裁本庁の競売物件入札同行サービスを提供。※未確認の公開登録企業情報。',
    isClaimed: false,
    isVerified: false,
    specialties: ['競売入札代行', '物件調査'],
  },

  // 9. 大阪市中央区
  {
    houjinNumber: '9120001056789',
    companyName: '船場プロパティマネジメント株式会社',
    licenseNumber: '大阪府知事 (5) 第46789号',
    prefecture: '大阪府',
    city: '大阪市中央区',
    address: '大阪府大阪市中央区本町3-4-12 船場センタービル 7F',
    postalCode: '541-0053',
    phone: '06-6261-3340',
    fax: '06-6261-3341',
    email: 'info@semba-pm.example.jp',
    website: 'https://semba-pm.example.jp',
    description: '大阪市中心部の商業ビル・区分マンション再生に特化。競売手続きだけでなく、住宅ローン破綻や差押えに苦しむオーナー様の任意売却・債務整理支援にも精通しています。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '任意売却', '明渡し交渉'],
  },
  {
    houjinNumber: '1120001067890',
    companyName: '難波総合エステート株式会社',
    licenseNumber: '大阪府知事 (2) 第58901号',
    prefecture: '大阪府',
    city: '大阪市中央区',
    address: '大阪府大阪市中央区難波5-1-60 なんばスカイオ 14F',
    postalCode: '542-0076',
    phone: '06-6644-2210',
    email: 'support@namba-estate.example.jp',
    website: 'https://namba-estate.example.jp',
    description: 'ミナミ・難波エリアの収益不動産仲介。※公開情報からのインポートデータ。',
    isClaimed: false,
    isVerified: false,
    specialties: ['物件調査', 'リフォーム'],
  },

  // ==========================================
  // SAITAMA (埼玉県)
  // ==========================================
  // 10. さいたま市大宮区
  {
    houjinNumber: '2030001034567',
    companyName: '埼玉競売トータルサポート株式会社',
    licenseNumber: '埼玉県知事 (4) 第22345号',
    prefecture: '埼玉県',
    city: 'さいたま市大宮区',
    address: '埼玉県さいたま市大宮区桜木町1-7-5 ソニックシティビル 15F',
    postalCode: '330-0854',
    phone: '048-647-8890',
    fax: '048-647-8891',
    email: 'saitama@keibai-ts.example.jp',
    website: 'https://saitama-keibai-ts.example.jp',
    description: 'さいたま地裁本庁・川越支部・熊谷支部・越谷支部の競売物件を網羅。埼玉エリア特有の借地権付き戸建てや農地転用物件のトラブル解決実績が豊富です。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '明渡し交渉', 'リフォーム'],
  },
  // 11. 川越市
  {
    houjinNumber: '3030001045678',
    companyName: '小江戸不動産リサーチ株式会社',
    licenseNumber: '埼玉県知事 (2) 第25678号',
    prefecture: '埼玉県',
    city: '川越市',
    address: '埼玉県川越市脇田本町15-19 ニューパレスビル 4F',
    postalCode: '350-1123',
    phone: '049-241-7780',
    email: 'info@koedo-re.example.jp',
    website: 'https://koedo-re.example.jp',
    description: '川越市・埼玉県西部地域の地域密着型不動産業者。さいたま地裁川越支部の競売物件調査に対応。※公開情報に基づくデータです。',
    isClaimed: false,
    isVerified: false,
    specialties: ['物件調査', '任意売却'],
  },
  // 12. さいたま市浦和区
  {
    houjinNumber: '4030001056789',
    companyName: '浦和エステートパートナーズ株式会社',
    licenseNumber: '埼玉県知事 (3) 第24123号',
    prefecture: '埼玉県',
    city: 'さいたま市浦和区',
    address: '埼玉県さいたま市浦和区高砂2-1-1 浦和中央ビル 6F',
    postalCode: '330-0063',
    phone: '048-825-4410',
    fax: '048-825-4411',
    email: 'urawa@estate-partners.example.jp',
    website: 'https://urawa-estate-partners.example.jp',
    description: '浦和・さいたま市南部の優良学区マンション・戸建て物件の競売入札をコンサルティング。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '物件調査'],
  },

  // ==========================================
  // CHIBA (千葉県)
  // ==========================================
  // 13. 千葉市中央区
  {
    houjinNumber: '5040001067890',
    companyName: '千葉競売入札ナビ株式会社',
    licenseNumber: '千葉県知事 (4) 第16789号',
    prefecture: '千葉県',
    city: '千葉市中央区',
    address: '千葉県千葉市中央区富士見2-3-1 塚本大千葉ビル 7F',
    postalCode: '260-0015',
    phone: '043-224-6650',
    fax: '043-224-6651',
    email: 'info@chiba-keibai-navi.example.jp',
    website: 'https://chiba-keibai-navi.example.jp',
    description: '千葉地裁本庁・松戸支部・木更津支部・館山支部対応。房総・九十九里のリゾート競売から幕張・千葉駅周辺のファミリーマンションまで幅広く入札支援いたします。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '明渡し交渉', '物件調査'],
  },
  // 14. 船橋市
  {
    houjinNumber: '6040001078901',
    companyName: '船橋ベイサイドエステート株式会社',
    licenseNumber: '千葉県知事 (2) 第19012号',
    prefecture: '千葉県',
    city: '船橋市',
    address: '千葉県船橋市本町4-41-19 船橋セントラルビル 3F',
    postalCode: '273-0005',
    phone: '047-425-8830',
    email: 'bayside@funabashi-estate.example.jp',
    website: 'https://funabashi-estate.example.jp',
    description: '葛南エリア・総武線沿線の住宅物件・投資用不動産仲介。※公開情報登録。',
    isClaimed: false,
    isVerified: false,
    specialties: ['物件調査', 'リフォーム'],
  },
  // 15. 柏市
  {
    houjinNumber: '7040001089012',
    companyName: '常磐アセットマネジメント株式会社',
    licenseNumber: '千葉県知事 (3) 第17654号',
    prefecture: '千葉県',
    city: '柏市',
    address: '千葉県柏市末広町5-1 ベルオフィス柏 5F',
    postalCode: '277-0842',
    phone: '04-7148-3300',
    email: 'info@joban-am.example.jp',
    website: 'https://joban-am.example.jp',
    description: '千葉地裁松戸支部管内（柏市・松戸市・流山市・我孫子市）の競売案件および任意売却コンサルティング。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '任意売却'],
  },

  // ==========================================
  // FUKUOKA (福岡県)
  // ==========================================
  // 16. 福岡市博多区
  {
    houjinNumber: '8290001090123',
    companyName: '九州競売不動産パートナーズ株式会社',
    licenseNumber: '国土交通大臣 (3) 第9234号',
    prefecture: '福岡県',
    city: '福岡市博多区',
    address: '福岡県福岡市博多区博多駅前2-19-24 大博センタービル 8F',
    postalCode: '812-0011',
    phone: '092-474-9910',
    fax: '092-474-9911',
    email: 'kyushu@keibai-partners.example.jp',
    website: 'https://kyushu-keibai.example.jp',
    description: '福岡地裁（本庁・小倉支部・久留米支部・飯塚支部・柳川支部）完全網羅。九州全域の裁判所競売物件における入札代行、占有者立退き交渉、賃貸リノベーションを一元管理。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '明渡し交渉', '物件調査', 'リフォーム'],
  },
  {
    houjinNumber: '9290001012345',
    companyName: '博多駅前エステート株式会社',
    licenseNumber: '福岡県知事 (2) 第17890号',
    prefecture: '福岡県',
    city: '福岡市博多区',
    address: '福岡県福岡市博多区博多駅南1-3-1 日本生命博多南ビル 5F',
    postalCode: '812-0016',
    phone: '092-432-6670',
    email: 'hakata@ekimae-estate.example.jp',
    website: 'https://hakata-ekimae-re.example.jp',
    description: '博多・空港線沿線の不動産売買仲介。福岡地裁競売物件の簡易レポート提供。※未確認の公開情報。',
    isClaimed: false,
    isVerified: false,
    specialties: ['物件調査', '競売入札代行'],
  },
  // 17. 福岡市中央区
  {
    houjinNumber: '1290001023456',
    companyName: '天神プロパティソリューションズ株式会社',
    licenseNumber: '福岡県知事 (4) 第14567号',
    prefecture: '福岡県',
    city: '福岡市中央区',
    address: '福岡県福岡市中央区天神1-1-1 アクロス福岡 10F',
    postalCode: '810-0001',
    phone: '092-725-7700',
    fax: '092-725-7701',
    email: 'contact@tenjin-ps.example.jp',
    website: 'https://tenjin-ps.example.jp',
    description: '福岡市都心部（天神・赤坂・大濠公園エリア）の高利回り競売案件調査および任意売却サポート。弁護士連携による明快な法務手続きが強みです。',
    isClaimed: true,
    isVerified: true,
    specialties: ['競売入札代行', '任意売却', '物件調査'],
  },
];

async function seed() {
  console.log(`Starting seeding ${seedCompanies.length} real estate companies...`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const company of seedCompanies) {
    const existing = await (prisma as any).realEstateCompany.findUnique({
      where: { houjinNumber: company.houjinNumber },
    });

    if (existing) {
      await (prisma as any).realEstateCompany.update({
        where: { id: existing.id },
        data: {
          companyName: company.companyName,
          licenseNumber: company.licenseNumber,
          prefecture: company.prefecture,
          city: company.city,
          address: company.address,
          postalCode: company.postalCode,
          phone: company.phone,
          fax: company.fax || null,
          email: company.email,
          website: company.website,
          logoUrl: company.logoUrl || null,
          description: company.description,
          isClaimed: company.isClaimed,
          isVerified: company.isVerified,
          specialties: company.specialties,
          status: 'ACTIVE',
        },
      });
      updatedCount++;
    } else {
      await (prisma as any).realEstateCompany.create({
        data: {
          houjinNumber: company.houjinNumber,
          companyName: company.companyName,
          licenseNumber: company.licenseNumber,
          prefecture: company.prefecture,
          city: company.city,
          address: company.address,
          postalCode: company.postalCode,
          phone: company.phone,
          fax: company.fax || null,
          email: company.email,
          website: company.website,
          logoUrl: company.logoUrl || null,
          description: company.description,
          isClaimed: company.isClaimed,
          isVerified: company.isVerified,
          specialties: company.specialties,
          status: 'ACTIVE',
        },
      });
      createdCount++;
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   - Created: ${createdCount} companies`);
  console.log(`   - Updated: ${updatedCount} companies`);
  console.log(`   - Total processed: ${seedCompanies.length} companies`);

  const totalInDb = await (prisma as any).realEstateCompany.count();
  const verifiedInDb = await (prisma as any).realEstateCompany.count({
    where: { isVerified: true },
  });
  const unverifiedInDb = await (prisma as any).realEstateCompany.count({
    where: { isVerified: false },
  });

  console.log(`\n📊 RealEstateCompany Database Stats:`);
  console.log(`   - Total in DB: ${totalInDb}`);
  console.log(`   - Verified (Tích Xanh): ${verifiedInDb}`);
  console.log(`   - Unverified (Public records): ${unverifiedInDb}`);
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
