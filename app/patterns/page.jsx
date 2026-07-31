import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';

const MIN_FOR_RATE = 5;

const FEELINGS = ['Calm', 'Confident', 'Rushed', 'Anxious', 'Bored', 'Tilted'];
const DOMAINS = [
  { id: 'trade', label: 'Trade' },
  { id: 'career', label: 'Career' },
  { id: 'sport', label: 'Sport' },
  { id: 'life', label: 'Life' },
]

export default async function Patterns() {
    const supabase = await createServerSupabase();

    const { 
        data: { user } 
    } = await supabase.auth.getUser();
    if(!user) return <p className="text-[15px] text-muted">Sign in to see your patterns.</p>;

    // Only reviewed entries can tell you anything — an unreviewed decision has
    // no verdict attached, so it contributes nothing here.
    const { data, error } = await supabase
        .from('entries')
        .select('*')
        .not('reviewed_at', 'is', null);
        
        if(error) {
            return (
                <p className="rounded-lg bg-verdict-flawed/10 px-3 py-2 text-[13px] text-verdict-flawed">
                    Couldn&apos;t load: {error.message}
                </p>
            )
        }

        const reviewed = data ?? [];

        return (
            <div>
                <header className="mb-8">
                    <h1 className="text-2xl">Patterns</h1>
                   <p className="mt-2 max-w-xl text-[15px] text-muted">
                        Built only from decisions you&apos;ve reviewed. Nothing here is advice —
                        it&apos;s your own record, counted back to you.
                  </p>
                </header>

                {reviewed.length === 0 ? (
                    <div className="card p-6">
                       <p className="text-[15px] text-muted">
                         Nothing to show yet. Patterns appear once you&apos;ve reviewed a few
                        decisions — the useful signal usually starts around fifteen or twenty.
                       </p>
                        <Link href="/log" className="mt-4 inline-block text-[15px] font-medium text-indigo">
                            Log a decision →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-10">
                       <Overview reviewed={reviewed} />
                       <Breakdown 
                           title="Reasoning by state going in"
                           blurb="The one worth watching. If your thinking holds up when calm but falls apart when rushed, that's not a character flaw — it's a scheduling problem, and it's fixable."
                           rows={FEELINGS.map((f) => ({
                            label: f,
                            entries: reviewed.filter((e) => e.feeling === f),
                           }))} 
                       /> 
                       <Breakdown 
                           title="Reasoning by domain"
                           blurb="Where your process is strongest — and where you're operating on feel."
                           rows={DOMAINS.map((d) => ({
                            label: d.label,
                            entries: reviewed.filter((e) => e.domain === d.id),
                           }))} 
                       /> 
                    </div>
                )}
            </div>
        )
}

/* ─── The headline number ──────────────────────────────────────────────────
   Process score = share of decisions where the REASONING was sound, ignoring
   outcomes entirely. */

function Overview({ reviewed }) {
    const sound = reviewed.filter((e) => e.sound === 'yes').length;
    const lucky = reviewed.filter((e) => e.sound !== 'yes' && e.worked === true).length;
    const enough = reviewed.length >= MIN_FOR_RATE;

    return (
        <section>
            <div className="grid gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-3">
              <Stat
                label="Reviewed"
                value={reviewed.length}
                note="Decisions you've closed the loop on."
              />  
              <Stat
                label="Process score"
                value={enough ? `${Math.round((sound / reviewed.length) * 100 )}%` : '-'}
                note={
                    enough
                       ? 'Reasoning you judged sound, outcomes ignored'
                       :  `Needs ${MIN_FOR_RATE - reviewed.length} more review${
                            MIN_FOR_RATE - reviewed.length === 1 ? '' : 's'
                       }.`
                }
              />
              <Stat
                label="Got away with it"
                value={lucky}
                note="Won despite flawed reasoning. The dangerous ones."
              />    
            </div>
        </section>
    )
}

function Stat({ label, value, note }) {
    return (
        <div className="p-5 bg-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{label}</p> 
            <p className="mt-1 text-3xl text-indigo">{value}</p>
            <p className="mt-1 text-[13px] text-muted">{note}</p>           
        </div>
    );
}

/*  A grouped breakdown 
   Same component for feelings and domains — both ask "how good was my
   reasoning inside this bucket?"
*/

function Breakdown({ title, blurb, rows }) {
    // New array that filters through the row array
    // Returns the rows that have more than one entry
    // Checks the Used array if it's empty and returns null
    const used = rows.filter((r) => r.entries.length > 0);
    if (used.length === 0) return null;

    return (
        <section>
            <h2 className="text-2xl">{title}</h2>
            <p className="text-muted text-[15px] mt-1 max-w-xl">{blurb}</p>

            <ul className="mt-4 space-y-2">
               {used.map((row) => {
                const total = row.entries.length;
                const sound = row.entries.filter((e) => e.sound === 'yes').length;
                const enough = total >= MIN_FOR_RATE;
                const pct = Math.round((sound / total) * 100);

                return (
                   <li key={row.label} className="card px-4 py-3">
                       <div className="flex items-baseline justify-between gap-4">
                          <span className="text-[15px] font-medium">{row.label}</span>
                          <span className="shrink-0 text-[13px] text-muted">
                            {enough ? `${pct}% sound` : `${sound} of ${total} sound`}
                          </span>
                       </div>

                      {enough && (
                        <div className="mt-2 h-1 5 overflow-hidden rounded-full bg-ink/[0.07]">
                           <div 
                              className="h-full rounded-full bg-indigo"
                              style={{ width: `${pct}%` }}
                           /> 
                        </div>
                      )} 
                   </li> 
                )
               })} 
            </ul>
        </section>
    )
}

