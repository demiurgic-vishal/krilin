import React, { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type = "text", placeholder = "Enter text", className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={cn(
          "px-4 py-2 w-full border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[2px_2px_0_0_var(--border)] transition-all",
          "focus:outline-none focus:shadow-[4px_4px_0_0_var(--border)] focus:translate-x-[-2px] focus:translate-y-[-2px]",
          "placeholder:text-[var(--muted-foreground)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          props["aria-invalid"] && "border-[var(--destructive)] text-[var(--destructive)]",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
