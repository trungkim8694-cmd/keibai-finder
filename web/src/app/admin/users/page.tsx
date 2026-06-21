'use client';

import { useState, useEffect } from "react";
import { 
  MagnifyingGlassIcon, 
  TrashIcon, 
  ShieldExclamationIcon, 
  UserMinusIcon,
  UserPlusIcon,
  PencilSquareIcon
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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchUsers = async (searchTerm = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error("ユーザー一覧を取得できませんでした。");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    // Cycle roles: USER -> ADMIN -> AGENCY -> USER (or toggle USER/ADMIN as before)
    // To make it simple and safe as previous flow: toggle between ADMIN and USER (or AGENCY if relevant)
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    
    if (!confirm(`このユーザーの権限を「${newRole}」に変更しますか？`)) {
      return;
    }

    setUpdatingId(userId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "権限の更新に失敗しました。");
      }

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSuccess(`「${data.user.email}」の権限を${data.user.role}に変更しました。`);
    } catch (err: any) {
      setError(err.message || "エラーが発生しました。");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleBan = async (userId: string, currentBanned: boolean) => {
    const nextBanned = !currentBanned;
    const actionText = nextBanned ? "アクセス禁止" : "アクセス禁止の解除";
    const confirmMessage = nextBanned
      ? "コミュニティガイドライン違反などの理由により、このユーザーのアクセスを禁止しますか？"
      : "このユーザーのアクセス禁止を解除しますか？";
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setUpdatingId(userId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isBanned: nextBanned })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "禁止ステータスの更新に失敗しました。");
      }

      setUsers(users.map(u => u.id === userId ? { ...u, isBanned: nextBanned } : u));
      setSuccess(`ユーザーを正常に${actionText}しました。`);
    } catch (err: any) {
      setError(err.message || "エラーが発生しました。");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateNotes = async (userId: string, currentNotes: string | null) => {
    const newNotes = window.prompt("このユーザーの管理用メモ（メモ・注意書き）を入力してください:", currentNotes || "");
    
    if (newNotes === null) return; // User clicked Cancel
    const trimmedNotes = newNotes.trim();

    setUpdatingId(userId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, adminNotes: trimmedNotes || null })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "管理メモの更新に失敗しました。");
      }

      setUsers(users.map(u => u.id === userId ? { ...u, adminNotes: trimmedNotes || null } : u));
      setSuccess("管理メモを正常に更新しました。");
    } catch (err: any) {
      setError(err.message || "エラーが発生しました。");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, email: string | null) => {
    if (!confirm(`「${email || 'このユーザー'}」を完全に削除しますか？\nこのユーザーに関連するお気に入り、メモ、コメントなどもすべて削除されます。この操作は取り消せません。`)) {
      return;
    }

    setUpdatingId(userId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ユーザーの削除に失敗しました。");
      }

      setUsers(users.filter(u => u.id !== userId));
      setSuccess("ユーザーアカウントを完全に削除しました。");
    } catch (err: any) {
      setError(err.message || "エラーが発生しました。");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">ユーザー管理</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            一般メンバーおよび管理者アカウントの監視、権限変更、アクセス禁止、削除を行います。
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="名前またはメールで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shrink-0"
          >
            検索
          </button>
        </form>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/25 text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl text-sm font-medium">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-sm font-medium">
          ✅ {success}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <span className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></span>
              <p className="text-sm">ユーザー一覧を読み込み中...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">
              <p className="text-4xl mb-4">👥</p>
              <p className="font-semibold">ユーザーが見つかりません</p>
              <p className="text-xs opacity-75 mt-1">別のキーワードでお試しください。</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <th scope="col" className="px-6 py-4 font-bold">メンバー</th>
                  <th scope="col" className="px-6 py-4 font-bold">メールアドレス</th>
                  <th scope="col" className="px-6 py-4 font-bold">登録日</th>
                  <th scope="col" className="px-6 py-4 font-bold">権限</th>
                  <th scope="col" className="px-6 py-4 font-bold">管理メモ (クリックで編集)</th>
                  <th scope="col" className="px-6 py-4 font-bold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    
                    {/* Member */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img src={user.image} alt={user.name || ""} className="w-8 h-8 rounded-full border border-zinc-200 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {user.name ? user.name[0] : "?"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-zinc-900 dark:text-white block truncate">
                            {user.name || "未設定"}
                          </span>
                          {user.isBanned && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/40">
                              アクセス禁止
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-zinc-650 dark:text-zinc-450 font-mono text-xs">
                      {user.email || "-"}
                    </td>

                    {/* Registration Date */}
                    <td className="px-6 py-4 text-zinc-500 font-medium">
                      {new Date(user.created_at).toLocaleDateString("ja-JP")}
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        user.role === "ADMIN" 
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                          : user.role === "AGENCY"
                          ? "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Admin Notes */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleUpdateNotes(user.id, user.adminNotes)}
                        disabled={updatingId === user.id}
                        className="w-full text-left font-medium text-xs py-1.5 px-2.5 rounded-xl transition-all border border-dashed border-zinc-200 hover:border-blue-300 dark:border-zinc-800 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-950 flex items-center justify-between gap-1 text-zinc-600 dark:text-zinc-400"
                      >
                        <span className="truncate max-w-[160px] font-semibold leading-relaxed">
                          {user.adminNotes || "メモを追加..."}
                        </span>
                        <PencilSquareIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Change Role Button */}
                        <button
                          onClick={() => handleRoleChange(user.id, user.role)}
                          disabled={updatingId === user.id}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                            user.role === "ADMIN"
                              ? "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-950/20"
                              : "border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-950/20"
                          } disabled:opacity-50`}
                        >
                          {user.role === "ADMIN" ? "一般にする" : "管理者にする"}
                        </button>

                        {/* Ban / Unban Button */}
                        <button
                          onClick={() => handleToggleBan(user.id, user.isBanned)}
                          disabled={updatingId === user.id}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                            user.isBanned
                              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                              : "border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-950/20"
                          } disabled:opacity-50`}
                        >
                          {user.isBanned ? "解除" : "禁止する"}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={updatingId === user.id}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-950/20 transition-all disabled:opacity-50"
                          title="アカウントを完全に削除"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
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
