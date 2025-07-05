import React, { useCallback, Suspense, lazy } from "react";
import { Slate, Editable } from "slate-react";
import { FaPaperPlane } from "react-icons/fa";
import ToolbarButton from "./ToolbarButton";
import ColorPicker from "./ColorPicker";
import { Element, Leaf } from "./SlateElements";
import { useRichMessageEditor } from ".//useRichMessageEditor";

// Lazy load the emoji picker for better performance
const EmojiPicker = lazy(() => import("emoji-picker-react"));

interface RichMessageInputProps {
  onSend: (message: string) => void;
}

const serializeToHTML = (nodes: any[]): string => {
  return nodes
    .map((node) => {
      if (node.type === "paragraph") {
        const content = node.children
          .map((child: any) => {
            let text = child.text || "";
            text = text
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
            if (child.bold) text = `<strong>${text}</strong>`;
            if (child.italic) text = `<em>${text}</em>`;
            if (child.underline) text = `<u>${text}</u>`;
            if (child.color)
              text = `<span style=\"color: ${child.color}\">${text}</span>`;
            return text;
          })
          .join("");
        return content || "<br>";
      }
      return "";
    })
    .join("<br>");
};

const RichMessageInput: React.FC<RichMessageInputProps> = ({ onSend }) => {
  const {
    editor,
    showEmoji,
    setShowEmoji,
    getActiveColor,
    isMarkActive,
    toggleMark,
    toggleColor,
    handleEmojiClick,
    clearEditor,
    initialValue,
    handleChange,
  } = useRichMessageEditor();

  const handleSend = () => {
    const plainText = editor.children
      .map((n: any) => n.children?.map((c: any) => c.text).join(""))
      .join("")
      .trim();
    if (plainText === "") return;
    const richContent = serializeToHTML(editor.children);
    onSend(richContent);
    clearEditor();
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-2 p-1 bg-black/20 rounded-lg">
        <ToolbarButton
          icon={<b>B</b>}
          isActive={isMarkActive("bold")}
          onClick={(e) => {
            e.preventDefault();
            toggleMark("bold");
          }}
          colorClass="bg-pink-600 text-white border-pink-600"
        />
        <ToolbarButton
          icon={<i>I</i>}
          isActive={isMarkActive("italic")}
          onClick={(e) => {
            e.preventDefault();
            toggleMark("italic");
          }}
          colorClass="bg-blue-500 text-white border-blue-500"
        />
        <ToolbarButton
          icon={<u>U</u>}
          isActive={isMarkActive("underline")}
          onClick={(e) => {
            e.preventDefault();
            toggleMark("underline");
          }}
          colorClass="bg-green-500 text-white border-green-500"
        />
        <ColorPicker
          getActiveColor={getActiveColor}
          toggleColor={toggleColor}
        />
        <div className="relative ml-2">
          <button
            type="button"
            className="px-2 py-1 rounded bg-pink-500 text-white hover:bg-pink-600 transition-all"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowEmoji((v: boolean) => !v);
            }}
          >
            😊
          </button>
          {showEmoji && (
            <div className="absolute bottom-full mb-2 left-0 z-50">
              <Suspense
                fallback={
                  <div className="w-80 h-80 bg-white/90 rounded-lg border border-gray-200 shadow-lg flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                      <div className="text-gray-600 text-sm">
                        Loading emojis...
                      </div>
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
            onChange={handleChange}
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
