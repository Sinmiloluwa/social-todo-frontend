import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { AuthContext } from '../auth/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Login: Attempting login with:', form.email);
      const response = await client.post('/auth/login', form);
      console.log('Login: Full response:', response.data);
      
      const userData = response.data.data;
      const token = userData.token;
      
      // Create user object without the token
      const user = {
        id: userData.id,
        name: userData.name,
        username: userData.username,
        email: userData.email,
        type: userData.type,
        created_at: userData.created_at
      };
      
      if (!token) {
        console.error('Login: No token in response');
        setError('No authentication token received');
        return;
      }
      
      console.log('Login: Extracted user:', user);
      console.log('Login: Extracted token:', token);
      console.log('Login: User type:', user.type);
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Update auth context
      login(user, token);
      
      console.log('Login: Navigating to dashboard');
      
      // Navigate to dashboard
      navigate('/dashboard');
      
      console.log('Login: Success - user:', user);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome back</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Don’t have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
