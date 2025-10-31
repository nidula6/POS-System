import Layout from '../../components/Layout';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CashierDashboard = () => {
  const [recentSales, setRecentSales] = useState([]);
  const [todayStats, setTodayStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageTransaction: 0
  });

  useEffect(() => {
    // Fetch recent sales and today's stats
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/reports/cashier/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setRecentSales(data.recentSales);
        setTodayStats(data.todayStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/sales"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              New Sale
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Print Daily Report
            </button>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Today's Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-indigo-900">Total Sales</h3>
              <p className="mt-2 text-3xl font-bold text-indigo-600">
                ${todayStats.totalSales.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-green-900">Transactions</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {todayStats.totalTransactions}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-purple-900">Average Sale</h3>
              <p className="mt-2 text-3xl font-bold text-purple-600">
                ${todayStats.averageTransaction.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Sales</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentSales.map((sale) => (
              <div key={sale._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Sale #{sale.saleNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(sale.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${sale.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {sale.paymentMethod}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CashierDashboard;