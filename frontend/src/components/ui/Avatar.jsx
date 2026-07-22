import { cn } from '../../utils/helpers.js';
import { getInitials, getAvatarUrl } from '../../utils/helpers.js';

const sizes = {
  xs:  'w-6 h-6 text-xs',
  sm:  'w-8 h-8 text-sm',
  md:  'w-10 h-10 text-sm',
  lg:  'w-12 h-12 text-base',
  xl:  'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl',
};

const Avatar = ({ user, size = 'md', className }) => {
  const avatarUrl = getAvatarUrl(user?.avatar);
  const initials = getInitials(user?.firstName, user?.lastName);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${user?.firstName} ${user?.lastName}`}
        className={cn('rounded-full object-cover ring-2 ring-white dark:ring-gray-800', sizes[size], className)}
      />
    );
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold',
      'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
      'ring-2 ring-white dark:ring-gray-800',
      sizes[size], className
    )}>
      {initials}
    </div>
  );
};
export default Avatar;
