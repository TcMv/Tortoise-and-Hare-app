"use client";

import React from "react";
import PrivacyModal from "@/components/PrivacyModal";

export default function ClientPrivacyHost({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);

    // Listen for global event from your menu item
    React.useEffect(() => {
        const handler = () => setOpen(true);
        window.addEventListener("thw:open-privacy", handler);
        return () => window.removeEventListener("thw:open-privacy", handler);
    }, []);

    return (
        <>
            {children}
            <PrivacyModal
                open={open}
                onClose={() => setOpen(false)}
                learnMoreHref="https://tortoiseandharewellness.com/privacy"
            />
        </>
    );
}
