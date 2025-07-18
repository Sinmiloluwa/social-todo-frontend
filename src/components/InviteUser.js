import { useState, useEffect } from 'react';
import client from '../api/client';

const InviteUser = ({ listId, onClose, onInviteSent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invitingUserId, setInvitingUserId] = useState(null);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data } = await client.get(`/search-user?username=${encodeURIComponent(searchTerm)}`);
      
      const users = Array.isArray(data.data) ? data.data : [];
      
      setSearchResults(users);
    } catch (err) {
      setError('Failed to search users');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (userId, username) => {
    setInvitingUserId(userId);
    setError('');
    setSuccess('');

    try {
      await client.post(`/todos/invite-user/${listId}/${userId}`);
      setSuccess(`${username} has been invited to the todo list!`);
      
      // Remove the invited user from search results
      setSearchResults(prev => prev.filter(user => user.id !== userId));
      
      // Clear search after successful invite
      setTimeout(() => {
        setSearchTerm('');
        setSuccess('');
        if (onInviteSent) onInviteSent();
      }, 2000);
    } catch (err) {
      console.error('Error inviting user:', err);
      setError(err.response?.data?.message || 'Failed to invite user');
    } finally {
      setInvitingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4 max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Invite Users</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by username..."
              className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-3 top-2.5">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Type at least 2 characters to search
          </p>
        </div>

        {/* Error and success messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
            {success}
          </div>
        )}

        {/* Search results */}
        <div className="flex-1 overflow-y-auto">
          {searchTerm.trim().length >= 2 && searchResults.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">👤</div>
              <p>No users found matching "{searchTerm}"</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}:
              </p>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.name || user.username}
                      </p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => inviteUser(user.id, user.username)}
                    disabled={invitingUserId === user.id}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {invitingUserId === user.id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Inviting...
                      </div>
                    ) : (
                      'Invite'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteUser;