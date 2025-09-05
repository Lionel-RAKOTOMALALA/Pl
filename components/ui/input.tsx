import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border-2 border-[#FF9A00]/50 bg-white/40 px-3 py-2 text-sm text-[#4F200D] placeholder:text-[#4F200D]/60 shadow-inner ring-offset-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD93D] focus-visible:ring-offset-2 focus-visible:border-[#4F200D] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
