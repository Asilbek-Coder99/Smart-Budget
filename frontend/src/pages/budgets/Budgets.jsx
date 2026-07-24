import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiExclamation } from 'react-icons/hi';
import { budgetService, categoryService } from '../../api/services.js';
import { useQuery } from '../../hooks/useQuery.js';
import { useLang } from '../../contexts/LanguageContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { formatCurrency, formatMonth } from '../../utils/format.js';
import { cn, getCurrentMonthYear } from '../../utils/helpers.js';

const schema = z.object({
  name:       z.string().min(2,'Min 2 chars').max(100),
  amount:     z.coerce.number().positive('Must be positive'),
  categoryId: z.string().min(1,'Category required'),
  month:      z.coerce.number().int().min(1).max(12),
  year:       z.coerce.number().int().min(2020).max(2099),
  alertAt:    z.coerce.number().int().min(1).max(100).optional(),
});

const MONTHS = Array.from({length:12},(_,i) => ({ value: i+1, label: new Date(2000,i).toLocaleString('default',{month:'long'}) }));
const YEARS  = [2023,2024,2025,2026].map(y => ({ value: y, label: String(y) }));

const BudgetForm = ({ budget, onClose, onSuccess }) => {
  const { t } = useLang();
  const { month, year } = getCurrentMonthYear();
  const [loading, setLoading] = useState(false);
  const isEdit = !!budget;

  const { data: catData } = useQuery(() => categoryService.getAll({ type: 'EXPENSE' }));
  const catOptions = (catData?.data || []).map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }));

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name:       budget?.name || '',
      amount:     budget?.amount || '',
      categoryId: budget?.categoryId || '',
      month:      budget ? budget.month : month,
      year:       budget ? budget.year : year,
      alertAt:    budget?.alertAt || 80,
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) { await budgetService.update(budget.id, data); toast.success('Budget updated!'); }
      else        { await budgetService.create(data); toast.success('Budget created!'); }
      onSuccess?.(); onClose();
    } catch {} finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label={t('common.name')} placeholder="e.g. Monthly Groceries" error={errors.name?.message} {...register('name')} />
      <Input label={t('budgets.totalBudget')+' ($)'} type="number" step="0.01" min="1" placeholder="500.00"
        error={errors.amount?.message} {...register('amount')} />
      <Select label={t('categories.expenseCateg')} options={catOptions} placeholder="Select category..."
        error={errors.categoryId?.message} {...register('categoryId')} />
      <div className="grid grid-cols-2 gap-3">
        <Select label={t('budgets.month')} options={MONTHS.map(m=>({value:m.value,label:m.label}))}
          error={errors.month?.message} {...register('month')} />
        <Select label={t('budgets.year')} options={YEARS}
          error={errors.year?.message} {...register('year')} />
      </div>
      <div>
        <Input label={t('budgets.alertThreshold')} type="number" min="1" max="100" placeholder="80"
          hint={t('budgets.alertHint')}
          error={errors.alertAt?.message} {...register('alertAt')} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">{isEdit ? 'Update' : 'Create'} Budget</Button>
      </div>
    </form>
  );
};

