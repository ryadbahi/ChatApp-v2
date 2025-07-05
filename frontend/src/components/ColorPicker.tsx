import React from "react";

interface ColorPickerProps {
  getActiveColor: () => string | null;
  toggleColor: (color: string) => void;
}

const COLORS = [
  "#ffffff", // White (default)
  "#1e1e1e", // Black (Deep Gray)
  "#e74c3c", // Soft red
  "#636e72", // Medium Gray
  "#0984e3", // Strong Blue
  "#74b9ff", // Light Blue
  "#b2bec3", // Light Gray
];

const ColorPicker: React.FC<ColorPickerProps> = ({
  getActiveColor,
  toggleColor,
}) => (
  <div className="flex gap-1 ml-2">
    {COLORS.map((color) => (
      <button
        key={color}
        type="button"
        className={`w-6 h-6 rounded-full border-2 color-picker-button transition-all relative focus:outline-none focus:ring-2 focus:ring-white/40
          ${
            getActiveColor() === color
              ? "ring-4 ring-pink-400 border-white scale-110"
              : "border-white/50 hover:border-white hover:scale-105"
          }
        `}
        style={{ backgroundColor: color }}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleColor(color);
        }}
        title={`Apply ${color === "#ffffff" ? "white (default)" : color} color`}
      />
    ))}
  </div>
);

export default ColorPicker;
