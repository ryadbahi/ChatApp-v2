import React, {
  useCallback,
  Suspense,
  lazy,
  useState,
  useRef,
  useEffect,
} from "react";
import GifPicker from "gif-picker-react";

// Use environment variable for Tenor API key
const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY;
import { Slate, Editable } from "slate-react";
import { FaPaperPlane, FaRegFileImage } from "react-icons/fa";
import ToolbarButton from "./ToolbarButton";
import ColorPicker from "./ColorPicker";
import { Element, Leaf } from "./SlateElements";
import { useRichMessageEditor } from ".//useRichMessageEditor";

// Lazy load the emoji picker for better performance
const EmojiPicker = lazy(() => import("emoji-picker-react"));

interface RichMessageInputProps {
  onSend: (message: string, imageUrl?: string) => void;
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
  // GIF picker state
  const [showGifDropdown, setShowGifDropdown] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const gifDropdownRef = useRef<HTMLDivElement>(null);
  const emojiDropdownRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  // Focus helper
  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Handle outside click for GIF and Emoji pickers
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      // Don't close if clicking inside the GIF picker
      if (
        showGifDropdown &&
        gifDropdownRef.current &&
        gifDropdownRef.current.contains(target)
      ) {
        return;
      }

      // Don't close if clicking inside the Emoji picker
      if (
        showEmoji &&
        emojiDropdownRef.current &&
        emojiDropdownRef.current.contains(target)
      ) {
        return;
      }

      setShowGifDropdown(false);
      setShowEmoji(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [showGifDropdown, showEmoji]);

  useEffect(() => {
    if (showEmoji) {
      setTimeout(() => {
        focusEditor();
      }, 50);
    }
  }, [showEmoji]);

  // Handle GIF select from gif-picker-react
  const handleGifSelect = (gif: any) => {
    if (gif?.url) {
      onSend("", gif.url);
      setShowGifDropdown(false);
      focusEditor();
    }
  };

  const {
    editor,
    getActiveColor,
    isMarkActive,
    toggleMark,
    toggleColor,
    handleEmojiClick,
    clearEditor,
    initialValue,
    handleChange,
  } = useRichMessageEditor();

  // Persistent emoji picker handler
  const handleEmojiClickPersistent = (emojiData: any) => {
    handleEmojiClick(emojiData);
    focusEditor();
    // Do NOT close the emoji picker here
  };

  // Handle sending text message
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

  // Handle image upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Optionally: validate file type/size here
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data?.url) {
        onSend("", data.url);
      }
    } catch (err) {
      alert("Failed to upload image");
    }
    e.target.value = ""; // Reset file input
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-2 p-1 bg-black/20 rounded-lg relative">
        {/* GIF picker button */}
        <button
          type="button"
          className="ml-2 pt-2 pb-2 px-2 rounded text-pink-700 bg-white transition-all font-bold"
          style={{ minWidth: 36 }}
          onClick={() => {
            setShowGifDropdown((v) => !v);
            setShowEmoji(false);
            focusEditor();
          }}
          aria-label="Pick a GIF"
        >
          GIF
        </button>

        {/* GIF picker-react dropdown */}
        {showGifDropdown && (
          <div
            className="absolute bottom-full mb-2 left-0 z-50"
            ref={gifDropdownRef}
          >
            <GifPicker
              onGifClick={handleGifSelect}
              width={320}
              height={400}
              tenorApiKey={TENOR_API_KEY}
            />
          </div>
        )}
        {/* Image upload button */}
        <label
          className="ml-2 pt-2 pb-2 cursor-pointer px-2 py-1 rounded text-indigo-700 bg-white transition-all"
          onClick={focusEditor}
        >
          <FaRegFileImage size={18} />
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </label>
        <ToolbarButton
          icon={<b>B</b>}
          isActive={isMarkActive("bold")}
          onClick={(e) => {
            e.preventDefault();
            toggleMark("bold");
            focusEditor();
          }}
          colorClass="bg-pink-600 text-white border-pink-600"
        />
        <ToolbarButton
          icon={<i>I</i>}
          isActive={isMarkActive("italic")}
          onClick={(e) => {
            e.preventDefault();
            toggleMark("italic");
            focusEditor();
          }}
          colorClass="bg-blue-500 text-white border-blue-500"
        />
        <ToolbarButton
          icon={<u>U</u>}
          isActive={isMarkActive("underline")}
          onClick={(e) => {
            e.preventDefault();
            toggleMark("underline");
            focusEditor();
          }}
          colorClass="bg-green-500 text-white border-green-500"
        />
        <ColorPicker
          getActiveColor={getActiveColor}
          toggleColor={(color) => {
            toggleColor(color);
            setTimeout(() => focusEditor(), 0);
          }}
        />
        <div className="relative ml-2">
          <button
            type="button"
            className="px-2 py-1 rounded bg-pink-500 text-white hover:bg-pink-600"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowEmoji((v) => !v);
            }}
          >
            😊
          </button>
          {showEmoji && (
            <div
              className="absolute bottom-full mb-2 left-0 z-50"
              ref={emojiDropdownRef}
            >
              <Suspense fallback={<div>Loading…</div>}>
                <EmojiPicker
                  onEmojiClick={handleEmojiClickPersistent}
                  lazyLoadEmojis={true}
                  previewConfig={{ showPreview: false }}
                  autoFocusSearch={false}
                  searchDisabled={false}
                  width={450}
                  height={450}
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
              ref={editorRef}
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
