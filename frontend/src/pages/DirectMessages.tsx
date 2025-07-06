import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDirectMessageContacts,
  searchUsersForDM,
  type DirectMessageContact,
  type User,
} from "../api/directMessages";
import Toast from "../components/Toast";
import { FiSearch, FiMessageCircle, FiPlus } from "react-icons/fi";

const DirectMessages: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<DirectMessageContact[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  }>({ message: "", type: "info", visible: false });

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type, visible: true });
  };

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await getDirectMessageContacts();
        setContacts(response.data.contacts);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        showToast("Failed to load contacts", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchUsersForDM(query);
      setSearchResults(response.data.users);
    } catch (error) {
      console.error("Error searching users:", error);
      showToast("Failed to search users", "error");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const UserAvatar: React.FC<{
    user: User | DirectMessageContact;
    size?: string;
  }> = ({ user, size = "w-12 h-12" }) =>
    user.avatar ? (
      <img
        src={user.avatar}
        alt={user.username}
        className={`${size} rounded-full object-cover`}
      />
    ) : (
      <div
        className={`${size} rounded-full bg-purple-600 flex items-center justify-center`}
      >
        <span className="text-white font-semibold">
          {user.username.charAt(0).toUpperCase()}
        </span>
      </div>
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Messages
          </h1>
          <button
            onClick={() => setIsSearching(!isSearching)}
            className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
          >
            <FiPlus className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isSearching && searchQuery.trim() ? (
          /* Search Results */
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Search Results
            </h3>
            {searchResults.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No users found
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => navigate(`/direct-messages/${user._id}`)}
                    className="w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="flex items-center">
                      <UserAvatar user={user} />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Contacts List */
          <div className="p-4">
            {contacts.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <FiMessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm mt-2">
                  Search for users to start messaging
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <button
                    key={contact._id}
                    onClick={() => navigate(`/direct-messages/${contact._id}`)}
                    className="w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <UserAvatar user={contact} />
                        {contact.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {contact.unreadCount > 9
                              ? "9+"
                              : contact.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {contact.username}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(contact.lastMessage.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {contact.lastMessage.imageUrl
                            ? "📷 Image"
                            : contact.lastMessage.content}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
};

export default DirectMessages;
