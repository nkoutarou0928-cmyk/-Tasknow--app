import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Team, TeamMember, Task, SimEvent, FCMNotification } from '../types';

interface SimulatorContextType {
  users: User[];
  teams: Team[];
  teamMembers: TeamMember[];
  tasks: Task[];
  currentUser: User;
  simTime: Date;
  simEvents: SimEvent[];
  notifications: FCMNotification[];
  sortMode: 'ai' | 'manual';
  setSortMode: (mode: 'ai' | 'manual') => void;
  setCurrentUser: (user: User) => void;
  updateTaskProgress: (taskId: string, progress: number, updaterUser?: User) => void;
  updateTaskDetails: (taskId: string, updates: Partial<Task>) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  deleteTask: (taskId: string) => void;
  advanceTime: (hours: number) => void;
  triggerCronCheck: (explicitTime?: Date) => void;
  simulateTeammateAction: (teammateId: string, taskId: string, newProgress: number) => void;
  clearAllData: () => void;
  setTasksOrder: (orderedTasks: Task[]) => void;
  addToast: (message: string, type: 'info' | 'success' | 'warning') => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

// Initial Seed Data
const INITIAL_USERS: User[] = [
  { id: 'user-alice', name: 'A君 (Alice)', email: 'alice@univ.ac.jp', theme_color: '#ff4d6d' },
  { id: 'user-bob', name: 'Bさん (Bob)', email: 'bob@univ.ac.jp', theme_color: '#06d6a0' },
  { id: 'user-charlie', name: 'C君 (Charlie)', email: 'charlie@univ.ac.jp', theme_color: '#7209b7' },
];

const INITIAL_TEAMS: Team[] = [
  { id: 'team-seminar', team_name: 'ゼミ共同発表課題' },
  { id: 'team-circle', team_name: 'サークル広報局' },
];

const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  { team_id: 'team-seminar', user_id: 'user-alice' },
  { team_id: 'team-seminar', user_id: 'user-bob' },
  { team_id: 'team-seminar', user_id: 'user-charlie' },
  { team_id: 'team-circle', user_id: 'user-alice' },
  { team_id: 'team-circle', user_id: 'user-bob' },
];

