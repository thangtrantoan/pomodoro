import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from '../types';

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface TaskState {
  tasks: Task[];
  /** Task đang chạy phiên — null khi hàng đợi rỗng hoặc user chưa chọn */
  currentTaskId: string | null;

  addTask: (name: string) => string;
  removeTask: (id: string) => void;
  renameTask: (id: string, name: string) => void;
  selectTask: (id: string) => void;
  /** +1 pomodoro cho task — gọi khi một phiên focus chạy hết giờ */
  incrementCompleted: (id: string) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      currentTaskId: null,

      addTask: (name) => {
        const task: Task = {
          id: makeId(),
          name,
          completed: 0,
          createdAt: Date.now(),
          archived: false,
        };
        set((state) => ({
          tasks: [...state.tasks, task],
          // Task đầu tiên tự được chọn — user không phải thao tác thêm một bước
          currentTaskId: state.currentTaskId ?? task.id,
        }));
        return task.id;
      },

      removeTask: (id) =>
        set((state) => {
          const tasks = state.tasks.filter((t) => t.id !== id);
          return {
            tasks,
            currentTaskId:
              state.currentTaskId === id ? (tasks[0]?.id ?? null) : state.currentTaskId,
          };
        }),

      renameTask: (id, name) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, name } : t)),
        })),

      selectTask: (currentTaskId) => set({ currentTaskId }),

      incrementCompleted: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, completed: t.completed + 1 } : t)),
        })),
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
