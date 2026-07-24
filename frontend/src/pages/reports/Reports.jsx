import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { HiDownload, HiDocumentText, HiTable } from 'react-icons/hi';
import { reportService, analyticsService } from '../../api/services.js';
import { useQuery } from '../../hooks/useQuery.js';
import { useLang } from '../../contexts/LanguageContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import Input from '../../components/ui/Input.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { formatCurrency, formatPercent, getMonthName, shortenCurrency } from '../../utils/format.js';
import { cn, downloadBlob, getCurrentMonthYear } from '../../utils/helpers.js';
import toast from 'react-hot-toast';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }));
const YEARS = [2023, 2024, 2025, 2026].map(y => ({ value: y, label: String(y) }));

const Reports = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const currency = user?.currency || 'USD';
  const { month, year } = getCurrentMonthYear();

  const [period, setPeriod] = useState('MONTHLY');
  const [selMonth, setSelMonth] = useState(month);
  const [selYear, setSelYear] = useState(year);
  const [exportLoading, setEL] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const { data: summaryData, loading: summaryLoading } = useQuery(
    () => reportService.getSummary({ period, month: selMonth, year: selYear }), [period, selMonth, selYear]
  );
  const { data: analyticsData, loading: analyticsLoading } = useQuery(
    () => analyticsService.getOverview({ months: 12 }), []
  );

  const summary = summaryData?.data;
  const analytics = analyticsData?.data;

  const handleExport = async (format) => {
    setEL(format);
    try {
      const params = { ...dateRange };
      const res = format === 'csv'
        ? await reportService.exportCSV(params)
        : await reportService.exportExcel(params);
      downloadBlob(res.data, `smart-budget-report.${format === 'csv' ? 'csv' : 'xlsx'}`);
      toast.success('Report downloaded!');
    } catch { } finally { setEL(''); }
  };

  const SummaryCard = ({ label, value, sub, color }) => (
    <div className="card p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={cn('text-2xl font-bold mt-1', color || 'text-gray-900 dark:text-white')}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Analyze your financial data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" leftIcon={<HiTable className="w-4 h-4" />}
            loading={exportLoading === 'csv'} onClick={() => handleExport('csv')}>CSV</Button>
          <Button variant="secondary" size="sm" leftIcon={<HiDownload className="w-4 h-4" />}
            loading={exportLoading === 'excel'} onClick={() => handleExport('excel')}>Excel</Button>
        </div>
      </div>

      {/* Period selector */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
            {[
              { value: 'DAILY', label: t('reports.daily') },
              { value: 'WEEKLY', label: t('reports.weekly') },
              { value: 'MONTHLY', label: t('reports.monthly') },
              { value: 'YEARLY', label: t('reports.yearly') },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  period === p.value
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {(period === 'MONTHLY' || period === 'YEARLY') && (
            <div className="flex gap-2">
              {period === 'MONTHLY' && (
                <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} className="input w-auto text-sm py-2 px-3">
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              )}
              <select value={selYear} onChange={e => setSelYear(Number(e.target.value))} className="input w-auto text-sm py-2 px-3">
                {YEARS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label={t('reports.totalIncome')} value={formatCurrency(summary.totalIncome, currency)} color="text-emerald-600 dark:text-emerald-400" sub={`${summary.transactionCount} transactions`} />
          <SummaryCard label={t('reports.totalExpense')} value={formatCurrency(summary.totalExpense, currency)} color="text-red-500" />
          <SummaryCard label={t('reports.netSavings')} value={formatCurrency(summary.netSavings, currency)}
            color={summary.netSavings >= 0 ? 'text-primary-600' : 'text-red-500'} />
          <SummaryCard label={t('reports.savingsRate')} value={formatPercent(summary.savingsRate)}
            color={summary.savingsRate >= 20 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}
            sub={t('reports.ofIncome')} />
        </div>
      )}

      {/* Charts */}
      <div className="grid xl:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">12-Month Overview</h2>
            <Badge variant="default">Income vs Expense</Badge>
          </div>
          {analyticsLoading ? <Skeleton className="h-64 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics?.monthlyTrend || []} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-gray-700" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => shortenCurrency(v)} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={v => formatCurrency(v, currency)} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="income" name={t('transactions.income')} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expense" name={t('transactions.expense')} fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Savings trend */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Savings Trend</h2>
            <Badge variant="success">Net savings</Badge>
          </div>
          {analyticsLoading ? <Skeleton className="h-64 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={analytics?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-gray-700" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={v => shortenCurrency(v)} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={v => formatCurrency(v, currency)} />
                <Line type="monotone" dataKey="savings" name="Savings" stroke="#6366f1" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Export section */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Export Data</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Input label={t('reports.startDate')} type="date" value={dateRange.startDate}
            onChange={e => setDateRange(p => ({ ...p, startDate: e.target.value }))} />
          <Input label={t('reports.endDate')} type="date" value={dateRange.endDate}
            onChange={e => setDateRange(p => ({ ...p, endDate: e.target.value }))} />
        </div>
        <div className="flex gap-3">
          <div className="card p-4 flex-1 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
            onClick={() => handleExport('csv')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <HiTable className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">CSV Export</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Spreadsheet compatible</p>
              </div>
            </div>
          </div>
          <div className="card p-4 flex-1 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
            onClick={() => handleExport('excel')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <HiDownload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Excel Export</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Full Excel workbook</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
