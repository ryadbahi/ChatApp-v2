import { useState } from "react";
import type { ReactNode } from "react";
import {
  FaUserCircle,
  FaPlus,
  FaCog,
  FaBars,
  FaChevronRight,
  FaChevronLeft,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface AppLayoutProps {
  children: ReactNode;
}

const SidebarButton = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    transition={{ type: "spring", stiffness: 300 }}
    onClick={onClick}
    className="group flex flex-col items-center gap-1 text-white hover:text-pink-300 transition-colors"
    title={label}
  >
    <Icon className="text-3xl" />
    {label && (
      <span className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    )}
  </motion.button>
);

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden relative">
      {/* Overlay (only when sidebar open) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-3xl"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar (detached, rounded, floating) */}
      <motion.div
        initial={false}
        animate={{
          width: sidebarOpen ? 256 : 64,
        }}
        transition={{ type: "spring", stiffness: 250, damping: 30 }}
        className="fixed top-4 left-4 h-[97vh] bg-white/20 backdrop-blur-3xl shadow-2xl flex flex-col items-center py-6 z-50 space-y-8 rounded-2xl border border-white/30"
        style={{
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        }}
      >
        <SidebarButton
          icon={FaUserCircle}
          label={sidebarOpen ? "Profile" : ""}
        />
        <SidebarButton icon={FaPlus} label={sidebarOpen ? "Create" : ""} />

        {/* Chevron Toggle */}
        <div className="my-2">
          <button
            className="flex items-center justify-center text-white bg-black/20 hover:bg-black/40 rounded-full w-8 h-8 transition-colors"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        </div>

        <div className="flex-1" />
        <SidebarButton icon={FaCog} label={sidebarOpen ? "Settings" : ""} />
      </motion.div>

      {/* Hamburger (shown when sidebar is collapsed) */}
      {!sidebarOpen && (
        <button
          className="fixed top-4 left-4 z-40 text-white text-3xl md:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open Sidebar"
        >
          <FaBars />
        </button>
      )}

      {/* Main content (add left margin to match sidebar) */}
      <div
        className="flex-1 h-full overflow-y-auto relative z-10 p-4"
        style={{ marginLeft: 88 }}
      >
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
