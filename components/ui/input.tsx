"use client";
import * as React from "react";
import cn from "classnames";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm",
        "placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2",
        "disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

