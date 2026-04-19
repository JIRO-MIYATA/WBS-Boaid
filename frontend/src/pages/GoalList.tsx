import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { CalendarRange, Plus, ChevronRight, Target, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Goal {
  id: number;
  fiscal_year: number;
  goal_code: string;
  goal_title: string;
  goal_description: string;
  status: string;
}

const GoalList: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // 新規目標作成用モーダル
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fiscal_year: new Date().getFullYear(),
    goal_code: '',
    goal_title: '',
    goal_description: '',
    start_date: '',
    end_date: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals');
      setGoals(res.data);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.goal_code || !formData.goal_title) {
      setFormError('目標コードとタイトルは必須です。');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await api.post('/goals', formData);
      setShowModal(false);
      setFormData({ fiscal_year: new Date().getFullYear(), goal_code: '', goal_title: '', goal_description: '', start_date: '', end_date: '' });
      fetchGoals();
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || '目標の作成に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="h-10 w-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">年間部門目標</h1>
          <p className="text-sm text-slate-500 font-medium">年度ごとの主要目標一覧</p>
        </div>
        {user?.role_code === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" />
            新規目標作成
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <Link
            key={goal.id}
            to={`/goals/${goal.id}`}
            className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-600/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target className="h-16 w-16" />
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider">
                FY{goal.fiscal_year}
              </span>
              <span className="text-slate-400 text-[10px] font-bold tracking-widest">{goal.goal_code}</span>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors leading-tight">
              {goal.goal_title}
            </h3>
            <p className="text-sm text-slate-500 line-clamp-2 mb-6 h-10">
              {goal.goal_description || '説明なし'}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <span className={`h-2 w-2 rounded-full ${goal.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                {goal.status === 'active' ? '実行中' : '終了'}
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <CalendarRange className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">目標がありません</h3>
          <p className="text-sm text-slate-500">まだ年間目標が登録されていません。</p>
        </div>
      )}

      {/* 新規目標作成モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">新規目標作成</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Create New Goal</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-8 space-y-5">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">年度</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.fiscal_year}
                    onChange={(e) => setFormData({ ...formData, fiscal_year: Number(e.target.value) })}
                  >
                    {Array.from({length: 3}, (_, i) => new Date().getFullYear() - 1 + i).map(y => (
                      <option key={y} value={y}>{y}年度</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">目標コード *</label>
                  <input
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="例: G2025-02"
                    value={formData.goal_code}
                    onChange={(e) => setFormData({ ...formData, goal_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">目標タイトル *</label>
                <input
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="例: 部門DXの推進"
                  value={formData.goal_title}
                  onChange={(e) => setFormData({ ...formData, goal_title: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">詳細説明</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="目標の具体的な内容"
                  value={formData.goal_description}
                  onChange={(e) => setFormData({ ...formData, goal_description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">開始日</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">終了日</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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
                  {isSubmitting ? '作成中...' : '目標を作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalList;
