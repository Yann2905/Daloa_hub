import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 active:scale-[0.97] [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-glow",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90",
        outline:
          "border-2 border-input bg-background hover:border-primary hover:bg-primary/5 hover:text-primary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-muted",
        ghost: "hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        accent:
          "bg-accent text-accent-foreground shadow-soft hover:bg-accent/90 hover:shadow-glow-orange",
        royal:
          "bg-royal text-royal-foreground shadow-soft hover:bg-royal/90 hover:shadow-glow-blue",
        gradient:
          "bg-brand-gradient text-white shadow-soft hover:shadow-glow",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-md px-3 text-sm",
        lg: "h-12 rounded-xl px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