const getInitialTasks = (baseTime: Date): Task[] => {
  const oneDay = 24 * 60 * 60 * 1000;
  
  return [
    // --- Team Seminar Tasks ---
    // Level 1: Parent
    {
      id: 'task-seminar-parent',
      title: 'ゼミの共同発表資料作成',
      parent_id: null,
      estimated_minutes: 330,
      progress_rate: 40,
      deadline: new Date(baseTime.getTime() + 2 * oneDay).toISOString(), // 2 days
      team_id: 'team-seminar',
      assigned_user_id: null,
    },
    // Level 2: Child 1
    {
      id: 'task-seminar-child-docs',
      title: '文献調査・資料集め',
      parent_id: 'task-seminar-parent',
      estimated_minutes: 120,
      progress_rate: 100,
      deadline: new Date(baseTime.getTime() + 1 * oneDay).toISOString(),
      team_id: 'team-seminar',
      assigned_user_id: 'user-alice',
    },
    // Level 2: Child 2
    {
      id: 'task-seminar-child-resume',
      title: 'レジュメの印刷と製本',
      parent_id: 'task-seminar-parent',
      estimated_minutes: 30,
      progress_rate: 0,
      deadline: new Date(baseTime.getTime() + 1.8 * oneDay).toISOString(),
      team_id: 'team-seminar',
      assigned_user_id: 'user-bob',
    },
    // Level 2: Child 3
    {
      id: 'task-seminar-child-slide',
      title: 'スライド資料の執筆',
      parent_id: 'task-seminar-parent',
      estimated_minutes: 180,
      progress_rate: 20,
      deadline: new Date(baseTime.getTime() + 2 * oneDay).toISOString(),
      team_id: 'team-seminar',
      assigned_user_id: null,
    },
    // Level 3: Subtasks for Child 3
    {
      id: 'task-seminar-sub-intro',
      title: '前半部分（イントロ・課題定義）',
      parent_id: 'task-seminar-child-slide',
      estimated_minutes: 90,
      progress_rate: 40,
      deadline: new Date(baseTime.getTime() + 1.5 * oneDay).toISOString(),
      team_id: 'team-seminar',
      assigned_user_id: 'user-charlie',
    },
    {
      id: 'task-seminar-sub-body',
      title: '後半部分（提案手法・評価）',
      parent_id: 'task-seminar-child-slide',
      estimated_minutes: 90,
      progress_rate: 0,
      deadline: new Date(baseTime.getTime() + 2 * oneDay).toISOString(),
      team_id: 'team-seminar',
      assigned_user_id: 'user-charlie',
    },

    // --- Personal Job Hunting Tasks ---
    // Level 1: Parent
    {
      id: 'task-job-parent',
      title: '就活エントリーシート提出 (大手IT企業)',
      parent_id: null,
      estimated_minutes: 150,
      progress_rate: 20,
      deadline: new Date(baseTime.getTime() + 0.8 * oneDay).toISOString(), // 19.2 hours
      team_id: null,
      assigned_user_id: 'user-alice',
    },
    // Level 2: Child
    {
      id: 'task-job-draft',
      title: '自己PRの添削依頼',
      parent_id: 'task-job-parent',
      estimated_minutes: 60,
      progress_rate: 50,
      deadline: new Date(baseTime.getTime() + 0.4 * oneDay).toISOString(), // 9.6 hours
      team_id: null,
      assigned_user_id: 'user-alice',
    },
    // Level 2: Child
    {
      id: 'task-job-reason',
      title: '志望動機の推敲',
      parent_id: 'task-job-parent',
      estimated_minutes: 90,
      progress_rate: 0,
      deadline: new Date(baseTime.getTime() + 0.8 * oneDay).toISOString(),
      team_id: null,
      assigned_user_id: 'user-alice',
    },

    // --- Circle Tasks ---
    {
      id: 'task-circle-parent',
      title: '夏合宿の案内チラシ作成',
      parent_id: null,
      estimated_minutes: 180,
      progress_rate: 60,
      deadline: new Date(baseTime.getTime() + 5 * oneDay).toISOString(),
      team_id: 'team-circle',
      assigned_user_id: null,
    },
    {
      id: 'task-circle-design',
      title: 'デザイン原案作成',
      parent_id: 'task-circle-parent',
      estimated_minutes: 120,
      progress_rate: 90,
      deadline: new Date(baseTime.getTime() + 3 * oneDay).toISOString(),
      team_id: 'team-circle',
      assigned_user_id: 'user-bob',
    },
    {
      id: 'task-circle-print',
      title: '部室での配布と掲示',
      parent_id: 'task-circle-parent',
      estimated_minutes: 60,
      progress_rate: 0,
      deadline: new Date(baseTime.getTime() + 5 * oneDay).toISOString(),
      team_id: 'team-circle',
      assigned_user_id: 'user-alice',
    }
  ];
};

