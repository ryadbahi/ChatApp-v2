import React from "react";
import { FaComments } from "react-icons/fa";
import { motion } from "framer-motion";

interface DMThreadsMenuButtonProps {
  totalUnreadCount: number;
  onToggle: () => void;
}

const DMThreadsMenuButton: React.FC<DMThreadsMenuButtonProps> = ({
  totalUnreadCount,
  onToggle,
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onToggle}
    className="relative group flex items-center gap-2 text-white hover:text-pink-300 transition-colors"
    title="Direct Messages"
  >
    <FaComments className="text-2xl" />
    {totalUnreadCount > 0 && (
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
        {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
      </span>
    )}
    <span className="text-sm opacity-90 group-hover:opacity-100 transition-opacity hidden sm:inline">
      Messages
    </span>
  </motion.button>
);

export default DMThreadsMenuButton;
