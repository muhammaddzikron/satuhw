import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  activeRole: UserRole | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setActiveRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      activeRole: null,
      setAuth: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true, 
        activeRole: user.activeRole || user.role 
      }),
      logout: () => set({ user: null, token: null, isAuthenticated: false, activeRole: null }),
      updateUser: (updatedUser) => 
        set((state) => {
          const newUser = state.user ? { ...state.user, ...updatedUser } : null;
          return { 
            user: newUser,
            activeRole: updatedUser.activeRole || state.activeRole || newUser?.role || null
          };
        }),
      setActiveRole: (role) => set((state) => ({
        activeRole: role,
        user: state.user ? { ...state.user, activeRole: role } : null
      })),
    }),
    {
      name: 'hw-materi-auth',
    }
  )
);
