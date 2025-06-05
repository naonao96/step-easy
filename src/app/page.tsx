'use client';

import { useState, useEffect } from "react";
import { useAuth } from './contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Task {
  id: number;
  name: string;
  completed: boolean;
  status: string;
}

export default function Home() {
  const { isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, name: "プロジェクト企画書を作成する", completed: false, status: "今日まで" },
    { id: 2, name: "ミーティングの準備", completed: true, status: "完了" },
    { id: 3, name: "クライアントへの連絡", completed: false, status: "明日まで" },
    { id: 4, name: "週報の提出", completed: false, status: "金曜日まで" },
    { id: 5, name: "プレゼン資料の作成", completed: false, status: "期限切れ" },
  ]);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 未ログインの場合、ログインページにリダイレクト
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    updateProgress();
  }, [isLoggedIn, router, tasks]);

  const updateProgress = () => {
    const completedTasks = tasks.filter(task => task.completed).length;
    const progressPercent = Math.round((completedTasks / tasks.length) * 100);
    setProgress(progressPercent);
  };

  const handleAddTask = () => {
    const taskName = prompt('新しいタスクを入力してください:');
    if (taskName) {
      const newTask: Task = {
        id: tasks.length + 1,
        name: taskName,
        completed: false,
        status: "新規"
      };
      setTasks([newTask, ...tasks]);
    }
  };

  const handleTaskStatusChange = (taskId: number) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const completed = !task.completed;
        return {
          ...task,
          completed,
          status: completed ? "完了" : task.status === "完了" ? "進行中" : task.status
        };
      }
      return task;
    }));
  };

  return (
    <div className="min-h-screen p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">StepEasy</h1>
        <button 
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          ログアウト
        </button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* タスク一覧 */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">タスク一覧</h2>
            <div className="task-list">
              <ul>
                {tasks.map(task => (
                  <li key={task.id} className="flex items-center p-3 border-b hover:bg-blue-50 transition-colors">
                    <input
                      type="checkbox"
                      className="w-5 h-5 mr-3 accent-blue-600"
                      checked={task.completed}
                      onChange={() => handleTaskStatusChange(task.id)}
                    />
                    <span className={task.completed ? "line-through text-gray-500" : ""}>
                      {task.name}
                    </span>
                    <span className={`ml-auto text-sm ${
                      task.status === "完了" ? "bg-green-100 text-green-800" :
                      task.status === "期限切れ" ? "bg-red-100 text-red-800" :
                      task.status === "今日まで" ? "bg-yellow-100 text-yellow-800" :
                      "bg-blue-100 text-blue-800"
                    } px-2 py-1 rounded`}>
                      {task.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex gap-6">
            {/* タスク追加ボタン */}
            <button
              onClick={handleAddTask}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center justify-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              タスク追加
            </button>
            
            {/* 進捗グラフ */}
            <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col items-center justify-center w-32">
              <h3 className="text-lg font-medium text-gray-700 mb-2">進捗状況</h3>
              <div className="progress-circle w-32 h-32">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#eee"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="3"
                    strokeDasharray={`${progress}, 100`}
                    strokeLinecap="round"
                  />
                  <text x="18" y="20.5" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#4f46e5">
                    {progress}%
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {/* カレンダー */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">カレンダー</h2>
            <div className="flex justify-between items-center mb-4">
              <button className="text-blue-600 hover:text-blue-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <h3 className="font-medium">2023年11月</h3>
              <button className="text-blue-600 hover:text-blue-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="calendar-grid mb-2">
              <div className="calendar-day text-red-500 font-medium">日</div>
              <div className="calendar-day font-medium">月</div>
              <div className="calendar-day font-medium">火</div>
              <div className="calendar-day font-medium">水</div>
              <div className="calendar-day font-medium">木</div>
              <div className="calendar-day font-medium">金</div>
              <div className="calendar-day text-blue-500 font-medium">土</div>
            </div>
            
            <div className="calendar-grid">
              <div className="calendar-day text-gray-400">29</div>
              <div className="calendar-day text-gray-400">30</div>
              <div className="calendar-day text-gray-400">31</div>
              <div className="calendar-day">1</div>
              <div className="calendar-day">2</div>
              <div className="calendar-day">3</div>
              <div className="calendar-day text-blue-500">4</div>
              
              <div className="calendar-day text-red-500">5</div>
              <div className="calendar-day">6</div>
              <div className="calendar-day">7</div>
              <div className="calendar-day">8</div>
              <div className="calendar-day">9</div>
              <div className="calendar-day">10</div>
              <div className="calendar-day text-blue-500">11</div>
              
              <div className="calendar-day text-red-500">12</div>
              <div className="calendar-day">13</div>
              <div className="calendar-day">14</div>
              <div className="calendar-day">15</div>
              <div className="calendar-day">16</div>
              <div className="calendar-day">17</div>
              <div className="calendar-day text-blue-500">18</div>
              
              <div className="calendar-day text-red-500">19</div>
              <div className="calendar-day">20</div>
              <div className="calendar-day">21</div>
              <div className="calendar-day">22</div>
              <div className="calendar-day">23</div>
              <div className="calendar-day">24</div>
              <div className="calendar-day text-blue-500">25</div>
              
              <div className="calendar-day text-red-500">26</div>
              <div className="calendar-day">27</div>
              <div className="calendar-day">28</div>
              <div className="calendar-day">29</div>
              <div className="calendar-day">30</div>
              <div className="calendar-day text-gray-400">1</div>
              <div className="calendar-day text-gray-400 text-blue-500">2</div>
            </div>
          </div>
          
          {/* セキセイインコのチャットボット */}
          <div className="flex items-center gap-4">
            {/* 吹き出し（左側）*/} 
            <div className="speech-bubble bg-white p-4 rounded-xl shadow-md flex-1">
              <p className="text-gray-800">こんにちは！今日のタスクを一緒に管理しましょう。何かお手伝いできることはありますか？</p>
            </div>
            
            {/* セキセイインコ（右側） */} 
            <div className="w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                {/* 頭 */}
                <ellipse cx="50" cy="60" rx="30" ry="35" fill="#a3e635" />
                {/* 目 */}
                <circle cx="50" cy="30" r="20" fill="#a3e635" />
                {/* 口 */}
                <path d="M50 35 L40 40 L50 45 Z" fill="#f59e0b" />
                {/* 目の瞳 */}
                <circle cx="57" cy="28" r="4" fill="black" />
                {/* 目の瞳の白い部分 */}
                <circle cx="58" cy="27" r="1" fill="white" />
                {/* 羽 */}
                <path d="M20 60 Q30 40 20 30" stroke="#86efac" strokeWidth="5" fill="none" />
                <path d="M80 60 Q70 40 80 30" stroke="#86efac" strokeWidth="5" fill="none" />
                {/* 足 */}
                <path d="M40 95 L40 85" stroke="#f59e0b" strokeWidth="3" />
                <path d="M60 95 L60 85" stroke="#f59e0b" strokeWidth="3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}