'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmComment, setConfirmComment] = useState<Comment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchComments = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/comments?page=${targetPage}&limit=50`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "コメント一覧の取得に失敗しました");
      setComments(data.comments || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchComments(page);
  }, [page, fetchComments]);

  const handleDeleteComment = async () => {
    if (!confirmComment) return;
    const id = confirmComment.id;
    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/comments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "コメントの削除に失敗しました");
      }

      setComments((prev) => prev.filter((c) => c.id !== id));
      setSuccess("コメントを正常に削除しました。");
      setConfirmComment(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setConfirmComment(null);
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="space-y-5 font-sans max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
          <span>コメント管理</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          物件ページに投稿された会員コメントの確認・削除管理を行います。
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs font-medium">
          {success}
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center py-16 text-slate-400">
          <span className="w-6 h-6 border-2 border-[#1B4F8A] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">コメント一覧を読み込み中...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl text-center py-16 text-slate-400">
          <ChatBubbleLeftRightIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">投稿されたコメントはありません</p>
          <p className="text-xs mt-1">
            物件詳細ページでユーザーから投稿されたコメントがここに表示されます。
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {comment.user.image ? (
                      <img
                        src={comment.user.image}
                        alt={comment.user.name || ""}
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {comment.user.name ? comment.user.name[0] : "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {comment.user.name || "名称未設定"}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate">
                        {comment.user.email || "-"}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                    {new Date(comment.created_at).toLocaleDateString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                    })}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium">
                      {comment.property.property_type}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">
                      {comment.property.court_name}
                    </span>
                  </div>
                  <Link
                    href={`/property/${comment.sale_unit_id}`}
                    target="_blank"
                    className="text-xs font-semibold text-[#1B4F8A] dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span className="truncate">{comment.property.address}</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 shrink-0" />
                  </Link>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                  {comment.content}
                </p>

                <button
                  type="button"
                  onClick={() => setConfirmComment(comment)}
                  disabled={deletingId === comment.id}
                  className="w-full min-h-[44px] text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg inline-flex items-center justify-center gap-1.5"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>コメントを削除</span>
                </button>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
                    <th scope="col" className="px-5 py-3.5 w-1/5">
                      投稿ユーザー
                    </th>
                    <th scope="col" className="px-5 py-3.5 w-1/4">
                      対象物件
                    </th>
                    <th scope="col" className="px-5 py-3.5 w-1/3">
                      コメント内容
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      投稿日時
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {comments.map((comment) => (
                    <tr
                      key={comment.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors align-top"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {comment.user.image ? (
                            <img
                              src={comment.user.image}
                              alt={comment.user.name || ""}
                              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {comment.user.name ? comment.user.name[0] : "?"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-white block truncate">
                              {comment.user.name || "名称未設定"}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono block truncate">
                              {comment.user.email || "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1 max-w-[220px]">
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-medium inline-block">
                            {comment.property.property_type}
                          </span>
                          <Link
                            href={`/property/${comment.sale_unit_id}`}
                            target="_blank"
                            className="font-medium text-slate-900 dark:text-slate-100 hover:text-[#1B4F8A] dark:hover:text-blue-400 transition-colors flex items-center gap-1 leading-snug group"
                          >
                            <span className="truncate block">
                              {comment.property.address}
                            </span>
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </Link>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {comment.property.court_name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed max-w-[300px]">
                        {comment.content}
                      </td>

                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap tabular-nums">
                        {new Date(comment.created_at).toLocaleDateString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                        })}
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(comment.created_at).toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Tokyo",
                          })}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setConfirmComment(comment)}
                          disabled={deletingId === comment.id}
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50 cursor-pointer"
                          title="コメントを削除"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span className="tabular-nums">
            ページ {page} / {totalPages} （全 {total.toLocaleString()} 件）
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              前へ
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-[#151B22] rounded-xl max-w-md w-full p-5 shadow-lg border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              コメントの削除
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              このコメントを削除してもよろしいですか？この操作は取り消せません。
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmComment(null)}
                className="min-h-[40px] px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDeleteComment}
                disabled={deletingId !== null}
                className="min-h-[40px] px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                {deletingId ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
