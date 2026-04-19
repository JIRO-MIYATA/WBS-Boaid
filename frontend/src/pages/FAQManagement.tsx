import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { 
  MessageCircleQuestion, 
  Plus, 
  Search,
  X,
  Pencil,
  Trash2,
  AlertCircle,
  User as UserIcon,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FAQ {
  id: number;
  title: string;
  question_detail: string;
  answer_detail: string;
  status: string;
  assignee_user_id: number | null;
  assignee_name: string | null;
  progress_percent: number;
  created_by: number;
  creator_name: string;
  created_at: string;
  updated_at: string;
}

interface UserOption {
  id: number;
  user_name: string;
}

const FAQManagement: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    question_detail: '',
    answer_detail: '',
    status: 'new',
    progress_percent: 0,
    assignee_user_id: '' as number | string
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filter, setFilter] = useState('all'); // all, new, in_progress, completed

  const fetchData = async () => {
    try {
      setLoading(true);
      const [faqRes, userRes] = await Promise.allSettled([
        api.get('/faqs'),
        api.get('/users')
      ]);

      if (faqRes.status === 'fulfilled') {
        setFaqs(faqRes.value.data);
      }
      if (userRes.status === 'fulfilled') {
        setUsers(userRes.value.data.filter((u: any) => u.is_active));
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (faq?: FAQ) => {
    setFormError('');
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        title: faq.title,
        question_detail: faq.question_detail,
        answer_detail: faq.answer_detail || '',
        status: faq.status,
        progress_percent: faq.progress_percent || 0,
        assignee_user_id: faq.assignee_user_id ? String(faq.assignee_user_id) : ''
      });
    } else {
      setEditingFaq(null);
      setFormData({
        title: '',
        question_detail: '',
        answer_detail: '',
        status: 'new',
        progress_percent: 0,
        assignee_user_id: user?.id ? String(user.id) : ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      assignee_user_id: formData.assignee_user_id ? Number(formData.assignee_user_id) : null
    };

    try {
      if (editingFaq) {
        await api.put(`/faqs/${editingFaq.id}`, payload);
      } else {
        await api.post('/faqs', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || '保存に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/faqs/${deletingId}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '削除に失敗しました。');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredFaqs = faqs.filter(faq => {
    if (filter === 'mine') return faq.assignee_user_id !== null && Number(faq.assignee_user_id) === Number(user?.id);
    return filter === 'all' || faq.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-100">未対応 (NEW)</span>;
      case 'in_progress':
        return <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1"><Clock className="h-3 w-3" />対応中</span>;
      case 'completed':
        return <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />完了</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <MessageCircleQuestion className="h-7 w-7 text-indigo-600" />
            問い合わせ・FAQ管理
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">社内からの問い合わせや課題をチケット形式で管理します</p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="h-5 w-5" />
          新規問い合わせ作成
        </button>
      </div>

      <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 w-fit">
        {[
          { id: 'all', label: 'すべて' },
          { id: 'mine', label: '自分の担当分' },
          { id: 'new', label: '未対応' },
          { id: 'in_progress', label: '対応中' },
          { id: 'completed', label: '完了' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
              filter === f.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-10 w-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFaqs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 hover:border-indigo-600/30 transition-colors shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">#{faq.id}</span>
                  {getStatusBadge(faq.status)}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{faq.title}</h3>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${faq.progress_percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                      style={{ width: `${faq.progress_percent || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-500 w-10 text-right">{faq.progress_percent || 0}%</span>
                </div>
                
                <div className="mb-4">
                  <span className="text-xs font-bold text-slate-400 block mb-1">質問・問い合わせ内容</span>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">{faq.question_detail}</p>
                </div>

                {faq.answer_detail && (
                  <div>
                    <span className="text-xs font-bold text-indigo-400 block mb-1">回答・対応内容</span>
                    <p className="text-sm text-indigo-900 whitespace-pre-wrap bg-indigo-50 p-3 rounded-xl border border-indigo-100">{faq.answer_detail}</p>
                  </div>
                )}
              </div>

              <div className="w-full md:w-48 shrink-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">登録者</span>
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1"><UserIcon className="h-3 w-3"/>{faq.creator_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">担当者</span>
                    <span className="text-sm font-bold text-slate-700">{faq.assignee_name || <span className="text-slate-400">未設定</span>}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">更新日時</span>
                    <span className="text-xs font-medium text-slate-500">{formatDate(faq.updated_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => handleOpenModal(faq)}
                    className="flex-1 flex justify-center items-center gap-1 p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors text-xs font-bold"
                  >
                    <Pencil className="h-4 w-4" /> 編集
                  </button>
                  {(user?.role_code === 'admin' || user?.id === faq.created_by) && (
                    <button 
                      onClick={() => setDeletingId(faq.id)}
                      className="flex-1 flex justify-center items-center gap-1 p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs font-bold"
                    >
                      <Trash2 className="h-4 w-4" /> 削除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Search className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">該当するデータがありません</h3>
              <p className="text-sm text-slate-500">条件を変更するか、新規作成してください。</p>
            </div>
          )}
        </div>
      )}

      {/* 登録・編集モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold">{editingFaq ? '問い合わせの編集' : '新規問い合わせ作成'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-5">
                {formError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
                    {formError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">件名 (タイトル) *</label>
                  <input
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="例: 社内システムのログインエラーについて"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">質問・問い合わせ内容 *</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="具体的な事象や質問内容を記載してください"
                    value={formData.question_detail}
                    onChange={(e) => setFormData({ ...formData, question_detail: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">ステータス</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="new">未対応 (NEW)</option>
                      <option value="in_progress">対応中</option>
                      <option value="completed">完了</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">担当者</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={String(formData.assignee_user_id)}
                      onChange={(e) => setFormData({ ...formData, assignee_user_id: e.target.value })}
                    >
                      <option value="">(未設定)</option>
                      {users.map((u) => (
                        <option key={u.id} value={String(u.id)}>{u.user_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">進捗率 (%)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="10"
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      value={formData.progress_percent}
                      onChange={(e) => setFormData({ ...formData, progress_percent: Number(e.target.value) })}
                    />
                    <span className="text-xl font-black text-indigo-600 w-12">{formData.progress_percent}%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo-500 ml-1">対応内容・回答 (対応者が入力)</label>
                  <textarea
                    rows={4}
                    className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="対応した内容や、質問への回答を記載してください"
                    value={formData.answer_detail}
                    onChange={(e) => setFormData({ ...formData, answer_detail: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
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
                    {isSubmitting ? '保存中...' : '保存する'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {deletingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
              <AlertCircle className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">問い合わせの削除</h3>
            <p className="text-sm text-slate-500 mb-6">
              この問い合わせ履歴を削除してもよろしいですか？<br/>
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

export default FAQManagement;
