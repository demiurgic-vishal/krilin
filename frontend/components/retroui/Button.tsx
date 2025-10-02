import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import React, { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-all duration-200 border-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--border)] hover:bg-[var(--primary-hover)] shadow-[4px_4px_0_0_var(--border)] hover:shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        secondary:
          "bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)] hover:bg-[var(--secondary)]/90 shadow-[4px_4px_0_0_var(--border)] hover:shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        success:
          "bg-[var(--success)] text-[var(--success-foreground)] border-[var(--border)] hover:opacity-90 shadow-[4px_4px_0_0_var(--border)] hover:shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        accent:
          "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--border)] hover:opacity-90 shadow-[4px_4px_0_0_var(--border)] hover:shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        destructive:
          "bg-[var(--destructive)] text-[var(--destructive-foreground)] border-[var(--border)] hover:opacity-90 shadow-[4px_4px_0_0_var(--border)] hover:shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        info:
          "bg-[var(--info)] text-[var(--info-foreground)] border-[var(--border)] hover:opacity-90 shadow-[4px_4px_0_0_var(--border)] hover:shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        warning:
          "bg-[var(--warning)] text-[var(--warning-foreground)] border-[var(--border)] hover:opacity-90 shadow-[4px_4px_0_0_var(--border)] hover:shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        outline:
          "bg-transparent border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] shadow-[4px_4px_0_0_var(--border)] hover:shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
        ghost:
          "bg-transparent border-0 text-[var(--foreground)] hover:bg-[var(--muted)] shadow-none",
        link: "bg-transparent border-0 text-[var(--foreground)] underline-offset-4 hover:underline shadow-none",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  },
);

export interface IButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, IButtonProps>(
  (
    {
      children,
      size = "md",
      className = "",
      variant = "default",
      asChild = false,
      ...props
    }: IButtonProps,
    forwardedRef,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={forwardedRef}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);

Button.displayName = "Button";
