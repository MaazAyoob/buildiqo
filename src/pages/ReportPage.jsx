import React from 'react';
import { StepReport } from '../components/planner/StepReport';
import { useEstimateStore } from '../store/useEstimateStore';

export function ReportPage({ setRoute, onOpenSavedModal }) {
  const { state, estimation } = useEstimateStore();

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <StepReport 
        state={state} 
        estimation={estimation} 
        onOpenSavedModal={onOpenSavedModal} 
      />
    </div>
  );
}