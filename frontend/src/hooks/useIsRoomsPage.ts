import { useLocation } from "react-router-dom";

export function useIsRoomsPage() {
  const location = useLocation();
  // Match /rooms or /rooms/ (exact)
  return /^\/rooms\/?$/.test(location.pathname);
}
