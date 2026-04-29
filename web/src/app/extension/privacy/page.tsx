import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy for Keibai Lens</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: April 2026</p>

        <div className="space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Information We Collect</h2>
            <p>
              Keibai Lens ("the Extension") requests the <strong>activeTab</strong> permission to capture text highlighted by the user within their active browser tab. This is strictly required to auto-fill the target address into the Extension's search bar for Real Estate valuation and hazard checking.
            </p>
            <p className="mt-2">
              <strong>We do not collect, store, or transmit your personal data, browsing history, or passwords.</strong> The text capture function triggers entirely locally on your machine upon your explicit action (opening the Extension or using the context menu).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. How We Use the Data</h2>
            <p>
              The text you highlight is temporarily sent to our secure backend servers explicitly for the purpose of communicating with public Japanese APIs (e.g., GSI Geocoding API and MLIT Real Estate API) to return corresponding Hazard and Valuation parameters.
            </p>
            <p className="mt-2 text-indigo-600 font-medium">
              We send anonymized telemetry logs (Event Type, Input Location Snippet) to optimize performance, but we do NOT track user identities, IPs, or cookies within the Extension module natively.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Third-Party Services</h2>
            <p>
              The Extension interacts with the Keibai-Koubai system. If you click external link buttons displayed inside the Extension (such as "Investment Solutions" or "Explore in-depth data"), you will be safely routed to our web application at <strong>keibai-koubai.com</strong>, which operates under its own Privacy Framework equipped with Google Analytics.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Your Rights & Consent</h2>
            <p>
              By installing and using Keibai Lens, you consent to this Privacy Policy. Since we do not retain identifiable personal data from the Extension, there is no personal data to delete. You can revoke all permissions simply by uninstalling the Extension from your browser.
            </p>
          </section>
        </div>

        <hr className="my-10 border-slate-100" />

        {/* Japanese Translation (Crucial for Japan Store approval) */}
        <h1 className="text-3xl font-bold text-slate-900 mb-6">プライバシーポリシー (Keibai Lens)</h1>
        <div className="space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. 収集する情報</h2>
            <p>
              Keibai Lens（以下「本拡張機能」）は、現在のアクティブなタブ内でユーザーがハイライトしたテキストを読み取るために、<strong>activeTab</strong> パーミッションを利用します。これはシステムに住所を自動入力するためだけに使用されます。パスワードや閲覧履歴などの個人情報を収集・保存することはありません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. データの使用方法</h2>
            <p>
              取得した住所テキストは、安全な自社サーバーを介して国土交通省や国土地理院の公開APIと通信し、ハザードデータや不動産価格を算出・表示する目的にのみ使用されます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. サードパーティサービス</h2>
            <p>
              本拡張機能内で外部リンク（詳細ボタン）をクリックした場合、当社のメインアプリケーションである <strong>keibai-koubai.com</strong> に移動します。以後のデータ保護は同ウェブサイトの利用規約およびプライバシーポリシーに準拠します。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
