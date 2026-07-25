'use client';

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();
        // Calls getSession() to check if the user is now logged in.
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession() 
                if(data.session) {
                    // if login is successful
                    // Check for ?next in the parameter
                    const next = new URLSearchParams(window.location.search).get('next');
                    // if it exists, go there or go home('/')
                    router.replace(next ?? '/')
                    // forces server components to re-fetch data with the new session.
                    router.refresh();
                } else {
                    // redirect back to login with an error.
                    router.replace('/login?error=auth');
                }
            }
            checkSession();
    }, [router]);

    // Shows a small loading spinner while the authentication check is happening (usually less than 1 second).
    return (
        <div className="flex items-center min-h-[60vh] justify-center">
            <div
                className="h-6 w-6 animate-spin rounded-full border-2 border-rule border-t-indigo"
                role="status"
                aria_label="Signing you in"
            />
        </div>
    )
}

