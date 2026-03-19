import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/utils';
import type { ProductFormat } from '@/stores/cartStore';

interface FormatPickerProps {
  value: ProductFormat;
  onChange: (format: ProductFormat) => void;
  wholeAvailable: boolean;
  sliceAvailable: boolean;
}

export function FormatPicker({ value, onChange, wholeAvailable, sliceAvailable }: FormatPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="flex bg-secondary rounded-xl p-1 gap-1">
      <button
        onClick={() => wholeAvailable && onChange('whole')}
        disabled={!wholeAvailable}
        className={cn(
          'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active-scale',
          value === 'whole'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground',
          !wholeAvailable && 'opacity-40 cursor-not-allowed'
        )}
      >
        {t('product.whole')}
      </button>
      <button
        onClick={() => sliceAvailable && onChange('slice')}
        disabled={!sliceAvailable}
        className={cn(
          'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active-scale',
          value === 'slice'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground',
          !sliceAvailable && 'opacity-40 cursor-not-allowed'
        )}
      >
        {t('product.slice')}
      </button>
    </div>
  );
}
