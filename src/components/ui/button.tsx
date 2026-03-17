import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "min-h-[44px] rounded-[var(--radius-md)] bg-[var(--accent-navy)] text-white transition-all hover:bg-[var(--accent-navy-hover)] active:scale-[0.98]",
        destructive: "min-h-[44px] rounded-[var(--radius-md)] bg-[var(--danger-bg)] text-[var(--danger-text)] transition-all hover:bg-red-100 active:scale-[0.98]",
        outline: "min-h-[44px] rounded-[var(--radius-md)] border border-[var(--border)] bg-transparent transition-all hover:bg-[var(--surface-hover)] active:scale-[0.98]",
        secondary: "min-h-[44px] rounded-[var(--radius-md)] bg-[var(--neutral-bg)] text-[var(--neutral-text)] transition-all hover:bg-[var(--surface-hover)] active:scale-[0.98]",
        ghost: "min-h-[44px] rounded-[var(--radius-md)] bg-transparent transition-all hover:bg-[var(--surface-hover)] active:scale-[0.98]",
        link: "text-slate-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3 text-xs",
        lg: "px-8",
        icon: "w-11 min-w-[44px] px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

