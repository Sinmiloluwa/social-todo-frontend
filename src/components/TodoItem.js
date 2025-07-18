import client from '../api/client';

const TodoItem = ({ item, isAdmin = false, onItemUpdate, currentUser }) => {
  const creatorName = item.creator?.name || item.user?.name || item.created_by || 'Unknown';
  
  // Check if current user is the creator of this item
  const isCreator = currentUser && (
    item.creator?.id === currentUser.id ||
    item.user?.id === currentUser.id ||
    item.created_by === currentUser.name
  );
  
  // User can delete if they're admin or the creator
  const canDelete = isAdmin || isCreator;
  
  const handleToggleComplete = async () => {
    try {
      const response = await client.put(`/todo-items/update/${item.id}`, {
        completed: !item.completed
      });
      
      if (response.data) {
        // Notify parent component to update the item
        if (onItemUpdate) {
          onItemUpdate(item.id, { ...item, completed: !item.completed });
        }
      }
    } catch (err) {
      console.error('Error toggling item completion:', err);
    }
  };

  const handleDeleteItem = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await client.delete(`/todo-items/destroy/${item.id}`);
        
        // Notify parent component to remove the item
        if (onItemUpdate) {
          onItemUpdate(item.id, null); // null indicates deletion
        }
      } catch (err) {
        console.error('Error deleting item:', err);
      }
    }
  };
  
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
      <div className="flex items-center gap-3 flex-1">
        <input
          type="checkbox"
          checked={item.completed || false}
          onChange={handleToggleComplete}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <div className="flex-1">
          <h4 className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {item.title || item.content || item.description || 'Untitled'}
          </h4>
          {item.description && (
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Added by {creatorName}
            {item.created_at && (
              <span> • {new Date(item.created_at).toLocaleDateString()}</span>
            )}
          </p>
        </div>
      </div>
      
      {/* Delete button for admins or item creators */}
      {canDelete && (
        <button
          onClick={handleDeleteItem}
          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition ml-2"
          title={isCreator ? "Delete your item" : "Delete this item"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default TodoItem;