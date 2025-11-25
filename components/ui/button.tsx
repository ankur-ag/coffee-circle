import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";
    size?: "default" | "sm" | "lg" | "icon";
    isLoading?: boolean;
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", isLoading, asChild = false, children, ...props }, ref) => {
        const buttonClasses = cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            {
                "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
                "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
                "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
                "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
                "text-primary underline-offset-4 hover:underline": variant === "link",
                "bg-red-500 text-white hover:bg-red-600": variant === "destructive",
                "h-10 px-4 py-2": size === "default",
                "h-9 rounded-full px-3": size === "sm",
                "h-11 rounded-full px-8": size === "lg",
                "h-10 w-10": size === "icon",
            },
            className
        );

        if (asChild) {
            return (
                <Slot className={buttonClasses} ref={ref} {...props}>
                    {children}
                </Slot>
            );
        }

        return (
            <button
                ref={ref}
                disabled={isLoading || props.disabled}
                className={buttonClasses}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button };
