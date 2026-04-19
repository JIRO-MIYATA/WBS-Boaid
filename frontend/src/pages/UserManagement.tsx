import React, { useState, useEffect } from 'react';
import { Users, UserPlus, X, Check, Mail, Building, KeyRound, Briefcase, Pencil, Trash2, AlertCircle } from 'lucide-react';
import api from '../lib/api';

// Type definitions
interface User {
  id: number;
  employee_code: string;
  user_name: string;
  email: string;
  department_name: string;
  role_code: string;
  role_name: string;
  is_active: boolean;
  first_login_required: boolean;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    employee_code: '',
    user_name: '',
    email: '',
    department_name: '',
    role_code: 'member',
    is_active: true
  });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'ユーザー一覧の取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setFormData({
      employee_code: '',
      user_name: '',
      email: '',
      department_name: '',
      role_code: 'member',
      is_active: true
    });
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      employee_code: user.employee_code || '',
      user_name: user.user_name,
      email: user.email,
      department_name: user.department_name || '',
      role_code: user.role_code,
      is_active: user.is_active
    });
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingUserId) return;
    try {
      await api.delete(`/users/${deletingUserId}`);
      await fetchUsers();
      setSuccessMsg('ユーザーを削除（無効化）しました。');
      setTimeout(() => setSuccessMsg(''), 3000);
      setDeletingUserId(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'ユーザーの削除に失敗しました。');
      setTimeout(() => setError(''), 3000);
      setDeletingUserId(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    try {
      if (editingUserId) {
        await api.put(`/users/${editingUserId}`, formData);
        setSuccessMsg('ユーザー情報を更新しました。');
      } else {
        await api.post('/users', formData);
        setSuccessMsg('ユーザーを正常に登録しました。');
      }
      await fetchUsers(); // Refresh the list
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error?.message || 'ユーザーの保存に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            ユーザー管理
          </h1>
          <p className="text-slate-500 text-sm mt-1">システムを利用するユーザーの追加と管理を行います。</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <UserPlus className="h-4 w-4" />
          ユーザーを追加
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
          <Check className="h-5 w-5" />
          {successMsg}
        </div>
      )}

      {/* ユーザー一覧テーブル */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">社員番号</th>
                <th className="px-6 py-4">氏名</th>
                <th className="px-6 py-4">メールアドレス</th>
                <th className="px-6 py-4">部署名</th>
                <th className="px-6 py-4">権限</th>
                <th className="px-6 py-4">ステータス</th>
                <th className="px-6 py-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    読み込み中...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    ユーザーが登録されていません。
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{user.employee_code || '-'}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{user.user_name}</td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 text-slate-600">{user.department_name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        user.role_code === 'admin' 
                          ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20' 
                          : 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                      }`}>
                        {user.role_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600">
                          <Check className="h-4 w-4" />
                          有効
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-400">
                          <X className="h-4 w-4" />
                          無効
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenEditModal(user)} 
                          title="編集"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setDeletingUserId(user.id)} 
                          title="削除"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ユーザー追加・編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {editingUserId ? <Pencil className="h-5 w-5 text-indigo-600" /> : <UserPlus className="h-5 w-5 text-indigo-600" />}
                {editingUserId ? 'ユーザー情報の編集' : 'ユーザー新規追加'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200 mb-4 animate-shake">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">社員番号</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      name="employee_code"
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                      placeholder="例: M0001"
                      value={formData.employee_code}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">氏名 <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Users className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      name="user_name"
                      required
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                      placeholder="山田 太郎"
                      value={formData.user_name}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">メールアドレス <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                      placeholder="yamada@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">部署名</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      name="department_name"
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                      placeholder="情報システム部"
                      value={formData.department_name}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">権限 <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <select
                      name="role_code"
                      required
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white transition-shadow"
                      value={formData.role_code}
                      onChange={handleInputChange}
                    >
                      <option value="member">一般部員</option>
                      <option value="admin">管理者</option>
                    </select>
                  </div>
                </div>

                {editingUserId && (
                  <div className="col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        name="is_active"
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                      />
                      <span className="text-sm font-bold text-slate-700">アカウントを有効にする</span>
                    </label>
                  </div>
                )}
              </div>

              {!editingUserId && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 mt-4">
                  <p className="text-xs text-amber-700 leading-relaxed">
                    ※初期パスワードは <code>elpa1234</code> で作成されます。<br />
                    対象のユーザーは初回ログイン時にパスワードの変更が求められます。
                  </p>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  保存する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {deletingUserId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
              <AlertCircle className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">ユーザーの削除</h3>
            <p className="text-sm text-slate-500 mb-6">
              このユーザーを削除（無効化）してもよろしいですか？<br/>
              過去の業務データとの整合性を保つため、データ自体は残り、ステータスが「無効」に変更されます。
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setDeletingUserId(null)}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
