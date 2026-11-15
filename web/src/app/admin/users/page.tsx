'use client';

import { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  TrashIcon,
  ShieldExclamationIcon,
  UserMinusIcon,
  UserPlusIcon,
  PencilSquareIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  isBanned: boolean;
  adminNotes: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Notes Modal
  const [notesUser, setNotesUser] = useState<User | null>(null);
  const [notesInput, setNotesInput] = useState("");

  // Confirm Modal
  const [confirmState, setConfirmState] = useState<{
    type: "role" | "ban" | "delete";
    user: User;
    nextRole?: string;
    nextBanned?: boolean;
    title: string;
    message: string;
  } | null>(null);

  const fetchUsers = useCallback(
    async (searchTerm = search, targetPage = page) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set("search", searchTerm);
        params.set("page", String(targetPage));
        params.set("limit", "50");
        const res = await fetch(`/api/admin/users?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "ユーザー一覧を取得できませんでした。");
        setUsers(data.users || []);
        setTotal(data.total || 0);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "エラーが発生しました。");
      } finally {
        setLoading(false);
      }
    },
    [page, search]
  );

  useEffect(() => {
    fetchUsers(search, page);
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(search, 1);
  };

  const executeConfirmAction = async () => {
    if (!confirmState) return;
    const { type, user, nextRole, nextBanned } = confirmState;
    setUpdatingId(user.id);
    setError(null);
    setSuccess(null);

    try {
      if (type === "role" && nextRole) {
        const res = await fetch("/api/admin/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, role: nextRole }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "権限の更新に失敗しました。");
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
        );
        setSuccess(`「${data.user.email}」の権限を ${data.user.role} に変更しました。`);
      } else if (type === "ban" && nextBanned !== undefined) {
        const res = await fetch("/api/admin/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, isBanned: nextBanned }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "禁止ステータスの更新に失敗しました。");
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isBanned: nextBanned } : u))
        );
        setSuccess(
          nextBanned
            ? "ユーザーをアクセス禁止にしました。"
            : "ユーザーのアクセス禁止を解除しました。"
        );
      } else if (type === "delete") {
        const res = await fetch("/api/admin/users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "ユーザーの削除に失敗しました。");
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setSuccess("ユーザーアカウントを完全に削除しました。");
      }
      setConfirmState(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
      setConfirmState(null);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesUser) return;
    const trimmedNotes = notesInput.trim();
    setUpdatingId(notesUser.id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: notesUser.id, adminNotes: trimmedNotes || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "管理メモの更新に失敗しました。");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === notesUser.id ? { ...u, adminNotes: trimmedNotes || null } : u
        )
      );
      setSuccess("管理メモを正常に更新しました。");
      setNotesUser(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="space-y-5 font-sans max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-[#1B4F8A] dark:text-blue-400 shrink-0" />
            <span>ユーザー管理</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            一般メンバーおよび管理者アカウントの監視、権限変更、アクセス禁止、削除を行います。
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full lg:max-w-sm">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="名前またはメールで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-white dark:bg-[#151B22] border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-4 py-2 bg-[#1B4F8A] hover:bg-[#163F6F] text-white text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            検索
          </button>
        </form>
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
          <p className="text-xs">ユーザー一覧を読み込み中...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl text-center py-16 text-slate-400">
          <UsersIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">ユーザーが見つかりません</p>
          <p className="text-xs mt-1">別のキーワードでお試しください。</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || ""}
                        className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {user.name ? user.name[0] : "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {user.name || "未設定"}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 break-all">
                        {user.email || "-"}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${
                      user.role === "ADMIN"
                        ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
                        : user.role === "AGENCY"
                        ? "bg-blue-50 text-[#1B4F8A] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="tabular-nums">
                    登録: {new Date(user.created_at).toLocaleDateString("ja-JP")}
                  </span>
                  {user.isBanned && (
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold">
                      アクセス禁止中
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNotesUser(user);
                    setNotesInput(user.adminNotes || "");
                  }}
                  className="w-full min-h-[40px] text-left text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2"
                >
                  <span className="truncate">
                    {user.adminNotes ? `メモ: ${user.adminNotes}` : "管理メモを追加..."}
                  </span>
                  <PencilSquareIcon className="w-4 h-4 shrink-0 text-slate-400" />
                </button>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={updatingId === user.id}
                    onClick={() => {
                      const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
                      setConfirmState({
                        type: "role",
                        user,
                        nextRole,
                        title: "ユーザー権限の変更",
                        message: `「${user.email || user.name}」の権限を ${nextRole} に変更しますか？`,
                      });
                    }}
                    className="min-h-[44px] px-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {user.role === "ADMIN" ? "一般化" : "管理者化"}
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === user.id}
                    onClick={() => {
                      const nextBanned = !user.isBanned;
                      setConfirmState({
                        type: "ban",
                        user,
                        nextBanned,
                        title: nextBanned ? "アクセス禁止" : "アクセス禁止解除",
                        message: nextBanned
                          ? `「${user.email || user.name}」のアクセスを禁止しますか？`
                          : `「${user.email || user.name}」のアクセス禁止を解除しますか？`,
                      });
                    }}
                    className="min-h-[44px] px-2 text-xs font-semibold rounded-lg border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20"
                  >
                    {user.isBanned ? "解除" : "BAN"}
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === user.id}
                    onClick={() =>
                      setConfirmState({
                        type: "delete",
                        user,
                        title: "アカウント完全削除",
                        message: `「${user.email || "このユーザー"}」を完全に削除しますか？関連データもすべて削除されます。`,
                      })
                    }
                    className="min-h-[44px] px-2 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 bg-red-50/50 dark:bg-red-950/20"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-[#151B22] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
                    <th scope="col" className="px-5 py-3.5">メンバー</th>
                    <th scope="col" className="px-5 py-3.5">メールアドレス</th>
                    <th scope="col" className="px-5 py-3.5">登録日</th>
                    <th scope="col" className="px-5 py-3.5">権限</th>
                    <th scope="col" className="px-5 py-3.5">管理メモ</th>
                    <th scope="col" className="px-5 py-3.5 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || ""}
                              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {user.name ? user.name[0] : "?"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {user.name || "未設定"}
                            </span>
                            {user.isBanned && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 mt-0.5">
                                アクセス禁止
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 font-mono text-xs">
                        {user.email || "-"}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 font-medium tabular-nums">
                        {new Date(user.created_at).toLocaleDateString("ja-JP")}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold ${
                            user.role === "ADMIN"
                              ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
                              : user.role === "AGENCY"
                              ? "bg-blue-50 text-[#1B4F8A] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 max-w-[220px]">
                        <button
                          type="button"
                          onClick={() => {
                            setNotesUser(user);
                            setNotesInput(user.adminNotes || "");
                          }}
                          className="group flex items-center gap-1.5 text-left text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 w-full"
                        >
                          <span className="truncate">
                            {user.adminNotes || "メモを追加..."}
                          </span>
                          <PencilSquareIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 shrink-0 text-slate-400" />
                        </button>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={updatingId === user.id}
                            onClick={() => {
                              const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
                              setConfirmState({
                                type: "role",
                                user,
                                nextRole,
                                title: "ユーザー権限の変更",
                                message: `「${user.email || user.name}」の権限を ${nextRole} に変更しますか？`,
                              });
                            }}
                            title="権限切替"
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            {user.role === "ADMIN" ? (
                              <UserMinusIcon className="w-4 h-4" />
                            ) : (
                              <UserPlusIcon className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === user.id}
                            onClick={() => {
                              const nextBanned = !user.isBanned;
                              setConfirmState({
                                type: "ban",
                                user,
                                nextBanned,
                                title: nextBanned ? "アクセス禁止" : "アクセス禁止解除",
                                message: nextBanned
                                  ? `「${user.email || user.name}」のアクセスを禁止しますか？`
                                  : `「${user.email || user.name}」のアクセス禁止を解除しますか？`,
                              });
                            }}
                            title={user.isBanned ? "禁止解除" : "アクセス禁止"}
                            className="p-2 rounded-lg border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
                          >
                            <ShieldExclamationIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={updatingId === user.id}
                            onClick={() =>
                              setConfirmState({
                                type: "delete",
                                user,
                                title: "アカウント完全削除",
                                message: `「${user.email || "このユーザー"}」を完全に削除しますか？関連データもすべて削除されます。`,
                              })
                            }
                            title="削除"
                            className="p-2 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
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
            ページ {page} / {totalPages} （全 {total.toLocaleString()} 名）
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

      {/* Notes Modal */}
      {notesUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[1px]">
          <form
            onSubmit={handleSaveNotes}
            className="bg-white dark:bg-[#151B22] rounded-xl max-w-md w-full p-5 shadow-lg border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              管理メモ編集: {notesUser.name || notesUser.email}
            </h3>
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              rows={4}
              placeholder="管理用メモ・注意書きを入力..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1117] focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNotesUser(null)}
                className="min-h-[40px] px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={updatingId === notesUser.id}
                className="min-h-[40px] px-4 py-1.5 text-xs font-bold bg-[#1B4F8A] hover:bg-[#163F6F] text-white rounded-lg"
              >
                保存する
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-[#151B22] rounded-xl max-w-md w-full p-5 shadow-lg border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {confirmState.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmState.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="min-h-[40px] px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={executeConfirmAction}
                disabled={updatingId !== null}
                className={`min-h-[40px] px-4 py-1.5 text-xs font-bold text-white rounded-lg ${
                  confirmState.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#1B4F8A] hover:bg-[#163F6F]"
                }`}
              >
                {updatingId ? "処理中..." : "確定する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
