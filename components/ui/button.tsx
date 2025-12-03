import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6cbbf7] focus-visible:shadow-[0_0_0_4px_rgba(0,116,204,0.15)] disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-[#0a95ff] text-white hover:bg-[#0074cc] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] active:shadow-none':
              variant === 'default',
            'border border-[#8a9199] bg-white text-[#3b4045] hover:bg-[#f8f9f9] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)] active:shadow-none':
              variant === 'outline',
            'hover:bg-[#f8f9f9] text-[#3b4045]': variant === 'ghost',
            'bg-[#d1383d] text-white hover:bg-[#b32d32] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] active:shadow-none':
              variant === 'destructive',
            'bg-[#e1ecf4] text-[#39739d] hover:bg-[#d0e3f1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)] active:shadow-none':
              variant === 'secondary',
          },
          {
            'h-[37px] px-[10px] py-[10px] text-[13px]': size === 'default',
            'h-[33px] px-[8px] py-[8px] text-[12px]': size === 'sm',
            'h-[42px] px-[12px] py-[12px] text-[15px]': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
