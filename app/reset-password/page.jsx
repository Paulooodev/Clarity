'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPassword() {
    const router = useRouter();
    const [supabase] = useState(() => createClient());
    const [ready, setReady] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false)

    // Clicking the email link signs the user into a special short-lived
    // "recovery" session. We wait for it to land before showing the form —
    // otherwise updateUser has no session to act on.

    useEffect(() => {
        // Listens for authentication events
        const { data: sub } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
        });

        // Async/await function that checks if the user is already logged in
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setReady(true);
            }    
        }
        checkSession();
        // Clean up the listener when the component unmounts
        return () => sub.subscription.unsubscribe();
    }, [supabase])

    async function updatePassword() {
        // Clears any previous error messages from the screen
        setError(null);

        // Send the new password to Supabase and wait for the response
        const { error } = await supabase.auth.updateUser({ password });

        // If Supabase rejects it, display the error and stop the function
        if (error) return setError(error.message);

        // If successful, update the UI to show a success message
        setDone(true);

        // Wait 1.5 seconds so the user can read the success message, 
        // then redirect them to the homepage and refresh the router state.
        setTimeout(() => {
            router.push('/');
            router.refresh();
        }, 1500)
    }

    return (
        <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5">
            <div className="card ledger p-8">
                {done ? (
                    <>
                     <h1 className="text-2xl">Password updated</h1>
                     <p className="mt-2 text-[15px] text-muted">Signing you in…</p>
                    </>
                ) : !ready ? (
                    <>
                      <h1 className="text-2xl">Opening your reset link…</h1>
                      <p className="mt-2 text-[15px] text-muted">
                        If this doesn&apos;t clear in a moment, the link may have expired. Please
                            request a new one from the sign-in page.  
                      </p>  
                    </>
                ) : (
                    <>
                      <h1 className="text-2xl">Set a new password</h1>
                      <label className="mt-6 block">
                        <span className="font-medium text-muted text-[13px]">New Password</span>
                        <input 
                            type="password" 
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key !== 'Enter') return;
                                if (password.length < 8) return;
                                updatePassword();
                            }}
                            className="mt-1.5 text-[15px] bg-paper/60 focus:border-indigo focus:outline-none w-full rounded-lg border border-rule py-2 5"
                        />
                        <span className="mt-1 block text-[13px] text-faint">At least 8 characters.</span>
                      </label>

                      {error && (
                        <p className="mt-3 rounded-lg bg-verdict-flawed/10 px-3 py-2 text-[13px] text-verdict-flawed">
                            {error}
                        </p>
                      )}
                      <button
                        onClick={updatePassword}
                        disabled={password.length < 8}
                        className="mt-4 w-full rounded-lg bg-ink py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-indigo disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Update password
                      </button>
                    </>
                )}
            </div>
        </div>
    )
}