const BudgetCard = ({ budget, currency, onEdit, onDelete }) => {
  const isOver    = budget.percentage >= 100;
  const isWarning = budget.percentage >= budget.alertAt && !isOver;
  return (
    <div className={cn('card p-5 border-l-4 transition-shadow hover:shadow-md',
      isOver ? 'border-l-red-500' : isWarning ? 'border-l-amber-500' : 'border-l-emerald-500')}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: (budget.category?.color || '#6366f1') + '20' }}>
            {budget.category?.icon || '💰'}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{budget.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{budget.category?.name} · {formatMonth(budget.month, budget.year)}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(budget)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"><HiPencil className="w-4 h-4"/></button>
          <button onClick={() => onDelete(budget)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"><HiTrash className="w-4 h-4"/></button>
        </div>
      </div>

      {(isOver || isWarning) && (
        <div className={cn('flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-2 mb-3',
          isOver ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                 : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400')}>
          <HiExclamation className="w-4 h-4 shrink-0"/>
          {isOver ? 'Budget exceeded!' : `Warning: ${budget.percentage}% used`}
        </div>
      )}

      <ProgressBar value={budget.spent} max={budget.amount} size="md" />

      <div className="flex justify-between items-center mt-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Spent</p>
          <p className={cn('text-base font-bold', isOver ? 'text-red-500' : 'text-gray-900 dark:text-white')}>
            {formatCurrency(budget.spent, currency)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Used</p>
          <p className={cn('text-base font-bold', isOver ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-600')}>
            {budget.percentage}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Limit</p>
          <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(budget.amount, currency)}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Remaining: <span className={cn('font-semibold', budget.remaining > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
            {formatCurrency(Math.max(0, budget.remaining), currency)}
          </span>
        </p>
      </div>
    </div>
  );
};

const Budgets = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const currency = user?.currency || 'USD';
  const { month, year } = getCurrentMonthYear();
  const [selMonth, setSelMonth] = useState(month);
  const [selYear,  setSelYear]  = useState(year);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBudget, setEditBudget]   = useState(null);
  const [deleteBudget, setDeleteBudget] = useState(null);
  const [deleteLoading, setDL] = useState(false);

  const { data, loading, refetch } = useQuery(
    () => budgetService.getAll({ month: selMonth, year: selYear }), [selMonth, selYear]
  );
  const budgets = data?.data?.budgets || [];
  const summary = data?.data?.summary || {};

  const handleDelete = async () => {
    setDL(true);
    try {
      await budgetService.delete(deleteBudget.id);
      toast.success('Budget deleted');
      setDeleteBudget(null); refetch();
    } catch {} finally { setDL(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatMonth(selMonth, selYear)}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}
            className="input w-auto text-sm py-2 px-3">
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}
            className="input w-auto text-sm py-2 px-3">
            {YEARS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
          </select>
          <Button size="sm" leftIcon={<HiPlus className="w-4 h-4"/>}
            onClick={() => { setEditBudget(null); setModalOpen(true); }}>{t('budgets.newBudget')}</Button>
        </div>
      </div>

      {/* Summary bar */}
      {budgets.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Monthly Overview</h2>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {summary.overallPercentage || 0}% used
            </span>
          </div>
          <ProgressBar value={summary.totalSpent || 0} max={summary.totalBudget || 1} size="lg" />
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { label: 'Total Budget', value: summary.totalBudget, color: 'text-gray-900 dark:text-white' },
              { label: 'Total Spent',  value: summary.totalSpent,  color: 'text-red-500' },
              { label: 'Remaining',    value: summary.totalRemaining, color: 'text-emerald-600 dark:text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className={cn('text-lg font-bold mt-0.5', s.color)}>{formatCurrency(s.value || 0, currency)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-52 rounded-2xl"/>)}
        </div>
      ) : budgets.length ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map(b => (
            <BudgetCard key={b.id} budget={b} currency={currency}
              onEdit={bgt => { setEditBudget(bgt); setModalOpen(true); }}
              onDelete={setDeleteBudget} />
          ))}
        </div>
      ) : (
        <EmptyState icon="🎯" title={t('budgets.noBudgets')}
          description={t('budgets.setBudgetHint')}
          actionLabel={t('budgets.createBudget')} onAction={() => setModalOpen(true)} />
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditBudget(null); }}
        title={editBudget ? 'Edit Budget' : 'New Budget'} size="md">
        <BudgetForm budget={editBudget} onClose={() => { setModalOpen(false); setEditBudget(null); }} onSuccess={refetch} />
      </Modal>

      <Modal isOpen={!!deleteBudget} onClose={() => setDeleteBudget(null)} title={t('common.delete')+' '+t('nav.budgets')} size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Delete <span className="font-semibold">"{deleteBudget?.name}"</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteBudget(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" loading={deleteLoading} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Budgets;
