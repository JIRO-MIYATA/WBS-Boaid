import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { 
  Plus, 
  Trash2, 
  Save, 
  ClipboardList, 
  Clock, 
  GripVertical, 
  ToggleLeft, 
  ToggleRight,
  AlertCircle
} from 'lucide-react';

interface Routine {
  id: number;
  title: string;
  task_detail: string;
  estimated_time_minutes: number;
  task_order: number;
  is_active: number;
}

const RoutineMaster: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 新規タスク用ステート
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDetail, setNewTaskDetail] = useState('');
  const [newTaskTime, setNewTaskTime] = useState(30);

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    try {
      const res = await api.get('/daily-tasks');
      setRoutines(res.data);
    } catch (err) {
      console.error('Failed to fetch routines:', err);
      setError('ルーチン業務の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    try {
      await api.post('/daily-tasks', {
        title: newTaskTitle,
        task_detail: newTaskDetail,
        estimated_time_minutes: newTaskTime,
        task_order: routines.length
      });
      setNewTaskTitle('');
      setNewTaskDetail('');
      setNewTaskTime(30);
      setSuccess('タスクを追加しました。');
      fetchRoutines();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('タスクの追加に失敗しました。');
    }
  };


  const handleToggleStatus = async (routine: Routine) => {
    try {
      await api.put(`/daily-tasks/${routine.id}`, {
        ...routine,
        is_active: routine.is_active === 1 ? 0 : 1
      });
      fetchRoutines();
    } catch (err) {
      setError('ステータスの更新に失敗しました。');
    }
  };

  const handleDeleteRoutine = async (id: number) => {
    if (!window.confirm('このタスクを削除してよろしいですか？')) return;
    try {
      await api.delete(`/daily-tasks/${id}`);
      setSuccess('タスクを削除しました。');
      fetchRoutines();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('タスクの削除に失敗しました。');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="h-10 w-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">ルーチン業務設定</h1>
          <p className="text-sm text-slate-500 font-medium">毎日繰り返し発生する定型業務を登録します</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <Save className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">新規タスク追加</h3>
        </div>
        <form onSubmit={handleAddRoutine} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4 space-y-1">
            <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Task Name</label>
            <input 
              required
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="例: メールチェック"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
          </div>
          <div className="md:col-span-5 space-y-1">
            <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Description</label>
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="例: 未返信メールの確認と返信"
              value={newTaskDetail}
              onChange={(e) => setNewTaskDetail(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Min.</label>
            <input 
              type="number"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={newTaskTime}
              onChange={(e) => setNewTaskTime(Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-1">
            <button 
              type="submit"
              className="w-full h-[46px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <ClipboardList className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">登録済みのルーチン</h2>
        </div>
        
        <div className="space-y-3">
          {routines.map((routine) => (
            <div 
              key={routine.id}
              className={`group bg-white p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                routine.is_active ? 'border-slate-200 hover:border-indigo-600/50 hover:shadow-lg' : 'border-slate-100 opacity-60'
              }`}
            >
              <div className="text-slate-300 group-hover:text-slate-400 transition-colors">
                <GripVertical className="h-5 w-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800 truncate">{routine.title}</h4>
                <p className="text-xs text-slate-400 truncate mt-0.5">{routine.task_detail || '説明なし'}</p>
              </div>


              <div className="flex items-center gap-2 text-slate-400 shrink-0">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">{routine.estimated_time_minutes}分</span>
              </div>

              <div className="flex items-center gap-4 shrink-0 border-l border-slate-100 pl-4">
                <button 
                  onClick={() => handleToggleStatus(routine)}
                  className={`transition-colors ${routine.is_active ? 'text-indigo-600' : 'text-slate-300'}`}
                  title={routine.is_active ? '無効にする' : '有効にする'}
                >
                  {routine.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                </button>
                <button 
                  onClick={() => handleDeleteRoutine(routine.id)}
                  className="text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}

          {routines.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Routines Configured</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutineMaster;
