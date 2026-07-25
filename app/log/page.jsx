"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";

// ─── The three domains, matching the CHECK constraint in schema.sql 
// If I add one here, I must also alter the constraint in Postgres or the
// insert will be rejected. These two places needs to be in sync.
const DOMAINS = [
  { id: 'trade', label: 'Trade' },
  { id: 'career', label: 'Career' },
  { id: 'sport', label: 'Sport' },
  { id: 'life', label: 'Life' },
];

// ─── The four prompts 
// Order matters. Decision → why → invalidation → feeling walks users from the
// easy part to the uncomfortable part. 
const PROMPTS = [
    {
        key: 'decision',
        label: 'What am i about to do?',
        placeholder: 'The call plainly.',
        row: 2,
        required: true,
    },
    {
        key: 'why',
        label: "Why ? What's the thesis?",
        placeholder: 'The actual reason, not the vibe.',
        row: 3,
        required: true,
    },
    {
        key: 'invalidation',
        label: "What would prove me wrong",
        placeholder: 'The line that says "this thesis is dead."',
        row: 2,
        required: false,
    },
];


// Named states rather than free-text box
// So as to group and categorize patterns properly when user is making a decision.
const FEELINGS = ['Calm', 'Rushed', 'Confident', 'Anxious', 'Bored', 'Tilted'];

// The states where you're most likely to act badly. Used only to show a
// gentle prompt
const HOT_STATES = ['Rushed', 'Anxious', 'Bored', 'Tilted'];

export default function LogPage(){
    const router = useRouter();

  // useState(() => ...) with a function means createClient runs ONCE on mount,
  // not on every re-render. Without the arrow you'd build a new client on
  // every keystroke.
  const [supabase] = useState(() => createClient());

    // One object for the whole draft rather than five useStates
    const [draft, setDraft] = useState({
        domain: 'trade',
        decision: '',
        why: '',
        invalidation: '',
        feeling: '',
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const update = (key, value) => setDraft((d) => ({ ...d, [key]: value }))

  // Only the first two prompts are mandatory. A decision without a stated
  // reason is exactly the thing this app exists to catch, so "why" is required
  // even though everything else is optional.
  const canSave = draft.decision.trim() && draft.why.trim() && !saving;
  const isHot = HOT_STATES.includes(draft.feeling);

  async function save() {
    if(!canSave) return;
    setSaving(true);
    setError(null);

    // Insert to supabase and talks to entries table
    const { error } = await supabase.from('entries').insert({
        domain: draft.domain,
        decision: draft.decision.trim(),
        why: draft.why.trim(),
        invalidation: draft.invalidation.trim() || null,
        feeling: draft.feeling || null,
    })
    setSaving(false);

    if(error) {
        setError(error.message);
        return;
    }

    // push() navigates; refresh() re-runs server components so the Today page
    // re-queries and your new entry is actually there when you land.
    router.push('/');
    router.refresh();
  }

  return (
    <div className="max-w-xl">
        <header className="mb-8">
            <h1 className="text-2xl">Log a decision</h1>
            <p className="mt-2 text-muted text-[15px]">
              Write it before you act. You&apos;re not predicting the outcome — you&apos;re
              recording your reasoning so you can judge it fairly later.  
            </p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="card ledger p-6"
        >
           {/* Domain picker */} 
           <div className="mb-6 flex gap-1 5">
            {DOMAINS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => update('domain', d.id)}
                  aria-pressed={draft.domain === d.id}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    draft.domain === d.id
                        ? 'bg-indigo text-paper'
                        : 'bg-ink/[0.05] text-muted hover:bg-ink/10'
                  }`}
                >
                    {d.label}
                </button>
            ))}
           </div>

            {/* The written prompts */}
            <div className="space-y-5">
                {PROMPTS.map((p) => (
                   <label key={p.key} className="block"> 
                        <span className="text-[15px] font-medium">
                            {p.label}
                            {!p.required && (
                                <span className="ml-2 text-[13px] font-normal text-faint">optional</span>
                            )}
                        </span>
                        <textarea 
                            rows={p.row}
                            value={draft[p.key]}
                            onChange={(e) => update(p.key, e.target.value)}
                            placeholder={p.placeholder}
                            className="mt-1.5 w-full resize-none rounded-lg border border-rule bg-paper/60 px-3 py-2 text-[15px] placeholder:text-faint focus:border-indigo focus:outline-none"
                        />
                   </label> 
                ))}

                {/* Feeling */}
                <div>
                    <span className=" text-[15px]font-medium">
                       How do I feel right now? 
                    </span>
                    <p className="mt-0 5 text-[13px] text-faint">Nobody sees this. Inaccurate here makes the whole record worthless.</p>
                    <div className="mt-2 felx flex-wrap gap-1 5">
                        {FEELINGS.map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => update('feeling', draft.feeling === f ? '' : f)}
                            aria-pressed={draft.feeling === f}
                            className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                                draft.feeling === f
                                    ? 'bg-ink text-paper'
                                    : 'bg-ink/[0.05] text-muted hover:bg-ink/10'
                            }`}
                            >
                                {f}
                            </button>  
                        ))}
                    </div>
                </div>

                {isHot && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"  
                    > 
                        <p className="rounded-lg border border-rule bg-ink/[0.03] px-3 py-2.5 text-[13px] text-muted">
                          Noted — no judgement. One question before you save: would you
                          still make this call in an hour?  
                        </p>
                    </motion.div>
                )}

                {error && (
                    <p className="rounded-lg bg-verdict-flawed/10 px-3 py-2 text-[13px] text-verdict-flawed">
                        {error}
                    </p>
                )}

                <button
                  onClick={save}
                  disabled={!canSave}
                  className="w-full rounded-lg bg-ink py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-indigo disabled:cursor-not-allowed disabled:opacity-40"  
                >
                    {saving ? 'Saving…' : 'Log it'}
                </button>
            </div>
        </motion.div>
    </div>
  )
}