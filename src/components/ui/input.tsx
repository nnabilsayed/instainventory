import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-[44px] w-full rounded-[var(--radius-md)] border bg-[var(--surface)] px-3 text-sm text-primary transition-colors placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          error
            ? "border-[var(--danger-text)] focus:border-[var(--danger-text)] focus:ring-[var(--danger-text)]"
            : "border-[var(--border)] focus:border-[var(--accent-navy)] focus:ring-[var(--accent-navy)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
