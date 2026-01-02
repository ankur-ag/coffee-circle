"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CafeImageProps extends Omit<ImageProps, "onError"> {
    fallbackSrc?: string;
}

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?q=80&w=1000&auto=format&fit=crop";

export function CafeImage({ src, alt, className, fallbackSrc = DEFAULT_FALLBACK, ...props }: CafeImageProps) {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    return (
        <Image
            {...props}
            src={hasError ? fallbackSrc : imgSrc}
            alt={alt}
            className={cn(className, hasError ? "opacity-90" : "")}
            onError={() => {
                setHasError(true);
            }}
        />
    );
}
