import React, { useCallback } from "react";
import { Slate, Editable } from "slate-react";
import { Element, Leaf } from "../SlateElements";

interface RichMessageEditorProps {
  editor: any;
  initialValue: any[];
  onChange: (value: any[]) => void;
  onSend: () => void;
  editorRef: React.RefObject<any>;
}

const RichMessageEditor: React.FC<RichMessageEditorProps> = ({
  editor,
  initialValue,
  onChange,
  onSend,
  editorRef,
}) => {
  return (
    <div className="flex-1">
      <Slate editor={editor} initialValue={initialValue} onChange={onChange}>
        <Editable
          ref={editorRef}
          className="pt-2 px-3 pb-2 rounded-lg bg-white/30 text-white placeholder-white/70 border-none outline-none backdrop-blur min-h-[48px] max-h-32 overflow-hidden resize-none"
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
              onSend();
            }
          }}
        />
      </Slate>
    </div>
  );
};

export default RichMessageEditor;
