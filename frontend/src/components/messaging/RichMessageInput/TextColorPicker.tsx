import React, { useState, useRef, useEffect } from "react";
import { IoIosColorPalette } from "react-icons/io";
import { Editor } from "slate";

interface TextColorPickerProps {
  editor: Editor;
  onFocusEditor: () => void;
}

const COLORS = [
  "#ffffff", // White (default)
  "#1e1e1e", // Black (Deep Gray)
  "#e74c3c", // Soft red
  "#74b9ff", // Light Blue
  "#b2bec3", // Light Gray
  "#00b894", // Green
  "#fd79a8", // Pink
  "#e17055", // Orange
];

const TextColorPicker: React.FC<TextColorPickerProps> = ({
  editor,
  onFocusEditor,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Get current active color
  const getActiveColor = (): string => {
    const marks = Editor.marks(editor);
    return (marks as any)?.color || "#ffffff";
  };

  // Handle color change
  const handleColorChange = (color: string) => {
    Editor.addMark(editor, "color", color);
    setShowColorPicker(false);
    onFocusEditor();
  };

  // Handle outside click
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        showColorPicker &&
        colorPickerRef.current &&
        !colorPickerRef.current.contains(target)
      ) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [showColorPicker]);

  const currentColor = getActiveColor();

  return (
    <div className="relative ml-2">
      <button
        type="button"
        className="w-8 h-8 rounded border-2 border-white/20 hover:border-white/40 transition-all relative focus:outline-none focus:ring-2 focus:ring-white/40"
        style={{ backgroundColor: currentColor }}
        onClick={() => {
          setShowColorPicker(!showColorPicker);
          onFocusEditor();
        }}
        aria-label="Text color"
      >
        {/* Small "A" indicator */}
        <span
          className="absolute inset-0 flex items-center justify-center  font-bold"
          style={{
            color: currentColor === "#ffffff" ? "#000000" : "#ffffff",
            textShadow: "1px 1px 1px rgba(0,0,0,0.5)",
          }}
        >
          <IoIosColorPalette />
        </span>
      </button>

      {showColorPicker && (
        <div
          className="absolute bottom-full mb-2 left-0 z-50 p-2 bg-white rounded-lg shadow-lg border"
          ref={colorPickerRef}
        >
          <div className="flex flex-col gap-1">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                  currentColor === color
                    ? "ring-2 ring-blue-500 border-blue-500"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextColorPicker;
