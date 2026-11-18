import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { LESSONS, Lesson, TourStep, TourActionContext } from '../types/tour';

interface TourContextValue {
  isTourActive: boolean;
  activeLessonId: string;
  currentLesson: Lesson;
  currentStepIndex: number;
  currentStep: TourStep;
  totalStepsInLesson: number;
  activeSelector: string | null;
  startLesson: (lessonId: string) => void;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  setActionContext: (ctx: TourActionContext) => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [activeLessonId, setActiveLessonId] = useState<string>('overview');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [activeSelector, setActiveSelector] = useState<string | null>(null);
  const actionContextRef = useRef<TourActionContext | null>(null);

  const currentLesson = LESSONS.find(l => l.id === activeLessonId) || LESSONS[0];
  const currentStep = currentLesson.steps[currentStepIndex] || currentLesson.steps[0];
  const totalStepsInLesson = currentLesson.steps.length;

  const setActionContext = useCallback((ctx: TourActionContext) => {
    actionContextRef.current = ctx;
  }, []);

  // Check first run on mount: if localStorage 'spirographTourSeen' is missing, start Tutorial Overview
  useEffect(() => {
    try {
      const seen = localStorage.getItem('spirographTourSeen');
      if (!seen) {
        const timer = window.setTimeout(() => {
          setActiveLessonId('overview');
          setCurrentStepIndex(0);
          setIsTourActive(true);
        }, 500);
        return () => window.clearTimeout(timer);
      }
    } catch {}
  }, []);

  // Update active selector when step changes
  useEffect(() => {
    if (!isTourActive) {
      setActiveSelector(null);
      return;
    }
    setActiveSelector(currentStep.targetSelector);
  }, [isTourActive, currentStepIndex, currentStep]);

  // Keep Gear Train sheet open on every step of the Gears lesson, including after Back
  useEffect(() => {
    if (isTourActive && activeLessonId === 'gears' && actionContextRef.current) {
      actionContextRef.current.openGears();
    }
  }, [isTourActive, activeLessonId, currentStepIndex]);

  const startLesson = useCallback((lessonId: string) => {
    const lesson = LESSONS.find(l => l.id === lessonId) || LESSONS[0];
    setActiveLessonId(lesson.id);
    setCurrentStepIndex(0);
    setIsTourActive(true);
    if (actionContextRef.current) {
      lesson.steps[0].onEnter?.(actionContextRef.current);
    }
  }, []);

  const startTour = useCallback(() => {
    startLesson('overview');
  }, [startLesson]);

  const skipTour = useCallback(() => {
    if (actionContextRef.current) {
      currentStep.onLeave?.(actionContextRef.current);
      actionContextRef.current.closeGears();
      actionContextRef.current.closePenLayers();
      actionContextRef.current.closeLoad();
      actionContextRef.current.closePresets();
    }
    setIsTourActive(false);
    try {
      localStorage.setItem('spirographTourSeen', '1');
    } catch {}
    if (actionContextRef.current) {
      actionContextRef.current.showToast('No problem! You can replay the tutorial from LEARN.');
    }
  }, [currentStep]);

  const completeTour = useCallback(() => {
    if (actionContextRef.current) {
      currentStep.onLeave?.(actionContextRef.current);
      actionContextRef.current.closeGears();
      actionContextRef.current.closePenLayers();
      actionContextRef.current.closeLoad();
      actionContextRef.current.closePresets();
    }
    setIsTourActive(false);
    try {
      localStorage.setItem('spirographTourSeen', '1');
    } catch {}
  }, [currentStep]);

  const nextStep = useCallback(() => {
    if (actionContextRef.current) {
      currentStep.onLeave?.(actionContextRef.current);
    }
    if (currentStepIndex < totalStepsInLesson - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      if (actionContextRef.current) {
        currentLesson.steps[nextIdx].onEnter?.(actionContextRef.current);
      }
    } else {
      completeTour();
    }
  }, [currentStep, currentStepIndex, totalStepsInLesson, currentLesson, completeTour]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      if (actionContextRef.current) {
        currentStep.onLeave?.(actionContextRef.current);
      }
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      if (actionContextRef.current) {
        currentLesson.steps[prevIdx].onEnter?.(actionContextRef.current);
      }
    }
  }, [currentStep, currentStepIndex, currentLesson]);

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        activeLessonId,
        currentLesson,
        currentStepIndex,
        currentStep,
        totalStepsInLesson,
        activeSelector,
        startLesson,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        completeTour,
        setActionContext,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = (): TourContextValue => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
