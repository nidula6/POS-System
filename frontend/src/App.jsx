import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LandingPage from './pages/LandingPage';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import CashierDashboard from './pages/cashier/Dashboard';
import Products from './pages/admin/Products';
import Sales from './pages/cashier/Sales';
import Reports from './pages/admin/Reports';
import ActivityLogs from './pages/admin/ActivityLogs';
import ProfitExpense from './pages/admin/ProfitExpense';
import InventoryMovement from './pages/admin/InventoryMovement';
import SalesByUser from './pages/admin/SalesByUser';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/activity-logs" element={<ActivityLogs />} />
              <Route path="/admin/profit-expense" element={<ProfitExpense />} />
              <Route path="/admin/inventory-movement" element={<InventoryMovement />} />
              <Route path="/admin/sales-by-user" element={<SalesByUser />} />
            </Route>
            
            {/* Cashier Routes */}
            <Route path="/cashier" element={<CashierDashboard />} />
            <Route path="/sales" element={<Sales />} />
          </Route>

          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
