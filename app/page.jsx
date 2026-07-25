// app/page.jsx
import Link from 'next/link';
import { createServerSupabase } from 'lib/supabase/server';


const DOMAIN_LABEL = { trade: 'Trade', sport: 'Sport', life: 'Life' };

export default async function Today({ searchParams }) {
  const params = await searchParams;
  const justVerified = params?.verified === '1'
  // Server components can be async. 
  // Next waits for this before rendering.

  const supabase = await createServerSupabase();

  const { data: { user }, } = await supabase.auth.getUser();

  // Signed out
  if(!user) return <SignedOut />
  // No .eq('user_id', ...) needed. 
  // RLS (Row Level Security) automatically filters the results to only return 
  // rows belonging to the currently logged-in user. 
  const { data: entries, error } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false });

    if (error) {
      return (
        <p className="rounded-lg bg-verdict-flawed/10 px-3 py-2 text-[13px] text-verdict-flawed">
          Couldn&apos;t load your entries: {error.message}
        </p>
      );
    }

    const all = entries ?? [];

    // reviewed_at is the marker. An entry with a null reviewed_at is still open.
    const reviewed = all.filter((e) => e.reviewed_at);
    const awaiting = all.filter((e) => !e.reviewed_at);

  return (
    <div className="max-w-3xl">
      <div>
        {justVerified && (
          <div className="mb-6 rounded-lg border border-indigo/30 bg-indigo-wash px-4 py-3 text-[15px] text-indigo">
             Email verified — you&apos;re all set.
          </div>
        )}
      <header className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
          {new Date().toLocaleString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
        <h1 className="mt-2 text-3xl">What are you about to decide?</h1>
        <p className="mt-2 max-w-xl text-[17px] text-muted">
          Write it down before you act. The point isn&apos;t to be right — it&apos;s to
          know whether you were thinking clearly when you chose.
        </p>
        <Link
            href="/log"
            className="mt-6 inline-block rounded-lg bg-ink px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-indigo"
          >
            Log a decision
          </Link>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl">
          Process, not results
        </h2>
        <p className="mt-1 max-w-xl text-[15px] text-muted">
          Every reviewed decision lands in one of four boxes. Aim to spend more time
          in the top row — regardless of which column you land in.
        </p>
        <Matrix reviewed={reviewed} />
      </section>

      <section>
        <div className="flex items-baseline justify-between border-b border-rule pb-2">
          <h2 className="text-2xl">Awaiting your review</h2>
          <span className="text-faint text-[13px]">{awaiting.legth}</span>
        </div>

        {awaiting.length === 0 ? (
          // if no decisions wait
          <p className="py-8 text-[15px] text-faint">Nothing open. The next real decision is the first one.</p>
           ) : (
            // if there are decisions wait
          <ul className="mt-4 space-y-2">
            {awaiting.slice(0, 6).map((e) => (
              <li key={e.id}>
                <Link
                  href='/review' 
                  className="card flex items-center justify-between px-4 py-3 transition-colors hover:border-indigo/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px]">{e.decision}</p>
                    <p className="truncate text-[13px] text-faint">{e.why}</p>
                  </div>
                  <span className="ml-4 shrink-0 rounded bg-ink/[0.05] px-2 py-0.5 text-[13px] text-muted">
                    {DOMAIN_LABEL[e.domain] ?? e.domain}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
    </div>
  );
}

function Matrix({ reviewed }) {
  const quadrantOf = (e) => {
    const good = e.sound === 'yes';
    const won = e.worked === true;
    if (good && won) return 'earned';
    if (good && !won) return 'variance';
    if (!good && won) return 'lucky';
      return 'avoidable'
  };

  const counts = reviewed.reduce((acc, e) => {
    const q = quadrantOf(e);
    acc[q] = (acc[q] || 0) + 1;
    return acc;
  }, {});

  const cells = [
    { id: 'earned',    title: 'Earned',            axes: 'Sound · Worked',      note: 'Good call, good result. Repeat this.' },
    { id: 'lucky',     title: 'Got away with it',  axes: 'Flawed · Worked',     note: 'Bad call, good result. Do not learn from this.' },
    { id: 'variance',  title: 'Variance',          axes: 'Sound · Didn\'t',     note: 'Good call, bad result. Nothing to fix.' },
    { id: 'avoidable', title: 'Avoidable',         axes: 'Flawed · Didn\'t',    note: 'Bad call, bad result. This is the one to study.' },
  ];

  return (
    <div className="mt-6">
      <div className="flex">
        <div className="hidden w-8 items-center justify-center md:flex">
          <span className="-rotate-90 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
            Reasoning
          </span>
        </div>

        <div className="m-w-0 flex-1">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-2">
            {cells.map((cell) => (
              <div key={cell.id} className="ledger bg-card p-4 sm:p-5">
                {/* Visible only on mobile — replaces the axis labels. */}
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint sm:hidden">{cell.axes}</p>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-base sm:text-lg">{cell.title}</h3>
                  <span className="text-lg text-indigo">{counts[cell.id] ?? 0}</span>
                </div>
                <p className="mt-1 text-[13px] text-muted">{cell.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 flex justify-between px-1 sm:flex">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
              Worked out
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
              Didn&apos;t
            </span>
          </div>
        </div>
      </div>

      {reviewed.length === 0 && (
        <p className="mt-4 text-[13px] text-faint">
            Empty for now. Log a decision, then review it - it&apos;ll land in one of these four.
        </p>
      )}
    </div>
  );
}

// Shown to logged-out visitors. Your stand-in landing page until you build a
// real one — better than bouncing strangers straight to a login wall.
function SignedOut() {
  return (
    <div className="max-w-lg py-16">
      <h1 className="text-3xl">
        Think first. Review honestly.
      </h1>
      <p className="mt-3 text-[17px] text-muted">
        Clarity separates two things people constantly confuse: whether your reasoning
        was sound, and whether it worked out. Log a decision before you act. Judge the
        thinking afterwards, on its own terms.
      </p>
      <Link
        href="/login"
        className='mt-6 inline-block rounded-lg bg-ink px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-indigo'
        >
          Get Started
        </Link>
    </div>
  );
}

