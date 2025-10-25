import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) {
        return (
            <div>
                <h2>Lädt...</h2>
            </div>
        );
    }
    return isAuthenticated ? children : <Navigate to="/login" />;
};
export default ProtectedRoute;