import { useState, useCallback } from 'react';
import { HiPlus, HiSearch, HiFilter, HiTrash, HiPencil, HiDownload } from 'react-icons/hi';
import { transactionService, reportService, categoryService } from '../../api/services.js';
import { useQuery }  from '../../hooks/useQuery.js';
import { useAuth }   from '../../contexts/AuthContext.jsx';
import { useLang }   from '../../contexts/LanguageContext.jsx';
import Button        from '../../components/ui/Button.jsx';
import Input         from '../../components/ui/Input.jsx';
import Select        from '../../components/ui/Select.jsx';
import Skeleton      from '../../components/ui/Skeleton.jsx';
import EmptyState    from '../../components/ui/EmptyState.jsx';
import Modal         from '../../components/ui/Modal.jsx';
import TransactionModal from './TransactionModal.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';
import { cn, downloadBlob } from '../../utils/helpers.js';
import toast from 'react-hot-toast';

const Transactions = () => {
  const { user } = useAuth();
  const { t }    = useLang();
  const currency = user?.currency || 'USD';

  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [type, setType]         = useState('');
  const [categoryId, setCat]    = useState('');
  const [startDate, setStart]   = useState('');
  const [endDate, setEnd]       = useState('');
  const [sortBy, setSortBy]     = useState('date');
  const [showFilters, setShowF] = useState(false);
  const [modalOpen, setModal]   = useState(false);
  const [editTx, setEditTx]     = useState(null);
  const [deleteTx, setDelTx]    = useState(null);
  const [deleteLoading, setDL]  = useState(false);
  const limit = 15;

  const { data, loading, refetch } = useQuery(
    () => transactionService.getAll({ page, limit, search, type, categoryId, startDate, endDate, sortBy, sortOrder:'desc' }),
    [page, search, type, categoryId, startDate, endDate, sortBy]
  );
  const { data: catData } = useQuery(() => categoryService.getAll(), []);

  const transactions = data?.data || [];
  const pagination   = data?.pagination;
  const catOptions   = [
    { value:'', label: t('transactions.allTypes') },
    ...(catData?.data||[]).map(c=>({ value:c.id, label:`${c.icon} ${c.name}` })),
  ];

  const handleDelete = async () => {
    setDL(true);
    try {
      await transactionService.delete(deleteTx.id);
      toast.success(t('common.deleted'));
      setDelTx(null); refetch();
    } catch {} finally { setDL(false); }
  };

  const handleExport = async (format) => {
    try {
      const res = format==='csv'
        ? await reportService.exportCSV({ type, startDate, endDate })
        : await reportService.exportExcel({ type, startDate, endDate });
      downloadBlob(res.data, `transactions.${format==='csv'?'csv':'xlsx'}`);
      toast.success(t('common.download') + '!');
    } catch {}
  };

  const totalIncome  = transactions.filter(t=>t.type==='INCOME').reduce((s,t)=>s+t.amount,0);
  const totalExpense = transactions.filter(t=>t.type==='EXPENSE').reduce((s,t)=>s+t.amount,0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">{t('transactions.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pagination?.total||0} {t('common.total').toLowerCase()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<HiDownload className="w-4 h-4"/>} onClick={()=>handleExport('xlsx')}>{t('common.excel')}</Button>
          <Button variant="secondary" size="sm" leftIcon={<HiDownload className="w-4 h-4"/>} onClick={()=>handleExport('csv')}>{t('common.csv')}</Button>
          <Button size="sm" leftIcon={<HiPlus className="w-4 h-4"/>} onClick={()=>{ setEditTx(null); setModal(true); }}>
            {t('common.add')}
          </Button>
        </div>
      </div>

      {/* Mini statistika */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:t('transactions.incomePage'),  value:totalIncome,             color:'text-emerald-600 dark:text-emerald-400' },
          { label:t('transactions.expensePage'), value:totalExpense,            color:'text-red-500' },
          { label:t('transactions.netPage'),     value:totalIncome-totalExpense,
            color:totalIncome-totalExpense>=0?'text-primary-600':'text-red-500' },
        ].map(s=>(
          <div key={s.label} className="card p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={cn('text-lg font-bold mt-0.5',s.color)}>{formatCurrency(s.value,currency)}</p>
          </div>
        ))}
      </div>

      {/* Qidiruv + Filtrlar */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-3">
          <Input placeholder={t('transactions.searchPlaceholder')}
            leftIcon={<HiSearch className="w-4 h-4"/>}
            value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} className="flex-1"/>
          <Select options={[
            {value:'date',  label:t('common.date')},
            {value:'amount',label:t('common.amount')},
            {value:'title', label:t('common.name')},
          ]} value={sortBy} onChange={e=>setSortBy(e.target.value)} className="w-36"/>
          <Button variant="secondary" size="sm" leftIcon={<HiFilter className="w-4 h-4"/>}
            onClick={()=>setShowF(p=>!p)}>{t('common.filter')}</Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Select placeholder={t('transactions.allTypes')}
              options={[{value:'INCOME',label:`💰 ${t('transactions.income')}`},{value:'EXPENSE',label:`💸 ${t('transactions.expense')}`}]}
              value={type} onChange={e=>{ setType(e.target.value); setPage(1); }}/>
            <Select options={catOptions} value={categoryId} onChange={e=>{ setCat(e.target.value); setPage(1); }}/>
            <Input type="date" placeholder={t('transactions.startDate')} value={startDate}
              onChange={e=>{ setStart(e.target.value); setPage(1); }}/>
            <Input type="date" placeholder={t('transactions.endDate')} value={endDate}
              onChange={e=>{ setEnd(e.target.value); setPage(1); }}/>
          </div>
        )}

        {(type||categoryId||startDate||endDate||search) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('transactions.activeFilters')}:</span>
            {type      && <span className="badge-income">{type==='INCOME'?t('transactions.income'):t('transactions.expense')}</span>}
            {search    && <span className="badge-expense">"{search}"</span>}
            {startDate && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{t('transactions.startDate')}: {startDate}</span>}
            {endDate   && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{t('transactions.endDate')}: {endDate}</span>}
            <button className="text-xs text-red-500 hover:underline"
              onClick={()=>{ setType(''); setCat(''); setStart(''); setEnd(''); setSearch(''); setPage(1); }}>
              {t('transactions.clearAll')}
            </button>
          </div>
        )}
      </div>

      {/* Jadval */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <tr>
                {[t('transactions.transaction'),t('common.category'),t('common.date'),t('common.amount'),''].map((h,i)=>(
                  <th key={i} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {loading ? Array.from({length:8}).map((_,i)=>(
                <tr key={i}><td colSpan={5} className="px-4 py-3"><Skeleton className="h-8 w-full"/></td></tr>
              )) : transactions.length ? transactions.map(tx=>(
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                        style={{background:(tx.category?.color||'#6366f1')+'20'}}>
                        {tx.category?.icon||'💰'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.title}</p>
                        {tx.description&&<p className="text-xs text-gray-400 truncate max-w-[180px]">{tx.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-sm text-gray-600 dark:text-gray-400">{tx.category?.name}</span></td>
                  <td className="px-4 py-3"><span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(tx.date)}</span></td>
                  <td className="px-4 py-3">
                    <span className={cn('text-sm font-semibold',
                      tx.type==='INCOME'?'text-emerald-600 dark:text-emerald-400':'text-red-500 dark:text-red-400')}>
                      {tx.type==='INCOME'?'+':'-'}{formatCurrency(tx.amount,currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={()=>{ setEditTx(tx); setModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors">
                        <HiPencil className="w-4 h-4"/>
                      </button>
                      <button onClick={()=>setDelTx(tx)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                        <HiTrash className="w-4 h-4"/>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5}>
                  <EmptyState icon="💸" title={t('transactions.noTransactions')}
                    description={t('transactions.startAdding')}
                    actionLabel={t('transactions.addTransaction')} onAction={()=>setModal(true)}/>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages>1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('common.page')} {pagination.page} {t('common.of')} {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={!pagination.hasPrev} onClick={()=>setPage(p=>p-1)}>← {t('common.prev')}</Button>
              <Button size="sm" variant="secondary" disabled={!pagination.hasNext} onClick={()=>setPage(p=>p+1)}>{t('common.next')} →</Button>
            </div>
          </div>
        )}
      </div>

      <TransactionModal isOpen={modalOpen} onClose={()=>{ setModal(false); setEditTx(null); }} transaction={editTx} onSuccess={refetch}/>

      <Modal isOpen={!!deleteTx} onClose={()=>setDelTx(null)} title={t('common.delete')} size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {t('transactions.deleteConfirm')} <span className="font-semibold">"{deleteTx?.title}"</span>? {t('transactions.deleteWarning')}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={()=>setDelTx(null)}>{t('common.cancel')}</Button>
          <Button variant="danger" className="flex-1" loading={deleteLoading} onClick={handleDelete}>{t('common.delete')}</Button>
        </div>
      </Modal>
    </div>
  );
};
export default Transactions;
