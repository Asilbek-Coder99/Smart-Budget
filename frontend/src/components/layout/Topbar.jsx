import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiMenu, HiBell, HiSun, HiMoon,
  HiLogout, HiUser, HiChevronDown, HiTranslate,
} from 'react-icons/hi';
import { useAuth }  from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLang }  from '../../contexts/LanguageContext.jsx';
import Avatar       from '../ui/Avatar.jsx';
import { notificationService } from '../../api/services.js';
import { useQuery } from '../../hooks/useQuery.js';

const Topbar = ({ onMenuClick }) => {
  const { user, logout }         = useAuth();
  const { isDark, toggleTheme }  = useTheme();
  const { t, lang, changeLang, languages } = useLang();
  const navigate = useNavigate();

  const [userOpen, setUserOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const userRef = useRef(null);
  const langRef = useRef(null);

  const { data: unreadData } = useQuery(
    () => notificationService.getUnreadCount(),
    [],
    { refetchInterval: 30000 }
  );
  const unreadCount = unreadData?.data?.count || 0;

  // Tashqariga bosiganda yopilsin
  useEffect(() => {
    const handler = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentLang = languages.find(l => l.code === lang);

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">

        {/* Chap: hamburger */}
        <button onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
          <HiMenu className="w-6 h-6"/>
        </button>
        <div className="hidden lg:block"/>

        {/* O'ng: amallar */}
        <div className="flex items-center gap-1">

          {/* ─── Til tanlash ─── */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(p => !p)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm font-medium"
            >
              <span className="text-base">{currentLang?.flag}</span>
              <span className="hidden sm:block">{currentLang?.label}</span>
              <HiChevronDown className={`w-3.5 h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`}/>
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 animate-slide-up z-50">
                <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  <HiTranslate className="inline w-3.5 h-3.5 mr-1"/>
                  {lang === 'uz' ? 'Til' : lang === 'ru' ? 'Язык' : 'Language'}
                </p>
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { changeLang(l.code); setLangOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                      ${lang === l.code
                        ? 'text-primary-600 dark:text-primary-400 font-semibold bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <span className="text-lg">{l.flag}</span>
                    <span className="flex-1 text-left">{l.label}</span>
                    {lang === l.code && (
                      <span className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Tungi/Kunduzgi rejim ─── */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            title={isDark ? "Yorug' rejim" : "Qorong'i rejim"}
          >
            {isDark ? <HiSun className="w-5 h-5"/> : <HiMoon className="w-5 h-5"/>}
          </button>

          {/* ─── Bildirishnomalar ─── */}
          <Link
            to="/notifications"
            className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <HiBell className="w-5 h-5"/>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* ─── Foydalanuvchi dropdown ─── */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserOpen(p => !p)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Avatar user={user} size="sm"/>
              <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                {user?.firstName}
              </span>
              <HiChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${userOpen ? 'rotate-180' : ''}`}/>
            </button>

            {userOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 animate-slide-up z-50">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full font-medium">
                    {user?.role}
                  </span>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <HiUser className="w-4 h-4 text-gray-400"/>
                  {t('nav.settings')}
                </Link>

                <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                  <button
                    onClick={async () => { await logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <HiLogout className="w-4 h-4"/>
                    {t('common.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
