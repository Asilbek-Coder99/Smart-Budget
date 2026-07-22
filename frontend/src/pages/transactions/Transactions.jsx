import { useState, useCallback } from 'react';
import { HiPlus, HiSearch, HiFilter, HiTrash, HiPencil, HiDownload } from 'react-icons/hi';
import { transactionService, reportService, categoryService } from '../../api/services.js';
import { useQuery } from '../../hooks/useQuery.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import TransactionModal from './TransactionModal.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';
import { cn, downloadBlob } from '../../utils/helpers.js';
import toast from 'react-hot-toast';

const Transactions = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';

  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [type, setType]           = useState('');
  const [categoryId, setCat]      = useState('');
  const [startDate, setStart]     = useState('');
  const [endDate, setEnd]         = useState('');
  const [sortBy, setSortBy]       = useState('date');
  const [sortOrder, setOrder]     = useState('desc');
  const [showFilters, setShowF]   = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx]       = useState(null);
  const [deleteTx, setDeleteTx]   = useState(null);
  const [deleteLoading, setDL]    = useState(false);
  const limit = 15;

  // deps array — bu o'zgaruvchilardan biri o'zgarganda qayta yuklaydi
  const { data, loading, refetch } = useQuery(
    () => transactionService.getAll({ page, limit, search, type, categoryId, startDate, endDate, sortBy, sortOrder }),
    [page, search, type, categoryId, startDate, endDate, sortBy, sortOrder]
  );

  const { data: catData } = useQuery(() => categoryService.getAll(), []);

  const transactions = data?.data || [];
  const pagination   = data?.pagination;
  const categories   = catData?.data || [];
  const catOptions   = [
    { value: '', label: 'All Categories' },
    ...categories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` })),
  ];

  const handleSearch = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleDelete = async () => {
    if (!deleteTx) return;
    setDL(true);
    try {
      await transactionService.delete(deleteTx.id);
      toast.success('Transaction deleted');
      setDeleteTx(null);
      refetch();
    } catch {} finally { setDL(false); }
  };

  const handleExport = async (format) => {
    try {
      const params = { type, startDate, endDate };
      const res = format === 'csv'
        ? await reportService.exportCSV(params)
        : await reportService.exportExcel(params);
      downloadBlob(res.data, `transactions.${format === 'csv' ? 'csv' : 'xlsx'}`);
      toast.success('Downloaded!');
    } catch {}
  };

  const totalIncome  = transactions.filter(t => t.type==='INCOME').reduce((s,t) => s+t.amount, 0);
  const totalExpense = transactions.filter(t => t.type==='EXPENSE').reduce((s,t) => s+t.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pagination?.total || 0} total transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<HiDownload className="w-4 h-4"/>}
            onClick={() => handleExport('xlsx')}>Excel</Button>
          <Button variant="secondary" size="sm" leftIcon={<HiDownload className="w-4 h-4"/>}
            onClick={() => handleExport('csv')}>CSV</Button>
          <Button size="sm" leftIcon={<HiPlus className="w-4 h-4"/>}
            onClick={() => { setEditTx(null); setModalOpen(true); }}>
            Add
          </Button>
        </div>
      </div>

      {/* Mini summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Income (page)',  value: totalIncome,              color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Expense (page)', value: totalExpense,             color: 'text-red-500' },
          { label: 'Net (page)',     value: totalIncome - totalExpense,
            color: totalIncome - totalExpense >= 0 ? 'text-primary-600' : 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={cn('text-lg font-bold mt-0.5', s.color)}>{formatCurrency(s.value, currency)}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-3">
          <Input
            placeholder="Search transactions…"
            leftIcon={<HiSearch className="w-4 h-4"/>}
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="flex-1"
          />
          <Select
            options={[
              { value: 'date',   label: 'Date'   },
              { value: 'amount', label: 'Amount' },
              { value: 'title',  label: 'Title'  },
            ]}
            value={sortBy}
            onChange={e => { setSortBy(e.target.value); setPage(1); }}
            className="w-32"
          />
          <Button variant="secondary" size="sm" leftIcon={<HiFilter className="w-4 h-4"/>}
            onClick={() => setShowF(p => !p)}>
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Select
              placeholder="All Types"
              options={[{ value:'INCOME', label:'💰 Income' }, { value:'EXPENSE', label:'💸 Expense' }]}
              value={type}
              onChange={e => { setType(e.target.value); setPage(1); }}
            />
            <Select
              options={catOptions}
              value={categoryId}
              onChange={e => { setCat(e.target.value); setPage(1); }}
            />
            <Input type="date" placeholder="Start Date" value={startDate}
              onChange={e => { setStart(e.target.value); setPage(1); }}/>
            <Input type="date" placeholder="End Date"   value={endDate}
              onChange={e => { setEnd(e.target.value); setPage(1); }}/>
          </div>
        )}

        {/* Active filters badges */}
        {(type || categoryId || startDate || endDate || search) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {type && <span className="badge-income">{type}</span>}
            {search && <span className="badge-expense">"{search}"</span>}
            {startDate && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">From {startDate}</span>}
            {endDate   && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">To {endDate}</span>}
            <button className="text-xs text-red-500 hover:underline ml-1"
              onClick={() => { setType(''); setCat(''); setStart(''); setEnd(''); setSearch(''); setPage(1); }}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <tr>
                {['Transaction','Category','Date','Amount',''].map((h,i) => (
                  <th key={i} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {loading ? (
                Array.from({length:8}).map((_,i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3">
                    <Skeleton className="h-8 w-full"/>
                  </td></tr>
                ))
              ) : transactions.length ? (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                          style={{ background: (tx.category?.color||'#6366f1')+'20' }}>
                          {tx.category?.icon||'💰'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.title}</p>
                          {tx.description && (
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">{tx.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{tx.category?.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(tx.date)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-sm font-semibold',
                        tx.type==='INCOME'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-500 dark:text-red-400')}>
                        {tx.type==='INCOME' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditTx(tx); setModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors">
                          <HiPencil className="w-4 h-4"/>
                        </button>
                        <button
                          onClick={() => setDeleteTx(tx)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                          <HiTrash className="w-4 h-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5}>
                  <EmptyState icon="💸" title="No transactions found"
                    description="Add your first transaction to get started"
                    actionLabel="Add Transaction" onAction={() => setModalOpen(true)}/>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" disabled={!pagination.hasPrev}
                onClick={() => setPage(p => p-1)}>← Prev</Button>
              {Array.from({length: Math.min(5, pagination.totalPages)}, (_, i) => {
                const p = Math.max(1, page-2) + i;
                if (p > pagination.totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={cn('w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                      p === page
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400')}>
                    {p}
                  </button>
                );
              })}
              <Button size="sm" variant="secondary" disabled={!pagination.hasNext}
                onClick={() => setPage(p => p+1)}>Next →</Button>
            </div>
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTx(null); }}
        transaction={editTx}
        onSuccess={refetch}
      />

      <Modal isOpen={!!deleteTx} onClose={() => setDeleteTx(null)} title="Delete Transaction" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Delete <span className="font-semibold">"{deleteTx?.title}"</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteTx(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" loading={deleteLoading} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Transactions;
