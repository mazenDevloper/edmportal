import { create } from 'zustand';
import type { SpatialWindow, Vec3 } from '@/lib/types';

type OSState = {
  windows: SpatialWindow[];
  addWindow: (window: Omit<SpatialWindow, 'id'>) => void;
  removeWindow: (id: string) => void;
  updateWindowTransform: (id: string, position: Vec3, rotation: Vec3) => void;
  setWindows: (windows: SpatialWindow[]) => void;
  isWindowOpen: (contentId: string) => boolean;
};

export const useOSStore = create<OSState>((set, get) => ({
  windows: [],
  addWindow: (windowData) => {
    const newWindow: SpatialWindow = {
        ...windowData,
        id: `window_${Date.now()}`,
    };
    set((state) => ({ windows: [...state.windows, newWindow] }))
  },
  removeWindow: (id) => set((state) => ({ windows: state.windows.filter((w) => w.id !== id) })),
  updateWindowTransform: (id, position, rotation) =>
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, position, rotation } : w)),
    })),
  setWindows: (windows) => set({ windows }),
  isWindowOpen: (contentId: string) => {
    return get().windows.some(w => w.contentId === contentId);
  }
}));
