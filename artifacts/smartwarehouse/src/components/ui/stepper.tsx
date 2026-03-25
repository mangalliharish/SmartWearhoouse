import { Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface StepperProps {
  steps: string[];
  currentStep: string;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="relative flex justify-between w-full mt-4 mb-8">
      {/* Background Line */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2 rounded-full" />
      
      {/* Active Line */}
      <div 
        className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 transition-all duration-500 ease-in-out rounded-full"
        style={{ width: `${(Math.max(currentIndex, 0) / (steps.length - 1)) * 100}%` }}
      />

      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <div key={step} className="relative flex flex-col items-center group">
            <div 
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10 bg-card shadow-sm",
                isCompleted ? "border-primary text-primary" : 
                isCurrent ? "border-primary text-primary ring-4 ring-primary/20 scale-110" : 
                "border-border text-muted-foreground"
              )}
            >
              {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <span className="text-sm font-bold">{index + 1}</span>}
            </div>
            <span 
              className={cn(
                "absolute -bottom-8 text-xs font-semibold capitalize whitespace-nowrap transition-colors duration-300",
                isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
