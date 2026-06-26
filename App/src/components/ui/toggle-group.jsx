import { cn } from "./utils";

export function ToggleGroup({ children, className, ...props }) {
  return (
    <div className={cn('inline-flex', className)} {...props}>
      {children}
    </div>
  );
}
