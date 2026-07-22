import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { HiCamera, HiUser, HiLockClosed, HiGlobe, HiCurrencyDollar } from 'react-icons/hi';
import { userService, authService } from '../../api/services.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Card from '../../components/ui/Card.jsx';
import { formatDateTime } from '../../utils/format.js';

const profileSchema = z.object({
  firstName: z.string().min(2,'Min 2 chars').max(50),
  lastName:  z.string().min(2,'Min 2 chars').max(50),
  username:  z.string().min(3,'Min 3 chars').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
  currency:  z.string().length(3,'Must be 3-letter code'),
  timezone:  z.string().optional(),
});

const pwSchema = z.object({
  currentPassword: z.string().min(1,'Required'),
  newPassword:     z.string().min(8,'Min 8 chars').regex(/(?=.*[A-Z])/,'Needs uppercase').regex(/(?=.*\d)/,'Needs number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message:'Passwords do not match', path:['confirmPassword'] });

const CURRENCIES = ['USD','EUR','GBP','JPY','CAD','AUD','CHF','CNY','INR','UZS','RUB','KZT'].map(c => ({value:c, label:c}));

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileLoading, setPL] = useState(false);
  const [pwLoading, setPwL]     = useState(false);
  const [avatarLoading, setAL]  = useState(false);
  const fileRef = useRef(null);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName:  user?.lastName  || '',
      username:  user?.username  || '',
      currency:  user?.currency  || 'USD',
      timezone:  user?.timezone  || 'UTC',
    },
  });

  const pwForm = useForm({ resolver: zodResolver(pwSchema) });

  const onProfileSubmit = async (data) => {
    setPL(true);
    try {
      const res = await userService.updateProfile(data);
      updateUser(res.data.data);
      toast.success('Profile updated!');
    } catch {} finally { setPL(false); }
  };

  const onPwSubmit = async (data) => {
    setPwL(true);
    try {
      await authService.changePassword(data);
      toast.success('Password changed!');
      pwForm.reset();
    } catch {} finally { setPwL(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('File too large (max 5MB)');
    setAL(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await userService.uploadAvatar(form);
      updateUser({ avatar: res.data.data.avatar });
      toast.success('Avatar updated!');
    } catch {} finally { setAL(false); }
  };

  const handleRemoveAvatar = async () => {
    setAL(true);
    try {
      await userService.deleteAvatar();
      updateUser({ avatar: null });
      toast.success('Avatar removed');
    } catch {} finally { setAL(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">Profile & Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account information</p>
      </div>

      {/* Avatar */}
      <Card className="p-6">
        <h2 className="section-title mb-5">Profile Picture</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar user={user} size="2xl" />
            <button onClick={() => fileRef.current?.click()} disabled={avatarLoading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors">
              <HiCamera className="w-4 h-4"/>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username}</p>
            <p className="text-xs text-gray-400 mt-1">Member since {formatDateTime(user?.createdAt)}</p>
            {user?.avatar && (
              <Button size="sm" variant="ghost" className="mt-2 text-red-500 text-xs px-2" onClick={handleRemoveAvatar}>
                Remove photo
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Profile Info */}
      <Card className="p-6">
        <h2 className="section-title mb-5 flex items-center gap-2"><HiUser className="w-5 h-5"/> Personal Information</h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" error={profileForm.formState.errors.firstName?.message} {...profileForm.register('firstName')}/>
            <Input label="Last Name"  error={profileForm.formState.errors.lastName?.message}  {...profileForm.register('lastName')}/>
          </div>
          <Input label="Username" leftIcon={<span className="text-gray-400 text-sm font-medium">@</span>}
            error={profileForm.formState.errors.username?.message} {...profileForm.register('username')}/>
          <Input label="Email" value={user?.email || ''} disabled
            hint="Email cannot be changed" className="opacity-60 cursor-not-allowed"/>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Currency" options={CURRENCIES} error={profileForm.formState.errors.currency?.message} {...profileForm.register('currency')}/>
            <Input label="Timezone" placeholder="UTC" error={profileForm.formState.errors.timezone?.message} {...profileForm.register('timezone')}/>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={profileLoading}>Save Changes</Button>
          </div>
        </form>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <h2 className="section-title mb-5 flex items-center gap-2"><HiLockClosed className="w-5 h-5"/> Change Password</h2>
        <form onSubmit={pwForm.handleSubmit(onPwSubmit)} className="space-y-4">
          <Input label="Current Password" type="password" placeholder="Enter current password"
            error={pwForm.formState.errors.currentPassword?.message} {...pwForm.register('currentPassword')}/>
          <Input label="New Password" type="password" placeholder="Min 8 chars, uppercase, number"
            error={pwForm.formState.errors.newPassword?.message} {...pwForm.register('newPassword')}/>
          <Input label="Confirm Password" type="password" placeholder="Repeat new password"
            error={pwForm.formState.errors.confirmPassword?.message} {...pwForm.register('confirmPassword')}/>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={pwLoading} variant="secondary">Change Password</Button>
          </div>
        </form>
      </Card>

      {/* Account info */}
      <Card className="p-6">
        <h2 className="section-title mb-4">Account Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Role',      value: user?.role },
            { label: 'Status',    value: user?.isActive ? 'Active' : 'Inactive' },
            { label: 'Currency',  value: user?.currency },
            { label: 'Timezone',  value: user?.timezone },
          ].map(item => (
            <div key={item.label} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Profile;
