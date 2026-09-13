import { createSlice, PayloadAction, configureStore } from '@reduxjs/toolkit';
import { Service, ServiceStep, FormField, StepLogic } from './types';

interface WorkflowState {
  steps: ServiceStep[];
  serviceInfo: Partial<Service>;
}

const initialState: WorkflowState = {
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
  }
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setSteps: (state, action: PayloadAction<ServiceStep[]>) => {
      state.steps = action.payload;
    },
    setServiceInfo: (state, action: PayloadAction<Partial<Service>>) => {
      state.serviceInfo = { ...state.serviceInfo, ...action.payload };
    },
    addStep: (state, action: PayloadAction<boolean>) => {
      const isAr = action.payload;
      state.steps.push({
        id: `step_${Date.now()}`,
        titleAr: isAr ? 'خطوة جديدة' : 'New Step',
        titleEn: 'New Step',
        fields: [],
        actionType: 'submit',
        position: { x: 250, y: state.steps.length * 200 }
      });
    },
    updateStep: (state, action: PayloadAction<{ idx: number; updates: Partial<ServiceStep> }>) => {
      const { idx, updates } = action.payload;
      if (state.steps[idx]) {
        state.steps[idx] = { ...state.steps[idx], ...updates };
      }
    },
    removeStep: (state, action: PayloadAction<string>) => {
      state.steps = state.steps.filter(s => s.id !== action.payload);
    },
    addFieldToStep: (state, action: PayloadAction<{ stepId: string; type: FormField['type'] }>) => {
      const { stepId, type } = action.payload;
      const step = state.steps.find(s => s.id === stepId);
      if (step) {
        step.fields.push({
          id: `field_${Date.now()}`,
          type,
          labelAr: '',
          labelEn: '',
          required: true,
          options: []
        });
      }
    },
    addLogic: (state, action: PayloadAction<number>) => {
      const stepIdx = action.payload;
      if (state.steps[stepIdx]) {
        if (!state.steps[stepIdx].logic) {
          state.steps[stepIdx].logic = [];
        }
        state.steps[stepIdx].logic!.push({ fieldId: 'none', value: '', targetStepId: 'none' });
      }
    },
    reset: () => initialState
  }
});

export const { 
  setSteps, setServiceInfo, addStep, updateStep, 
  removeStep, addFieldToStep, addLogic, reset 
} = workflowSlice.actions;

export const store = configureStore({
  reducer: {
    workflow: workflowSlice.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;