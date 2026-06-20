import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "./utils";

const toggleVariants = cva("inline-flex items-center rounded-md border px-2 py-1", {
  variants: {
    variant: {
      default: "bg-background",
    },
    size: {
      default: "h-8 px-3",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export function Toggle(props) {
  const { className, variant, size, children, ...rest } = props;
  return (
    <button className={cn(toggleVariants({ variant, size, className }))} {...rest}>
      {children}
    </button>
  );
}
