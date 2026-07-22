import { useState } from 'react';
import { HiBell, HiCheck, HiTrash, HiExclamation, HiInformationCircle, HiCheckCircle, HiChartBar } from 'react-icons/hi';
import { notificationService } from '../../api/services.js';
import { useQuery } from '../../hooks/useQuery.js';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { formatTimeAgo } from '../../utils/format.js';
import { cn } from '../../utils/helpers.js';
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  BUDGET_WARNING:  { icon: HiExclamation,      color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20',   badge: 'warning' },
  BUDGET_EXCEEDED: { icon: HiExclamation,      color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',       badge: 'danger' },
  GOAL_ACHIEVED:   { icon: HiCheckCircle,      color: 'text-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-900/20', badge: 'success' },
  MONTHLY_REPORT:  { icon: HiChartBar,         color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',     badge: 'info' },
  GENERAL:         { icon: HiInformationCircle,color: 'text-gray-500',   bg: 'bg-gray-50 dark:bg-gray-700/50',     badge: 'default' },
};

const NotificationItem = ({ notification, onRead, onDelete }) => {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.GENERAL;
  const Icon = config.icon;

  return (
    <div className={cn('flex items-start gap-4 p-4 rounded-xl transition-all',
      !notification.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30')}>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', config.bg)}>
        <Icon className={cn('w-5 h-5', config.color)}/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={cn('text-sm font-semibold truncate', !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300')}>
            {notification.title}
          </p>
          {!notification.isRead && <span className="w-2 h-2 bg-primary-600 rounded-full shrink-0"/>}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{notification.message}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatTimeAgo(notification.createdAt)}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        {!notification.isRead && (
          <button onClick={() => onRead(notification.id)}
            className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 transition-colors" title="Mark as read">
            <HiCheck className="w-4 h-4"/>
          </button>
        )}
        <button onClick={() => onDelete(notification.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors" title="Delete">
          <HiTrash className="w-4 h-4"/>
        </button>
      </div>
    </div>
  );
};

const Notifications = () => {
  const [page, setPage]       = useState(1);
  const [unreadOnly, setUnread] = useState(false);

  const { data, loading, refetch } = useQuery(
    () => notificationService.getAll({ page, limit: 20, unread: unreadOnly || undefined }), [page, unreadOnly]
  );
  const notifications = data?.data || [];
  const pagination    = data?.pagination;
  const unreadCount   = notifications.filter(n => !n.isRead).length;

  const handleRead = async (id) => {
    try { await notificationService.markAsRead(id); refetch(); } catch {}
  };

  const handleDelete = async (id) => {
    try { await notificationService.delete(id); toast.success('Deleted'); refetch(); } catch {}
  };

  const handleMarkAll = async () => {
    try { await notificationService.markAllAsRead(); toast.success('All marked as read'); refetch(); } catch {}
  };

  const handleDeleteAll = async () => {
    try { await notificationService.deleteAll(); toast.success('All cleared'); refetch(); } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pagination?.total || 0} total · {unreadCount} unread
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button size="sm" variant="secondary" leftIcon={<HiCheck className="w-4 h-4"/>}
              onClick={handleMarkAll}>Mark all read</Button>
          )}
          {notifications.length > 0 && (
            <Button size="sm" variant="ghost" leftIcon={<HiTrash className="w-4 h-4"/>}
              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleDeleteAll}>Clear all</Button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl w-fit">
        {[{v:false,l:'All'},{v:true,l:'Unread'}].map(f => (
          <button key={String(f.v)} onClick={() => { setUnread(f.v); setPage(1); }}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              unreadOnly===f.v ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                               : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-20 rounded-xl"/>)}
        </div>
      ) : notifications.length ? (
        <>
          <div className="space-y-2">
            {notifications.map(n => (
              <NotificationItem key={n.id} notification={n} onRead={handleRead} onDelete={handleDelete}/>
            ))}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="secondary" disabled={!pagination.hasPrev} onClick={() => setPage(p => p-1)}>← Prev</Button>
              <span className="flex items-center text-sm text-gray-500 px-3">{page} / {pagination.totalPages}</span>
              <Button size="sm" variant="secondary" disabled={!pagination.hasNext} onClick={() => setPage(p => p+1)}>Next →</Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState icon="🔔" title="No notifications" description="You're all caught up! Notifications about budgets and goals will appear here." />
      )}
    </div>
  );
};

export default Notifications;
