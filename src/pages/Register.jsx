import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2 } from 'lucide-react';

function Register() {
  const [form, setForm] = useState({
    school_name: '', district: '', taluk: '', username: '', password: '', first_name: '',
  });
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/register/', form);
      setSubmitted(true);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.username?.[0] || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <CheckCircle2 className="text-emerald-500 mx-auto mb-4" size={48} />
          <h1 className="text-xl font-bold text-gray-900">Registration submitted</h1>
          <p className="text-gray-500 mt-2">
            An admin will review and approve your account. You'll be able to log in once approved.
          </p>
          <Link to="/login" className="inline-block mt-6 text-indigo-600 font-medium">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Register your school</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">{error}</div>}

          {[
            { key: 'school_name', label: 'School Name' },
            { key: 'district', label: 'District' },
            { key: 'taluk', label: 'Taluk' },
            { key: 'first_name', label: 'Your Name' },
            { key: 'username', label: 'Username' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                required={key !== 'first_name'}
                value={form[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'Submitting...' : 'Register'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-indigo-600 font-medium">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;