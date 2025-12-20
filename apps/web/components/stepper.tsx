"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WIZARD_STEPS,
  getCompletedSteps,
  type WizardStep,
} from "@/lib/wizardSteps";

export interface StepperProps {
  /** Current active step (1-indexed) */
  currentStep: number;
  /** Callback when a step is clicked */
  onStepClick?: (step: number) => void;
  /** Additional class names for the container */
  className?: string;
}

interface StepItemProps {
  step: WizardStep;
  isActive: boolean;
  isCompleted: boolean;
  isClickable: boolean;
  onClick?: () => void;
}

function StepItem({
  step,
  isActive,
  isCompleted,
  isClickable,
  onClick,
}: StepItemProps) {
  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
        isActive && "bg-primary/10",
        isClickable && !isActive && "hover:bg-muted",
        !isClickable && "cursor-not-allowed opacity-50"
      )}
      aria-current={isActive ? "step" : undefined}
    >
      {/* Step indicator */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
          isCompleted && "bg-green-500 text-white",
          isActive && !isCompleted && "bg-primary text-primary-foreground",
          !isActive && !isCompleted && "bg-muted text-muted-foreground"
        )}
      >
        {isCompleted ? (
          <Check className="h-4 w-4" />
        ) : (
          <span>{step.id}</span>
        )}
      </div>

      {/* Step text */}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate text-sm font-medium",
            isActive && "text-foreground",
            !isActive && "text-muted-foreground"
          )}
        >
          {step.title}
        </div>
      </div>
    </button>
  );
}

/**
 * Stepper component for wizard navigation.
 *
 * Shows all wizard steps in a vertical list with:
 * - Current step highlighted
 * - Completed steps with checkmarks
 * - Click navigation to completed steps only
 */
export function Stepper({ currentStep, onStepClick, className }: StepperProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Load completed steps from localStorage on mount
  useEffect(() => {
    setCompletedSteps(getCompletedSteps());
  }, []);

  const handleStepClick = useCallback(
    (stepId: number) => {
      if (onStepClick) {
        onStepClick(stepId);
      }
    },
    [onStepClick]
  );

  return (
    <nav
      className={cn("flex flex-col gap-1", className)}
      aria-label="Wizard steps"
    >
      {WIZARD_STEPS.map((step) => {
        const isActive = step.id === currentStep;
        const isCompleted = completedSteps.includes(step.id);
        // Can click if step is completed or if it's the next step after last completed
        const highestCompleted = Math.max(0, ...completedSteps);
        const isClickable = isCompleted || step.id <= highestCompleted + 1;

        return (
          <StepItem
            key={step.id}
            step={step}
            isActive={isActive}
            isCompleted={isCompleted}
            isClickable={isClickable}
            onClick={() => handleStepClick(step.id)}
          />
        );
      })}
    </nav>
  );
}

/**
 * Mobile-friendly bottom navigation version of the stepper.
 * Shows a compact progress bar with current step indicator.
 */
export function StepperMobile({
  currentStep,
  onStepClick,
  className,
}: StepperProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    setCompletedSteps(getCompletedSteps());
  }, []);

  const currentStepData = WIZARD_STEPS.find((s) => s.id === currentStep);
  const progress = (completedSteps.length / WIZARD_STEPS.length) * 100;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-card p-4",
        className
      )}
    >
      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Current step info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {WIZARD_STEPS.length}
          </span>
          {currentStepData && (
            <span className="text-sm font-semibold">{currentStepData.title}</span>
          )}
        </div>

        {/* Navigation dots */}
        <div className="flex gap-1">
          {WIZARD_STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = completedSteps.includes(step.id);
            const highestCompleted = Math.max(0, ...completedSteps);
            const isClickable = isCompleted || step.id <= highestCompleted + 1;

            return (
              <button
                key={step.id}
                type="button"
                onClick={isClickable && onStepClick ? () => onStepClick(step.id) : undefined}
                disabled={!isClickable}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  isCompleted && "bg-green-500",
                  isActive && !isCompleted && "bg-primary",
                  !isActive && !isCompleted && "bg-muted-foreground/30",
                  isClickable && "cursor-pointer hover:scale-125",
                  !isClickable && "cursor-not-allowed"
                )}
                aria-label={`Go to step ${step.id}: ${step.title}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export type { WizardStep };
