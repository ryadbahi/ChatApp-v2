import { useNavigate, Link } from "react-router-dom";
import { FaPlus, FaSearch, FaLock } from "react-icons/fa";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useRoom } from "../context/RoomContext";
import type { ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import { useIsRoomsPage } from "../hooks/useIsRoomsPage";
import RoomSearch from "./RoomSearch";
import CreateRoomForm from "./CreateRoomForm";
import JoinSecretRoom from "./JoinSecretRoom";
import Profile from "../pages/Profile";

interface AppLayoutProps {
  children: ReactNode;
}

const NavbarButton = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 300 }}
    onClick={onClick}
    className="group flex items-center gap-2 text-white hover:text-pink-300 transition-colors"
    title={label}
  >
    <Icon className="text-2xl" />
    <span className="text-sm opacity-90 group-hover:opacity-100 transition-opacity hidden sm:inline">
      {label}
    </span>
  </motion.button>
);

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { joinRoomWithLoading, notifyRoomCreated } = useRoom();
  const [showSearch, setShowSearch] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinSecret, setShowJoinSecret] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);
  const createModalRef = useRef<HTMLDivElement>(null);
  const isRoomsPage = useIsRoomsPage();

  // Handle clicks outside of profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Escape key for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowCreate(false);
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden relative">
      {/* Navbar */}
      <div className="w-full bg-black/20 backdrop-blur-md shadow-xl z-50 border-b border-white/20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              to="/rooms"
              className="text-white text-xl font-bold mr-4 md:mr-8"
            >
              AuraRooms
            </Link>
          </div>

          <div className="flex items-center gap-3 md:gap-6 relative">
            {/* Search Rooms */}
            <NavbarButton
              icon={FaSearch}
              label="Search Rooms"
              onClick={() => {
                setShowSearch((prev) => !prev);
                setShowCreate(false);
                setShowProfileMenu(false);
              }}
            />

            {/* Create Room (hide on /rooms) */}
            {!isRoomsPage && (
              <NavbarButton
                icon={FaPlus}
                label="Create Room"
                onClick={() => {
                  setShowCreate((prev) => !prev);
                  setShowSearch(false);
                  setShowProfileMenu(false);
                }}
              />
            )}

            {/* Join Secret Room */}
            <NavbarButton
              icon={FaLock}
              label="Join Secret Room"
              onClick={() => {
                setShowJoinSecret(true);
                setShowSearch(false);
                setShowCreate(false);
                setShowProfileMenu(false);
              }}
            />

            <div className="h-8 w-px bg-white/20 mx-1 md:mx-2"></div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setShowProfileMenu((prev) => !prev);
                  setShowSearch(false);
                  setShowCreate(false);
                }}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none group"
              >
                <div className="relative">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-colors"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center border-2 border-white/20 group-hover:border-white/40 transition-colors">
                      <span className="text-white text-sm font-medium">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-full transition-colors"></div>
                </div>
              </button>
              {showProfileMenu && (
                <ul className="absolute right-0 mt-2 w-56 bg-white/10 backdrop-blur-md rounded-lg shadow-lg border border-white/20 z-50 overflow-hidden">
                  <li className="px-4 py-3 bg-white/5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt="Profile"
                          className="w-10 h-10 rounded-full border-2 border-white/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center border-2 border-white/20">
                          <span className="text-white text-lg font-medium">
                            {user?.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-white">
                          {user?.username}
                        </div>
                        <div className="text-xs text-white/60">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                  </li>
                  <li
                    className="px-4 py-2 text-white hover:bg-white/20 cursor-pointer flex items-center gap-2"
                    onClick={() => {
                      setShowProfileModal(true);
                      setShowProfileMenu(false);
                    }}
                  >
                    Edit Profile
                  </li>
                  <li
                    className="px-4 py-2 text-white hover:bg-white/20 cursor-pointer flex items-center gap-2"
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                  >
                    Logout
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowSearch(false)}
        >
          <div
            ref={searchModalRef}
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Search Rooms</h2>
                <button
                  onClick={() => setShowSearch(false)}
                  className="text-white/70 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  ×
                </button>
              </div>
              <RoomSearch
                onSelectRoom={async (room) => {
                  setShowSearch(false);
                  try {
                    if (room.visibility === "private") {
                      navigate(`/join/${room._id}`);
                    } else {
                      await joinRoomWithLoading(room._id, { delay: 300 });
                    }
                  } catch (error) {
                    console.error("[AppLayout] Failed to join room:", error);
                    // Fall back to normal navigation if needed
                    navigate(`/chat/${room._id}`);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            ref={createModalRef}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <CreateRoomForm
              onSuccess={(room, joinAfterCreate, resetLoading) => {
                console.log("[AppLayout] Room created successfully:", room);

                // Notify all listeners (like Rooms.tsx) about the new room
                notifyRoomCreated(room);

                setShowCreate(false);

                if (joinAfterCreate && room && room._id) {
                  if (room.visibility === "private") {
                    navigate(`/join/${room._id}`);
                  } else {
                    navigate(`/chat/${room._id}`);
                  }
                }

                resetLoading?.(); // Reset the form's loading state
              }}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        </div>
      )}

      {/* Join Secret Room Modal */}
      {showJoinSecret && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowJoinSecret(false)}
        >
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <JoinSecretRoom
              onSuccess={() => {
                setShowJoinSecret(false);
                // Don't navigate here - let JoinSecretRoom handle navigation with proper state
              }}
              onCancel={() => setShowJoinSecret(false)}
            />
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Profile onCancel={() => setShowProfileModal(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 h-full overflow-y-auto relative z-10 p-4">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
