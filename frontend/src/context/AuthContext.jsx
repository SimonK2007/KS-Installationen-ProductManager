import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
const AuthContext = createContext();
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
    }
    return context;
};
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    // Token bei jedem Request mitschicken
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            verifyToken();
        } else {
            setLoading(false);
        }
    }, [token]);
    const verifyToken = async () => {
        try {
            const response = await axios.get(`${API_URL}/auth/verify`);
            if (response.data.valid) {
                setUser(response.data.user);
            } else {
                logout();
            }
        } catch (error) {
            logout();
        } finally {
            setLoading(false);
        }
    };
    const login = async (email, password) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password
            });

            const { token, user } = response.data;

            localStorage.setItem('token', token);
            setToken(token);
            setUser(user);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login fehlgeschlagen'
            };
        }
    };
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };
    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user
    };
    return < AuthContext.Provider value={value} > {children} </AuthContext.Provider>
};