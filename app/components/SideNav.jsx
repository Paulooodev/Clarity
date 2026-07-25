"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

const NAV = [
    { href: '/', label: 'Today' },
    { href: '/review', label: 'Review' },
    { href: '/patterns', label: 'Pattern' },
];


// Shared by SideNav and MobileBar so the two can never disagree
// about whether you're signed in.

function useAuth() {
    const [supabase] = useState(() => createClient());

    // Stores logged in user details. Returns null if no user is logged in.
    const [user, setUser] = useState(null);
    // Check to see if user is authenticated through supabase
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Get the current user now
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
            setReady(true);
        });
        // Listen for any future changes
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            // If session exists, get session.user.
            // ?? -- if the left side is null/undefined, return the right side.
            setUser(session?.user ?? null);  
        });
        // Clean up the listeners
        return () => sub.subscription.unsubscribe();
    }, [supabase]);

     return { supabase, user, ready };
}

export default function SideNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { supabase, user, ready } = useAuth();

    async function signOut() {
        // Informs Supabase to securely end the user's session.
        await supabase.auth.signOut();
        router.push('/login')
        router.refresh();
    }

      if (pathname === '/login') return null;

      return (
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-rule px-6 py-10 md:flex">
            <Link href="/"className="text-lg font-medium">
                Clarity
            </Link>
            <p className="mt-1 text-[12px] text-faint">
                Think first. Review Honestly.
            </p>

            {user && (
                <nav className="mt-10 flex flex-col gap-0 5">
                    {NAV.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? 'page' : undefined}
                                className={`rounded px-3 py-2 text-[15px] transition-colors ${
                                    active 
                                        ? 'bg-indigo-wash fon-medium text-indigo'
                                        : 'text-muted hover:bg-ink/[0.04] hover:text-ink'
                                }`}
                            >
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            )}

            <div className="mt-auto">
                {!ready ? (
                    <div className="h-10 animate-pulse rounded-lg bg-ink/5" />
                ): user ? (
                    <>
                    <Link 
                        href="/log"
                        className="block rounded-lg bg-ink px-4 py-2 text-center text-[15px] font-medium text-paper transition-colors hover:bg-indigo"
                    >
                        Log a decision
                    </Link>
                    <div className="mt-4 border-t border-rule pt-4">
                        <p className="truncate text-[13px] text-faint" title={user.email ?? ''}>
                            {user.email}
                        </p>  
                        <button
                            onClick={signOut} 
                            className="mt-1 text-[13px] text-muted underline underline-offset-4 hover:text-ink"
                        >
                            Sign Out
                        </button>
                    </div>
                    </>
                ) : (
                    <Link 
                        href="/login"
                        className="block rounded-lg bg-ink px-4 py-2 text-center text-[15px] font-medium text-paper transition-colors hover:bg-indigo"
                    >
                        Sign in
                    </Link>
                )}
            </div>
        </aside>
      )
}


/* ─── Mobile top bar ─── hidden from md up */
export function MobileBar() {
    const pathname = usePathname();
    const router = useRouter();
    const { supabase, user, ready } = useAuth();

    async function signOut() {
        await supabase.auth.signOut()
        router.push('/login');
        router.refresh()
    }

    if (pathname === '/login') return null;

    return (
        // sticky + z-20 pins it while the page scrolls beneath.
       // bg-paper is essential or content shows through it. 
       <header className="sticky top-0 z-20 border-b border-rule bg-paper md:hidden">
          <div className="flex items-center justify-between px-5 py-3">
            <Link
               href='/'
               className='text-lg font-medium'
            >
                Clarity
            </Link>
            {ready && (user ? (
                <button className="text-[13px] text-muted underline underline-offset-4">Sign Out</button>
            ) : (
                <Link href='/login' className='text-[13px] font-medium text-indigo'>Sign in</Link>
            ))}
          </div>

          {user && (
            // overflow-x-auto: tabs scroll sideways instead of squashing.
            <nav className="flex gap-1 overflow-x-auto px-5 pb-2">
                {NAV.map((item) => (
                    <Link
                      href={item.href}
                      key={item.href}
                      aria-current={pathname === item.href ? 'page' : undefined}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] ${
                        pathname === item.href
                            ? "bg-indigo-wash font-medium text-indigo"
                            : 'text-muted'
                      }`}
                    >
                        {item.label}
                    </Link>
                ))}
                <Link
                  href='/log'
                  className="ml-auto shrink-0 rounded-full bg-ink px-3 py-1.5 text-[13px] font-medium text-paper"
                  >
                    + Log
                  </Link>
            </nav>
          )}
       </header>       
    )
}