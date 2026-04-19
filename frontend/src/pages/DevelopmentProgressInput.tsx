import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  TrendingUp, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2,
  Pencil,
  Trash2,
  AlertCircle,
  Clock
} from 'lucide-react';

interface ProgressHistory {
  id: number;
  development_task_id: number;
  target_year: number;
  target_month: number;
  progress_percent: number;
  progress_comment: string;
  delay_reason: string;
  next_month_plan: string;
  submitted_by: number;
  submitted_user_name: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

const DevelopmentProgressInput: React.FC = () => {
  const { devId, taskId } = useParams<{ devId: string; taskId: string }>();

  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressComment, setProgressComment] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [nextMonthPlan, setNextMonthPlan] = useState('');
  
  const [taskTitle, setTaskTitle] = useState('');
  const [history, setHistory] = useState<ProgressHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchHistory = async () => {
    try {
      const progressRes = await api.get('/development-progress', {
        params: { development_task_id: taskId }
      });
      setHistory(progressRes.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/developments/${devId}`);
        const task = res.data.tasks.find((a: any) => a.id === Number(taskId));
        if (task) {
          setTaskTitle(task.title);
        }
        await fetchHistory();
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [devId, taskId]);

  useEffect(() => {
    if (history.length > 0) {
      const match = history.find(h => h.target_year === targetYear && h.target_month === targetMonth);
      if (match) {
        setProgressPercent(match.progress_percent);
        setProgressComment(match.progress_comment || '');
        setDelayReason(match.delay_reason || '');
        setNextMonthPlan(match.next_month_plan || '');
      } else {
        setProgressPercent(0);
        setProgressComment('');
        setDelayReason('');
        setNextMonthPlan('');
      }
    }
  }, [targetYear, targetMonth, history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/development-progress', {
        development_task_id: Number(taskId),
        target_year: Number(targetYear),
        target_month: Number(targetMonth),
        progress_percent: Number(progressPercent),
        progress_comment: progressComment,
        delay_reason: delayReason,
        next_month_plan: nextMonthPlan
      });
      setSuccess('進捗を保存しました。');
      await fetchHistory();
      setTimeout(() => setSuccess(''), 3000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '進捗の登録に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: ProgressHistory) => {
    setTargetYear(item.target_year);
    setTargetMonth(item.target_month);
    setProgressPercent(item.progress_percent);
    setProgressComment(item.progress_comment || '');
    setDelayReason(item.delay_reason || '');
    setNextMonthPlan(item.next_month_plan || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/development-progress/${deletingId}`);
      setSuccess('進捗履歴を削除しました。');
      setTimeout(() => setSuccess(''), 3000);
      await fetchHistory();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '進捗の削除に失敗しました。');
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="h-10 w-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <Link to={`/developments/${devId}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" />
        開発プロジェクト詳細に戻る
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-slate-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-2">{taskTitle || '開発タスク進捗報告'}</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Development Progress Report</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                <Calendar className="h-4 w-4 text-indigo-600" />
                対象年月
              </label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={targetYear}
                  onChange={(e) => setTargetYear(Number(e.target.value))}
                >
                  {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <select 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(Number(e.target.value))}
                >
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                進捗率 (%)
              </label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(Number(e.target.value))}
                />
                <span className="text-xl font-black text-indigo-600 w-12">{progressPercent}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              今月の進捗コメント
            </label>
            <textarea 
              required
              rows={4}
              placeholder="実施した内容や成果を具体的に入力してください"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={progressComment}
              onChange={(e) => setProgressComment(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
                遅延理由・課題 (任意)
              </label>
              <textarea 
                rows={3}
                placeholder="進捗が遅れている場合は理由を入力してください"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                来月の予定
              </label>
              <textarea 
                rows={3}
                placeholder="翌月に予定しているアクションを入力してください"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={nextMonthPlan}
                onChange={(e) => setNextMonthPlan(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              {isSubmitting ? '保存中...' : '進捗を保存する'}
            </button>
          </div>
        </form>
      </div>

      {/* 履歴一覧 */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-600" />
          進捗履歴
        </h3>

        {history.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            まだ履歴がありません。
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {history.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                
                <div className={`p-6 flex flex-col items-center justify-center shrink-0 w-full md:w-48 ${item.progress_percent === 100 ? 'bg-emerald-50 border-r border-emerald-100' : 'bg-slate-50 border-r border-slate-100'}`}>
                  <span className="text-sm font-bold text-slate-500 mb-1">{item.target_year}年 {item.target_month}月</span>
                  <div className="text-3xl font-black text-indigo-600 mb-2">{item.progress_percent}%</div>
                  {item.progress_percent === 100 && (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      完了
                    </span>
                  )}
                </div>

                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 block mb-1">進捗コメント</span>
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{item.progress_comment}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        title="編集"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setDeletingId(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {(item.delay_reason || item.next_month_plan) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-4">
                      {item.delay_reason && (
                        <div>
                          <span className="text-xs font-bold text-rose-500 block mb-1">遅延理由・課題</span>
                          <p className="text-xs text-slate-600">{item.delay_reason}</p>
                        </div>
                      )}
                      {item.next_month_plan && (
                        <div>
                          <span className="text-xs font-bold text-emerald-600 block mb-1">来月の予定</span>
                          <p className="text-xs text-slate-600">{item.next_month_plan}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 text-[10px] text-slate-400 text-right">
                    更新日時: {formatDate(item.updated_at || item.created_at)} by {item.submitted_user_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deletingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
              <AlertCircle className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">履歴の削除</h3>
            <p className="text-sm text-slate-500 mb-6">
              この進捗履歴を削除してもよろしいですか？<br/>
              この操作は取り消せません。
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
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

export default DevelopmentProgressInput;
