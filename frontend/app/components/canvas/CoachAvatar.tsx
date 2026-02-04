'use client';

import { motion } from 'framer-motion';

export type CoachAvatarState = 'idle' | 'thinking' | 'happy' | 'confused';

type CoachAvatarProps = {
  state: CoachAvatarState;
};

const stateVariants = {
  idle: { rotate: 0, y: 0 },
  thinking: { rotate: -3, y: -4 },
  happy: { rotate: 4, y: -8 },
  confused: { rotate: -6, y: 2 },
};

export function CoachAvatar({ state }: CoachAvatarProps) {
  return (
    <motion.div
      className="relative h-48 w-48"
      animate={stateVariants[state]}
      transition={{ type: 'spring', stiffness: 120, damping: 12 }}
    >
      <div className="absolute inset-0 rounded-[42%] bg-gradient-to-br from-amber-100 via-white to-amber-200 shadow-xl" />
      <motion.div
        className="absolute left-1/2 top-1/2 h-32 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-gray-800 bg-white"
        animate={{
          scale: state === 'thinking' ? 1.02 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        className="absolute left-[38%] top-[38%] h-6 w-6 rounded-full border-4 border-gray-800 bg-amber-300"
        animate={{
          x: state === 'confused' ? -2 : 0,
          y: state === 'happy' ? -2 : 0,
        }}
      />
      <motion.div
        className="absolute left-[54%] top-[44%] h-4 w-4 rounded-full border-4 border-gray-800 bg-amber-200"
        animate={{
          x: state === 'confused' ? 2 : 0,
          y: state === 'thinking' ? 2 : 0,
        }}
      />
      <motion.div
        className="absolute left-[45%] top-[64%] h-2 w-10 rounded-full bg-gray-800"
        animate={{
          scaleX: state === 'happy' ? 1.1 : 0.9,
          rotate: state === 'confused' ? -8 : 0,
        }}
      />
      <div className="absolute -bottom-4 left-1/2 h-10 w-40 -translate-x-1/2 rounded-full bg-amber-200/60 blur-xl" />
    </motion.div>
  );
}
