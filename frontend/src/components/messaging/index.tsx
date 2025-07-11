// Messaging Components - Lazy loaded for better performance
import { lazy, Suspense } from "react";
import type { ComponentProps } from "react";

// Import LazyRichMessageInput as default export
import LazyRichMessageInput from "./LazyRichMessageInput";
export { LazyRichMessageInput as RichMessageInput };

// Lazy load other heavy messaging components
const LazyMessageBubble = lazy(() => import("./MessageBubble"));

// Loading fallback for messaging components
const MessageLoader = () => (
  <div className="animate-pulse bg-white/10 rounded-lg p-3">
    <div className="h-3 bg-white/20 rounded w-20 mb-2"></div>
    <div className="h-4 bg-white/20 rounded w-full mb-1"></div>
    <div className="h-4 bg-white/20 rounded w-3/4"></div>
  </div>
);

// Lazy wrapped components with proper typing
export const MessageBubble = (
  props: ComponentProps<typeof LazyMessageBubble>
) => (
  <Suspense fallback={<MessageLoader />}>
    <LazyMessageBubble {...props} />
  </Suspense>
);

// Re-export lightweight components normally
export { Element, Leaf } from "./SlateElements";
export { default as ToolbarButton } from "./ToolbarButton";
export { useRichMessageEditor } from "./useRichMessageEditor";
