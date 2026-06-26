import { useIsMobile } from "./use-mobile";

export default function Sidebar({ children }) {
  const isMobile = useIsMobile();
  return (
    <aside>
      {children}
      <div>{isMobile ? 'mobile' : 'desktop'}</div>
    </aside>
  );
}
