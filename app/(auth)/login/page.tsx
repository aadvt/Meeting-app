'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogIn, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    // Set mock session
    localStorage.setItem('meridian_auth', JSON.stringify({ loggedIn: true, user: 'Demo User' }));
    router.push('/dashboard');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 150, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 150, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15"
        />
      </div>

      {/* Login Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/60">Enter Meridian to continue</p>
        </motion.div>

        {/* Glass Card */}
        <motion.div variants={itemVariants} className="glass-lg p-8 mb-6">
          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email
              </label>
              <input
                type="email"
                defaultValue="demo@meridian.ai"
                readOnly
                className="glass-input w-full"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Password
              </label>
              <input
                type="password"
                defaultValue="demo-password"
                readOnly
                className="glass-input w-full"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Remember me</span>
              </label>
              <a href="#" className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className="glass-glow group w-full py-3 text-white font-semibold text-lg overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="flex items-center justify-center gap-2 relative z-10">
                <LogIn className="w-5 h-5" />
                Sign In
              </div>
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center text-white/60 text-sm">
          <p>Demo credentials - just click Sign In</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
