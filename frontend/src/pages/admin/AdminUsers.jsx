import { useState } from 'react';
import { HiSearch, HiTrash, HiBan, HiCheckCircle, HiUser, HiShieldCheck } from 'react-icons/hi';
import { useLang } from '../../contexts/LanguageContext.jsx';
import { adminService } from '../../api/services.js';
import { useQuery } from '../../hooks/useQuery.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Modal from '../../components/ui/Modal.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { formatDateTime, formatTimeAgo } from '../../utils/format.js';
import { cn } from '../../utils/helpers.js';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const { t } = useLang();
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteLoading, setDL]      = useState(false);
  const [toggleLoading, setTL]      = useState('');

  const { data, loading, refetch } = useQuery(
    () => adminService.getUsers({ search, page, limit: 15 }), [search, page]
  );
  const users      = data?.data || [];
  const pagination = data?.pagination;

  const handleToggle = async (user) => {
    setTL(user.id);
    try {
      const res = await adminService.toggleStatus(user.id);
      toast.success(res.data.message);
      refetch();
    } catch {} finally { setTL(''); }
  };

  const handleDelete = async () => {
    setDL(true);
    try {
      await adminService.deleteUser(deleteUser.id);
      toast.success('User deleted');
      setDeleteUser(null); refetch();
    } catch {} finally { setDL(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HiShieldCheck className="w-6 h-6 text-primary-600"/>
          <h1 className="page-title">User Management</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{pagination?.total || 0} registered users</p>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Total Users', value: pagination?.total || 0, color:'text-primary-600' },
            { label:'Active',      value: users.filter(u=>u.isActive).length, color:'text-emerald-600 dark:text-emerald-400' },
            { label:'Admins',      value: users.filter(u=>u.role==='ADMIN').length, color:'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className={cn('text-xl font-bold mt-0.5', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <Input placeholder={t('transactions.searchPlaceholder')}
        leftIcon={<HiSearch className="w-4 h-4"/>}
        value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <tr>
                {['User','Role','Status','Transactions','Joined','Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {loading ? (
                Array.from({length:8}).map((_,i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-8 w-full"/></td></tr>
                ))
              ) : users.length ? (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} size="sm"/>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">@{user.username} · {user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role==='ADMIN' ? 'warning' : 'default'}>
                        {user.role==='ADMIN' ? '👑 Admin' : '👤 User'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{user._count?.transactions || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(user.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleToggle(user)}
                          disabled={toggleLoading === user.id}
                          className={cn('p-1.5 rounded-lg transition-colors',
                            user.isActive
                              ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500'
                              : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500')}
                          title={user.isActive ? 'Deactivate' : 'Activate'}>
                          {user.isActive ? <HiBan className="w-4 h-4"/> : <HiCheckCircle className="w-4 h-4"/>}
                        </button>
                        <button onClick={() => setDeleteUser(user)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title={t('common.delete')}>
                          <HiTrash className="w-4 h-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6}><EmptyState icon="👥" title={t('admin.noUsers')}/></td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={!pagination.hasPrev} onClick={() => setPage(p=>p-1)}>← Prev</Button>
              <Button size="sm" variant="secondary" disabled={!pagination.hasNext} onClick={() => setPage(p=>p+1)}>Next →</Button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!deleteUser} onClose={() => setDeleteUser(null)} title={t('admin.deleteUser')} size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Permanently delete <span className="font-semibold">{deleteUser?.firstName} {deleteUser?.lastName}</span>?
        </p>
        <p className="text-xs text-red-500 mb-6">⚠️ This will delete ALL their data including transactions, budgets and goals.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteUser(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" loading={deleteLoading} onClick={handleDelete}>Delete User</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsers;
