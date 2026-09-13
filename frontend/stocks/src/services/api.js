const BASE_URL = 'http://localhost:5000/api';

const getHeaders = (customHeaders = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Auth API
export const signupAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Signup failed');
  return json;
};

export const loginAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Login failed');
  return json;
};

export const getMeAPI = async () => {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: getHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to get user profile');
  return json;
};

// Stocks API
export const getStocksAPI = async (search = '', sector = 'All Sectors') => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (sector && sector !== 'All Sectors') params.append('sector', sector);
  
  const res = await fetch(`${BASE_URL}/stocks/all?${params.toString()}`, {
    headers: getHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch stocks');
  return json;
};

export const getStockQuoteAPI = async (symbol) => {
  const res = await fetch(`${BASE_URL}/stocks/quote/${symbol}`, {
    headers: getHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `Failed to fetch quote for ${symbol}`);
  return json;
};

export const getStockChartAPI = async (symbol, range = '1mo') => {
  const res = await fetch(`${BASE_URL}/stocks/chart/${symbol}?range=${range}`, {
    headers: getHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `Failed to fetch chart data for ${symbol}`);
  return json;
};

// Portfolio API
export const getPortfolioAPI = async () => {
  const res = await fetch(`${BASE_URL}/portfolio`, {
    headers: getHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch portfolio');
  return json;
};

export const buyStockAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/portfolio/buy`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to buy stock');
  return json;
};

export const sellStockAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/portfolio/sell`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to sell stock');
  return json;
};

export const getTransactionsAPI = async () => {
  const res = await fetch(`${BASE_URL}/portfolio/transactions`, {
    headers: getHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch transactions');
  return json;
};

// Watchlist API
export const getWatchlistAPI = async () => {
  const res = await fetch(`${BASE_URL}/watchlist`, {
    headers: getHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch watchlist');
  return json;
};

export const addToWatchlistAPI = async (data) => {
  const res = await fetch(`${BASE_URL}/watchlist`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to add to watchlist');
  return json;
};

export const removeFromWatchlistAPI = async (symbol) => {
  const res = await fetch(`${BASE_URL}/watchlist/${symbol}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to remove from watchlist');
  return json;
};
