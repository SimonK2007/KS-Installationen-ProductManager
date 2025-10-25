import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(email, password);

        setLoading(false);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
    };
    return (
        <div>
            <div>
                <h1>Kundenverwaltung</h1>
                <h2>Anmelden</h2>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {error && <div>{error}</div>}

                    <div>
                        <label style={styles.label}>E-Mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={styles.input}
                            placeholder="admin@firma.ch"
                        />
                    </div>
                    <div>
                        <label style={styles.label}>Passwort</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={styles.input}
                            placeholder="Passwort eingeben"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.button}
                    >
                        {loading ? 'Wird angemeldet...' : 'Anmelden'}
                    </button>
                </form>
                <div>
                    <p>Standard-Login:</p>
                    <p>Email: <strong>admin@firma.ch</strong></p>
                    <p>Passwort: <strong>admin123</strong></p>
                </div>
            </div>
        </div>
    );
};
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
    },
    loginBox: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
    },
    title: {
        textAlign: 'center',
        marginBottom: '10px',
        color: '#333',
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: '30px',
        color: '#666',
        fontWeight: 'normal',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    inputGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        color: '#333',
        fontWeight: '500',
    },
    input: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px',
        boxSizing: 'border-box',
    },
    button: {
        padding: '12px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        fontSize: '16px',
        fontWeight: '500',
        cursor: 'pointer',
        marginTop: '10px',
    },
    error: {
        padding: '10px',
        backgroundColor: '#fee',
        color: '#c33',
        borderRadius: '5px',
        marginBottom: '20px',
        textAlign: 'center',
    },
    hint: {
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
        fontSize: '13px',
        textAlign: 'center',
        color: '#666',
    },
};
export default Login;