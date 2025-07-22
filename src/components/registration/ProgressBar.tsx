import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  const steps = [
    { number: 1, title: 'Personal Info' },
    { number: 2, title: 'Choose Group' },
    { number: 3, title: 'Generate Content' },
    { number: 4, title: 'Complete' },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex items-center">
              <div
                className={`
                  relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                  ${
                    step.number < currentStep
                      ? 'bg-progress-complete border-progress-complete text-white'
                      : step.number === currentStep
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-progress-bg border-border text-muted-foreground'
                  }
                `}
              >
                {step.number < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.number}</span>
                )}
              </div>
              <div className="ml-3">
                <p
                  className={`
                    text-sm font-medium transition-colors duration-300
                    ${
                      step.number <= currentStep
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }
                  `}
                >
                  {step.title}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-0.5 mx-4 transition-colors duration-300
                  ${
                    step.number < currentStep
                      ? 'bg-progress-complete'
                      : 'bg-progress-bg'
                  }
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};