export const SimulatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial settings or local storage
  const [simTime, setSimTime] = useState<Date>(() => {
    const saved = localStorage.getItem('sim_time');
    return saved ? new Date(saved) : new Date();
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('sim_tasks');
    return saved ? JSON.parse(saved) : getInitialTasks(new Date());
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('sim_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0];
  });

  const [simEvents, setSimEvents] = useState<SimEvent[]>(() => {
    const saved = localStorage.getItem('sim_events');
    return saved ? JSON.parse(saved) : [
      {
        id: 'evt-init',
        timestamp: new Date().toLocaleTimeString(),
        user: 'システム',
        message: 'タスク管理シミュレータが起動しました。初期データをロードしました。',
        type: 'info'
      }
    ];
  });

  const [notifications, setNotifications] = useState<FCMNotification[]>(() => {
    const saved = localStorage.getItem('sim_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [sortMode, setSortMode] = useState<'ai' | 'manual'>(() => {
    return (localStorage.getItem('sim_sort_mode') as 'ai' | 'manual') || 'ai';
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('sim_time', simTime.toISOString());
  }, [simTime]);

  useEffect(() => {
    localStorage.setItem('sim_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('sim_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sim_events', JSON.stringify(simEvents));
  }, [simEvents]);

  useEffect(() => {
    localStorage.setItem('sim_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('sim_sort_mode', sortMode);
  }, [sortMode]);

  // Toast notifications helper
  const addToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to add simulation event
  const addSimEvent = (user: string, message: string, type: 'info' | 'success' | 'warning' | 'websocket' | 'notification') => {
    const newEvent: SimEvent = {
      id: 'evt-' + Math.random().toString(36).substr(2, 9),
      timestamp: simTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      user,
      message,
      type,
    };
    setSimEvents((prev) => [newEvent, ...prev.slice(0, 49)]); // Cap at 50 logs
  };

  // RECURSIVE PROGRESS PROPAGATION
  // Updates the progress of all ancestor tasks when a child task is modified
  const propagateProgressUp = (taskList: Task[], parentId: string | null): Task[] => {
    if (!parentId) return taskList;

    // Find all siblings (tasks sharing the same parentId)
    const siblings = taskList.filter((t) => t.parent_id === parentId);
    if (siblings.length === 0) return taskList;

    // Calculate average progress
    const totalProgress = siblings.reduce((sum, s) => sum + s.progress_rate, 0);
    const avgProgress = Math.round(totalProgress / siblings.length);

    // Find the parent
    const parentIndex = taskList.findIndex((t) => t.id === parentId);
    if (parentIndex === -1) return taskList;

    const parent = taskList[parentIndex];
    
    // Only update and propagate if it actually changed
    if (parent.progress_rate !== avgProgress) {
      const updatedList = [...taskList];
      updatedList[parentIndex] = {
        ...parent,
        progress_rate: avgProgress,
      };

      // Recurse upwards to parent's parent
      return propagateProgressUp(updatedList, parent.parent_id);
    }

    return taskList;
  };

  // Recalculates all parent/grandparent progress rates based on leaf nodes
  // Used after batch updates or database initializations
  const rebuildAllParentProgress = (taskList: Task[]): Task[] => {
    let list = [...taskList];
    // Find all parents (tasks that are parent_id of some other task)
    const parentIds = Array.from(new Set(list.map(t => t.parent_id).filter((id): id is string => id !== null)));
    
    // Sort parentIds so we calculate from bottom of tree up
    // Deepest parents (whose children have no children themselves) first.
    // A simple way is to repeat calculation until no parent progress changes.
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 5) {
      changed = false;
      for (const parentId of parentIds) {
        const siblings = list.filter(t => t.parent_id === parentId);
        if (siblings.length > 0) {
          const avg = Math.round(siblings.reduce((sum, s) => sum + s.progress_rate, 0) / siblings.length);
          const idx = list.findIndex(t => t.id === parentId);
          if (idx !== -1 && list[idx].progress_rate !== avg) {
            list[idx] = { ...list[idx], progress_rate: avg };
            changed = true;
          }
        }
      }
      iterations++;
    }
    return list;
  };

  // UPDATE TASK PROGRESS
  const updateTaskProgress = (taskId: string, progress: number, updater: User = currentUser) => {
    // 0 <= progress <= 100
    const finalProgress = Math.min(100, Math.max(0, progress));
    
    setTasks((prevTasks) => {
      const taskIndex = prevTasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prevTasks;

      const targetTask = prevTasks[taskIndex];
      
      // Check if it's a leaf node. We only allow editing progress directly for leaf nodes.
      // (If a task has children, its progress is computed automatically, not edited directly)
      const hasChildren = prevTasks.some((t) => t.parent_id === taskId);
      if (hasChildren) {
        // Just return as progress is computed
        return prevTasks;
      }

      // Perform update
      let updatedTasks = [...prevTasks];
      updatedTasks[taskIndex] = {
        ...targetTask,
        progress_rate: finalProgress,
      };

      // Propagate progress to parent tasks
      updatedTasks = propagateProgressUp(updatedTasks, targetTask.parent_id);

      // Check parent status to trigger a scenario toast/log
      const oldProgress = targetTask.progress_rate;
      
      // Logging and Toast logic
      const taskName = targetTask.title;
      if (updater.id === currentUser.id) {
        addSimEvent(updater.name, `タスク『${taskName}』の進捗を ${oldProgress}% ➔ ${finalProgress}% に更新しました。`, 'success');
        addToast(`タスク『${taskName}』を更新しました (${finalProgress}%)`, 'success');
      } else {
        // Teammate updated it (WebSocket simulation)
        addSimEvent(updater.name, `WebSocket配信: 共同タスク『${taskName}』が ${updater.name} により ${finalProgress}% に更新されました。`, 'websocket');
        addToast(`${updater.name}が『${taskName}』を更新しました (${finalProgress}%)`, 'info');
      }

      // Trace parent progress changes for scenario log
      if (targetTask.parent_id) {
        const parentBefore = prevTasks.find((t) => t.id === targetTask.parent_id);
        const parentAfter = updatedTasks.find((t) => t.id === targetTask.parent_id);
        if (parentBefore && parentAfter && parentBefore.progress_rate !== parentAfter.progress_rate) {
          addSimEvent(
            'バックエンド', 
            `親タスク『${parentBefore.title}』の進捗を再計算: ${parentBefore.progress_rate}% ➔ ${parentAfter.progress_rate}%`, 
            'info'
          );
        }
      }

      return updatedTasks;
    });
  };

  // UPDATE TASK DETAILS (Title, estimated_minutes, deadline, assigned_user)
  const updateTaskDetails = (taskId: string, updates: Partial<Task>) => {
    setTasks((prevTasks) => {
      const idx = prevTasks.findIndex(t => t.id === taskId);
      if (idx === -1) return prevTasks;
      
      const updated = [...prevTasks];
      updated[idx] = { ...updated[idx], ...updates } as Task;
      
      // If estimated minutes changed, it could trigger progress calculation changes (if using weighted, but we use simple average)
      // If we added or modified children, rebuild parent progresses just in case
      const rebuilt = rebuildAllParentProgress(updated);
      
      addSimEvent(currentUser.name, `タスク『${updated[idx].title}』の詳細を更新しました。`, 'info');
      return rebuilt;
    });
  };

  // ADD TASK
  const addTask = (taskDetails: Omit<Task, 'id'>) => {
    const newId = 'task-' + Math.random().toString(36).substr(2, 9);
    const newTask: Task = {
      ...taskDetails,
      id: newId,
    };

    setTasks((prevTasks) => {
      let updated = [...prevTasks, newTask];
      // Recalculate progress rates since parent might now have a new child
      updated = rebuildAllParentProgress(updated);
      addSimEvent(currentUser.name, `新規タスク『${newTask.title}』を作成しました。`, 'success');
      addToast(`タスク『${newTask.title}』を作成しました。`, 'success');
      return updated;
    });
  };

  // DELETE TASK
  const deleteTask = (taskId: string) => {
    setTasks((prevTasks) => {
      const target = prevTasks.find(t => t.id === taskId);
      if (!target) return prevTasks;
      
      // Delete task and all its recursive children
      const getChildrenIds = (id: string): string[] => {
        const children = prevTasks.filter(t => t.parent_id === id);
        return [id, ...children.flatMap(c => getChildrenIds(c.id))];
      };
      
      const idsToDelete = getChildrenIds(taskId);
      const updated = prevTasks.filter(t => !idsToDelete.includes(t.id));
      const rebuilt = rebuildAllParentProgress(updated);
      
      addSimEvent(currentUser.name, `タスク『${target.title}』(および子タスク計 ${idsToDelete.length - 1} 個) を削除しました。`, 'warning');
      addToast(`タスクを削除しました。`, 'warning');
      return rebuilt;
    });
  };

  // ADVANCE TIME (Time Travel)
  const advanceTime = (hours: number) => {
    setSimTime((prevTime) => {
      const nextTime = new Date(prevTime.getTime() + hours * 60 * 60 * 1000);
      
      // Add event
      addSimEvent(
        'システム', 
        `時間を ${hours} 時間進めました。(${prevTime.toLocaleString()} ➔ ${nextTime.toLocaleString()})`, 
        'info'
      );
      
      // Check if we crossed 12:00 or 20:00 simulation-time to trigger Cron check
      // For simplicity, we trigger a cron check right after time changes to let users see the effect instantly
      setTimeout(() => {
        triggerCronCheck(nextTime);
      }, 50);

      return nextTime;
    });
  };

  // CRON JOB FOR PREDICTIVE NOTIFICATION
  const triggerCronCheck = (currentTime: Date = simTime) => {
    let notificationsAdded = 0;
    
    setTasks((currentTasks) => {
      const newNotifications: FCMNotification[] = [];
      
      currentTasks.forEach((task) => {
        // We only check leaf tasks (since actual work is done there)
        const hasChildren = currentTasks.some(t => t.parent_id === task.id);
        if (hasChildren || task.progress_rate >= 100) return;

        // Calculate hours remaining
        const diffMs = new Date(task.deadline).getTime() - currentTime.getTime();
        const remainingHours = diffMs / (1000 * 60 * 60);

        // Remaining estimated work in hours
        const remainingMinutes = task.estimated_minutes * ((100 - task.progress_rate) / 100);
        const remainingWorkHours = remainingMinutes / 60;

        // Condition: Remaining time < Remaining Work * 1.5
        // Or if deadline already passed and progress < 100%
        const isYabai = remainingHours < (remainingWorkHours * 1.5);
        
        if (isYabai && remainingHours > -48) { // Don't notify for tasks overdue by more than 2 days
          // Check if notification already exists to avoid duplication
          setNotifications((prevNotifs) => {
            const alreadyExists = prevNotifs.some(n => n.taskTitle === task.title && !n.read);
            if (alreadyExists) return prevNotifs;
            
            const message = `このままだと間に合いません！今すぐ『${task.title}』を始めましょう`;
            const notif: FCMNotification = {
              id: 'notif-' + Math.random().toString(36).substr(2, 9),
              taskTitle: task.title,
              message,
              timestamp: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false,
            };
            
            newNotifications.push(notif);
            notificationsAdded++;
            return [notif, ...prevNotifs];
          });
        }
      });

      if (newNotifications.length > 0) {
        newNotifications.forEach(n => {
          addSimEvent(
            'FCMバッチ処理', 
            `予測警告通知を送信: 『${n.taskTitle}』 - "${n.message}"`, 
            'notification'
          );
          addToast(`⚠️ 予測リマインダー: ${n.message}`, 'warning');
        });
      } else {
        addSimEvent('FCMバッチ処理', `Cronジョブが実行されました。期限が迫った「やばい」タスクはありません。`, 'info');
      }

      return currentTasks;
    });
  };

  // SIMULATE TEAMMATE ACTIONS
  const simulateTeammateAction = (teammateId: string, taskId: string, newProgress: number) => {
    const teammate = INITIAL_USERS.find(u => u.id === teammateId);
    if (!teammate) return;
    
    updateTaskProgress(taskId, newProgress, teammate);
  };

  // CLEAR DATA & RESET
  const clearAllData = () => {
    localStorage.removeItem('sim_tasks');
    localStorage.removeItem('sim_time');
    localStorage.removeItem('sim_current_user');
    localStorage.removeItem('sim_events');
    localStorage.removeItem('sim_notifications');
    localStorage.removeItem('sim_sort_mode');
    
    const base = new Date();
    setSimTime(base);
    setTasks(getInitialTasks(base));
    setCurrentUser(INITIAL_USERS[0]);
    setNotifications([]);
    setSortMode('ai');
    setSimEvents([
      {
        id: 'evt-reset',
        timestamp: base.toLocaleTimeString(),
        user: 'システム',
        message: 'シミュレーターデータを初期状態にリセットしました。',
        type: 'info'
      }
    ]);
    addToast('データをリセットしました', 'info');
  };

  // MANUAL SORT ORDER SETTING
  const setTasksOrder = (orderedTasks: Task[]) => {
    setTasks(orderedTasks);
  };

  return (
    <SimulatorContext.Provider
      value={{
        users: INITIAL_USERS,
        teams: INITIAL_TEAMS,
        teamMembers: INITIAL_TEAM_MEMBERS,
        tasks,
        currentUser,
        simTime,
        simEvents,
        notifications,
        sortMode,
        setSortMode,
        setCurrentUser,
        updateTaskProgress,
        updateTaskDetails,
        addTask,
        deleteTask,
        advanceTime,
        triggerCronCheck,
        simulateTeammateAction,
        clearAllData,
        setTasksOrder,
        addToast,
        toasts,
        removeToast,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
};

export const useSimulator = () => {
  const context = useContext(SimulatorContext);
  if (context === undefined) {
    throw new Error('useSimulator must be used within a SimulatorProvider');
  }
  return context;
};
