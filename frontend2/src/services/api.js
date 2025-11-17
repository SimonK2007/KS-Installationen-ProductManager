const API_BASE = 'http://16.170.207.80:5000/api'; // Deine EC2 IP und Port

export async function apiCall(endpoint, options = {}) {
    const token = options.token || null;
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };
    const config = {
        ...options,
        headers
    };
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Ein Fehler ist aufgetreten' }));
        throw new Error(error.error || error.message || 'Ein Fehler ist aufgetreten');
    }
    return response.json();
}

export async function apiCallWithAuth(endpoint, token, options = {}) {
    return apiCall(endpoint, { ...options, token });
}
