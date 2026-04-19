import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-12 w-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 初回パスワード変更必須の制御
  if (user.first_login_required && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // 管理者権限チェック
  if (requireAdmin && user.role_code !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 初回パスワード変更画面の場合はLayoutを表示しない（または特別なLayoutにする）
  if (location.pathname === '/change-password') {
    return <Outlet />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoute;

