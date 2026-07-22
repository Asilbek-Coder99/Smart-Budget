import { cn } from '../../utils/helpers.js';

const Card = ({ children, className, hover, ...props }) => (
  <div
    className={cn(
      'card p-6',
      hover && 'hover:shadow-md transition-shadow duration-200 cursor-pointer',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

Card.Header = ({ children, className }) => (
  <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>
);

export default Card;
