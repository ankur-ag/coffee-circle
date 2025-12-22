"use client";

import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface ScrollToSectionProps {
    href: string;
    children: ReactNode;
    variant?: "default" | "outline" | "ghost" | "destructive" | "link" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
}

export function ScrollToSection({ href, children, variant, size, className }: ScrollToSectionProps) {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        
        // Remove the # from href to get the ID
        const targetId = href.replace("#", "");
        const element = document.getElementById(targetId);
        
        if (element) {
            // Get header height (64px = 4rem)
            const headerHeight = 64;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        } else {
            // Fallback: try querySelector
            const fallbackElement = document.querySelector(href);
            if (fallbackElement) {
                const elementPosition = fallbackElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - 64;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            className={className}
            onClick={handleClick}
        >
            {children}
        </Button>
    );
}
