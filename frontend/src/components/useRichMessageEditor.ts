import { useMemo, useState, useCallback } from "react";
import { createEditor, Editor, Transforms } from "slate";
import { withReact } from "slate-react";

const initialValue = [{ type: "paragraph", children: [{ text: "" }] }];

export function useRichMessageEditor() {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [showEmoji, setShowEmoji] = useState(false);
  const [currentMarks, setCurrentMarks] = useState<any>({});

  // Update current marks on every change
  const handleChange = useCallback(() => {
    const marks = Editor.marks(editor) || {};
    setCurrentMarks(marks);
  }, [editor]);

  const getActiveColor = () => {
    return currentMarks && currentMarks.color ? currentMarks.color : null;
  };

  const isMarkActive = (format: string) => {
    return currentMarks && currentMarks[format] === true;
  };

  const toggleMark = (format: string) => {
    const isActive = isMarkActive(format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  const toggleColor = (color: string) => {
    Editor.removeMark(editor, "color");
    Editor.addMark(editor, "color", color);
  };

  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji;
    Editor.insertText(editor, emoji);
    setShowEmoji(false);
  };

  const clearEditor = () => {
    Transforms.select(editor, Editor.start(editor, []));
    Transforms.delete(editor, {
      at: {
        anchor: Editor.start(editor, []),
        focus: Editor.end(editor, []),
      },
    });
  };

  return {
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
  };
}
