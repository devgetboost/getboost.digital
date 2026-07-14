import { ReactNode } from "react";
import RequireRole from "./RequireRole";

export default function RequireAgenticView({ children }: { children: ReactNode }) {
  return <RequireRole role="admin">{children}</RequireRole>;
}
