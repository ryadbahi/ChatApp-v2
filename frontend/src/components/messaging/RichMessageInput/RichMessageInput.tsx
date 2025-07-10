import React, { useState, useRef } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { useRichMessageEditor } from "../useRichMessageEditor";
import { serializeToHTML } from "./utils";
import GifPickerButton from "./GifPickerButton";
import EmojiPickerButton from "./EmojiPickerButton";
import ImageUploadButton from "./ImageUploadButton";
import RichMessageEditor from "./RichMessageEditor";
import FormattingToolbar from "./FormattingToolbar";

interface RichMessageInputProps {
  onSend: (message: string, imageUrl?: string) => void;
}

const RichMessageInput: React.FC<RichMessageInputProps> = ({ onSend }) => {
  const [showGifDropdown, setShowGifDropdown] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const editorRef = useRef<any>(null);

  const { editor, clearEditor, initialValue, handleChange, handleEmojiClick } =
    useRichMessageEditor();

  // Focus helper
  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Handle GIF select
  const handleGifSelect = (gif: any) => {
    if (gif?.url) {
      onSend(gif.url, undefined);
      setShowGifDropdown(false);
      focusEditor();
    }
  };

  // Handle emoji click
  const handleEmojiClickPersistent = (emojiData: any) => {
    handleEmojiClick(emojiData);
    focusEditor();
  };

  // Handle image upload
  const handleImageUpload = (imageUrl: string) => {
    onSend("", imageUrl);
  };

  // Handle sending text message
  const handleSend = () => {
    const plainText = editor.children
      .map((n: any) => n.children?.map((c: any) => c.text).join("") || "")
      .join("")
      .trim();

    if (plainText === "") {
      return;
    }

    const richContent = serializeToHTML(editor.children);
    onSend(richContent);
    clearEditor();
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-2 p-1 bg-black/20 rounded-lg relative">
        <GifPickerButton
          showGifDropdown={showGifDropdown}
          onToggleGifDropdown={() => {
            setShowGifDropdown(!showGifDropdown);
            setShowEmoji(false);
            focusEditor();
          }}
          onGifSelect={handleGifSelect}
          onFocusEditor={focusEditor}
        />

        <ImageUploadButton
          onImageUpload={handleImageUpload}
          onFocusEditor={focusEditor}
        />

        <EmojiPickerButton
          showEmoji={showEmoji}
          onToggleEmoji={() => setShowEmoji(!showEmoji)}
          onEmojiClick={handleEmojiClickPersistent}
          onFocusEditor={focusEditor}
        />

        {/* Text Formatting */}
        <FormattingToolbar editor={editor} onFocusEditor={focusEditor} />
      </div>

      {/* Editor and Send Button Container */}
      <div className="flex items-end gap-2">
        <RichMessageEditor
          editor={editor}
          initialValue={initialValue}
          onChange={handleChange}
          onSend={handleSend}
          editorRef={editorRef}
        />

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
