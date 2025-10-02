import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || "");

export { convex };

interface ConvexProviderWrapperProps {
  children: React.ReactNode;
}

export function ConvexProviderWrapper({ children }: ConvexProviderWrapperProps) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}