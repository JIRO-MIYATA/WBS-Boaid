import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Target, ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Stats {
  activeGoals: number;
  pendingMonthly: number;
  dailyTodo: number;
  monthlyDone: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    activeGoals: 0,
    pendingMonthly: 0,
    dailyTodo: 0,
    monthlyDone: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statItems = [
    { label: '実行中の目標', value: stats.activeGoals.toString(), icon: Target, color: 'bg-indigo-600' },
    { label: '今月の未入力', value: stats.pendingMonthly.toString(), icon: AlertCircle, color: 'bg-rose-500' },
    { label: '日次対応中', value: stats.dailyTodo.toString(), icon: ClipboardList, color: 'bg-amber-500' },
    { label: '今月完了済', value: stats.monthlyDone.toString(), icon: CheckCircle2, color: 'bg-emerald-500' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-10 w-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-2xl shadow-lg shadow-indigo-500/10`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-800">{stat.value}</span>
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              月次進捗サマリー
            </h3>
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center">
                <p className="text-sm text-slate-500 font-medium">
                  {stats.pendingMonthly > 0 
                    ? `今月未入力の項目が ${stats.pendingMonthly} 件あります。お早めに入力をお願いします。`
                    : '今月の目標進捗はすべて入力済みです。お疲れ様でした！'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-900/10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <AlertCircle className="h-24 w-24" />
            </div>
            <h3 className="text-lg font-bold mb-4 relative z-10">お知らせ・アラート</h3>
            <div className="space-y-4 relative z-10">
              {stats.pendingMonthly > 0 && (
                <div className="bg-rose-500/20 p-4 rounded-2xl border border-rose-500/30 backdrop-blur-sm">
                  <p className="text-xs font-bold text-rose-300 uppercase tracking-widest mb-1">Critical</p>
                  <p className="text-sm font-medium">月次進捗報告の期限が近づいています。</p>
                </div>
              )}
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Update</p>
                <p className="text-sm font-medium">システムが正常に稼働しています。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Dashboard;

