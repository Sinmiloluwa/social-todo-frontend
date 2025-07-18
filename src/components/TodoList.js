import { useEffect, useState, useContext } from 'react';
import client from '../api/client';
import TodoItem from './TodoItem';
import InviteUser from './InviteUser';
import { echo } from '../sockets/echo';
import { AuthContext } from '../auth/AuthContext';

const TodoList = ({ list, isAdmin = false, isOwner = true }) => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItemForm, setNewItemForm] = useState({ title: '', description: '' });
  const [addingItem, setAddingItem] = useState(false);

  // Debug logging
  console.log('TodoList props:', { 
    listId: list?.id, 
    isAdmin, 
    isOwner,
    listTitle: list?.title 
  });

  useEffect(() => {
    fetchItems();

    const channel = echo.private(`todolist.${list.id}`);
    
    // Listen for new items
    channel.listen('.item.created', ({ item }) => {
      console.log('Real-time: Item created', item);
      setItems(prev => [item, ...prev]);
    });
    
    // Listen for item updates (completion toggle)
    channel.listen('.item.updated', ({ item }) => {
      console.log('Real-time: Item updated', item);
      setItems(prev => prev.map(existing => 
        existing.id === item.id ? item : existing
      ));
    });
    
    // Listen for item deletions
    channel.listen('.item.deleted', ({ itemId }) => {
      console.log('Real-time: Item deleted', itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
    });

    return () => {
      channel.stopListening('.item.created');
      channel.stopListening('.item.updated');
      channel.stopListening('.item.deleted');
    };
  }, [list]);

  const fetchItems = async () => {
    try {
      const response = await client.get(`/todos/show/${list.id}`);
      console.log('fetchItems - Full response:', response);
      console.log('fetchItems - Response data:', response.data);
      
      const { data } = response;
      
      // Handle different possible response structures
      let items = [];
      if (data.items) {
        items = data.items;
      } else if (data.data && Array.isArray(data.data)) {
        items = data.data;
      } else if (Array.isArray(data)) {
        items = data;
      } else if (data.data && data.data.items) {
        items = data.data.items;
      }
      
      console.log('fetchItems - Extracted items:', items);
      console.log('fetchItems - Items count:', items.length);
      
      setItems(items);
    } catch (err) {
      console.error('Error fetching items:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to load todo items');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteList = async () => {
    if (window.confirm('Are you sure you want to delete this todo list?')) {
      try {
        await client.delete(`/todos/destroy/${list.id}`);
        // Refresh the page or remove from parent component
        window.location.reload();
      } catch (err) {
        setError('Failed to delete todo list');
      }
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setAddingItem(true);
    setError('');

    try {
      const response = await client.post(`/todo-items/create/${list.id}`, newItemForm);
      console.log('Item added:', response.data);
      
      // Normalize the data structure to match what TodoItem expects
      let newItem = null;
      if (response.data && response.data.data) {
        newItem = response.data.data;
      } else if (response.data) {
        newItem = response.data;
      }
      
      if (newItem) {
        // Add the new item to the list
        setItems(prev => [newItem, ...prev]);
      }
      
      // Reset form and close modal
      setNewItemForm({ title: '', description: '' });
      setShowAddItemForm(false);
      
    } catch (err) {
      console.error('Error adding item:', err);
      setError(err.response?.data?.message || 'Failed to add todo item');
    } finally {
      setAddingItem(false);
    }
  };

  const handleItemUpdate = (itemId, updatedItem) => {
    if (updatedItem === null) {
      // Item was deleted
      setItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      // Item was updated
      setItems(prev => prev.map(item => 
        item.id === itemId ? updatedItem : item
      ));
    }
  };

  const handleItemInputChange = (e) => {
    setNewItemForm({
      ...newItemForm,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{list.title || list.name}</h3>
            {!isOwner && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Shared by {list.ownerName}
              </span>
            )}
            {isOwner && list.invitedUsersCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {list.invitedUsersCount} collaborator{list.invitedUsersCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {list.description && (
            <p className="text-gray-600 text-sm">{list.description}</p>
          )}
        </div>
        
        {/* Admin and user controls */}
        <div className="flex gap-2">
          {/* Debug info */}
          {/* <div className="text-xs bg-yellow-100 px-2 py-1 rounded">
            isAdmin: {isAdmin ? 'true' : 'false'} | isOwner: {isOwner ? 'true' : 'false'}
          </div> */}
          
          {/* Add item button for all users who have access to the list */}
          <button
            onClick={() => setShowAddItemForm(true)}
            className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition text-sm"
            title="Add a new todo item"
          >
            ➕ Add Item
          </button>
          
          {/* Show invite button only for owners/admins */}
          {isAdmin && isOwner && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition text-sm"
              title="Invite users to this todo list"
            >
              👥 Invite
            </button>
          )}
          
          {/* Show delete button only for owners/admins */}
          {isAdmin && isOwner && (
            <button
              onClick={handleDeleteList}
              className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition text-sm"
              title="Delete todo list"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/* Todo items */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>No items in this list yet</p>
          </div>
        ) : (
          items.map(item => (
            <TodoItem 
              key={item.id} 
              item={item} 
              isAdmin={isAdmin} 
              onItemUpdate={handleItemUpdate}
              currentUser={user}
            />
          ))
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-500">
          <span>{items.length} items</span>
          <span>
            {items.filter(item => item.completed).length} completed
          </span>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Add New Todo Item</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Todo item title"
                value={newItemForm.title}
                onChange={handleItemInputChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <textarea
                name="description"
                placeholder="Description (optional)"
                value={newItemForm.description}
                onChange={handleItemInputChange}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={addingItem}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {addingItem ? 'Adding...' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddItemForm(false);
                    setNewItemForm({ title: '', description: '' });
                    setError('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUser
          listId={list.id}
          onClose={() => setShowInviteModal(false)}
          onInviteSent={() => {
            // You could add refresh logic here if needed
            console.log('User invited successfully');
          }}
        />
      )}
    </div>
  );
};

export default TodoList;