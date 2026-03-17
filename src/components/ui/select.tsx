import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex min-h-[44px] w-full appearance-none items-center justify-between whitespace-nowrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 pe-8 text-sm text-primary transition-colors placeholder:text-tertiary focus:border-[var(--accent-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-navy)] disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute end-2 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
