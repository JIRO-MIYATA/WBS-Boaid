import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  User as UserIcon, 
  LayoutDashboard, 
  CalendarRange, 
  ClipboardList, 
  Users, 
  Settings,
  Target,
  MessageCircleQuestion,
  ChevronRight
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'ダッシュボード', path: '/', icon: LayoutDashboard },
    { name: '年間目標・月次進捗', path: '/goals', icon: CalendarRange },
    { name: '開発業務・進捗管理', path: '/developments', icon: Target },
    { name: '問い合わせ・FAQ', path: '/faqs', icon: MessageCircleQuestion },
    { name: '日次ルーチン業務', path: '/daily-tasks', icon: ClipboardList },
    { name: 'ルーチン設定', path: '/routines', icon: Settings },
  ];


  const adminItems = [
    { name: 'ユーザー管理', path: '/users', icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-72 bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out">
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-xl">W</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight tracking-tight">WBS-Boaid</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Progress System</p>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          <nav className="space-y-1">
            <p className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Menu</p>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${isActive(item.path) ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                  <span className="text-sm font-semibold">{item.name}</span>
                </div>
                {isActive(item.path) && <ChevronRight className="h-4 w-4" />}
              </Link>
            ))}
          </nav>

          {user?.role_code === 'admin' && (
            <nav className="space-y-1">
              <p className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Control</p>
              {adminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 ${isActive(item.path) ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                    <span className="text-sm font-semibold">{item.name}</span>
                  </div>
                  {isActive(item.path) && <ChevronRight className="h-4 w-4" />}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="p-4 bg-slate-800/50 m-4 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center overflow-hidden">
              <UserIcon className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.user_name}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate uppercase">{user?.role_name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent rounded-lg transition-all"
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">
              {location.pathname === '/' && 'ダッシュボード'}
              {location.pathname.startsWith('/goals') && '年間目標・月次進捗'}
              {location.pathname.startsWith('/developments') && '開発業務・進捗管理'}
              {location.pathname.startsWith('/faqs') && '問い合わせ・FAQ管理'}
              {location.pathname === '/daily-tasks' && '日次ルーチン業務'}
              {location.pathname === '/routines' && 'ルーチン設定'}
              {location.pathname === '/users' && 'ユーザー管理'}
              {location.pathname === '/change-password' && 'パスワード変更'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{user?.department_name}</span>
            </div>
            <Link to="/change-password" title="設定" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

