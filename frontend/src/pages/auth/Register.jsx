import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HiMail, HiLockClosed, HiUser, HiEye, HiEyeOff, HiSparkles } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';

const schema = z.object({
  firstName: z.string().min(2, 'First name min 2 characters'),
  lastName:  z.string().min(2, 'Last name min 2 characters'),
  username:  z.string().min(3, 'Username min 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
  email:     z.string().email('Invalid email address'),
  password:  z.string().min(8, 'At least 8 characters')
    .regex(/(?=.*[A-Z])/, 'Must contain uppercase')
    .regex(/(?=.*[a-z])/, 'Must contain lowercase')
    .regex(/(?=.*\d)/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser(data);
      navigate('/dashboard', { replace: true });
    } catch {
      // handled by axios
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-200 dark:shadow-none">
            <HiSparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Smart <span className="text-primary-600">Budget</span>
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">Start managing your finances today</p>
        </div>

        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create your account</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Free forever · No credit card needed</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="John"
                leftIcon={<HiUser className="w-4 h-4" />}
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <Input
              label="Username"
              placeholder="johndoe"
              leftIcon={<span className="text-gray-400 text-sm font-medium">@</span>}
              error={errors.username?.message}
              {...register('username')}
            />

            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              leftIcon={<HiMail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPwd ? 'text' : 'password'}
              placeholder="Min 8 chars, upper, lower, number"
              leftIcon={<HiLockClosed className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPwd((p) => !p)} className="text-gray-400 hover:text-gray-600">
                  {showPwd ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type={showPwd ? 'text' : 'password'}
              placeholder="Re-enter password"
              leftIcon={<HiLockClosed className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
