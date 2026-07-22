import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { HiUsers, HiCash, HiTrendingUp, HiTrendingDown, HiShieldCheck } from 'react-icons/hi';
import { adminService, analyticsService } from '../../api/services.js';
import { useQuery } from '../../hooks/useQuery.js';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { formatCurrency, shortenCurrency } from '../../utils/format.js';
import { cn } from '../../utils/helpers.js';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4'];

const AdminAnalytics = () => {
  const { data: statsData, loading: statsLoading } = useQuery(() => adminService.getStats(), []);
  const { data: analyticsData, loading: analyticsLoading } = useQuery(
    () => analyticsService.getOverview({ months: 12 }), []
  );

  const stats     = statsData?.data;
  const analytics = analyticsData?.data;

  const statCards = stats ? [
    { label:'Total Users',      value: stats.userCount,        icon: HiUsers,        color:'bg-primary-600', fmt: v => v.toLocaleString() },
    { label:'Total Transactions',value: stats.transactionCount, icon: HiCash,         color:'bg-amber-500',   fmt: v => v.toLocaleString() },
    { label:'Total Income',     value: stats.totalIncome,      icon: HiTrendingUp,   color:'bg-emerald-500', fmt: v => formatCurrency(v) },
    { label:'Total Expenses',   value: stats.totalExpense,     icon: HiTrendingDown, color:'bg-red-500',     fmt: v => formatCurrency(v) },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HiShieldCheck className="w-6 h-6 text-primary-600"/>
          <h1 className="page-title">System Analytics</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Platform-wide statistics</p>
      </div>

      {/* Stat cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(s => (
            <div key={s.label} className="card p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{s.fmt(s.value)}</p>
              </div>
              <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', s.color)}>
                <s.icon className="w-5 h-5 text-white"/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid xl:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="section-title mb-5">Monthly Income vs Expenses</h2>
          {analyticsLoading ? <Skeleton className="h-64 rounded-xl"/> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics?.monthlyTrend || []} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-gray-700"/>
                <XAxis dataKey="label" tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                <YAxis tickFormatter={v => shortenCurrency(v)} tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                <Tooltip formatter={v => formatCurrency(v)}/>
                <Legend iconType="circle" iconSize={8}/>
                <Bar dataKey="income"  name="Income"  fill="#10b981" radius={[4,4,0,0]} maxBarSize={28}/>
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4,4,0,0]} maxBarSize={28}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-5">Expense Categories (Current Month)</h2>
          {analyticsLoading ? <Skeleton className="h-64 rounded-xl"/> : (
            analytics?.currentMonthExpenseByCategory?.length ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={analytics.currentMonthExpenseByCategory} dataKey="amount"
                      nameKey="category.name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {analytics.currentMonthExpenseByCategory.map((_,i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                      ))}
                    </Pie>
                    <Tooltip formatter={v => formatCurrency(v)}/>
                    <Legend iconType="circle" iconSize={8}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5">
                  {analytics.currentMonthExpenseByCategory.slice(0,4).map((item,i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{background: COLORS[i%COLORS.length]}}/>
                        <span className="text-gray-600 dark:text-gray-400">{item.category.icon} {item.category.name}</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p className="text-sm">No data available</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* System info */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Platform Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats && [
            { label:'Net Platform Flow', value: formatCurrency(stats.totalIncome - stats.totalExpense), color: stats.totalIncome > stats.totalExpense ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500' },
            { label:'Avg per User',      value: formatCurrency(stats.totalIncome / (stats.userCount || 1)), color: 'text-primary-600' },
            { label:'Transactions/User', value: ((stats.transactionCount / (stats.userCount || 1)).toFixed(1)), color: 'text-amber-600' },
            { label:'Total Volume',      value: formatCurrency(stats.totalIncome + stats.totalExpense), color: 'text-gray-900 dark:text-white' },
          ].map(s => (
            <div key={s.label} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className={cn('text-lg font-bold mt-1', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
