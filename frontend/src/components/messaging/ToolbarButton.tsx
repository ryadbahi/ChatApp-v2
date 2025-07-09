import React from "react";

interface ToolbarButtonProps {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  isActive?: boolean;
  colorClass?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  onClick,
  isActive,
  colorClass,
}) => (
  <button
    type="button"
    className={`px-2 py-1 rounded mr-1 transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-white/40
      ${
        isActive
          ? colorClass || "bg-pink-600 text-white border-pink-600"
          : "bg-gray-200 text-gray-500 border-gray-300"
      }
      ${
        isActive
          ? "shadow-lg scale-105"
          : "hover:bg-gray-300 hover:text-gray-700"
      }
    `}
    onMouseDown={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    tabIndex={-1}
  >
    {icon}
  </button>
);

export default ToolbarButton;
