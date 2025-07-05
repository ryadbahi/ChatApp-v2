import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import type { Message } from "../types/types";
import { FaClock, FaUser } from "react-icons/fa";

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, isMe }) => {
  const [showTime, setShowTime] = useState(false);
  const usernameRef = useRef<HTMLSpanElement>(null);
  const [usernameWidth, setUsernameWidth] = useState<number>(0);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (usernameRef.current) {
      setUsernameWidth(usernameRef.current.offsetWidth);
    }
  }, [msg.sender.username]);

  const handleBubbleClick = () => setShowTime((prev) => !prev);

  // Format time for display
  const formatTime = () => {
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
  };

  return (
    <div
      className={clsx(
        "w-full flex px-3 mb-2 pt-5",
        isMe ? "justify-end" : "justify-start"
      )}
      aria-label={`Message from ${msg.sender.username}: ${msg.content}`}
    >
      <div className="relative flex items-start gap-2 max-w-[80%] group">
        {/* Avatar placeholder with enhanced styling */}
        <div
          className={clsx(
            "w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105",
            isMe ? "order-last" : ""
          )}
          style={{
            marginTop: "1.5rem", // Align with bubble
            background: isMe
              ? "linear-gradient(to bottom right, #f472b6, #a855f7)"
              : "linear-gradient(to bottom right, #818cf8, #3b82f6)",
            border: isMe
              ? "2px solid rgba(236,72,153,0.3)"
              : "2px solid rgba(99,102,241,0.3)",
            boxShadow: isMe
              ? "0 0 10px rgba(236,72,153,0.2)"
              : "0 0 10px rgba(99,102,241,0.2)",
            borderRadius: "50%",
          }}
          role="img"
          aria-label={`${msg.sender.avatar}'s avatar`}
        >
          {msg.sender.avatar ? (
            <img
              src={msg.sender.avatar}
              alt="Avatar"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : (
            <FaUser
              style={{
                position: "relative",
                zIndex: 10,
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "0.75rem",
              }}
            />
          )}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Enhanced username badge */}
          <div
            className={clsx(
              "absolute z-10 pointer-events-none select-none",
              isMe ? "right-4" : "left-4",
              "transform -translate-y-1/2 transition-all duration-300 group-hover:scale-105"
            )}
            style={{ top: 0 }}
          >
            <div
              className={clsx(
                "px-3 py-0.5 rounded-full flex items-center gap-1",
                isMe
                  ? "bg-gradient-to-r from-pink-500/70 to-purple-600/70"
                  : "bg-gradient-to-r from-indigo-500/70 to-blue-600/70",
                "backdrop-blur-md border border-white/10 shadow-lg"
              )}
            >
              <span
                ref={usernameRef}
                className="text-sm font-bold text-white whitespace-nowrap"
                style={{
                  textShadow: "0 0 4px rgba(0,0,0,0.3)",
                  letterSpacing: "0.2px",
                }}
                title={msg.sender.username}
              >
                {msg.sender.username}
              </span>
            </div>

            {/* Connector from username to bubble */}
            <div
              className={clsx(
                "absolute w-1.5 h-3",
                isMe ? "right-4" : "left-4",
                isMe
                  ? "bg-gradient-to-b from-purple-600/70 to-transparent"
                  : "bg-gradient-to-b from-blue-600/70 to-transparent"
              )}
              style={{ top: "95%" }}
            />
          </div>
          {/* Enhanced Message bubble with 3D effect */}
          <div
            ref={bubbleRef}
            className={clsx(
              "relative backdrop-blur-md rounded-2xl px-4 py-3 pt-3 text-base leading-normal break-words cursor-pointer",
              "transition-all duration-300 group-hover:shadow-2xl border",
              "animate-fadeIn hover:translate-y-[-2px]",
              {
                "bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-purple-700/90 text-white text-right border-purple-500/30":
                  isMe,
                "bg-gradient-to-br from-white/90 via-white/80 to-slate-100/90 text-gray-800 text-left border-white/30":
                  !isMe,
              }
            )}
            style={{
              wordBreak: "break-word",
              width: "fit-content",
              minWidth: Math.max(usernameWidth + 32, 80), // username width + bubble padding or 80px min
              paddingTop: "2.2rem",
              transformStyle: "preserve-3d",
              transform: `perspective(1000px) ${
                isMe ? "rotateY(-1deg)" : "rotateY(1deg)"
              } rotateX(1deg)`,
              boxShadow: isMe
                ? "0 10px 20px -10px rgba(124, 58, 237, 0.3), 0 4px 8px rgba(0, 0, 0, 0.1)"
                : "0 10px 20px -10px rgba(30, 64, 175, 0.2), 0 4px 8px rgba(0, 0, 0, 0.05)",
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
            onClick={handleBubbleClick}
            tabIndex={0}
            role="button"
            aria-label={`Message: ${msg.content}. Click to ${
              showTime ? "hide" : "show"
            } time.`}
            onKeyDown={(e) => e.key === "Enter" && handleBubbleClick()}
          >
            {/* Render message content with HTML support */}
            <div
              dangerouslySetInnerHTML={{ __html: msg.content }}
              className="message-content"
            />

            {/* Time display with animation */}
            <div
              className={clsx(
                "mt-2 pt-1 border-t transition-all overflow-hidden flex items-center justify-center gap-1 text-xs",
                showTime
                  ? "max-h-8 opacity-100 animate-fadeIn"
                  : "max-h-0 opacity-0 pointer-events-none",
                isMe
                  ? "border-white/20 text-white/80"
                  : "border-gray-400/20 text-gray-500"
              )}
              aria-hidden={!showTime}
            >
              <FaClock style={{ fontSize: "0.625rem" }} />
              <span>{formatTime()}</span>
            </div>
          </div>{" "}
          {/* Enhanced glow effects */}
          <div
            className={clsx(
              "absolute bottom-1 w-12 h-1.5 rounded-full blur-lg opacity-70 transition-all duration-500 group-hover:opacity-90 group-hover:w-16 group-hover:blur-xl",
              isMe ? "bg-purple-400 right-6" : "bg-blue-400 left-6"
            )}
          />
          {/* Subtle shine effect */}
          <div
            className={clsx(
              "absolute top-1/3 h-1/2 rounded-full blur-md opacity-20 pointer-events-none",
              isMe
                ? "right-4 w-3/4 bg-gradient-to-r from-transparent to-white/50"
                : "left-4 w-3/4 bg-gradient-to-l from-transparent to-white/50"
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
