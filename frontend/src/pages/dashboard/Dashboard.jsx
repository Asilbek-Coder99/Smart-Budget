import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { HiTrendingUp, HiTrendingDown, HiCash, HiCreditCard, HiPlus, HiArrowRight } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useQuery } from '../../hooks/useQuery.js';
import { userService, analyticsService } from '../../api/services.js';
import Card from '../../components/ui/Card.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { formatCurrency, formatDate, shortenCurrency } from '../../utils/format.js';
import { cn } from '../../utils/helpers.js';
import TransactionModal from '../transactions/TransactionModal.jsx';

// ── Stat Card ─────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, change, currency = 'USD' }) => (
  <div className="card p-5 flex items-start justify-between gap-4">
    <div className="min-w-0">
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 truncate">
        {formatCurrency(value, currency)}
      </p>
      {change !== undefined && (
        <div className={cn('flex items-center gap-1 mt-1.5 text-xs font-medium',
          change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
          {change >= 0 ? <HiTrendingUp className="w-3.5 h-3.5" /> : <HiTrendingDown className="w-3.5 h-3.5" />}
          {Math.abs(change).toFixed(1)}% vs last month
        </div>
      )}
    </div>
    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', color)}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

// ── Custom Tooltip ─────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500 dark:text-gray-400 capitalize">{p.name}:</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(p.value, currency)}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txType, setTxType] = useState('EXPENSE');

  const { data: dashData, loading: dashLoading, refetch: refetchDash } = useQuery(
    () => userService.getDashboard(), []
  );
  const { data: analyticsData, loading: analyticsLoading } = useQuery(
    () => analyticsService.getOverview({ months: 6 }), []
  );
  const { data: insightsData } = useQuery(() => analyticsService.getInsights(), []);

  const dash = dashData?.data;
  const analytics = analyticsData?.data;
  const insights = insightsData?.data;

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#f97316', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName}! 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here's your financial overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary" size="sm"
            leftIcon={<HiPlus className="w-4 h-4" />}
            onClick={() => { setTxType('INCOME'); setTxModalOpen(true); }}
          >
            Income
          </Button>
          <Button
            size="sm"
            leftIcon={<HiPlus className="w-4 h-4" />}
            onClick={() => { setTxType('EXPENSE'); setTxModalOpen(true); }}
          >
            Expense
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      {dashLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Balance"
            value={dash?.balance || 0}
            icon={HiCash}
            color="bg-primary-600"
            currency={currency}
          />
          <StatCard
            title="Monthly Income"
            value={dash?.monthlyIncome || 0}
            icon={HiTrendingUp}
            color="bg-emerald-500"
            change={insights?.changes?.income}
            currency={currency}
          />
          <StatCard
            title="Monthly Expenses"
            value={dash?.monthlyExpense || 0}
            icon={HiTrendingDown}
            color="bg-red-500"
            change={insights?.changes?.expense}
            currency={currency}
          />
          <StatCard
            title="Monthly Savings"
            value={dash?.monthlySavings || 0}
            icon={HiCreditCard}
            color="bg-amber-500"
            currency={currency}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Income vs Expense Line Chart */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Income vs Expenses</h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">Last 6 months</span>
          </div>
          {analyticsLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={analytics?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => shortenCurrency(v)} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip currency={currency} />} />
                <Legend iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="income"  stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense by Category Pie */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Spending by Category</h2>
          </div>
          {analyticsLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : analytics?.currentMonthExpenseByCategory?.length ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={analytics.currentMonthExpenseByCategory}
                    dataKey="amount"
                    nameKey="category.name"
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={3}
                  >
                    {analytics.currentMonthExpenseByCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {analytics.currentMonthExpenseByCategory.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
                        {item.category.icon} {item.category.name}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <span className="text-4xl mb-2">📊</span>
              <p className="text-sm">No expenses this month</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {dashLoading ? (
            <Skeleton.Table rows={5} />
          ) : dash?.recentTransactions?.length ? (
            <div className="space-y-2">
              {dash.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: tx.category.color + '20' }}>
                    {tx.category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tx.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tx.category.name} · {formatDate(tx.date)}</p>
                  </div>
                  <span className={cn('text-sm font-semibold shrink-0',
                    tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <span className="text-4xl mb-2">💸</span>
              <p className="text-sm">No transactions yet</p>
              <Button size="sm" className="mt-3" onClick={() => setTxModalOpen(true)}>
                Add your first transaction
              </Button>
            </div>
          )}
        </div>

        {/* Budget Overview + Savings */}
        <div className="space-y-6">
          {/* Budgets */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Budget Overview</h2>
              <Link to="/budgets" className="text-xs text-primary-600 font-medium">View all</Link>
            </div>
            {dashLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : dash?.budgets?.length ? (
              <div className="space-y-3">
                {dash.budgets.slice(0, 4).map((b) => (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{b.category.icon}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[100px]">{b.category.name}</span>
                      </div>
                      <span className={cn('text-xs font-semibold',
                        b.percentage >= 100 ? 'text-red-500' : b.percentage >= 80 ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400')}>
                        {b.percentage}%
                      </span>
                    </div>
                    <ProgressBar value={b.spent} max={b.amount} size="sm" />
                    <div className="flex justify-between mt-0.5">
                      <span className="text-xs text-gray-400">{formatCurrency(b.spent, currency)}</span>
                      <span className="text-xs text-gray-400">{formatCurrency(b.amount, currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-sm">No budgets set</p>
                <Link to="/budgets"><Button size="sm" className="mt-2" variant="secondary">Set Budget</Button></Link>
              </div>
            )}
          </div>

          {/* Savings Goals */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Savings Goals</h2>
              <Link to="/savings" className="text-xs text-primary-600 font-medium">View all</Link>
            </div>
            {dashLoading ? (
              <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : dash?.savingsGoals?.length ? (
              <div className="space-y-3">
                {dash.savingsGoals.slice(0, 3).map((g) => (
                  <div key={g.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{g.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{g.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(g.currentAmount, currency)} / {formatCurrency(g.targetAmount, currency)}</p>
                      </div>
                      <span className="text-xs font-bold text-primary-600">{g.percentage}%</span>
                    </div>
                    <ProgressBar value={g.currentAmount} max={g.targetAmount} size="sm" colorClass="bg-primary-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-sm">No savings goals</p>
                <Link to="/savings"><Button size="sm" className="mt-2" variant="secondary">Create Goal</Button></Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Monthly Savings Trend</h2>
          <Badge variant="info">Last 6 months</Badge>
        </div>
        {analyticsLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics?.monthlyTrend || []} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => shortenCurrency(v)} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="income"  fill="#10b981" radius={[6,6,0,0]} maxBarSize={32} />
              <Bar dataKey="expense" fill="#ef4444" radius={[6,6,0,0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        defaultType={txType}
        onSuccess={refetchDash}
      />
    </div>
  );
};

export default Dashboard;
