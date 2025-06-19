import { Task } from '@/types/task';
import { SortOption } from '@/components/atoms/SortDropdown';

/**
 * 優先度を数値に変換（ソート用）
 */
const getPriorityValue = (priority?: 'low' | 'medium' | 'high'): number => {
  switch (priority) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
};

/**
 * 日本語の文字列を比較（あいうえお順）
 */
const compareJapanese = (a: string, b: string): number => {
  return a.localeCompare(b, 'ja', { numeric: true });
};

/**
 * タスクをソートする
 */
export const sortTasks = (tasks: Task[], sortOption: SortOption): Task[] => {
  const sortedTasks = [...tasks];
  
  switch (sortOption) {
    case 'default':
      // デフォルト: 未完了優先 → 優先度順 → 期限日順
      return sortedTasks.sort((a, b) => {
        // 1. 完了状態でソート（未完了が上）
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        
        // 2. 優先度でソート（高い順）
        const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority);
        if (priorityDiff !== 0) return priorityDiff;
        
        // 3. 期限日でソート（近い順、期限なしは最後）
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        
        return 0;
      });
      
    case 'priority_desc':
      return sortedTasks.sort((a, b) => 
        getPriorityValue(b.priority) - getPriorityValue(a.priority)
      );
      
    case 'priority_asc':
      return sortedTasks.sort((a, b) => 
        getPriorityValue(a.priority) - getPriorityValue(b.priority)
      );
      
    case 'streak_desc':
      return sortedTasks.sort((a, b) => 
        (b.current_streak || 0) - (a.current_streak || 0)
      );
      
    case 'streak_asc':
      return sortedTasks.sort((a, b) => 
        (a.current_streak || 0) - (b.current_streak || 0)
      );
      
    case 'due_date_asc':
      return sortedTasks.sort((a, b) => {
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        return 0;
      });
      
    case 'due_date_desc':
      return sortedTasks.sort((a, b) => {
        if (a.due_date && b.due_date) {
          return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
        }
        if (a.due_date && !b.due_date) return 1;
        if (!a.due_date && b.due_date) return -1;
        return 0;
      });
      
    case 'created_desc':
      return sortedTasks.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
    case 'created_asc':
      return sortedTasks.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
    case 'title_asc':
      return sortedTasks.sort((a, b) => 
        compareJapanese(a.title, b.title)
      );
      
    case 'title_desc':
      return sortedTasks.sort((a, b) => 
        compareJapanese(b.title, a.title)
      );
      
    default:
      return sortedTasks;
  }
};

/**
 * ローカルストレージからソート設定を取得
 */
export const getSavedSortOption = (): SortOption => {
  if (typeof window === 'undefined') return 'default';
  
  try {
    const saved = localStorage.getItem('taskSortOption');
    return (saved as SortOption) || 'default';
  } catch {
    return 'default';
  }
};

/**
 * ソート設定をローカルストレージに保存
 */
export const saveSortOption = (option: SortOption): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('taskSortOption', option);
  } catch {
    // ローカルストレージが使用できない場合は無視
  }
}; 