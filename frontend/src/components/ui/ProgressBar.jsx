import { cn } from '../../utils/helpers.js';

const ProgressBar = ({ value = 0, max = 100, className, colorClass, showLabel = false, size = 'md' }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  const autoColor =
    pct >= 100 ? 'bg-red-500' :
    pct >= 80  ? 'bg-amber-500' :
    'bg-emerald-500';

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', colorClass || autoColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Math.round(pct)}%</span>
      )}
    </div>
  );
};
export default ProgressBar;
