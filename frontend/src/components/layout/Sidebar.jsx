import { NavLink } from 'react-router-dom';
import {
  HiHome, HiCash, HiCollection, HiChartPie,
  HiFlag, HiDocumentReport, HiBell, HiCog,
  HiUsers, HiChartBar, HiX, HiSparkles,
} from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLang } from '../../contexts/LanguageContext.jsx';
import { cn }      from '../../utils/helpers.js';

const NavItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink to={to} onClick={onClick}
    className={({ isActive }) => cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
      isActive
        ? 'bg-primary-600 text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
    )}>
    <Icon className="w-5 h-5 shrink-0"/>
    <span className="truncate">{label}</span>
  </NavLink>
);

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { t }    = useLang();
  const isAdmin  = user?.role === 'ADMIN';

  const navItems = [
    { to: '/dashboard',     icon: HiHome,          label: t('nav.dashboard')     },
    { to: '/transactions',  icon: HiCash,           label: t('nav.transactions')  },
    { to: '/categories',    icon: HiCollection,     label: t('nav.categories')    },
    { to: '/budgets',       icon: HiChartPie,       label: t('nav.budgets')       },
    { to: '/savings',       icon: HiFlag,           label: t('nav.savings')       },
    { to: '/reports',       icon: HiDocumentReport, label: t('nav.reports')       },
    { to: '/notifications', icon: HiBell,           label: t('nav.notifications') },
  ];

  const adminItems = [
    { to: '/admin/users',     icon: HiUsers,    label: t('nav.manageUsers') },
    { to: '/admin/analytics', icon: HiChartBar, label: t('nav.analytics')   },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={onClose}/>
      )}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 z-50 lg:z-30',
        'bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700',
        'flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
              <HiSparkles className="w-5 h-5 text-white"/>
            </div>
            <div>
              <span className="text-base font-bold text-gray-900 dark:text-white">Smart</span>
              <span className="text-base font-bold text-primary-600"> Budget</span>
            </div>
          </div>
          <button onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <HiX className="w-5 h-5"/>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
          {navItems.map(item => (
            <NavItem key={item.to} {...item} onClick={onClose}/>
          ))}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3">
                  {t('nav.admin')}
                </p>
              </div>
              {adminItems.map(item => (
                <NavItem key={item.to} {...item} onClick={onClose}/>
              ))}
            </>
          )}
        </nav>

        {/* Settings */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <NavItem to="/profile" icon={HiCog} label={t('nav.settings')} onClick={onClose}/>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
