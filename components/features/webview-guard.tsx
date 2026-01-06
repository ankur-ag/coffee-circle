"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info } from "lucide-react";

export function WebviewGuard() {
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);
    const [browserType, setBrowserType] = useState<"line" | "instagram" | "facebook" | "other" | null>(null);

    useEffect(() => {
        const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
        const isLine = /Line/i.test(ua);
        const isInstagram = /Instagram/i.test(ua);
        const isFacebook = /FBAN|FBAV/i.test(ua);

        // General in-app check (often includes 'wv' for Android/iOS webview)
        const isGenericWebview = /wv|WebView/i.test(ua) || (ua.includes("iPhone") && !ua.includes("Safari") && !ua.includes("CriOS"));

        if (isLine || isInstagram || isFacebook || isGenericWebview) {
            setIsInAppBrowser(true);
            if (isLine) setBrowserType("line");
            else if (isInstagram) setBrowserType("instagram");
            else if (isFacebook) setBrowserType("facebook");
            else setBrowserType("other");

            // For LINE, we can force-open external browser via query param
            if (isLine && !window.location.search.includes("openExternalBrowser=1")) {
                const url = new URL(window.location.href);
                url.searchParams.set("openExternalBrowser", "1");
                window.location.replace(url.toString());
            }
        }
    }, []);

    const handleOpenExternal = () => {
        const url = window.location.href;

        // Android Intent trick
        if (/Android/i.test(navigator.userAgent)) {
            const intentUrl = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
            window.location.href = intentUrl;
        } else {
            // For iOS, we can't easily force open Safari. 
            // We just have to show instructions.
            alert("Please tap the '...' menu (top right) and select 'Open in Safari' or 'Open in Browser'.");
        }
    };

    if (!isInAppBrowser) return null;

    // If it's LINE and we already redirected/reloading, don't show the UI yet or show a loading state
    if (browserType === "line" && window.location.search.includes("openExternalBrowser=1")) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background p-6 text-center animate-in fade-in duration-500">
            <div className="max-w-md space-y-8">
                <div className="flex justify-center">
                    <div className="rounded-full bg-primary/10 p-4">
                        <Info className="h-12 w-12 text-primary" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight">Open in Browser</h1>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        Google Sign-in is restricted within {browserType !== "other" ? browserType : "this app's"} browser for security reasons.
                    </p>
                    <p className="font-medium text-foreground">
                        Please open this page in Safari or Chrome to book your coffee meetup.
                    </p>
                </div>

                <div className="space-y-4 pt-4">
                    <Button
                        size="lg"
                        className="w-full h-14 text-lg font-semibold gap-2 shadow-lg hover:translate-y-[-2px] transition-all"
                        onClick={handleOpenExternal}
                    >
                        <ExternalLink className="h-5 w-5" />
                        Open in External Browser
                    </Button>

                    <div className="text-sm text-muted-foreground border-t border-border mt-8 pt-8">
                        <p className="mb-2 uppercase text-[10px] font-bold tracking-widest text-muted-foreground/60">Instructions</p>
                        <ul className="text-left space-y-2 list-none px-4">
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">1</span>
                                <span>Tap the <strong className="text-foreground">three dots (...)</strong> or <strong className="text-foreground">menu icon</strong></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">2</span>
                                <span>Select <strong className="text-foreground">"Open in Browser"</strong> or <strong className="text-foreground">"Open in Safari"</strong></span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
