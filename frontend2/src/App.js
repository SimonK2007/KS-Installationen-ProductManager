import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Auth/Login.js';
import Layout from './components/Layout/Layout';
import CustomerList from './components/Customers/CustomerList.jsx';
import ProductList from './components/Products/ProductList';
import CategoryList from './components/Categories/CategoryList';
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Lädt...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<CustomerList />} />
        <Route path="kunden" element={<CustomerList />} />
        <Route path="produkte" element={<ProductList />} />
        <Route path="kategorien" element={<CategoryList />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router basename="/KS-Installationen-ProductManager">
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
