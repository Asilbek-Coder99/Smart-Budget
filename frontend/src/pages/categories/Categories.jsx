import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';
import { categoryService } from '../../api/services.js';
import { useQuery }  from '../../hooks/useQuery.js';
import { useLang }   from '../../contexts/LanguageContext.jsx';
import Button        from '../../components/ui/Button.jsx';
import Input         from '../../components/ui/Input.jsx';
import Modal         from '../../components/ui/Modal.jsx';
import EmptyState    from '../../components/ui/EmptyState.jsx';
import Skeleton      from '../../components/ui/Skeleton.jsx';
import Badge         from '../../components/ui/Badge.jsx';
import { cn }        from '../../utils/helpers.js';

const ICONS  = ['💰','🍽️','🚗','🛍️','🏠','🏥','🎬','📚','✈️','💡','💅','📱','💼','💻','🏢','📈','🎁','💸','🎯','🎮','🐾','⚽','🎵','📦','🔧','🌿'];
const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#f97316','#ec4899','#14b8a6','#84cc16','#e11d48','#7c3aed'];

const schema = z.object({
  name: z.string().min(2).max(50),
  type: z.enum(['INCOME','EXPENSE']),
  description: z.string().max(200).optional(),
});

const CategoryForm = ({ category, onClose, onSuccess }) => {
  const { t }     = useLang();
  const isEdit    = !!category;
  const [icon, setIcon]   = useState(category?.icon||'💰');
  const [color, setColor] = useState(category?.color||'#6366f1');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState:{errors} } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name:category?.name||'', type:category?.type||'EXPENSE', description:category?.description||'' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) { await categoryService.update(category.id,{...data,icon,color}); toast.success(t('common.updated')); }
      else        { await categoryService.create({...data,icon,color}); toast.success(t('common.created')); }
      onSuccess?.(); onClose();
    } catch {} finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex rounded-xl border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700/50">
        {['EXPENSE','INCOME'].map(tp=>(
          <label key={tp} className="flex-1 cursor-pointer">
            <input type="radio" value={tp} {...register('type')} className="sr-only"/>
            <span className={cn('block text-center py-2 rounded-lg text-sm font-medium transition-all',
              'hover:bg-white/50 dark:hover:bg-gray-600/50')}>
              {tp==='INCOME'?`💰 ${t('transactions.income')}`:`💸 ${t('transactions.expense')}`}
            </span>
          </label>
        ))}
      </div>

      <Input label={t('common.name')} placeholder={t('categories.namePlaceholder')}
        error={errors.name?.message} {...register('name')}/>
      <Input label={t('common.description')+' ('+t('common.optional')+')'}
        placeholder={t('categories.descPlaceholder')}
        error={errors.description?.message} {...register('description')}/>

      <div>
        <label className="label">{t('categories.icon')}</label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(ic=>(
            <button key={ic} type="button" onClick={()=>setIcon(ic)}
              className={cn('w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all',
                icon===ic?'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/30 scale-110':'hover:bg-gray-100 dark:hover:bg-gray-700')}>
              {ic}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">{t('categories.color')}</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c=>(
            <button key={c} type="button" onClick={()=>setColor(c)}
              className={cn('w-7 h-7 rounded-full transition-all',color===c?'ring-2 ring-offset-2 ring-gray-400 scale-110':'hover:scale-105')}
              style={{background:c}}/>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{background:color+'20'}}>{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('categories.preview')}</p>
          <p className="text-xs text-gray-500">{t('categories.previewDesc')}</p>
        </div>
        <div className="ml-auto w-3 h-3 rounded-full" style={{background:color}}/>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" loading={loading} className="flex-1">
          {isEdit?t('common.update'):t('common.create')}
        </Button>
      </div>
    </form>
  );
};

