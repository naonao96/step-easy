'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStore } from '@/stores/taskStore';
import { useUserStore } from '@/stores/userStore';
import { useCharacterMessage } from '@/hooks/useCharacterMessage';
import { useMessageDisplay } from '@/hooks/useMessageDisplay';

import { Task } from '@/stores/taskStore';
import { AppLayout } from '@/components/templates/AppLayout';
import { Character } from '@/components/molecules/Character';
import { TaskListHome } from '@/components/molecules/TaskListHome';
import { Calendar } from '@/components/molecules/Calendar';
import { ModernMobileHome } from '@/components/molecules/ModernMobileHome';

export default function MenuPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { tasks, fetchTasks, updateTask, deleteTask } = useTaskStore();
  const { user: userStore } = useUserStore();
  
  // 基本状態管理
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [characterMood, setCharacterMood] = useState<'happy' | 'normal' | 'sad'>('normal');
  const [greeting, setGreeting] = useState('');
  const [currentMobileTab, setCurrentMobileTab] = useState<'tasks' | 'habits'>('tasks');
  const [currentTimePeriod, setCurrentTimePeriod] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  // レスポンシブ判定（シンプルな実装）
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => { 
    setMounted(true);
    setIsDesktop(window.innerWidth >= 1024);
    
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 初期化処理
  useEffect(() => {
    const initializeData = async () => {
      if (user?.id) {
        // ログイン日時を記録
        const today = new Date();
        const lastLoginKey = `lastLogin_${user.id}`;
        localStorage.setItem(lastLoginKey, today.toISOString());
      }
    };
    
    initializeData();
  }, [user?.id]);

  // タスクデータの取得
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 選択日付のタスクをフィルタリング
  const selectedDateTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date);
    return taskDate.toDateString() === selectedDate.toDateString();
  });

  // 統計データの計算
  const statistics = {
    completedTasks: tasks.filter(task => task.status === 'done').length,
    totalTasks: tasks.length,
    todayCompletedTasks: tasks.filter(task => {
      if (!task.due_date) return false;
      const today = new Date();
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === today.toDateString() && task.status === 'done';
    }).length,
    todayTotalTasks: tasks.filter(task => {
      if (!task.due_date) return false;
      const today = new Date();
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === today.toDateString();
    }).length,
    selectedDateCompletedTasks: selectedDateTasks.filter(task => task.status === 'done').length,
    selectedDateTotalTasks: selectedDateTasks.length,
    overallPercentage: tasks.length > 0 ? Math.round((tasks.filter(task => task.status === 'done').length / tasks.length) * 100) : 0,
    todayPercentage: tasks.filter(task => {
      if (!task.due_date) return false;
      const today = new Date();
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === today.toDateString();
    }).length > 0 ? Math.round((tasks.filter(task => {
      if (!task.due_date) return false;
      const today = new Date();
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === today.toDateString() && task.status === 'done';
    }).length / tasks.filter(task => {
      if (!task.due_date) return false;
      const today = new Date();
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === today.toDateString();
    }).length) * 100) : 0,
    selectedDatePercentage: selectedDateTasks.length > 0 ? Math.round((selectedDateTasks.filter(task => task.status === 'done').length / selectedDateTasks.length) * 100) : 0,
  };

  // AIキャラクターメッセージ
  const { message: characterMessage, generateNewMessage } = useCharacterMessage({
    userType: user?.planType || 'guest',
    userName: (user?.displayName || user?.email?.split('@')[0] || 'ユーザー') + 'さん',
    tasks,
    statistics,
    selectedDate
  });

  // メッセージ表示管理
  const { showMessage, isTyping, displayedMessage, startMessage, hideMessage } = useMessageDisplay();

  // 初回表示（一度だけ実行）
  useEffect(() => {
    if (mounted && isDesktop && characterMessage && !showMessage) {
      startMessage(characterMessage);
    }
  }, [mounted, isDesktop, characterMessage, showMessage, startMessage]);

  // クリック処理
  const handleClick = async () => {
    if (!isTyping) {
      await generateNewMessage();
      if (characterMessage) {
        startMessage(characterMessage);
      }
    }
  };

  // 外部クリックでメッセージを消す機能
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMessage && !isTyping) {
        const target = event.target as HTMLElement;
        if (!target.closest('.character-container')) {
          hideMessage();
        }
      }
    };

    if (showMessage) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMessage, isTyping, hideMessage]);

  // キャラクターの表情更新
  useEffect(() => {
    const { todayCompletedTasks, todayTotalTasks } = statistics;

    if (todayTotalTasks === 0) {
      setCharacterMood('normal');
    } else if (todayCompletedTasks === todayTotalTasks) {
      setCharacterMood('happy');
    } else if (todayCompletedTasks / todayTotalTasks >= 0.7) {
      setCharacterMood('happy');
    } else if (todayCompletedTasks / todayTotalTasks >= 0.3) {
      setCharacterMood('normal');
    } else {
      setCharacterMood('sad');
    }
  }, [statistics]);

  // タスク操作関数
  const handleCompleteTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const completedAt = newStatus === 'done' ? new Date().toISOString() : undefined;
    
    await updateTask(id, { 
      status: newStatus, 
      completed_at: completedAt 
    });
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
      await deleteTask(id);
    }
  };

  const handleEditTask = (task: Task) => {
    router.push(`/tasks?id=${task.id}&edit=true`);
  };



  // 時間帯による挨拶の設定
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('おはようございます');
    } else if (hour < 18) {
      setGreeting('こんにちは');
    } else {
      setGreeting('こんばんは');
    }
  }, []);

  // FABクリック時の処理
  const handleFABClick = () => {
    if (currentMobileTab === 'habits') {
      router.push('/tasks?type=habit');
    } else {
      router.push('/tasks?type=task');
    }
  };

  return (
    <AppLayout variant="home" tasks={tasks as any} showNotifications={true} onFABClick={handleFABClick}>
      {/* モバイル専用レイアウト */}
      <div className="lg:hidden">
        <ModernMobileHome
          selectedDate={selectedDate}
          selectedDateTasks={selectedDateTasks}
          tasks={tasks}
          statistics={statistics}
          characterMood={characterMood}
          characterMessage={characterMessage}
          onCompleteTask={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
          onDateSelect={setSelectedDate}
          onTabChange={setCurrentMobileTab}
          onTaskUpdate={fetchTasks}
        />
      </div>

      {/* デスクトップ版レイアウト */}
      <div className="hidden lg:block px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto w-full min-h-screen">
        {/* 右下固定のキャラクター */}
        {mounted && isDesktop && (
          <div className="fixed bottom-6 right-24 z-10 character-container">
            <Character
              mood={characterMood}
              message={displayedMessage}
              showMessage={showMessage}
              isTyping={isTyping}
              bubblePosition="left"
              size="3cm"
              onClick={handleClick}
              isDesktop={isDesktop}
              currentTimePeriod={currentTimePeriod}
            />
          </div>
        )}
        
        {/* メインコンテンツ */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <TaskListHome
                tasks={selectedDateTasks as any}
                selectedDate={selectedDate}
                onAddTask={() => router.push('/tasks')}
                onCompleteTask={handleCompleteTask}
                height={46}
              />
              <Calendar 
                tasks={tasks}
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  const newDate = new Date(date);
                  newDate.setHours(0, 0, 0, 0);
                  setSelectedDate(newDate);
                }}
              />
          </div>
        </div>
      </div>


    </AppLayout>
  );
}