import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './components/Login';
import CustomerList from './components/CustomerList';
import ProductMenu from './components/ProductMenu';
import BillingView from './components/BillingView';
import ProductManager from './components/ProductManager';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="app-container">
                    <Navbar />
                    <div className="main-content">
                      <Routes>
                        <Route path="/" element={<CustomerList />} />
                        <Route path="/products" element={<ProductManager />} />
                        <Route
                          path="/customer/:customerId/products"
                          element={<ProductMenu />}
                        />
                        <Route
                          path="/customer/:customerId/billing"
                          element={<BillingView />}
                        />
                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