const CategoryCard = ({ category, onEdit, onDelete, t }) => (
  <div className="card p-4 hover:shadow-md transition-shadow group">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
        style={{background:category.color+'20'}}>{category.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{category.name}</p>
          {category.isDefault && <Badge variant="info" className="text-[10px]">{t('categories.default')}</Badge>}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {category._count?.transactions||0} {t('categories.transactions')}
        </p>
      </div>
      <div className="w-3 h-3 rounded-full shrink-0" style={{background:category.color}}/>
    </div>
    {category.description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">{category.description}</p>}
    {!category.isDefault && (
      <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant="ghost" leftIcon={<HiPencil className="w-3.5 h-3.5"/>}
          className="flex-1 text-xs" onClick={()=>onEdit(category)}>{t('common.edit')}</Button>
        <Button size="sm" variant="ghost" leftIcon={<HiTrash className="w-3.5 h-3.5"/>}
          className="flex-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={()=>onDelete(category)}>{t('common.delete')}</Button>
      </div>
    )}
  </div>
);

const Categories = () => {
  const { t }  = useLang();
  const [modalOpen, setModal]     = useState(false);
  const [editCat, setEditCat]     = useState(null);
  const [deleteCat, setDelCat]    = useState(null);
  const [deleteLoading, setDL]    = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');

  const { data, loading, refetch } = useQuery(()=>categoryService.getAll(),[]);
  const categories = data?.data||[];
  const filtered   = activeTab==='ALL' ? categories : categories.filter(c=>c.type===activeTab);
  const expCount   = categories.filter(c=>c.type==='EXPENSE').length;
  const incCount   = categories.filter(c=>c.type==='INCOME').length;

  const handleDelete = async () => {
    setDL(true);
    try {
      await categoryService.delete(deleteCat.id);
      toast.success(t('common.deleted')); setDelCat(null); refetch();
    } catch {} finally { setDL(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('categories.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('common.total')}: {categories.length} · {t('transactions.expense')}: {expCount} · {t('transactions.income')}: {incCount}
          </p>
        </div>
        <Button size="sm" leftIcon={<HiPlus className="w-4 h-4"/>} onClick={()=>{ setEditCat(null); setModal(true); }}>
          {t('categories.newCategory')}
        </Button>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl w-fit">
        {[
          { v:'ALL',     l:`${t('common.all')} (${categories.length})` },
          { v:'EXPENSE', l:`💸 ${t('transactions.expense')} (${expCount})` },
          { v:'INCOME',  l:`💰 ${t('transactions.income')} (${incCount})` },
        ].map(tab=>(
          <button key={tab.v} onClick={()=>setActiveTab(tab.v)}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              activeTab===tab.v?'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                              :'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}>
            {tab.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-28 rounded-2xl"/>)}
        </div>
      ) : filtered.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(c=>(
            <CategoryCard key={c.id} category={c} t={t}
              onEdit={cat=>{ setEditCat(cat); setModal(true); }}
              onDelete={setDelCat}/>
          ))}
        </div>
      ) : (
        <EmptyState icon="📂" title={t('categories.noCategories')} description={t('categories.createFirst')}
          actionLabel={t('categories.newCategory')} onAction={()=>setModal(true)}/>
      )}

      <Modal isOpen={modalOpen} onClose={()=>{ setModal(false); setEditCat(null); }}
        title={editCat?t('categories.editCategory'):t('categories.newCategory')} size="md">
        <CategoryForm category={editCat} onClose={()=>{ setModal(false); setEditCat(null); }} onSuccess={refetch}/>
      </Modal>

      <Modal isOpen={!!deleteCat} onClose={()=>setDelCat(null)} title={t('common.delete')} size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {t('categories.deleteConfirm')} <span className="font-semibold">"{deleteCat?.name}"</span>?
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-6">{t('categories.deleteWarning')}</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={()=>setDelCat(null)}>{t('common.cancel')}</Button>
          <Button variant="danger" className="flex-1" loading={deleteLoading} onClick={handleDelete}>{t('common.delete')}</Button>
        </div>
      </Modal>
    </div>
  );
};
export default Categories;
