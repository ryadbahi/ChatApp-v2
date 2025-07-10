import React from "react";
import { Editor } from "slate";
import { FaBold, FaItalic, FaUnderline } from "react-icons/fa";
import TextColorPicker from "./TextColorPicker";

interface FormattingToolbarProps {
  editor: Editor;
  onFocusEditor: () => void;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  editor,
  onFocusEditor,
}) => {
  const toggleMark = (format: string) => {
    const isActive = isMarkActive(editor, format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  const isMarkActive = (editor: Editor, format: string) => {
    const marks = Editor.marks(editor);
    return marks ? (marks as any)[format] === true : false;
  };

  return (
    <div className="flex items-center gap-1">
      {/* Bold */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark("bold");
          onFocusEditor();
        }}
        className={`p-2 rounded transition-all ${
          isMarkActive(editor, "bold")
            ? "bg-blue-500 text-white"
            : "bg-white/20 text-white hover:bg-white/30"
        }`}
      >
        <FaBold size={12} />
      </button>

      {/* Italic */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark("italic");
          onFocusEditor();
        }}
        className={`p-2 rounded transition-all ${
          isMarkActive(editor, "italic")
            ? "bg-blue-500 text-white"
            : "bg-white/20 text-white hover:bg-white/30"
        }`}
      >
        <FaItalic size={12} />
      </button>

      {/* Underline */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark("underline");
          onFocusEditor();
        }}
        className={`p-2 rounded transition-all ${
          isMarkActive(editor, "underline")
            ? "bg-blue-500 text-white"
            : "bg-white/20 text-white hover:bg-white/30"
        }`}
      >
        <FaUnderline size={12} />
      </button>

      {/* Text Color Picker */}
      <TextColorPicker editor={editor} onFocusEditor={onFocusEditor} />
    </div>
  );
};

export default FormattingToolbar;
