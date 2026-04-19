import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  MessageSquare,
  Save,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface DailyTask {
  task_id: number;
  title: string;
  task_detail: string;
  estimated_time_minutes: number;
  history_id: number | null;
  status: 'todo' | 'done' | 'pending' | null;
  completion_comment: string | null;
  actual_time_minutes: number | null;
}


const DailyExecution: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [date]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/daily-tasks/history?target_date=${date}`);
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (task: DailyTask, status: 'todo' | 'done' | 'pending') => {
    try {
      await api.post('/daily-tasks/history', {
        daily_task_id: task.task_id,
        target_date: date,
        status: status,
        completion_comment: task.completion_comment || '',
        actual_time_minutes: task.actual_time_minutes || task.estimated_time_minutes
      });
      fetchTasks();
      setSuccess('保存しました。');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleUpdateComment = async (task: DailyTask, comment: string) => {
    // ローカルステートを更新するだけで、保存ボタンで一括送信も良いが、今回は即時反映かフォーカスアウト時にする
    // ここでは個別の更新とする
    try {
      await api.post('/daily-tasks/history', {
        daily_task_id: task.task_id,
        target_date: date,
        status: task.status || 'todo',
        completion_comment: comment,
        actual_time_minutes: task.actual_time_minutes || task.estimated_time_minutes
      });
      fetchTasks();
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="h-10 w-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">日次タスク実施状況</h1>
          <p className="text-sm text-slate-500 font-medium">毎日のルーチン業務の進捗を記録します</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => changeDate(-1)} className="p-1 hover:text-indigo-600 transition-colors"><ArrowLeft className="h-4 w-4" /></button>
          <div className="flex items-center gap-2 font-bold text-slate-700 mx-4">
            <Calendar className="h-4 w-4 text-indigo-600" />
            {date}
          </div>
          <button onClick={() => changeDate(1)} className="p-1 hover:text-indigo-600 transition-colors"><ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      <div className="space-y-4">
        {tasks.map((task) => (
          <div 
            key={task.task_id}
            className={`bg-white p-6 rounded-3xl border transition-all ${
              task.status === 'done' ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    task.status === 'done' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {task.status === 'done' ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </div>
                  <h3 className={`text-lg font-bold ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {task.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-500 ml-11">{task.task_detail || '説明なし'}</p>

                
                <div className="flex items-center gap-4 ml-11 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    目安: {task.estimated_time_minutes}分
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="flex gap-2">
                  {[
                    { id: 'todo', label: '未着手', color: 'bg-slate-100 text-slate-600' },
                    { id: 'done', label: '完了', color: 'bg-emerald-600 text-white' },
                    { id: 'pending', label: '保留', color: 'bg-amber-500 text-white' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleUpdateStatus(task, s.id as any)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        (task.status || 'todo') === s.id ? s.color + ' shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="relative group">
                  <div className="absolute top-3 left-3 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="特記事項を入力..."
                    rows={2}
                    defaultValue={task.completion_comment || ''}
                    onBlur={(e) => handleUpdateComment(task, e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Routine Tasks for Today</h3>
            <p className="text-xs text-slate-400 mt-2">ルーチン設定からタスクを登録してください。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyExecution;
