import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { 
  ArrowLeft, 
  Target, 
  Users, 
  Plus, 
  ChevronRight, 
  User as UserIcon,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Task {
  id: number;
  assigned_user_id: number;
  assigned_user_name: string;
  title: string;
  description: string;
  priority: string;
  due_date: string;
  status: string;
  latest_progress_percent?: number;
}

interface DevelopmentDetailData {
  id: number;
  development_code: string;
  title: string;
  description: string;
  status: string;
  owner_name: string;
  tasks: Task[];
}

interface UserOption {
  id: number;
  user_name: string;
  email: string;
}

const DevelopmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [development, setDevelopment] = useState<DevelopmentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [userList, setUserList] = useState<UserOption[]>([]);
  const [assignForm, setAssignForm] = useState({
    assigned_user_id: 0,
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/developments/${id}`);
      setDevelopment(res.data);
    } catch (err) {
      console.error('Failed to fetch development detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleOpenModal = async () => {
    try {
      const res = await api.get('/users');
      setUserList(res.data.filter((u: any) => u.is_active));
      if (res.data.length > 0) {
        setAssignForm(prev => ({ ...prev, assigned_user_id: res.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
    setShowModal(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.assigned_user_id || !assignForm.title) {
      setFormError('担当者とタスク名は必須です。');
      return;
    }
    setIsSubmitting(true);
    setFormError('');

    try {
      await api.post(`/developments/${id}/tasks`, assignForm);
      setShowModal(false);
      setAssignForm({ assigned_user_id: 0, title: '', description: '', priority: 'medium', due_date: '' });
      fetchDetail();
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || '割当の追加に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="h-10 w-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  if (!development) return (
    <div className="text-center py-12">
      <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-800">開発プロジェクトが見つかりません</h2>
      <Link to="/developments" className="text-indigo-600 font-bold hover:underline mt-4 inline-block">一覧に戻る</Link>
    </div>
  );

  return (
    <div className="space-y-8">
      <Link to="/developments" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" />
        開発プロジェクト一覧に戻る
      </Link>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Target className="h-32 w-32 text-indigo-600" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-slate-400 text-sm font-bold tracking-widest">{development.development_code}</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">{development.title}</h1>
          <p className="text-slate-600 leading-relaxed max-w-3xl mb-8">
            {development.description || '詳細説明はありません。'}
          </p>

          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-slate-400" />
              <span className="text-slate-400 font-bold uppercase tracking-wider">Owner:</span>
              <span className="text-slate-800 font-bold">{development.owner_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-400 font-bold uppercase tracking-wider">Status:</span>
              <span className="text-slate-800 font-bold">{development.status === 'active' ? '実行中' : development.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-800">担当・タスク割当</h2>
          </div>
          {user?.role_code === 'admin' && (
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border border-indigo-100"
            >
              <Plus className="h-4 w-4" />
              新規タスク追加
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {development.tasks.map((task) => (
            <Link
              key={task.id}
              to={`/developments/${development.id}/progress/${task.id}`}
              className="group flex items-center bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-600/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors shrink-0">
                <UserIcon className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="ml-5 flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{task.assigned_user_name}</span>
                  {task.priority === 'high' && (
                    <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-100">HIGH</span>
                  )}
                  {task.latest_progress_percent === 100 && (
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-wider flex items-center gap-1">
                      完了
                    </span>
                  )}
                </div>
                <h4 className="text-base font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                  {task.title}
                </h4>
                <p className="text-xs text-slate-500 truncate mt-1">
                  {task.description || '説明なし'}
                </p>
              </div>
              <div className="ml-4 flex flex-col items-end shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</span>
                <span className="text-sm font-bold text-slate-700">{task.due_date || '未設定'}</span>
              </div>
              <ChevronRight className="ml-6 h-5 w-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}

          {development.tasks.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No Tasks Yet</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">新規タスク追加</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="p-8 space-y-5">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">担当者 *</label>
                <select
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={assignForm.assigned_user_id}
                  onChange={(e) => setAssignForm({ ...assignForm, assigned_user_id: Number(e.target.value) })}
                >
                  {userList.map((u) => (
                    <option key={u.id} value={u.id}>{u.user_name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">タスク名 *</label>
                <input
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={assignForm.title}
                  onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">詳細説明</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={assignForm.description}
                  onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">優先度</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={assignForm.priority}
                    onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">期限</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={assignForm.due_date}
                    onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? '追加中...' : 'タスクを追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevelopmentDetail;
