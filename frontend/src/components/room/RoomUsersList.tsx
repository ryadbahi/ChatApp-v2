import { useEffect, useState } from "react";
import { socket } from "../../socket";
import { useAuth } from "../../context/AuthContext";
import { UserActionDropdown } from "../social";
// Use the User type from AuthContext for current user, and types.ts for room users
import type { User as RoomUser } from "../../types/types";

interface RoomUsersListProps {
  roomId: string;
  onOpenDM?: (userId: string) => void;
}

const RoomUsersList: React.FC<RoomUsersListProps> = ({ roomId, onOpenDM }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<RoomUser | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!roomId) return; // Don't join if roomId is undefined

    socket.emit("joinRoom", { roomId });
    socket.emit("getRoomUsers", { roomId }, (data) => {
      setUsers(data.users || []);
    });
    // Listen for updates
    const handleUpdate = (data: { users: RoomUser[] }) => {
      setUsers(data.users || []);
    };
    socket.on("roomUsersUpdate", handleUpdate);
    return () => {
      socket.off("roomUsersUpdate", handleUpdate);
      // Optionally leave the room on unmount
      socket.emit("leaveRoom", { roomId });
    };
  }, [roomId]);

  // Put current user at the top
  // The current user from AuthContext uses 'id', room users use '_id'
  const sortedUsers = users.slice().sort((a: RoomUser, b: RoomUser) => {
    if (a._id === user?.id) return -1;
    if (b._id === user?.id) return 1;
    return a.username.localeCompare(b.username);
  });

  const handleUserClick = (clickedUser: RoomUser, event: React.MouseEvent) => {
    // Don't show dropdown for current user
    if (clickedUser._id === user?.id) return;

    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setDropdownPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 5,
    });
    setSelectedUser(clickedUser);
  };

  const handleCloseDropdown = () => {
    setSelectedUser(null);
  };

  return (
    <div className="flex-1 min-h-[26vh] h-full overflow-y-auto p-4 space-y-2 mb-4 bg-white/20 rounded-2xl border border-white/30 shadow-2xl backdrop-blur-3xl">
      <h3 className="text-lg font-semibold text-white mb-2">Connected Users</h3>
      <ul className="space-y-2">
        {sortedUsers.map((u: RoomUser) => (
          <li
            key={u._id}
            onClick={(e) => handleUserClick(u, e)}
            className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors ${
              u._id === user?.id
                ? "font-bold text-blue-300"
                : "text-white/90 hover:bg-white/10"
            }`}
          >
            {u.avatar ? (
              <img
                src={u.avatar}
                alt={u.username}
                className="w-7 h-7 rounded-full object-cover border border-white/20"
              />
            ) : (
              <span className="w-7 h-7 rounded-full bg-blue-500/30 flex items-center justify-center text-white/80 text-xs">
                {u.username[0].toUpperCase()}
              </span>
            )}
            <span>{u.username}</span>
            {u._id === user?.id && <span className="ml-1 text-xs">(You)</span>}
          </li>
        ))}
      </ul>

      {/* User Action Dropdown */}
      {selectedUser && (
        <UserActionDropdown
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={handleCloseDropdown}
          position={dropdownPosition}
          onOpenDM={onOpenDM}
        />
      )}
    </div>
  );
};

export default RoomUsersList;
