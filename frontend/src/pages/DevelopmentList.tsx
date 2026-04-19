import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { 
  Target, 
  Plus, 
  ChevronRight, 
  User as UserIcon,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Development {
  id: number;
  development_code: string;
  title: string;
  description: string;
  status: string;
  owner_name: string;
  is_all_tasks_completed?: number | boolean;
}

const DevelopmentList: React.FC = () => {
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    development_code: '',
    title: '',
    description: '',
    owner_user_id: user?.id || 0
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDevelopments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/developments');
      setDevelopments(res.data);
    } catch (err) {
      console.error('Failed to fetch developments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevelopments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      await api.post('/developments', formData);
      setShowModal(false);
      setFormData({ development_code: '', title: '', description: '', owner_user_id: user?.id || 0 });
      fetchDevelopments();
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || '登録に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">開発業務管理</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">情報システム部の開発プロジェクトとその進捗を管理します</p>
        </div>
        
        {user?.role_code === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus className="h-5 w-5" />
            新規プロジェクト作成
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-10 w-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {developments.map((dev) => (
            <Link 
              key={dev.id}
              to={`/developments/${dev.id}`}
              className="group bg-white rounded-2xl border border-slate-200 p-6 flex items-center hover:border-indigo-600/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all"
            >
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Target className="h-8 w-8 text-indigo-600" />
              </div>
              
              <div className="ml-6 flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{dev.development_code}</span>
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                    {dev.status}
                  </span>
                  {dev.is_all_tasks_completed ? (
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-wider flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      完了
                    </span>
                  ) : null}
                </div>
                <h3 className="text-xl font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                  {dev.title}
                </h3>
                <p className="text-sm text-slate-500 truncate mt-1">
                  {dev.description || '説明なし'}
                </p>
              </div>

              <div className="ml-6 hidden md:flex items-center gap-6 shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <UserIcon className="h-3 w-3" /> Owner
                  </span>
                  <span className="text-sm font-bold text-slate-700">{dev.owner_name}</span>
                </div>
              </div>

              <div className="ml-6 pl-6 border-l border-slate-100 flex items-center justify-center shrink-0">
                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          ))}

          {developments.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">開発プロジェクトがありません</h3>
              <p className="text-sm text-slate-500">右上のボタンから新しいプロジェクトを登録してください。</p>
            </div>
          )}
        </div>
      )}

      {/* 新規登録モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">新規プロジェクト作成</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">New Development Project</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">開発コード *</label>
                <input
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="例: DEV-2025-01"
                  value={formData.development_code}
                  onChange={(e) => setFormData({ ...formData, development_code: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">プロジェクトタイトル *</label>
                <input
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="例: 社内ポータル刷新"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">詳細説明</label>
                <textarea
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="プロジェクトの概要や目標など"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
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
                  {isSubmitting ? '作成中...' : 'プロジェクトを作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevelopmentList;
