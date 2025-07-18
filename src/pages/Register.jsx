import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';

const Register = () => {
  const [form, setForm] = useState({ 
    name: '', 
    username: '', 
    email: '', 
    password: '', 
    type: 'user' // default to regular user
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await client.post('/auth/register', form);
      console.log(res.data);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Create your account</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />
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
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Account Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="user"
                  checked={form.type === 'user'}
                  onChange={handleChange}
                  className="mr-3 text-blue-600 focus:ring-blue-300"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Regular User</span>
                  <p className="text-xs text-gray-500">Join and collaborate on todo lists</p>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-md hover:bg-blue-50 cursor-pointer border-blue-200">
                <input
                  type="radio"
                  name="type"
                  value="admin"
                  checked={form.type === 'admin'}
                  onChange={handleChange}
                  className="mr-3 text-blue-600 focus:ring-blue-300"
                />
                <div>
                  <span className="text-sm font-medium text-blue-700">Creator (Admin)</span>
                  <p className="text-xs text-blue-600">Create and manage todo lists</p>
                </div>
              </label>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
