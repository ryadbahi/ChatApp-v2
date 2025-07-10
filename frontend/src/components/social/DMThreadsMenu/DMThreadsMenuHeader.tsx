import React from "react";

interface DMThreadsMenuHeaderProps {
  onClose: () => void;
}

const DMThreadsMenuHeader: React.FC<DMThreadsMenuHeaderProps> = ({
  onClose,
}) => (
  <div className="flex items-center justify-between p-4 border-b border-white/20">
    <h3 className="text-lg font-semibold text-white">Direct Messages</h3>
    <button
      onClick={onClose}
      className="text-white/70 hover:text-white text-xl leading-none w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
    >
      ×
    </button>
  </div>
);

export default DMThreadsMenuHeader;
