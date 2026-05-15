import { createFileRoute, redirect } from "@tanstack/react-router";

// Signup is now embedded in the login page as a tab.
// Redirect any old /signup bookmarks to /login automatically.
export const Route = createFileRoute("/signup")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
