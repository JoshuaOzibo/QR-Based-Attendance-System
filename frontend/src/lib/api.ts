const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${normalizedEndpoint}`;
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    let data;
    try {
      data = await response.json();
    } catch (err) {
      data = { message: await response.text() };
    }
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `API request failed (${response.status})`);
    }
    
    return data as T;
  } catch (err: any) {
    console.error(`[fetchAPI Error] URL: ${url}`, err);
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error(`Unable to connect to backend server (${BASE_URL || 'relative URL'}). Please verify backend status & CORS.`);
    }
    throw err;
  }
}
