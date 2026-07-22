import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';
import { categoryService } from '../../api/services.js';
import { useQuery } from '../../hooks/useQuery.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { cn } from '../../utils/helpers.js';

const ICONS = ['💰','🍽️','🚗','🛍️','🏠','🏥','🎬','📚','✈️','💡','💅','📱','💼','💻','🏢','📈','🎁','💸','🎯','🎮','🐾','⚽','🎵','📦','🔧','🌿'];
const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#f97316','#ec4899','#14b8a6','#84cc16','#e11d48','#7c3aed'];

const schema = z.object({
  name:        z.string().min(2,'Min 2 chars').max(50),
  type:        z.enum(['INCOME','EXPENSE']),
  description: z.string().max(200).optional(),
});

const CategoryForm = ({ category, onClose, onSuccess }) => {
  const isEdit = !!category;
  const [icon, setIcon]   = useState(category?.icon || '💰');
  const [color, setColor] = useState(category?.color || '#6366f1');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: category?.name || '', type: category?.type || 'EXPENSE', description: category?.description || '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await categoryService.update(category.id, { ...data, icon, color });
        toast.success('Category updated!');
      } else {
        await categoryService.create({ ...data, icon, color });
        toast.success('Category created!');
      }
      onSuccess?.();
      onClose();
    } catch {} finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type */}
      <div className="flex rounded-xl border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700/50">
        {['EXPENSE','INCOME'].map((t) => (
          <label key={t} className="flex-1">
            <input type="radio" value={t} {...register('type')} className="sr-only" />
            <span className={cn('block text-center py-2 rounded-lg text-sm font-medium cursor-pointer transition-all',
              'peer-checked:bg-primary-600')}>
              {t === 'INCOME' ? '💰 Income' : '💸 Expense'}
            </span>
          </label>
        ))}
      </div>

      <Input label="Category Name" placeholder="e.g. Food & Dining" error={errors.name?.message} {...register('name')} />
      <Input label="Description (optional)" placeholder="Short description..." error={errors.description?.message} {...register('description')} />

      {/* Icon picker */}
      <div>
        <label className="label">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map((ic) => (
            <button key={ic} type="button" onClick={() => setIcon(ic)}
              className={cn('w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all',
                icon === ic ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/30 scale-110' : 'hover:bg-gray-100 dark:hover:bg-gray-700')}>
              {ic}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="label">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={cn('w-7 h-7 rounded-full transition-all', color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105')}
              style={{ background: c }} />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: color + '20' }}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Preview</p>
          <p className="text-xs text-gray-500">This is how it will look</p>
        </div>
        <div className="ml-auto w-3 h-3 rounded-full" style={{ background: color }} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">{isEdit ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
};

const CategoryCard = ({ category, onEdit, onDelete }) => (
  <div className="card p-4 hover:shadow-md transition-shadow group">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: category.color + '20' }}>
        {category.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{category.name}</p>
          {category.isDefault && <Badge variant="info" className="text-[10px]">Default</Badge>}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {category._count?.transactions || 0} transactions
        </p>
      </div>
      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: category.color }} />
    </div>
    {category.description && (
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">{category.description}</p>
    )}
    {!category.isDefault && (
      <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant="ghost" leftIcon={<HiPencil className="w-3.5 h-3.5" />}
          className="flex-1 text-xs" onClick={() => onEdit(category)}>Edit</Button>
        <Button size="sm" variant="ghost" leftIcon={<HiTrash className="w-3.5 h-3.5" />}
          className="flex-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => onDelete(category)}>Delete</Button>
      </div>
    )}
  </div>
);

const Categories = () => {
  const [modalOpen, setModalOpen]   = useState(false);
  const [editCat, setEditCat]       = useState(null);
  const [deleteCat, setDeleteCat]   = useState(null);
  const [deleteLoading, setDL]      = useState(false);
  const [activeTab, setActiveTab]   = useState('ALL');

  const { data, loading, refetch } = useQuery(() => categoryService.getAll(), []);
  const categories = data?.data || [];

  const filtered = activeTab === 'ALL' ? categories
    : categories.filter(c => c.type === activeTab);

  const expenseCount = categories.filter(c => c.type === 'EXPENSE').length;
  const incomeCount  = categories.filter(c => c.type === 'INCOME').length;

  const handleDelete = async () => {
    setDL(true);
    try {
      await categoryService.delete(deleteCat.id);
      toast.success('Category deleted');
      setDeleteCat(null);
      refetch();
    } catch {} finally { setDL(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{categories.length} total · {expenseCount} expense · {incomeCount} income</p>
        </div>
        <Button size="sm" leftIcon={<HiPlus className="w-4 h-4" />}
          onClick={() => { setEditCat(null); setModalOpen(true); }}>New Category</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl w-fit">
        {['ALL','EXPENSE','INCOME'].map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              activeTab === t ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}>
            {t === 'ALL' ? `All (${categories.length})` : t === 'EXPENSE' ? `💸 Expense (${expenseCount})` : `💰 Income (${incomeCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({length:8}).map((_,i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : filtered.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(c => (
            <CategoryCard key={c.id} category={c}
              onEdit={(cat) => { setEditCat(cat); setModalOpen(true); }}
              onDelete={setDeleteCat} />
          ))}
        </div>
      ) : (
        <EmptyState icon="📂" title="No categories" description="Create your first category"
          actionLabel="New Category" onAction={() => setModalOpen(true)} />
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditCat(null); }}
        title={editCat ? 'Edit Category' : 'New Category'} size="md">
        <CategoryForm category={editCat} onClose={() => { setModalOpen(false); setEditCat(null); }} onSuccess={refetch} />
      </Modal>

      <Modal isOpen={!!deleteCat} onClose={() => setDeleteCat(null)} title="Delete Category" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Are you sure you want to delete <span className="font-semibold">"{deleteCat?.name}"</span>?
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-6">
          ⚠️ Categories with transactions cannot be deleted.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteCat(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" loading={deleteLoading} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Categories;
