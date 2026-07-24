import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiSparkles } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLang } from '../../contexts/LanguageContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import Button  from '../../components/ui/Button.jsx';
import Input   from '../../components/ui/Input.jsx';

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const Login = () => {
  const { login }    = useAuth();
  const { t, lang, changeLang, languages } = useLang();
  const navigate     = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { isDark, toggleTheme } = useTheme();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setLoginError('');

    try {
      const user = await login(data);

      navigate(
        user.role === 'ADMIN'
          ? '/admin/users'
          : '/dashboard',
        { replace: true }
      );
    } catch (error) {
      setLoginError('auth.invalidLogin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Til tanlash (login sahifasida ham) */}
        <div className="flex justify-center gap-2 mb-6">
          {languages.map(l => (
            <button key={l.code} onClick={() => changeLang(l.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border
                ${lang === l.code
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary-300'}`}>
              <span>{l.flag}</span>
              <span className="hidden sm:block">{l.label}</span>
            </button>
          ))}
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-200 dark:shadow-none">
            <HiSparkles className="w-8 h-8 text-white"/>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Smart <span className="text-primary-600">Budget</span>
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
            {lang === 'uz' ? "Shaxsiy moliya boshqaruvi" :
             lang === 'ru' ? "Управление личными финансами" :
             "Personal finance manager"}
          </p>
        </div>

        {/* Karta */}
        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('auth.welcomeBack')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('auth.signInDesc')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder="siz@misol.com"
              leftIcon={<HiMail className="w-4 h-4"/>}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label={t('auth.password')}
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<HiLockClosed className="w-4 h-4"/>}
              rightIcon={
                <button type="button" onClick={() => setShowPwd(p => !p)} className="text-gray-400 hover:text-gray-600">
                  {showPwd ? <HiEyeOff className="w-4 h-4"/> : <HiEye className="w-4 h-4"/>}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
            {loginError && (
              <div className="rounded-lg bg-red-100 border border-red-300 text-red-700 px-4 py-3 text-sm">
                {t(loginError)}
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {t('auth.signIn')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('auth.createAccount')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
