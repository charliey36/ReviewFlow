/**
 * Re-mounts on every navigation inside the app shell (unlike layout.tsx), so
 * each page eases in instead of snapping. Kept short and subtle on purpose.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in-up">{children}</div>;
}
