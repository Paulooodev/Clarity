'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="card ledger max-w-lg p-6 py-16"
    >
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
        className="mt-6 inline-block rounded-lg bg-ink px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-indigo"
      >
        Get Started
      </Link>
    </motion.div>
  );
}