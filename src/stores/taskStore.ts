import { create } from 'zustand';
import { Task } from '@/types/task';

interface TaskStore {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  setCurrentTask: (task: Task | null) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement API call
      const mockTasks: Task[] = [];
      set({ tasks: mockTasks });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement API call
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        ...taskData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set((state) => ({ tasks: [...state.tasks, newTask] }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTask: async (id, taskData) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement API call
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id
            ? { ...task, ...taskData, updated_at: new Date().toISOString() }
            : task
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement API call
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  completeTask: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement API call
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                status: 'done',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : task
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentTask: (task) => {
    set({ currentTask: task });
  },
})); 