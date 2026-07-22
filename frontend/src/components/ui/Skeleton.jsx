import { cn } from '../../utils/helpers.js';

const Skeleton = ({ className, ...props }) => (
  <div className={cn('skeleton', className)} {...props} />
);

Skeleton.Card = ({ rows = 3 }) => (
  <div className="card p-6 space-y-4">
    <Skeleton className="h-5 w-1/3" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-4 w-full" />
    ))}
  </div>
);

Skeleton.Table = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 card">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-5 w-20 ml-auto" />
      </div>
    ))}
  </div>
);

export default Skeleton;
