'use client';

import { useState, useEffect } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
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
      if (!res.ok) throw new Error("Không thể tải danh sách người dùng");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi");
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
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    
    if (!confirm(`Bạn có chắc chắn muốn chuyển vai trò của người dùng này thành ${newRole}?`)) {
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
        throw new Error(data.error || "Không thể cập nhật quyền hạn");
      }

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSuccess(`Đã cập nhật vai trò của ${data.user.email} thành ${data.user.role}`);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Quản lý người dùng</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Xem thành viên và cấp quyền quản trị (ADMIN/USER).
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shrink-0"
          >
            Tìm
          </button>
        </form>
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
              <p className="text-sm">Đang tải danh sách thành viên...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">
              <p className="text-4xl mb-4">👥</p>
              <p className="font-semibold">Không tìm thấy người dùng nào</p>
              <p className="text-xs opacity-75 mt-1">Hãy thử tìm với từ khóa khác.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <th scope="col" className="px-6 py-4 font-semibold">Thành viên</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Email</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Ngày đăng ký</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Vai trò</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {user.image ? (
                        <img src={user.image} alt={user.name || ""} className="w-8 h-8 rounded-full border border-zinc-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center justify-center font-bold text-xs uppercase">
                          {user.name ? user.name[0] : "?"}
                        </div>
                      )}
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {user.name || "Chưa đặt tên"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                      {user.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 font-medium">
                      {new Date(user.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        user.role === "ADMIN" 
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRoleChange(user.id, user.role)}
                        disabled={updatingId === user.id}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          user.role === "ADMIN"
                            ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/20"
                            : "border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-950/20"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {updatingId === user.id ? "Đang lưu..." : user.role === "ADMIN" ? "Hạ quyền USER" : "Lên ADMIN"}
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
