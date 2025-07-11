import { lazy, Suspense } from "react";

// Lazy load the heavy RichMessageInput component
const LazyRichMessageInput = lazy(
  () => import("./RichMessageInput/RichMessageInput")
);

interface RichMessageInputProps {
  onSend: (content: string, imageUrl?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const RichMessageInputLoader = () => (
  <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
    <div className="flex-1 bg-white/5 rounded-lg p-3 min-h-[44px] flex items-center">
      <div className="animate-pulse bg-white/20 h-4 w-32 rounded"></div>
    </div>
    <div className="animate-pulse bg-white/20 h-8 w-8 rounded"></div>
  </div>
);

const RichMessageInput: React.FC<RichMessageInputProps> = (props) => {
  return (
    <Suspense fallback={<RichMessageInputLoader />}>
      <LazyRichMessageInput {...props} />
    </Suspense>
  );
};

export default RichMessageInput;
