import React, { Suspense, lazy, useRef, useEffect } from "react";

// Lazy load the emoji picker for better performance
const EmojiPicker = lazy(() => import("emoji-picker-react"));

interface EmojiPickerButtonProps {
  showEmoji: boolean;
  onToggleEmoji: () => void;
  onEmojiClick: (emojiData: any) => void;
  onFocusEditor: () => void;
}

const EmojiPickerButton: React.FC<EmojiPickerButtonProps> = ({
  showEmoji,
  onToggleEmoji,
  onEmojiClick,
  onFocusEditor,
}) => {
  const emojiDropdownRef = useRef<HTMLDivElement>(null);

  // Handle outside click
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        showEmoji &&
        emojiDropdownRef.current &&
        !emojiDropdownRef.current.contains(target)
      ) {
        onToggleEmoji();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [showEmoji, onToggleEmoji]);

  // Focus editor when emoji picker opens
  useEffect(() => {
    if (showEmoji) {
      setTimeout(() => {
        onFocusEditor();
      }, 50);
    }
  }, [showEmoji, onFocusEditor]);

  // Persistent emoji picker handler (doesn't close picker)
  const handleEmojiClickPersistent = (emojiData: any) => {
    onEmojiClick(emojiData);
    onFocusEditor();
    // Do NOT close the emoji picker here
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleEmoji();
  };

  return (
    <div className="relative ml-2">
      <button
        type="button"
        className="ml-2 pt-2 pb-2 cursor-pointer px-2 py-1 rounded text-indigo-700bg-white/20 text-white hover:bg-white/30 transition-all"
        onClick={handleButtonClick}
      >
        😊
      </button>

      {showEmoji && (
        <div className="absolute bottom-full mb-2  z-50" ref={emojiDropdownRef}>
          <Suspense fallback={<div>Loading…</div>}>
            <EmojiPicker
              onEmojiClick={handleEmojiClickPersistent}
              lazyLoadEmojis={true}
              previewConfig={{ showPreview: false }}
              autoFocusSearch={false}
              searchDisabled={false}
              width={350}
              height={450}
              reactionsDefaultOpen={true}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default EmojiPickerButton;
