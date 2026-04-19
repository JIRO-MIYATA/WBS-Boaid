import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import GoalList from './pages/GoalList';
import GoalDetail from './pages/GoalDetail';
import MonthlyProgressInput from './pages/MonthlyProgressInput';
import RoutineMaster from './pages/RoutineMaster';
import DailyExecution from './pages/DailyExecution';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 公開ルート */}
          <Route path="/login" element={<Login />} />

          {/* 認証必須ルート */}
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/" element={<Dashboard />} />
            
            {/* 年間目標・進捗ルート */}
            <Route path="/goals" element={<GoalList />} />
            <Route path="/goals/:id" element={<GoalDetail />} />
            <Route path="/goals/:goalId/progress/:assignmentId" element={<MonthlyProgressInput />} />
            
            {/* 日次ルーチンルート */}
            <Route path="/daily-tasks" element={<DailyExecution />} />
            <Route path="/routines" element={<RoutineMaster />} />
          </Route>

          {/* 管理者必須ルート */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/users" element={<Dashboard />} />
          </Route>



          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
