import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import type { Message } from "../types/types";

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, isMe }) => {
  const [showTime, setShowTime] = useState(false);
  const usernameRef = useRef<HTMLSpanElement>(null);
  const [usernameWidth, setUsernameWidth] = useState<number>(0);

  useEffect(() => {
    if (usernameRef.current) {
      setUsernameWidth(usernameRef.current.offsetWidth);
    }
  }, [msg.sender.username]);

  const handleBubbleClick = () => setShowTime((prev) => !prev);

  return (
    <div
      className={clsx(
        "w-full flex px-3 mb-2 pt-5",
        isMe ? "justify-end" : "justify-start"
      )}
    >
      <div className="relative inline-block max-w-[80%]">
        {/* Username */}
        <span
          ref={usernameRef}
          className={clsx(
            "absolute z-10 text-sm font-bold tracking-wide whitespace-nowrap pointer-events-none select-none",
            isMe ? "text-pink-300 right-4" : "text-indigo-600 left-4",
            "-translate-y-1/2"
          )}
          style={{ top: 0 }}
          title={msg.sender.username}
        >
          {msg.sender.username}
        </span>

        {/* Message bubble */}
        <div
          className={clsx(
            "relative bg-opacity-80 backdrop-blur-sm rounded-xl shadow-xl px-4 py-2 pt-1 text-base leading-normal break-words cursor-pointer transition-all duration-200",
            {
              "bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-right":
                isMe,
              "bg-white/80 text-gray-800 text-left": !isMe,
            }
          )}
          style={{
            wordBreak: "break-word",
            width: "fit-content",
            minWidth: Math.max(usernameWidth + 32, 80), // username width + bubble padding or 80px min
            paddingTop: "2.2rem",
          }}
          onClick={handleBubbleClick}
        >
          {msg.content}

          {showTime && (
            <span
              className={clsx(
                "absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full text-xs pointer-events-none select-none whitespace-nowrap",
                isMe ? "text-pink-200" : "text-indigo-400"
              )}
              style={{ zIndex: 20 }}
            >
              {(() => {
                const dateObj = new Date(msg.createdAt);
                const now = new Date();
                const isToday =
                  dateObj.getFullYear() === now.getFullYear() &&
                  dateObj.getMonth() === now.getMonth() &&
                  dateObj.getDate() === now.getDate();
                const timeStr = dateObj.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                if (isToday) {
                  return `Today, ${timeStr}`;
                } else {
                  return dateObj.toLocaleString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  });
                }
              })()}
            </span>
          )}
        </div>

        {/* Bubble glow accent */}
        <div
          className={clsx(
            "absolute -bottom-1 w-8 h-1 rounded-t-full blur-md opacity-60",
            isMe ? "bg-purple-500 right-4" : "bg-yellow-400 left-4"
          )}
        />
      </div>
    </div>
  );
};

export default MessageBubble;
