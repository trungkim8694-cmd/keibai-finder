'use client';

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { MessageSquare, Lock, AlertCircle } from "lucide-react";

interface Comment {
  id: string;
  userId: string;
  sale_unit_id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface PropertyCommentsProps {
  saleUnitId: string;
  initialComments: Comment[];
}

const maskName = (name: string | null): string => {
  if (!name) return '匿名ユーザー';
  const trimmed = name.trim();
  if (trimmed.length === 0) return '匿名ユーザー';
  const firstChar = Array.from(trimmed)[0];
  return `${firstChar}***`;
};

export function PropertyComments({ saleUnitId, initialComments }: PropertyCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (content.trim() === "") return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/properties/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sale_unit_id: saleUnitId, content })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "コメントの投稿に失敗しました");
      }

      setComments([data.comment, ...comments]);
      setContent("");
    } catch (err: any) {
      setError(err.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const formatCommentDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-lg p-5 md:p-6 shadow-none border border-slate-200 dark:border-zinc-800 space-y-5">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
        <MessageSquare className="w-4 h-4 text-[#1B4F8A] dark:text-blue-400" />
        <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
          コメント・現地調査メモ ({comments.length})
        </h2>
      </div>

      {/* Comment Form */}
      {session ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
              {Array.from(session.user?.name ? maskName(session.user.name) : '匿名ユーザー')[0]}
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="現地調査の所見（接道状況、外壁劣化、占有状態など）や入札に関する質疑を入力できます..."
                rows={3}
                required
                className="w-full px-3 py-2 bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-[#1B4F8A] focus:border-[#1B4F8A] transition-colors resize-none placeholder-slate-400 dark:placeholder-zinc-600"
              />
              
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || content.trim() === ""}
                  className="px-4 py-2 bg-[#1B4F8A] hover:bg-[#163e6c] disabled:bg-slate-300 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors flex items-center gap-1.5 disabled:cursor-not-allowed"
                >
                  {loading && (
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  コメントを投稿する
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-5 bg-slate-50/50 dark:bg-zinc-950/20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-lg flex flex-col items-center justify-center text-center space-y-3 py-6">
          <div className="p-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-full">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
              コメントや調査メモの閲覧・投稿にはログインが必要です
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-xs leading-relaxed">
              現地確認データや投資家同士の情報交換にご利用いただけます。
            </p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium rounded hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-none"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Googleでログイン
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3 divide-y divide-slate-100 dark:divide-zinc-800/40">
        {comments.map((comment) => {
          const commentMaskedName = maskName(comment.user.name);
          return (
            <div key={comment.id} className="flex gap-3 pt-3 first:pt-0">
              <div className="w-8 h-8 rounded border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                {Array.from(commentMaskedName)[0]}
              </div>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-slate-800 dark:text-white truncate">
                    {commentMaskedName}
                  </span>
                  <span className="text-[10px] text-slate-400 tabular-nums whitespace-nowrap">
                    {formatCommentDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
