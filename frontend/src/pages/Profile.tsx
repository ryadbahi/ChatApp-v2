import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axios";
import { FaUserEdit } from "react-icons/fa";

interface ProfileProps {
  onCancel?: () => void;
}

const Profile = ({ onCancel }: ProfileProps) => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      if (password) {
        formData.append("password", password);
      }
      if (avatar) {
        formData.append("avatar", avatar);
      }

      await axiosInstance.put("/api/auth/profile", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update the user in context with new data
      if (user) {
        updateUser({
          ...user,
          username,
          email,
          avatar: avatar ? URL.createObjectURL(avatar) : user.avatar,
        });
      }

      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      // No need to reload the page anymore
      // window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.msg || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <p className="p-4 text-red-500">Not authenticated.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600/80 hover:bg-blue-700/80 text-white rounded-lg transition"
          >
            <FaUserEdit />
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0 flex flex-col items-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="w-40 h-40 rounded-full object-cover border-4 border-white/30"
                />
              ) : (
                <div className="w-40 h-40 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                  No Avatar
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-sm text-gray-400">Username</h3>
                <p className="text-xl text-white">{user.username}</p>
              </div>

              <div>
                <h3 className="text-sm text-gray-400">Email</h3>
                <p className="text-xl text-white">{user.email}</p>
              </div>

              <div>
                <h3 className="text-sm text-gray-400">Account ID</h3>
                <p className="text-xl text-white">{user.id}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-xl"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 text-green-300 rounded-lg">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 flex flex-col items-center mb-4">
              <div className="w-40 h-40 rounded-full mb-4 overflow-hidden border-4 border-white/30">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400">
                    No Avatar
                  </div>
                )}
              </div>

              <label className="px-4 py-2 bg-black/30 hover:bg-black/50 text-white rounded-lg cursor-pointer transition">
                Upload Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 
                         focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 
                         outline-none text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 
                         focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 
                         outline-none text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 
                         focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 
                         outline-none text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 
                         focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 
                         outline-none text-white"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6 gap-3">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                onCancel?.();
              }}
              className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600/80 hover:bg-blue-700/80 text-white rounded-lg transition"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;
