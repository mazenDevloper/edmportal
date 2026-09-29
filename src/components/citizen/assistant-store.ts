'use client';

import { create } from 'zustand';

/** Lets any page open the floating assistant with a question already asked */
interface AssistantState {
  open: boolean;
  queued: string | null;
  setOpen: (open: boolean) => void;
  ask: (question: string) => void;
  takeQueued: () => string | null;
}

export const useAssistant = create<AssistantState>()((set, get) => ({
  open: false,
  queued: null,
  setOpen: open => set({ open }),
  ask: question => set({ open: true, queued: question }),
  takeQueued: () => { const q = get().queued; set({ queued: null }); return q; },
}));
