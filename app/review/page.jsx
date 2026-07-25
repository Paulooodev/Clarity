'use client';

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from "react";

export default function ReviewPage() {
    const [supabase] = useState(() => createClient());
    const [entries , setEntries] = useState([]);
    const [loading , setLoading] = useState(true);

    useEffect(() => {
       // .is('reviewed_at', null) is how you ask Postgres for NULL —
        // .eq(..., null) does NOT work. Only unreviewed decisions belong here.
        supabase
            .from('entries')
            .select('*')
            .is('reviewed_at', null)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
                setEntries(data ?? []);
                setLoading(false);
            });        
    }, [supabase]);

    // Drop the entry from local state once saved. Combined with AnimatePresence
    // below, the card animates out instead of vanishing.
    const remove = (id) => setEntries((list) => list.filter((e) => e.id !== id));

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-2xl">Review</h1>
                <p className="mt-2 text-[15px] text-muted">
                    Judge the thinking, not the result. These are separate questions and
                    keeping them separate is the entire point.
                </p>
            </header>

            {loading && <p className="text-[15px] text-faint">Loading…</p>}
            {!loading && entries.length === 0 && (
                <p className="text-[15px] text-faint">
                    Nothing to review. Log a decision, act on it, then come back.
                </p>
            )}

            <ul className="space-y-3">
               <AnimatePresence initial={false}>
                    {entries.map((entry) => (
                        <motion.li
                            key={entry.id}
                            layout
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            {/* To be looked at later */}
                          <ReviewCard entry={entry} supabase={supabase} onDone={remove} />  
                        </motion.li>
                    ))}
                </AnimatePresence> 
            </ul>
        </div>
    )
}

function ReviewCard({ entry, supabase, onDone }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [outcome, setOutcome] = useState('');
    const [sound, setSound] = useState(null);
    const [worked, setWorked] = useState(null);
    const [gotRight, setGotRight] = useState('');
    const [missed, setMissed] = useState('');

    // Both verdicts required — they're the two axes of the matrix, and one
    // without the other tells you nothing.
    const canSave = sound && worked !== null && !saving;

    async function save() {
        if (!canSave) return;
        setSaving(true);

        // Update the existing entry in the database
        // object destructuring, while taking note of the errors when the entries are being updated
        // Loading spinner shows so as not to save the action while the update process is going on
        // any error stored in the object i think, as a result of the updates going on, is displayed
        // callback fn 'onDone' 
        const { error } = await supabase
            .from('entries')
            .update({
                outcome: outcome.trim() || null,
                sound,
                worked,
                got_right: gotRight.trim() || null,
                missed: missed.trim() || null,
                reviewed_at: new Date().toISOString()
            })
            // Update only the specific entry
            .eq('id', entry.id);
        // Hide loading state
        setSaving(false);
        // Show error to user
        if (error) return alert(error.message);

        // Notify parent component that review is complete
        onDone(entry.id);
        // Refresh the current page to show updated data
        router.refresh();
    }

    return (
        <article className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg">{entry.decision}</h2> 
              <p className="mt-1 text-[15px] text-muted">{entry.why}</p> 
            </div>
            <span className="shrink-0 rounded bg-ink/[0.05] px-2 py-0 5 text-[13px] text-muted">{entry.domain}</span>
          </div>  

          {entry.feeling && (
            <p className="mt-3 text-[13px] text-faint">State going in: <span className="text-muted">{entry.feeling}</span></p>
          )}

          {!open ? (
            <button
                onClick={() => setOpen(true)} 
                className="mt-4 font-medium text-indigo text-[15px]"
            >
                Review this →
            </button>
          ) : (
            <div className="mt-5 space-y-4 border-t border-rule pt-5">
                <label className="block">
                   <span className="text-[15px] font-medium">What actually happened?</span>
                   <textarea 
                      placeholder="Just the facts." 
                      className="mt-1.5 w-full resize-none rounded-lg border border-rule bg-paper/60 px-3 py-2 text-[15px] placeholder:text-faint focus:border-indigo focus:outline-none"
                      rows={2}
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value)}
                    />
                </label>
                <Choice
                    label="Was the reasoning sound — independent of how it turned out?"
                    value={sound}
                    onChange={setSound}
                    options={[['yes', 'Yes'], ['mixed', 'Mixed'], ['no', 'No']]}
                />

                <Choice
                    label="Did it work out?"
                    value={worked}
                    onChange={setWorked}
                    options={[[true, 'Yes'], [false, 'No']]}
                /> 

                <label className="block">
                    <span className="text-[15px] font-medium">What did I get right?</span>
                    <input
                        value={gotRight} 
                        onChange={(e) => setGotRight(e.target.value)}
                        className="text-[15px] focus:border-indigo focus:outline-none bg-paper/60 mt-1 5 w-full rounded-lg border border-rule pc-3 py-2" 
                    />
                </label>

                <label className="block">
                   <span className="text-[15px] font-medium">What did I miss?</span>
                   <input
                      value={missed}
                      onChange={(e) => setMissed(e.target.value)}
                      placeholder="Without the whip. Just what to see next time."
                      className="mt-1.5 w-full rounded-lg border border-rule bg-paper/60 px-3 py-2 text-[15px] placeholder:text-faint focus:border-indigo focus:outline-none" 
                   /> 
                </label>

                <button
                   onClick={save}
                   disabled={!canSave}
                   className="w-full rounded-lg bg-ink py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-indigo disabled:cursor-not-allowed disabled:opacity-40"
                >
                    { saving ? 'Saving…' : 'Save review' }
                </button>
            </div>
          )}
        </article>
    );
}

function Choice ({ label, value, onChange, options }) {
    return (
        <div>
            <span className="text-[15px] font-medium">{label}</span>
              <div className="mt-1.5 flex gap-1.5">
                {options.map(([val, text]) => (
                    <button
                       key={String(val)}
                       type="button"
                       onClick={() => onChange(val)}
                       aria-pressed={value === val}
                       className={`flex-1 rounded-lg py-2 text-[15px] font-medium transition-colors ${
                            value === val
                                ? 'bg-ink text-paper'
                                : 'bg-ink/[0.05] text-muted hover:bg-ink/10'
                       }`}
                    >
                        {text}
                    </button>
                ))} 
              </div>
        </div>
    )
}