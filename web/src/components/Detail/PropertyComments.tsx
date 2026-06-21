'use client';

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { ChatBubbleLeftRightIcon, LockClosedIcon } from "@heroicons/react/24/outline";

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
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
      <div className="flex items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="font-bold text-lg text-zinc-900 dark:text-white">
          コメント・情報共有 ({comments.length})
        </h2>
      </div>

      {/* Comment Form */}
      {session ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-800 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              {Array.from(session.user?.name ? maskName(session.user.name) : '匿名ユーザー')[0]}
            </div>
            <div className="flex-1 space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="現地調査の状況（外壁の状態、騒音、境界など）や、入札に関する相談・疑問などを入力してください..."
                rows={3}
                required
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none placeholder-zinc-400 dark:placeholder-zinc-600"
              />
              
              {error && (
                <p className="text-xs text-red-500 font-medium">⚠️ {error}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || content.trim() === ""}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-blue-800/50 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:cursor-not-allowed"
                >
                  {loading && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  )}
                  コメントを投稿する
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 py-8">
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full">
            <LockClosedIcon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              コメントを投稿するにはログインが必要です
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[280px] leading-relaxed">
              現地調査メモの共有や、入札意見の交換をするためにログインしてください。
            </p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-black rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
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
      <div className="space-y-4 divide-y divide-zinc-100 dark:divide-zinc-800/40">
        {comments.map((comment, index) => {
          const commentMaskedName = maskName(comment.user.name);
          return (
            <div key={comment.id} className="flex gap-3 pt-4 first:pt-0">
              <div className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-800 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                {Array.from(commentMaskedName)[0]}
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                    {commentMaskedName}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                    {formatCommentDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-350 leading-relaxed whitespace-pre-wrap break-words">
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
