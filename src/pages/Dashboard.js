import { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import TodoList from '../components/TodoList';
import WebSocketDebug from '../components/WebSocketDebug';
import { AuthContext } from '../auth/AuthContext';

const Dashboard = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTodoForm, setNewTodoForm] = useState({ title: '', description: '' });
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchLists = useCallback(async (page = 1, isLoadMore = false) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (!user) {
      return;
    }
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError('');
    
    try {
      const response = await client.get(`/todos/list?page=${page}`);
      const { data } = response;
      let newLists = [];
      
      // Handle the API response structure
      if (data && data.status && Array.isArray(data.data)) {
        newLists = data.data;
      }

      const listsWithOwnership = newLists.map(list => {
        const isOwner = list.owner?.id === user?.id;
        const isInvited = list.users?.some(invitedUser => invitedUser.id === user?.id);
        
        return {
          ...list,
          isOwner: isOwner,
          isInvited: isInvited,
          ownerName: list.owner?.name || 'Unknown',
          invitedUsersCount: list.users?.length || 0
        };
      });

      if (isLoadMore) {
        // Append new lists to existing ones
        setLists(prev => [...prev, ...listsWithOwnership]);
      } else {
        // Replace all lists (for initial load or refresh)
        setLists(listsWithOwnership);
      }

      // Check if there are more items to load
      // Since your API doesn't seem to have pagination metadata, 
      // we'll assume there are more if we got a full page of results
      const pageSize = 10; // Adjust based on your API's page size
      setHasMore(newLists.length === pageSize);
      
      if (isLoadMore) {
        setCurrentPage(page);
      }

    } catch (err) {
      if (!isLoadMore) {
        setLists([]);
      }
      
      if (err.response?.status !== 401) {
        setError('Failed to fetch todo lists: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (!user) {
      return;
    }
    
    fetchLists(1, false);
  }, [navigate, user, fetchLists, isAuthenticated]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 1000 && // Load when 1000px from bottom
        !loading &&
        !loadingMore &&
        hasMore
      ) {
        fetchLists(currentPage + 1, true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, hasMore, currentPage, fetchLists]);

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    
    // Double-check that only admins can create lists
    if (user?.type !== 'admin') {
      setError('Only administrators can create todo lists');
      return;
    }
    
    if (!newTodoForm.title.trim()) {
      setError('Title is required');
      return;
    }
    
    try {
      const response = await client.post('/todos/create', newTodoForm);
      
      setNewTodoForm({ title: '', description: '' });
      setShowCreateForm(false);
      setError('');
      
      // Reset to first page and refresh the list
      setCurrentPage(1);
      setHasMore(true);
      await fetchLists(1, false);
      
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create todo list');
    }
  };

  const handleInputChange = (e) => {
    setNewTodoForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading your todo lists...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome {user?.name || 'User'}!</h1>
        <div>
          {/* Only show create button to admin users */}
          {user?.type === 'admin' && (
            <button 
              className="create-btn" 
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{ marginRight: '10px' }}
            >
              {showCreateForm ? 'Cancel' : 'Create New Todo List'}
            </button>
          )}
          <button 
            className="create-btn" 
            onClick={() => {
              setCurrentPage(1);
              setHasMore(true);
              fetchLists(1, false);
            }}
            style={{ backgroundColor: '#28a745' }}
          >
            🔄 Refresh Lists
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Info message for regular users */}
      {user?.type !== 'admin' && (
        <div style={{
          backgroundColor: '#e3f2fd',
          color: '#1565c0',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #bbdefb'
        }}>
          <strong>ℹ️ Info:</strong> Only administrators can create new todo lists. You can join existing lists when invited by an admin.
        </div>
      )}

      {/* Only show create form to admin users */}
      {showCreateForm && user?.type === 'admin' && (
        <form onSubmit={handleCreateTodo} className="create-form">
          <input
            type="text"
            name="title"
            placeholder="Todo List Title"
            value={newTodoForm.title}
            onChange={handleInputChange}
            required
          />
          <textarea
            name="description"
            placeholder="Description (optional)"
            value={newTodoForm.description}
            onChange={handleInputChange}
          />
          <button type="submit">Create Todo List</button>
        </form>
      )}

      <div className="todo-lists">
        {lists.length === 0 ? (
          <div className="no-lists">
            <p>No todo lists found. Create your first one!</p>
          </div>
        ) : (
          <div className="lists-grid">
            {lists.map(list => (
              <TodoList 
                key={list.id} 
                list={list} 
                isAdmin={user?.type === 'admin'}
                isOwner={list.isOwner}
                onUpdate={() => {
                  setCurrentPage(1);
                  setHasMore(true);
                  fetchLists(1, false);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {loadingMore && (
        <div className="loading-more" style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#666'
        }}>
          Loading more lists...
        </div>
      )}

      {!hasMore && lists.length > 0 && (
        <div className="no-more" style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#666'
        }}>
          No more lists to load
        </div>
      )}

      {/* WebSocket Debug - Only show for first list if available */}
      {/* {lists.length > 0 && (
        <WebSocketDebug listId={lists[0].id} />
      )} */}
    </div>
  );
};

export default Dashboard;