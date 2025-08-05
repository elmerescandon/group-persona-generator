import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

interface StepData {
  number: number;
  title: string;
  description: string;
}

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
  disabled?: boolean;
}

// Animation configurations
const ANIMATION_CONFIG = {
  spring: { type: "spring", stiffness: 200, damping: 20 },
  easeOut: { duration: 0.5, ease: "easeOut" },
  breathe: { repeat: Infinity, duration: 2, ease: "easeInOut" },
  chevron: { repeat: Infinity, duration: 2, ease: "easeInOut" },
} as const;

const STEP_DEFINITIONS: StepData[] = [
  { number: 1, title: 'Personal Info', description: 'Enter your basic information' },
  { number: 2, title: 'Choose Group', description: 'Select your preferred group' },
  { number: 3, title: 'Generate Content', description: 'Create personalized content' },
  { number: 4, title: 'Complete', description: 'Finish your registration' },
];

export const ProgressBar = ({ 
  currentStep, 
  totalSteps, 
  onStepClick,
  disabled = false 
}: ProgressBarProps) => {
  const shouldReduceMotion = useReducedMotion();
  
  const steps = useMemo(() => 
    STEP_DEFINITIONS.slice(0, totalSteps), 
    [totalSteps]
  );
  
  const currentStepData = useMemo(() => 
    steps[currentStep - 1], 
    [steps, currentStep]
  );

  const handleStepClick = (stepNumber: number) => {
    if (!disabled && onStepClick && stepNumber <= currentStep) {
      onStepClick(stepNumber);
    }
  };

  if (!currentStepData) {
    return null; // Handle edge case gracefully
  }

  return (
    <motion.div 
      className="w-full max-w-2xl mx-auto"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : ANIMATION_CONFIG.easeOut}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep} of ${totalSteps}: ${currentStepData.title}`}
    >
      {/* Stepper Dots Navigation */}
      <nav 
        className="flex items-center justify-center gap-2 mb-12"
        role="tablist"
        aria-label="Registration progress"
      >
        {steps.map((step, index) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          const isClickable = !disabled && step.number <= currentStep;
          
          return (
            <div key={step.number} className="relative flex items-center">
              {/* Dot or Expanded Pill */}
              <motion.button
                className={`
                  relative flex items-center justify-center rounded-full 
                  transition-all duration-300 outline-none ring-offset-2
                  focus-visible:ring-2 focus-visible:ring-primary
                  ${isActive 
                    ? 'bg-primary w-4 h-4 shadow-lg shadow-primary/30' 
                    : isCompleted
                    ? 'bg-primary w-3 h-3 cursor-pointer hover:scale-110'
                    : 'bg-gray-300 w-3 h-3'
                  }
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                  ${disabled ? 'opacity-50' : ''}
                `}
                disabled={!isClickable}
                onClick={() => handleStepClick(step.number)}
                initial={shouldReduceMotion ? false : { scale: 0 }}
                animate={{ 
                  scale: 1,
                  width: isActive ? '16px' : '12px',
                  height: isActive ? '16px' : '12px',
                }}
                transition={shouldReduceMotion 
                  ? { duration: 0 } 
                  : { 
                      delay: index * 0.1, 
                      duration: 0.4,
                      ...ANIMATION_CONFIG.spring
                    }
                }
                whileHover={shouldReduceMotion ? {} : { 
                  scale: isActive ? 1.1 : 1.2 
                }}
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`${step.title}. ${isCompleted ? 'Completed' : isActive ? 'Current step' : 'Not started'}`}
                tabIndex={isClickable ? 0 : -1}
              >
                {/* Breathing effect for all dots when not active - only if motion is enabled */}
                {!shouldReduceMotion && !isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ 
                      ...ANIMATION_CONFIG.breathe,
                      delay: index * 0.3
                    }}
                    style={{
                      backgroundColor: isCompleted 
                        ? 'hsl(var(--primary))' 
                        : 'hsl(var(--muted-foreground))',
                    }}
                  />
                )}

                {/* Active step glow - only if motion is enabled */}
                {!shouldReduceMotion && isActive && (
                  <motion.div
                    className="absolute -inset-2 rounded-full bg-primary/20 -z-10 pointer-events-none"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={ANIMATION_CONFIG.breathe}
                  />
                )}
              </motion.button>

              {/* Connection line between dots */}
              {index < steps.length - 1 && (
                <motion.div
                  className="w-6 h-0.5 mx-1 pointer-events-none"
                  style={{
                    backgroundColor: isCompleted 
                      ? 'hsl(var(--primary))' 
                      : 'hsl(var(--border))',
                  }}
                  initial={shouldReduceMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={shouldReduceMotion 
                    ? { duration: 0 } 
                    : { delay: index * 0.1 + 0.3, duration: 0.4 }
                  }
                />
              )}
            </div>
          );
        })}

        {/* Ghost dot hint for next step */}
        {!shouldReduceMotion && currentStep < totalSteps && (
          <motion.div
            className="w-2 h-2 rounded-full bg-muted ml-2 pointer-events-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0.8, 1, 0.8],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5,
              ease: "easeInOut"
            }}
            aria-hidden="true"
          />
        )}
      </nav>

      {/* Current Step Content */}
      <AnimatePresence mode="wait">
        <motion.main
          key={currentStep}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? {} : { opacity: 0, y: -30 }}
          transition={shouldReduceMotion 
            ? { duration: 0 } 
            : ANIMATION_CONFIG.easeOut
          }
          className="text-center space-y-6"
          role="tabpanel"
          aria-labelledby={`step-${currentStep}-button`}
        >
          <div className="space-y-3">
            <motion.h1 
              id={`step-${currentStep}-title`}
              className="text-4xl font-bold text-foreground tracking-tight"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion 
                ? { duration: 0 } 
                : { delay: 0.2, duration: 0.4 }
              }
            >
              {currentStepData.title}
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion 
                ? { duration: 0 } 
                : { delay: 0.3, duration: 0.4 }
              }
            >
              {currentStepData.description}
            </motion.p>
          </div>

          {/* Subtle next step hint */}
          {currentStep < totalSteps && steps[currentStep] && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion 
                ? { duration: 0 } 
                : { delay: 0.6, duration: 0.4 }
              }
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground/70 mt-8"
              role="note"
              aria-label={`Next step: ${steps[currentStep].title}`}
            >
              <span className="text-xs">Up next</span>
              {!shouldReduceMotion && (
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={ANIMATION_CONFIG.chevron}
                  aria-hidden="true"
                >
                  <ChevronRight className="w-3 h-3" />
                </motion.div>
              )}
              {shouldReduceMotion && <ChevronRight className="w-3 h-3" />}
              <span className="text-xs font-medium">{steps[currentStep].title}</span>
            </motion.div>
          )}
        </motion.main>
      </AnimatePresence>
    </motion.div>
  );
};