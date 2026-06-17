import React, { useState } from 'react';
import { SimulatorProvider, useSimulator } from './context/SimulatorContext';
import { DashboardView } from './components/DashboardView';
import { TaskTree, TaskFormModal } from './components/TaskTree';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { Plus, CheckSquare, ListTree, BookOpen } from 'lucide-react';

const AppInner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tree'>('dashboard');
  const [showAddRootModal, setShowAddRootModal] = useState(false);
  const { currentUser, tasks } = useSimulator();

  // Calculate overall progress for the active user (all assigned leaf tasks)
  const userTasks = tasks.filter(t => t.assigned_user_id === currentUser.id);
  const userLeafTasks = userTasks.filter(t => !tasks.some(child => child.parent_id === t.id));
  const completedUserLeafTasks = userLeafTasks.filter(t => t.progress_rate === 100);
  const overallProgress = userLeafTasks.length > 0
    ? Math.round((completedUserLeafTasks.length / userLeafTasks.length) * 100)
    : 0;

  return (
    <div className="app-container">
      {/* Main Workspace (Left) */}
      <div className="main-content">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              <BookOpen size={28} style={{ color: 'var(--accent-blue)' }} />
              GradTask AI
              <span 
                style={{ 
                  fontSize: '11px', 
                  background: 'rgba(0, 240, 255, 0.12)', 
                  border: '1px solid rgba(0, 240, 255, 0.3)', 
                  color: 'var(--accent-blue)', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  fontWeight: 600,
                  marginLeft: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                v1.0 (大学生向け)
              </span>
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              大学生のための流動的優先度タスク管理システム
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* User mini stats */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                background: 'rgba(255,255,255,0.03)',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '12px'
              }}
            >
              <div 
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: currentUser.theme_color
                }}
              />
              <span style={{ fontWeight: 600 }}>{currentUser.name}の進捗:</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent-blue)' }}>
                {overallProgress}%
              </span>
            </div>

            <button 
              onClick={() => setShowAddRootModal(true)}
              style={{
                background: 'linear-gradient(135deg, var(--accent-blue) 0%, #00a8ff 100%)',
                border: 'none',
                color: 'var(--bg-main)',
                padding: '10px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: 'var(--glow-blue)',
                transition: 'var(--transition-fast)'
              }}
            >
              <Plus size={16} />
              新規タスク
            </button>
          </div>
        </header>

        {/* View Selection Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="view-tabs">
            <button 
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <CheckSquare size={16} />
              統合ToDo (優先度順)
            </button>
            <button 
              className={`tab-btn ${activeTab === 'tree' ? 'active' : ''}`}
              onClick={() => setActiveTab('tree')}
            >
              <ListTree size={16} />
              タスク階層化ツリー
            </button>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            💡 AI優先度スコアは「作業量」と「残り時間」からリアルタイムに再計算されます。
          </div>
        </div>

        {/* Workspace views */}
        <div style={{ flex: 1 }}>
          {activeTab === 'dashboard' ? <DashboardView /> : <TaskTree />}
        </div>
      </div>

      {/* Simulator Sidebar (Right) */}
      <Sidebar />

      {/* Toast Alert popup overlay */}
      <ToastContainer />

      {/* Add Root Level Task Modal */}
      {showAddRootModal && (
        <TaskFormModal onClose={() => setShowAddRootModal(false)} />
      )}
    </div>
  );
};

function App() {
  return (
    <SimulatorProvider>
      <AppInner />
    </SimulatorProvider>
  );
}

export default App;
