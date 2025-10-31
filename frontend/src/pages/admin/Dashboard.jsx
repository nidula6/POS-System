import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    lowStock: 0,
    totalProducts: 0
  });

  const [salesData, setSalesData] = useState({
    labels: ['Cash', 'Card', 'Other'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#4F46E5', '#10B981', '#F59E0B'],
        borderWidth: 0,
      },
    ],
  });

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/reports/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setStats(data.stats);
        setSalesData(prev => ({
          ...prev,
          datasets: [{
            ...prev.datasets[0],
            data: [data.paymentStats.cash, data.paymentStats.card, data.paymentStats.other]
          }]
        }));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <Layout>
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Sales Card */}
          <div className="rounded-lg bg-indigo-50 p-6">
            <h3 className="text-lg font-medium text-indigo-900">Total Sales</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              ${stats.totalSales.toFixed(2)}
            </p>
          </div>

          {/* Today's Sales Card */}
          <div className="rounded-lg bg-green-50 p-6">
            <h3 className="text-lg font-medium text-green-900">Today's Sales</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">
              ${stats.todaySales.toFixed(2)}
            </p>
          </div>

          {/* Low Stock Alert Card */}
          <div className="rounded-lg bg-yellow-50 p-6">
            <h3 className="text-lg font-medium text-yellow-900">Low Stock Items</h3>
            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {stats.lowStock}
            </p>
          </div>

          {/* Total Products Card */}
          <div className="rounded-lg bg-purple-50 p-6">
            <h3 className="text-lg font-medium text-purple-900">Total Products</h3>
            <p className="mt-2 text-3xl font-bold text-purple-600">
              {stats.totalProducts}
            </p>
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Methods</h3>
          <div className="h-64 w-full md:w-1/2 lg:w-1/3">
            <Doughnut data={salesData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Quick Links to New Features */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Advanced Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/profit-expense"
              className="block p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-2">📉</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Profit & Expense</h4>
              <p className="text-sm text-gray-600">Track profitability and margins</p>
            </Link>

            <Link
              to="/admin/inventory-movement"
              className="block p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-2">🔁</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Inventory Movement</h4>
              <p className="text-sm text-gray-600">Monitor stock changes</p>
            </Link>

            <Link
              to="/admin/sales-by-user"
              className="block p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-2">👥</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Cashier Performance</h4>
              <p className="text-sm text-gray-600">Track cashier sales metrics</p>
            </Link>

            <Link
              to="/admin/activity-logs"
              className="block p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-2">📋</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Activity Logs</h4>
              <p className="text-sm text-gray-600">Audit trail & history</p>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;