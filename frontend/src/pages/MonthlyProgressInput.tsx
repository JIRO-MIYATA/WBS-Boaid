import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  TrendingUp, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MonthlyProgressInput: React.FC = () => {
  const { goalId, assignmentId } = useParams<{ goalId: string; assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [targetYear, setTargetYear] = useState(new Date().getFullYear());
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressComment, setProgressComment] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [nextMonthPlan, setNextMonthPlan] = useState('');
  
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 目標詳細からタイトル等を取得（暫定的に詳細APIを利用）
        const goalRes = await api.get(`/goals/${goalId}`);
        const assignment = goalRes.data.assignments.find((a: any) => a.id === Number(assignmentId));
        if (assignment) {
          setAssignmentTitle(assignment.assignment_title);
        }

        // 既存の進捗があれば取得
        const progressRes = await api.get('/monthly-progress', {
          params: { goal_assignment_id: assignmentId, target_year: targetYear, target_month: targetMonth }
        });
        
        if (progressRes.data.length > 0) {
          const latest = progressRes.data[0];
          setProgressPercent(latest.progress_percent);
          setProgressComment(latest.progress_comment || '');
          setDelayReason(latest.delay_reason || '');
          setNextMonthPlan(latest.next_month_plan || '');
        } else {
          // データがない場合はリセット
          setProgressPercent(0);
          setProgressComment('');
          setDelayReason('');
          setNextMonthPlan('');
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [goalId, assignmentId, targetYear, targetMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/monthly-progress', {
        goal_assignment_id: Number(assignmentId),
        target_year: Number(targetYear),
        target_month: Number(targetMonth),
        progress_percent: Number(progressPercent),
        progress_comment: progressComment,
        delay_reason: delayReason,
        next_month_plan: nextMonthPlan
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate(`/goals/${goalId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '進捗の登録に失敗しました。');
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
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to={`/goals/${goalId}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" />
        目標詳細に戻る
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-2">{assignmentTitle || 'タスク進捗報告'}</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Monthly Progress Report</p>
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
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">進捗を保存しました。</span>
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
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={targetYear}
                  onChange={(e) => setTargetYear(Number(e.target.value))}
                >
                  {Array.from({length: 3}, (_, i) => new Date().getFullYear() - 1 + i).map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <select 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
    </div>
  );
};

export default MonthlyProgressInput;
