"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { motion } from 'motion/react'

export default function LoginPage() {
    return (
        <Suspense 
            fallback={<LoginSkeleton />}
        >
            <LoginForm />
        </Suspense>
    )
}

// Google's four-colour mark as an inline SVG. Brand rules say don't tint it,
// so this keeps the official colours rather than using a monochrome icon.
function GoogleIcon() {
    return (
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
        </svg>
    );
}

function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const supabase = createClient();

    // The callback route redirects here with ?error=auth when the email link
    // fails (expired, already used, or opened in a different browser).
    // Without this, the user gets bounced back to a blank form with no idea why.
    const callbackFailed = params.get('error') === 'auth';


    const [mode, setMode] = useState('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(null);
    const [sent, setSent] = useState(false);

    async function submit() {
        setPending(true);
        setError(null);

        if(mode === 'signup') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: `${location.origin}/auth/callback` }
            });
            setPending(false);
            if (error) return setError(error.message);
            setSent(true);
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setPending(false);
        if(error) return setError(error.message);

        // When credentials are verified, if a redirected URL 
        // Such as /dashboard exists -- it pushes the user there
        // If not, it defaults to home page.
        router.push(params.get('next') ?? '/');
        // Page rebuild with the authenticated step
        router.refresh();
    }


    async function signInWithGoogle() {
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Where Google sends the user back to AFTER Supabase has
                // finished with them. Must be in your Supabase redirect
                // allowlist (Authentication → URL Configuration). 
                redirectTo: `${location.origin}/auth/callback`,
            }
        })
        if(error) setError(error.message);
    }

    if(sent) {
        return (
            <Shell>
                <h1 className="text-2xl">Check your email</h1>
                <p className="mt-2 text-muted text-[15px]">
                    We sent a confirmation link to {' '}
                    <span className="text-ink font-medium">{email}</span>
                </p>
            </Shell>
        );
    }

    return (
        <Shell>
            <h1 className="text-2xl">
                {mode === 'signin' ? 'Welcome back' : 'Start your record'}
            </h1>
            <p className="mt-2 text-muted text-[15px]">
                {mode === 'signin'
                    ? 'Pick up where you left'
                    :  'Your entries are private to you. Nobody else can read them.'
                }
            </p>

            <div className="mt-8 space-y-4">
                {callbackFailed && (
                    <p className="rounded-lg bg-verdict-flawed/10 px-3 py-2 text-[13px] text-verdict-flawed">
                    That confirmation link didn&apos;t work — it may have expired or already
                    been used. Try signing in, or sign up again to get a new one.
                    </p>
                )}
                <label className="block">
                  <span className="text-[13px] font-medium text-muted">Email</span>
                  <input 
                    type="email" 
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                    className="w-full mt-1.5 rounded-lg border border-rule bg-paper/60 px-3 py-2.5 text-[15px] focus:border-indigo focus:outline-none" 
                />  
                </label>
                <label className="block">
                  <span className="text-[13px] font-medium text-muted">Password</span>
                  <input 
                    type="password" 
                    autoComplete={mode === "signin" ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                    className="w-full mt-1.5 rounded-lg border border-rule bg-paper/60 px-3 py-2.5 text-[15px] focus:border-indigo focus:outline-none" 
                /> 
                    {mode === 'signup' && (
                        <span className="mt-1 block text-[13px] text-faint">At least 8 characters.</span>
                    )} 
                </label>
                    {error && (
                        <p className="rounded-lg bg-verdict-flawed/10 px-3 py-2 text-[13px] text-verdict-flawed">
                            {error}
                        </p>
                    )}

                    <button
                        onClick={signInWithGoogle}
                    className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-rule bg-card py-2.5 text-[15px] font-medium transition-colors hover:border-indigo/40"
                    >
                        <GoogleIcon />
                        Continue with Google
                    </button>


                    <div className="flex items-center gap-3" aria-hidden="true">
                        <span className="h-px flex-1 bg-rule" />
                        <span className="text-[13px] text-faint">or</span>
                        <span className="h-px flex-1 bg-rule" />
                    </div>

                    <button
                        onClick={submit}
                        disabled={pending || !email || password.length < 8}
                        className="w-full rounded-lg bg-ink py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-indigo disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {pending  ? 'One moment...' : mode === 'signin' ? 'Sign in' : 'Create account' }
                    </button>
            </div>

            <p className="mt-6 text-muted text-[13px]">
               {mode === 'signin' ? "Don't have an account?" : 'Already have one?' }{' '}     
               <button
                onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError(null);
                }}
                className="font-medium text-indigo underline underline-offset-4"
               >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
               </button>
            </p>
        </Shell>
    );
}

function Shell({ children }) {
    return (
        <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-5">
            <motion.div 
                className="card ledger p-8"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                {children}
            </motion.div>
        </div>
    );
}

function LoginSkeleton() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm items-center justify-center px-5">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-rule border-t-indigo"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}