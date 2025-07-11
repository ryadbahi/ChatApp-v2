// Room Components - Lazy loaded for better performance
import { lazy, Suspense } from "react";
import type { ComponentProps } from "react";

// Lazy load room components
const LazyRoomCard = lazy(() => import("./RoomCard"));
const LazyRoomUsersList = lazy(() => import("./RoomUsersList"));

// Loading fallback for room components
const RoomLoader = () => (
  <div className="animate-pulse bg-white/10 rounded-lg p-4">
    <div className="h-6 bg-white/20 rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-white/20 rounded w-1/2"></div>
  </div>
);

// Lazy wrapped components with proper typing
export const RoomCard = (props: ComponentProps<typeof LazyRoomCard>) => (
  <Suspense fallback={<RoomLoader />}>
    <LazyRoomCard {...props} />
  </Suspense>
);

export const RoomUsersList = (
  props: ComponentProps<typeof LazyRoomUsersList>
) => (
  <Suspense fallback={<RoomLoader />}>
    <LazyRoomUsersList {...props} />
  </Suspense>
);
