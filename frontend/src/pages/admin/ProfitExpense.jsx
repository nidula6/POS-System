import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { toast } from 'react-hot-toast';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const ProfitExpense = () => {
  const [profitData, setProfitData] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfitData();
  }, [dateRange]);

  const fetchProfitData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/reports/profit-expense?start=${dateRange.start}&end=${dateRange.end}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setProfitData(data);
      setIsLoading(false);
    } catch (error) {
      toast.error('Error fetching profit data');
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!profitData) return;
    
    const csvContent = [
      ['Date', 'Revenue', 'Cost', 'Profit', 'Margin %'],
      ...profitData.dailyData.map(item => [
        item.date,
        item.revenue.toFixed(2),
        item.cost.toFixed(2),
        item.profit.toFixed(2),
        item.margin
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-expense-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const profitChartData = profitData ? {
    labels: profitData.dailyData.map(item => item.date),
    datasets: [
      {
        label: 'Revenue',
        data: profitData.dailyData.map(item => item.revenue),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
      },
      {
        label: 'Cost',
        data: profitData.dailyData.map(item => item.cost),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
      },
      {
        label: 'Profit',
        data: profitData.dailyData.map(item => item.profit),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
      },
    ],
  } : null;

  const marginChartData = profitData ? {
    labels: profitData.dailyData.map(item => item.date),
    datasets: [
      {
        label: 'Profit Margin %',
        data: profitData.dailyData.map(item => parseFloat(item.margin)),
        backgroundColor: 'rgba(147, 51, 234, 0.5)',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📉 Profit & Expense Analysis</h2>
              <p className="text-gray-600">Track revenue, costs, and profitability</p>
            </div>
            <button
              onClick={exportToCSV}
              disabled={!profitData || isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : profitData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">💰 Total Revenue</h3>
                <p className="text-3xl font-bold text-green-600">${profitData.summary.totalRevenue}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">💸 Total Cost</h3>
                <p className="text-3xl font-bold text-red-600">${profitData.summary.totalCost}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">📈 Total Profit</h3>
                <p className="text-3xl font-bold text-blue-600">${profitData.summary.totalProfit}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">📊 Profit Margin</h3>
                <p className="text-3xl font-bold text-purple-600">{profitData.summary.profitMargin}%</p>
              </div>
            </div>

            {/* Profit Trend Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue, Cost & Profit Trend</h3>
              {profitChartData && (
                <Line
                  data={profitChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => '$' + value.toFixed(0)
                        }
                      }
                    }
                  }}
                />
              )}
            </div>

            {/* Profit Margin Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Profit Margin by Day</h3>
              {marginChartData && (
                <Bar
                  data={marginChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => value + '%'
                        }
                      }
                    }
                  }}
                />
              )}
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Daily Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {profitData.dailyData.map((day, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{day.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">${day.revenue.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">${day.cost.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-semibold">${day.profit.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-semibold">{day.margin}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            No data available for the selected date range
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfitExpense;
