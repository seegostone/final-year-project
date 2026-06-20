import * as React from "react";

export function Form({ children, ...props }) {
  return <form {...props}>{children}</form>;
}

export function FormField({ children, ...props }) {
  return <div {...props}>{children}</div>;
}

export function FormItem({ children, ...props }) {
  return <div {...props}>{children}</div>;
}

export function FormLabel({ children, ...props }) {
  return <label {...props}>{children}</label>;
}

export function FormControl({ children, ...props }) {
  return <div {...props}>{children}</div>;
}

export function FormMessage({ children, ...props }) {
  return <div {...props}>{children}</div>;
}
