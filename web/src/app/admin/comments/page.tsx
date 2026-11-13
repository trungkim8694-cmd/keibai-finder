'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrashIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

interface Comment {
  id: string;
  userId: string;
  sale_unit_id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  property: {
    sale_unit_id: string;
    address: string;
    property_type: string;
    court_name: string;
  };
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/comments");
      if (!res.ok) throw new Error("コメント一覧の取得に失敗しました");
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err: any) {
      setError(err.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDeleteComment = async (id: string) => {
    if (!confirm("このコメントを削除してもよろしいですか？この操作は取り消せません。")) {
      return;
    }

    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/comments?id=${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "コメントの削除に失敗しました");
      }

      setComments(comments.filter(c => c.id !== id));
      setSuccess("コメントを正常に削除しました");
    } catch (err: any) {
      setError(err.message || "エラーが発生しました");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">コメント管理</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          物件ページに投稿された会員コメントの確認・削除管理を行います。
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl text-sm font-medium">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50 rounded-xl text-sm font-medium">
          ✅ {success}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <span className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></span>
              <p className="text-sm">コメント一覧を読み込み中...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">
              <p className="text-4xl mb-4">💬</p>
              <p className="font-semibold">投稿されたコメントはありません</p>
              <p className="text-xs opacity-75 mt-1">物件詳細ページでユーザーから投稿されたコメントがここに表示されます。</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <th scope="col" className="px-6 py-4 font-semibold w-1/4">投稿ユーザー</th>
                  <th scope="col" className="px-6 py-4 font-semibold w-1/4">対象物件</th>
                  <th scope="col" className="px-6 py-4 font-semibold w-1/3">コメント内容</th>
                  <th scope="col" className="px-6 py-4 font-semibold">投稿日時</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                {comments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors align-top">
                    {/* User info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {comment.user.image ? (
                          <img src={comment.user.image} alt={comment.user.name || ""} className="w-8 h-8 rounded-full border border-zinc-200 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {comment.user.name ? comment.user.name[0] : "?"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-semibold text-zinc-900 dark:text-white block truncate">
                            {comment.user.name || "名称未設定"}
                          </span>
                          <span className="text-xs text-zinc-400 font-mono block truncate">
                            {comment.user.email || "-"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Property info */}
                    <td className="px-6 py-4">
                      <div className="space-y-1 max-w-[200px]">
                        <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded font-medium">
                          {comment.property.property_type}
                        </span>
                        <Link 
                          href={`/property/${comment.sale_unit_id}`}
                          target="_blank"
                          className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 leading-snug group"
                        >
                          <span className="truncate block">{comment.property.address}</span>
                          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </Link>
                        <span className="text-[11px] text-zinc-400 block truncate">
                          {comment.property.court_name}
                        </span>
                      </div>
                    </td>

                    {/* Comment content */}
                    <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words leading-relaxed max-w-[300px]">
                      {comment.content}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                      {new Date(comment.created_at).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        {new Date(comment.created_at).toLocaleTimeString("ja-JP", { hour: '2-digit', minute: '2-digit', timeZone: "Asia/Tokyo" })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingId === comment.id}
                        className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="コメントを削除"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
