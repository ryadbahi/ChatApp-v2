import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return <p className="p-4 text-red-500">Not authenticated.</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">My Profile</h1>

      <div className="bg-white/20 p-4 rounded shadow-md max-w-md space-y-4">
        <div>
          <strong>Username:</strong> {user.username}
        </div>
        <div>
          <strong>Email:</strong> {user.email}
        </div>
        <div>
          <strong>Avatar:</strong>{" "}
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-16 h-16 rounded-full mt-2"
            />
          ) : (
            "No avatar set"
          )}
        </div>
      </div>

      <p className="mt-6 text-gray-400">
        Form to update username, email, avatar and change password goes here.
      </p>
    </div>
  );
};

export default Profile;
