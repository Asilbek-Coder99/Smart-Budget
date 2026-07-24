import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Modal    from '../../components/ui/Modal.jsx';
import Input    from '../../components/ui/Input.jsx';
import Button   from '../../components/ui/Button.jsx';
import Select   from '../../components/ui/Select.jsx';
import { useQuery }   from '../../hooks/useQuery.js';
import { useLang }    from '../../contexts/LanguageContext.jsx';
import { categoryService, transactionService } from '../../api/services.js';

const schema = z.object({
  title:       z.string().min(2).max(100),
  amount:      z.coerce.number().positive(),
  type:        z.enum(['INCOME','EXPENSE']),
  categoryId:  z.string().min(1),
  date:        z.string().min(1),
  description: z.string().max(500).optional(),
  note:        z.string().max(300).optional(),
});

const TransactionModal = ({ isOpen, onClose, transaction, defaultType='EXPENSE', onSuccess }) => {
  const { t } = useLang();
  const isEdit = !!transaction;
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState:{errors} } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: defaultType, date: new Date().toISOString().split('T')[0] },
  });

  const selectedType = watch('type');

  const { data: catData } = useQuery(
    () => categoryService.getAll({ type: selectedType }),
    [selectedType, isOpen],
    { enabled: isOpen }
  );
  const catOptions = (catData?.data||[]).map(c=>({ value:c.id, label:`${c.icon} ${c.name}` }));

  useEffect(() => {
    if (transaction) {
      reset({
        title:       transaction.title,
        amount:      transaction.amount,
        type:        transaction.type,
        categoryId:  transaction.categoryId,
        date:        new Date(transaction.date).toISOString().split('T')[0],
        description: transaction.description||'',
        note:        transaction.note||'',
      });
    } else {
      reset({ type: defaultType, date: new Date().toISOString().split('T')[0] });
    }
  }, [transaction, defaultType, isOpen]);

  useEffect(() => { setValue('categoryId',''); }, [selectedType]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await transactionService.update(transaction.id, data);
        toast.success(t('common.updated'));
      } else {
        await transactionService.create(data);
        toast.success(t('common.created'));
      }
      onSuccess?.(); onClose();
    } catch {} finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={isEdit ? t('transactions.editTransaction') : t('transactions.addTransaction')} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Tur tanlash */}
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700/50">
          {['EXPENSE','INCOME'].map(tp => (
            <button key={tp} type="button" onClick={()=>setValue('type',tp)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedType===tp
                  ? tp==='INCOME' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-red-500 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
              {tp==='INCOME' ? `💰 ${t('transactions.income')}` : `💸 ${t('transactions.expense')}`}
            </button>
          ))}
        </div>

        <Input label={t('transactions.titleField')}
          placeholder={t('transactions.titlePlaceholder')}
          error={errors.title?.message} {...register('title')}/>

        <div className="grid grid-cols-2 gap-3">
          <Input label={t('transactions.amountField')} type="number" step="0.01" min="0.01"
            placeholder="0.00" leftIcon={<span className="text-gray-400 text-sm">$</span>}
            error={errors.amount?.message} {...register('amount')}/>
          <Input label={t('transactions.dateField')} type="date"
            error={errors.date?.message} {...register('date')}/>
        </div>

        <Select label={t('transactions.categoryField')} options={catOptions}
          placeholder={t('transactions.selectCategory')}
          error={errors.categoryId?.message} {...register('categoryId')}/>

        <Input label={t('transactions.descField')} error={errors.description?.message} {...register('description')}/>
        <Input label={t('transactions.noteField')}  error={errors.note?.message}        {...register('note')}/>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading} className="flex-1"
            variant={selectedType==='INCOME'?'success':'primary'}>
            {isEdit ? t('common.update') : t('common.add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionModal;
