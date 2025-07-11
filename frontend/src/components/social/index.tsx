import { lazy, Suspense } from "react";
import type { ComponentProps } from "react";

// Lazy load heavy social components
const LazyFriendsList = lazy(() => import("./FriendsList/FriendsList"));
const LazyDMThreadsMenu = lazy(() => import("./DMThreadsMenu/DMThreadsMenu"));
const LazyDMWindow = lazy(() => import("./DMWindow/index"));

// Loading fallbacks
const SocialLoader = () => (
  <div className="animate-pulse bg-white/10 rounded-lg p-4">
    <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-white/20 rounded w-1/2"></div>
  </div>
);

const MenuLoader = () => (
  <div className="animate-pulse bg-white/10 rounded-lg p-2">
    <div className="h-6 bg-white/20 rounded w-16"></div>
  </div>
);

// Lazy wrapped components with proper typing
export const FriendsList = (props: ComponentProps<typeof LazyFriendsList>) => (
  <Suspense fallback={<SocialLoader />}>
    <LazyFriendsList {...props} />
  </Suspense>
);

export const DMThreadsMenu = (
  props: ComponentProps<typeof LazyDMThreadsMenu>
) => (
  <Suspense fallback={<MenuLoader />}>
    <LazyDMThreadsMenu {...props} />
  </Suspense>
);

export const DMWindow = (props: ComponentProps<typeof LazyDMWindow>) => (
  <Suspense fallback={<SocialLoader />}>
    <LazyDMWindow {...props} />
  </Suspense>
);

// Re-export lightweight components normally
export { default as FriendRequestButton } from "./FriendRequestButton";
export { default as UserActionDropdown } from "./UserActionDropdown";
