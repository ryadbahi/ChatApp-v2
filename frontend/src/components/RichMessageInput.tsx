import React, { useCallback, useState, useMemo, Suspense, lazy } from "react";
import { createEditor, Editor, Transforms } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { FaPaperPlane } from "react-icons/fa";

// Lazy load the emoji picker for better performance
const EmojiPicker = lazy(() => import("emoji-picker-react"));

interface RichMessageInputProps {
  onSend: (message: string) => void;
}

const initialValue = [{ type: "paragraph", children: [{ text: "" }] }];

const Element = ({ attributes, children, element }: any) => {
  switch (element.type) {
    case "bulleted-list":
      return <ul {...attributes}>{children}</ul>;
    case "list-item":
      return <li {...attributes}>{children}</li>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) children = <strong>{children}</strong>;
  if (leaf.italic) children = <em>{children}</em>;
  if (leaf.underline) children = <u>{children}</u>;

  // Apply color if present
  const style = leaf.color ? { color: leaf.color } : {};

  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  );
};

const ToolbarButton = ({
  icon,
  onClick,
  isActive,
}: {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  isActive?: boolean;
}) => (
  <button
    type="button"
    className={`px-2 py-1 rounded text-white mr-1 transition-all duration-200 ${
      isActive 
        ? "bg-pink-600 shadow-lg ring-2 ring-white/30 scale-105" 
        : "bg-pink-500/70 hover:bg-pink-600 hover:scale-105"
    }`}
    onMouseDown={(e) => {
      e.preventDefault(); // Prevent losing focus
      onClick(e);
    }}
    tabIndex={-1}
  >
    {icon}
  </button>
);

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? (marks as any)[format] === true : false;
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const toggleColor = (editor: Editor, color: string) => {
  // Remove any existing color first
  Editor.removeMark(editor, "color");
  // Add the new color
  Editor.addMark(editor, "color", color);
};

const getActiveColor = (editor: Editor): string | null => {
  const marks = Editor.marks(editor);
  return marks ? (marks as any).color || null : null;
};

const RichMessageInput: React.FC<RichMessageInputProps> = ({ onSend }) => {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [showEmoji, setShowEmoji] = useState(false);

  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji;
    // Insert emoji at the current cursor position
    Editor.insertText(editor, emoji);
    setShowEmoji(false);
  };

  // Serialize Slate content to HTML
  const serializeToHTML = (nodes: any[]): string => {
    return nodes
      .map((node) => {
        if (node.type === "paragraph") {
          const content = node.children
            .map((child: any) => {
              let text = child.text || "";
              // Escape HTML characters in text first
              text = text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

              // Apply formatting
              if (child.bold) text = `<strong>${text}</strong>`;
              if (child.italic) text = `<em>${text}</em>`;
              if (child.underline) text = `<u>${text}</u>`;
              if (child.color)
                text = `<span style="color: ${child.color}">${text}</span>`;

              return text;
            })
            .join("");
          return content || "<br>";
        }
        return "";
      })
      .join("<br>");
  };

  const handleSend = () => {
    const plainText = Editor.string(editor, []).trim();
    if (plainText === "") return;

    // Get the rich content and serialize it to HTML
    const richContent = serializeToHTML(editor.children);

    // Send the rich content
    onSend(richContent);

    // Clear the editor content safely
    Transforms.select(editor, Editor.start(editor, []));
    Transforms.delete(editor, {
      at: {
        anchor: Editor.start(editor, []),
        focus: Editor.end(editor, [])
      }
    });
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-2 p-1 bg-black/20 rounded-lg">
        <ToolbarButton
          icon={<b>B</b>}
          isActive={isMarkActive(editor, "bold")}
          onClick={(e) => {
            e.preventDefault();
            toggleMark(editor, "bold");
          }}
        />
        <ToolbarButton
          icon={<i>I</i>}
          isActive={isMarkActive(editor, "italic")}
          onClick={(e) => {
            e.preventDefault();
            toggleMark(editor, "italic");
          }}
        />
        <ToolbarButton
          icon={<u>U</u>}
          isActive={isMarkActive(editor, "underline")}
          onClick={(e) => {
            e.preventDefault();
            toggleMark(editor, "underline");
          }}
        />

        {/* Color Options */}
        <div className="flex gap-1 ml-2">
          {[
            "#1e1e1e", // Black (Deep Gray)
            "#e74c3c", // Soft red
            "#636e72", // Medium Gray
            "#0984e3", // Strong Blue
            "#74b9ff", // Light Blue
            "#b2bec3", // Light Gray
          ].map((color) => (
            <button
              key={color}
              type="button"
              className={`w-6 h-6 rounded-full border-2 color-picker-button transition-all relative ${
                getActiveColor(editor) === color
                  ? "border-white active ring-2 ring-white/50 scale-110"
                  : "border-white/50 hover:border-white hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
              onMouseDown={(e) => {
                e.preventDefault();
                toggleColor(editor, color);
              }}
              title={`Apply ${color} color`}
            >
              {getActiveColor(editor) === color && (
                <div className="absolute inset-0 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          ))}
          <button
            type="button"
            className={`w-6 h-6 rounded-full border-2 color-picker-button flex items-center justify-center transition-all relative ${
              !getActiveColor(editor)
                ? "border-white active bg-gray-300 shadow-lg ring-2 ring-white/50 scale-110" 
                : "border-white/50 hover:border-white bg-gray-200 hover:scale-105"
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              Editor.removeMark(editor, "color");
            }}
            title="Remove color"
          >
            <span className="text-xs text-gray-700 font-bold leading-none">×</span>
            {!getActiveColor(editor) && (
              <div className="absolute inset-0 rounded-full bg-white/30 flex items-center justify-center">
                <span className="text-gray-800 text-xs font-bold">✓</span>
              </div>
            )}
          </button>
        </div>

        <div className="relative ml-2">
          <button
            type="button"
            className="px-2 py-1 rounded bg-pink-500 text-white hover:bg-pink-600 transition-all"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowEmoji((v) => !v);
            }}
          >
            😊
          </button>
          {/* Emoji Picker - positioned above the emoji button with lazy loading */}
          {showEmoji && (
            <div className="absolute bottom-full mb-2 left-0 z-50">
              <Suspense 
                fallback={
                  <div className="w-80 h-80 bg-white/90 rounded-lg border border-gray-200 shadow-lg flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                      <div className="text-gray-600 text-sm">Loading emojis...</div>
                    </div>
                  </div>
                }
              >
                <EmojiPicker 
                  onEmojiClick={handleEmojiClick}
                  lazyLoadEmojis={true}
                  previewConfig={{ showPreview: false }}
                  width={300}
                  height={350}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>

      {/* Editor and Send Button Container */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Slate
            editor={editor}
            initialValue={initialValue}
            onChange={() => {}}
          >
            <Editable
              className="p-3 rounded-lg bg-white/30 text-white placeholder-white/70 border-none outline-none backdrop-blur min-h-[48px] max-h-32 overflow-y-hidden resize-none"
              renderElement={useCallback(
                (props: any) => (
                  <Element {...props} />
                ),
                []
              )}
              renderLeaf={useCallback(
                (props: any) => (
                  <Leaf {...props} />
                ),
                []
              )}
              placeholder="Type your message..."
              spellCheck
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
          </Slate>
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          className="px-4 py-3 flex items-center justify-center bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors shadow-md"
          style={{ minWidth: 48, minHeight: 48 }}
          aria-label="Send message"
        >
          <FaPaperPlane size={18} />
        </button>
      </div>
    </div>
  );
};

export default RichMessageInput;
