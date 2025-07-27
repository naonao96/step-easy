import { create } from 'zustand';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User, UserSettings } from '@/lib/supabase';

// AuthContextと同じSupabaseクライアント作成方法を使用
const supabase = createClientComponentClient();

interface UserStore {
  user: User | null;
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  settings: null,
  loading: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (authUser) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            id, email, display_name, character_name, plan_type,
            notification_settings, created_at, updated_at, onboarding_completed_at
          `)
          .eq('id', authUser.id)
          .single();

        if (userError) throw userError;

        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        if (settingsError) throw settingsError;

        set({ user: userData, settings: settingsData });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user: authUser }, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (authUser) {
        const { error: userError } = await supabase.from('users').insert([
          {
            id: authUser.id,
            email,
            displayName,
          },
        ]);

        if (userError) throw userError;

        const { error: settingsError } = await supabase.from('user_settings').insert([
          {
            user_id: authUser.id,
            email_notifications: true,
            push_notifications: true,
            task_reminders: true,
            habit_reminders: true,
            ai_suggestions: true,
            theme: 'light',
            font_size: 'medium',
            compact_mode: false,
          },
        ]);

        if (settingsError) throw settingsError;

        await get().signIn(email, password);
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, settings: null });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  updateUser: async (data: Partial<User>) => {
    set({ loading: true, error: null });
    try {
      const { user } = get();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;

      set({ user: { ...user, ...data } });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  updateSettings: async (data: Partial<UserSettings>) => {
    set({ loading: true, error: null });
    try {
      const { user } = get();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('user_settings')
        .update(data)
        .eq('user_id', user.id);

      if (error) throw error;

      set({ settings: { ...get().settings!, ...data } });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  deleteAccount: async () => {
    set({ loading: true, error: null });
    try {
      const { user } = get();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      await supabase.auth.signOut();
      set({ user: null, settings: null });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
})); 