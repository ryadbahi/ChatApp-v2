import React, { useRef, useEffect } from "react";
import GifPicker from "gif-picker-react";

const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY;

interface GifPickerButtonProps {
  showGifDropdown: boolean;
  onToggleGifDropdown: () => void;
  onGifSelect: (gif: any) => void;
  onFocusEditor: () => void;
}

const GifPickerButton: React.FC<GifPickerButtonProps> = ({
  showGifDropdown,
  onToggleGifDropdown,
  onGifSelect,
  onFocusEditor,
}) => {
  const gifDropdownRef = useRef<HTMLDivElement>(null);

  // Handle outside click
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        showGifDropdown &&
        gifDropdownRef.current &&
        !gifDropdownRef.current.contains(target)
      ) {
        onToggleGifDropdown();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [showGifDropdown, onToggleGifDropdown]);

  const handleGifClick = (gif: any) => {
    if (gif?.url) {
      onGifSelect(gif);
      onFocusEditor();
    }
  };

  const handleButtonClick = () => {
    onToggleGifDropdown();
    onFocusEditor();
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="ml-2 pt-2 pb-2 px-2 rounded text-pink-700 bg-white transition-all font-bold"
        style={{ minWidth: 36 }}
        onClick={handleButtonClick}
        aria-label="Pick a GIF"
      >
        GIF
      </button>

      {showGifDropdown && (
        <div
          className="absolute bottom-full mb-2 left-0 z-50"
          ref={gifDropdownRef}
        >
          <GifPicker
            onGifClick={handleGifClick}
            width={320}
            height={400}
            tenorApiKey={TENOR_API_KEY}
          />
        </div>
      )}
    </div>
  );
};

export default GifPickerButton;
