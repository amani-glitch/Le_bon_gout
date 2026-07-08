import { useMe } from "./api";

export function useAuth() {
  const { data: user, isLoading, isFetched } = useMe();
  return {
    user: user ?? null,
    isLoading,
    isResolved: isFetched,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };
}
