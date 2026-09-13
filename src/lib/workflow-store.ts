
import { create } from 'zustand';
import { Service, ServiceStep, FormField, StepLogic } from './types';

interface WorkflowState {
  steps: ServiceStep[];
  serviceInfo: Partial<Service>;
  setSteps: (steps: ServiceStep[]) => void;
  setServiceInfo: (info: Partial<Service>) => void;
  addStep: (isAr: boolean) => void;
  updateStep: (idx: number, updates: Partial<ServiceStep>) => void;
  removeStep: (id: string) => void;
  addFieldToStep: (stepId: string, type: FormField['type']) => void;
  addLogic: (stepIdx: number) => void;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  steps: [],
  serviceInfo: {
    title: '',
    titleEn: '',
    category: 'elec',
    iconName: 'FileText',
    fees: '0 OMR',
    description: '',
    descriptionEn: '',
    type: 'workflow',
    linkUrl: ''
  },
  setSteps: (steps) => set({ steps }),
  setServiceInfo: (serviceInfo) => set({ serviceInfo }),
  addStep: (isAr) => set((state) => {
    const newStep: ServiceStep = {
      id: `step_${Date.now()}`,
      titleAr: isAr ? 'خطوة جديدة' : 'New Step',
      titleEn: 'New Step',
      fields: [],
      actionType: 'submit',
      position: { x: 250, y: state.steps.length * 200 }
    };
    return { steps: [...state.steps, newStep] };
  }),
  updateStep: (idx, updates) => set((state) => {
    const ns = [...state.steps];
    ns[idx] = { ...ns[idx], ...updates };
    return { steps: ns };
  }),
  removeStep: (id) => set((state) => ({
    steps: state.steps.filter((s) => s.id !== id)
  })),
  addFieldToStep: (stepId, type) => set((state) => ({
    steps: state.steps.map((s) => s.id === stepId ? {
      ...s,
      fields: [...s.fields, {
        id: `field_${Date.now()}`,
        type,
        labelAr: '',
        labelEn: '',
        required: true,
        options: []
      }]
    } : s)
  })),
  addLogic: (stepIdx) => set((state) => {
    const ns = [...state.steps];
    const logic: StepLogic[] = ns[stepIdx].logic || [];
    ns[stepIdx].logic = [...logic, { fieldId: 'none', value: '', targetStepId: 'none' }];
    return { steps: ns };
  }),
  reset: () => set({
    steps: [],
    serviceInfo: {
      title: '', titleEn: '', category: 'elec', iconName: 'FileText',
      fees: '0 OMR', description: '', descriptionEn: '', type: 'workflow', linkUrl: ''
    }
  })
}));
