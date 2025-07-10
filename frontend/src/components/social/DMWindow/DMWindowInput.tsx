import React from "react";
import RichMessageInput from "../../messaging/RichMessageInput";

interface DMWindowInputProps {
  onSend: (content: string, imageUrl?: string) => void;
}

const DMWindowInput: React.FC<DMWindowInputProps> = ({ onSend }) => (
  <div className="p-3 border-t border-white/20">
    <RichMessageInput onSend={onSend} />
  </div>
);

export default DMWindowInput;
