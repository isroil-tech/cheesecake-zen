import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export function QuantitySelector({ quantity, onChange, min = 1, max = 99, size = 'md' }: QuantitySelectorProps) {
  const isSmall = size === 'sm';

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-2xl bg-secondary',
      isSmall ? 'h-8 px-1' : 'h-10 px-1.5'
    )}>
      <button
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        className={cn(
          'flex items-center justify-center rounded-xl transition-all active-scale disabled:opacity-30',
          isSmall ? 'w-6 h-6' : 'w-7 h-7'
        )}
      >
        <Minus className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} />
      </button>
      <span className={cn(
        'font-semibold text-foreground min-w-[20px] text-center',
        isSmall ? 'text-sm' : 'text-base'
      )}>
        {quantity}
      </span>
      <button
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        className={cn(
          'flex items-center justify-center rounded-xl transition-all active-scale disabled:opacity-30',
          isSmall ? 'w-6 h-6' : 'w-7 h-7'
        )}
      >
        <Plus className={isSmall ? 'w-3 h-3' : 'w-4 h-4'} />
      </button>
    </div>
  );
}
