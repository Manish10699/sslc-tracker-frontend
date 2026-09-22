import { useState } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import axios from 'axios';
import { School } from 'lucide-react';
import { saveTokens } from '../auth';
import { subscribeToPush } from '../pushNotifications';
import { savePushSubscription } from '../api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
const API_BASE = import.meta.env.DEV
  ? 'http://127.0.0.1:8000/api'
  : 'https://sslc-tracker.onrender.com/api';
 const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  try {
    const response = await axios.post(`${API_BASE}/token/`, { username, password });
    saveTokens(response.data.access, response.data.refresh);

    try {
      const subscription = await subscribeToPush();

      if (subscription) {
  console.log("PUSH SUBSCRIPTION:", subscription);

  await savePushSubscription(
    subscription,
    response.data.access
  );

        console.log('Push subscription saved successfully');
      }
    } catch (pushError) {
      console.error('Push notification setup failed:', pushError);
    }

    const meResponse = await axios.get(`${API_BASE}/me/`, {
      headers: { Authorization: `Bearer ${response.data.access}` },
    });
    navigate(meResponse.data.role === 'admin' ? '/admin' : '/points');
  } catch (err) {
    setError('Invalid username or password');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <School className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900"> Programme Tracker</h1>
          <p className="text-gray-500 mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
          <p className="text-center text-sm text-gray-500 mt-2">
            New school? <Link to="/register" className="text-indigo-600 font-medium">Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
