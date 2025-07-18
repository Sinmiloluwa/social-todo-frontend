import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import TodoList from '../components/TodoList';
import { AuthContext } from '../auth/AuthContext';

const Dashboard = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTodoForm, setNewTodoForm] = useState({ title: '', description: '' });
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Dashboard mounted');
    console.log('Dashboard: user:', user);
    console.log('Dashboard: isAuthenticated:', isAuthenticated);
    console.log('Dashboard: token in localStorage:', localStorage.getItem('token') ? 'EXISTS' : 'MISSING');
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Dashboard: No token found - redirecting to login');
      navigate('/login');
      return;
    }
    
    console.log('Dashboard: Token exists, fetching lists...');
    // Only fetch lists if we have a token
    fetchLists();
  }, [navigate]);

  const fetchLists = async () => {
    console.log('Fetching lists...');
    try {
      const { data } = await client.get('/todos/list');
      console.log('Lists fetched:', data);
      console.log('Type of data:', typeof data);
      console.log('Is array:', Array.isArray(data));
      
      // Ensure we always set an array and add ownership info based on owner_id
      let lists = [];
      if (Array.isArray(data)) {
        lists = data;
      } else if (data && Array.isArray(data.data)) {
        lists = data.data;
      } else {
        console.warn('API returned non-array data:', data);
        lists = [];
      }

      // Add ownership information to each list
      const listsWithOwnership = lists.map(list => {
        const isOwner = list.owner_id === user?.id;
        const isInvited = list.users?.some(invitedUser => invitedUser.id === user?.id);
        
        return {
          ...list,
          isOwner: isOwner,
          isInvited: isInvited,
          // For display purposes
          ownerName: list.owner?.name || 'Unknown',
          invitedUsersCount: list.users?.length || 0
        };
      });

      console.log('Lists with ownership:', listsWithOwnership);
      console.log('Current user ID:', user?.id);
      setLists(listsWithOwnership);

    } catch (err) {
      console.error('Error fetching lists:', err);
      
      // Always ensure lists is an array even on error
      setLists([]);
      
      // Don't handle 401 here - let the global interceptor handle it
      if (err.response?.status !== 401) {
        setError('Failed to fetch todo lists: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    try {
      await client.post('/todos/create', newTodoForm);
      setNewTodoForm({ title: '', description: '' });
      setShowCreateForm(false);
      fetchLists(); // Refresh the list
    } catch (err) {
      setError('Failed to create todo list');
    }
  };

  const handleInputChange = (e) => {
    setNewTodoForm({
      ...newTodoForm,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your todo lists...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering dashboard, user:', user, 'lists:', lists, 'error:', error);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Debug info */}
        <div className="mb-4 p-2 bg-yellow-100 border rounded text-xs">
          <strong>Debug:</strong> User: {user ? `${user.name} (${user.type})` : 'Loading...'} | 
          Lists: {lists.length} | Error: {error || 'None'}
        </div>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user?.type === 'admin' ? 'Your Todo Lists' : 'Shared Todo Lists'}
            </h1>
            <p className="text-gray-600 mt-2">
              {user?.type === 'admin' 
                ? 'Create and manage your todo lists' 
                : 'Todo lists shared with you'
              }
            </p>
          </div>
          
          {/* Create button for admins only */}
          {user?.type === 'admin' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Todo List
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Create Todo Form Modal */}
        {showCreateForm && (user?.type === 'admin' || !user) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Create New Todo List</h2>
              <form onSubmit={handleCreateTodo} className="space-y-4">
                <input
                  type="text"
                  name="title"
                  placeholder="Todo list title"
                  value={newTodoForm.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  name="description"
                  placeholder="Description (optional)"
                  value={newTodoForm.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User type indicator */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${user?.type === 'admin' ? 'bg-blue-600' : 'bg-green-600'}`}></div>
            <span className="font-medium text-gray-700">
              {user?.type === 'admin' ? 'Creator Account' : 'Collaborator Account'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {user?.type === 'admin' 
              ? 'You can create, edit, and delete todo lists' 
              : 'You can view and collaborate on shared todo lists'
            }
          </p>
        </div>

        {/* Todo Lists */}
        <div className="space-y-4">
          {!Array.isArray(lists) || lists.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No todo lists yet
              </h3>
              <p className="text-gray-500">
                {user?.type === 'admin' 
                  ? 'Create your first todo list to get started' 
                  : 'You will see todo lists here when they are shared with you'
                }
              </p>
            </div>
          ) : (
            lists.map(list => {
              const isListOwner = list.isOwner || user?.type === 'admin';
              console.log('Rendering TodoList:', { 
                listId: list.id, 
                listTitle: list.title,
                userType: user?.type, 
                isOwner: list.isOwner,
                isListOwner: isListOwner,
                isAdmin: user?.type === 'admin',
                userObject: user,
                typeComparison: {
                  actualType: user?.type,
                  typeOfType: typeof user?.type,
                  isAdminString: user?.type === 'admin',
                  isAdminStrict: user?.type === 'admin',
                  rawComparison: `"${user?.type}" === "admin"`,
                }
              });
              return (
                <TodoList 
                  key={list.id} 
                  list={list} 
                  isAdmin={isListOwner} 
                  isOwner={list.isOwner}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;