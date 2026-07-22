import { cn } from '../../utils/helpers.js';
import Spinner from './Spinner.jsx';

const variants = {
  primary:   'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
  secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 focus:ring-gray-400',
  danger:    'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400',
  ghost:     'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 focus:ring-gray-400',
  success:   'bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-400',
};
const sizes = {
  sm:  'px-3 py-1.5 text-xs rounded-lg',
  md:  'px-4 py-2.5 text-sm rounded-xl',
  lg:  'px-6 py-3 text-base rounded-xl',
  icon:'p-2 rounded-xl',
};

const Button = ({
  children, variant = 'primary', size = 'md',
  loading, disabled, className, leftIcon, rightIcon, ...props
}) => (
  <button
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variants[variant], sizes[size], className
    )}
    {...props}
  >
    {loading ? <Spinner size="sm" /> : leftIcon}
    {children}
    {!loading && rightIcon}
  </button>
);

export default Button;
