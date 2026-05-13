const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { message: await response.text() };
  }
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'API request failed');
  }
  
  return data as T;
}
