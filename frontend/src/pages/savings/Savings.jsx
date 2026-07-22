import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiCash } from 'react-icons/hi';
import { savingsGoalService } from '../../api/services.js';
import { useQuery } from '../../hooks/useQuery.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';
import { cn } from '../../utils/helpers.js';

const ICONS = ['🎯','🏠','🚗','✈️','💍','🎓','💻','📱','🌴','🏖️','💪','🎸','🐶','🍕','⚽','🎮'];
const COLORS = ['#10b981','#6366f1','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#f97316','#ec4899'];

const schema = z.object({
  name:         z.string().min(2,'Min 2 chars').max(100),
  targetAmount: z.coerce.number().positive('Must be positive'),
  description:  z.string().max(200).optional(),
  deadline:     z.string().optional(),
});

const GoalForm = ({ goal, onClose, onSuccess }) => {
  const isEdit = !!goal;
  const [icon, setIcon]   = useState(goal?.icon || '🎯');
  const [color, setColor] = useState(goal?.color || '#10b981');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name:         goal?.name || '',
      targetAmount: goal?.targetAmount || '',
      description:  goal?.description || '',
      deadline:     goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data, icon, color };
      if (isEdit) { await savingsGoalService.update(goal.id, payload); toast.success('Goal updated!'); }
      else        { await savingsGoalService.create(payload); toast.success('Goal created!'); }
      onSuccess?.(); onClose();
    } catch {} finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Goal Name" placeholder="e.g. Emergency Fund" error={errors.name?.message} {...register('name')} />
      <Input label="Target Amount ($)" type="number" step="0.01" min="1" placeholder="5000.00"
        error={errors.targetAmount?.message} {...register('targetAmount')} />
      <Input label="Description (optional)" placeholder="What are you saving for?" error={errors.description?.message} {...register('description')} />
      <Input label="Deadline (optional)" type="date" error={errors.deadline?.message} {...register('deadline')} />

      <div>
        <label className="label">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(ic => (
            <button key={ic} type="button" onClick={() => setIcon(ic)}
              className={cn('w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all',
                icon === ic ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/30 scale-110' : 'hover:bg-gray-100 dark:hover:bg-gray-700')}>
              {ic}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={cn('w-7 h-7 rounded-full transition-all', color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105')}
              style={{ background: c }} />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">{isEdit ? 'Update' : 'Create'} Goal</Button>
      </div>
    </form>
  );
};

const ContributeModal = ({ goal, onClose, onSuccess, currency }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount');
    setLoading(true);
    try {
      await savingsGoalService.contribute(goal.id, { amount: Number(amount) });
      toast.success(`Added ${formatCurrency(Number(amount), currency)} to "${goal.name}"!`);
      onSuccess?.(); onClose();
    } catch {} finally { setLoading(false); }
  };

  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <Modal isOpen={!!goal} onClose={onClose} title="Add Contribution" size="sm">
      <div className="space-y-4">
        <div className="p-4 rounded-xl text-center" style={{ background: goal?.color + '15' }}>
          <span className="text-4xl">{goal?.icon}</span>
          <p className="font-semibold text-gray-900 dark:text-white mt-2">{goal?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatCurrency(goal?.currentAmount, currency)} / {formatCurrency(goal?.targetAmount, currency)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Remaining: {formatCurrency(remaining, currency)}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Amount ($)" type="number" step="0.01" min="0.01" placeholder="100.00"
            value={amount} onChange={e => setAmount(e.target.value)} />
          <div className="flex gap-2">
            {[10,25,50,100].map(v => (
              <button key={v} type="button" onClick={() => setAmount(String(v))}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors">
                +${v}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Add Funds</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

const GoalCard = ({ goal, currency, onEdit, onDelete, onContribute }) => {
  const isComplete = goal.status === 'COMPLETED';
  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className={cn('card p-5 hover:shadow-md transition-shadow', isComplete && 'border-emerald-200 dark:border-emerald-800')}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: goal.color + '20' }}>
            {goal.icon}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{goal.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant={isComplete ? 'success' : goal.status === 'PAUSED' ? 'warning' : 'info'}>
                {goal.status}
              </Badge>
              {daysLeft !== null && !isComplete && (
                <span className={cn('text-xs font-medium', daysLeft < 0 ? 'text-red-500' : daysLeft < 30 ? 'text-amber-500' : 'text-gray-400')}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(goal)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"><HiPencil className="w-4 h-4"/></button>
          <button onClick={() => onDelete(goal)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"><HiTrash className="w-4 h-4"/></button>
        </div>
      </div>

      {goal.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{goal.description}</p>}

      <ProgressBar value={goal.currentAmount} max={goal.targetAmount} size="md"
        colorClass={isComplete ? 'bg-emerald-500' : undefined} />

      <div className="flex justify-between items-center mt-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Saved</p>
          <p className="text-base font-bold" style={{ color: goal.color }}>
            {formatCurrency(goal.currentAmount, currency)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Progress</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{goal.percentage}%</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Target</p>
          <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(goal.targetAmount, currency)}</p>
        </div>
      </div>

      {goal.deadline && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Deadline: {formatDate(goal.deadline)}
        </p>
      )}

      {!isComplete && (
        <Button size="sm" variant="secondary" className="w-full mt-4"
          leftIcon={<HiCash className="w-4 h-4"/>}
          onClick={() => onContribute(goal)}>
          Add Contribution
        </Button>
      )}

      {isComplete && (
        <div className="mt-4 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">🎉 Goal Achieved!</p>
        </div>
      )}
    </div>
  );
};

const Savings = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const [modalOpen, setModalOpen]       = useState(false);
  const [editGoal, setEditGoal]         = useState(null);
  const [deleteGoal, setDeleteGoal]     = useState(null);
  const [contributeGoal, setContribute] = useState(null);
  const [deleteLoading, setDL]          = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, loading, refetch } = useQuery(
    () => savingsGoalService.getAll(statusFilter ? { status: statusFilter } : {}), [statusFilter]
  );
  const goals = data?.data || [];

  const totalSaved  = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const completed   = goals.filter(g => g.status === 'COMPLETED').length;

  const handleDelete = async () => {
    setDL(true);
    try {
      await savingsGoalService.delete(deleteGoal.id);
      toast.success('Goal deleted'); setDeleteGoal(null); refetch();
    } catch {} finally { setDL(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{goals.length} goals · {completed} completed</p>
        </div>
        <Button size="sm" leftIcon={<HiPlus className="w-4 h-4"/>}
          onClick={() => { setEditGoal(null); setModalOpen(true); }}>New Goal</Button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Saved', value: formatCurrency(totalSaved, currency), color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Total Target', value: formatCurrency(totalTarget, currency), color: 'text-primary-600' },
            { label: 'Completed', value: `${completed} / ${goals.length}`, color: 'text-amber-600 dark:text-amber-400' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className={cn('text-lg font-bold mt-0.5', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl w-fit">
        {[{v:'',l:'All'},{v:'ACTIVE',l:'Active'},{v:'COMPLETED',l:'Completed'},{v:'PAUSED',l:'Paused'}].map(f => (
          <button key={f.v} onClick={() => setStatusFilter(f.v)}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              statusFilter === f.v ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-64 rounded-2xl"/>)}
        </div>
      ) : goals.length ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map(g => (
            <GoalCard key={g.id} goal={g} currency={currency}
              onEdit={gl => { setEditGoal(gl); setModalOpen(true); }}
              onDelete={setDeleteGoal}
              onContribute={setContribute} />
          ))}
        </div>
      ) : (
        <EmptyState icon="🎯" title="No savings goals yet"
          description="Start saving for something meaningful"
          actionLabel="Create Goal" onAction={() => setModalOpen(true)} />
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditGoal(null); }}
        title={editGoal ? 'Edit Goal' : 'New Savings Goal'} size="md">
        <GoalForm goal={editGoal} onClose={() => { setModalOpen(false); setEditGoal(null); }} onSuccess={refetch} />
      </Modal>

      {contributeGoal && (
        <ContributeModal goal={contributeGoal} currency={currency}
          onClose={() => setContribute(null)} onSuccess={refetch} />
      )}

      <Modal isOpen={!!deleteGoal} onClose={() => setDeleteGoal(null)} title="Delete Goal" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Delete <span className="font-semibold">"{deleteGoal?.name}"</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteGoal(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" loading={deleteLoading} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Savings;
