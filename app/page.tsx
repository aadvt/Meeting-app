'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, BarChart3, Users } from 'lucide-react';

function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if already authenticated
    const auth = localStorage.getItem('meridian_auth');
    if (auth && !searchParams.get('logout')) {
      router.push('/dashboard');
    }
  }, [router, searchParams]);

  const handleNavigate = () => {
    router.push('/login');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const features = [
    {
      icon: Zap,
      title: 'Real-time Intelligence',
      description: 'Capture decisions and insights instantly as they happen',
    },
    {
      icon: BarChart3,
      title: 'Visual Analytics',
      description: 'Transform meetings into actionable intelligence with graphs',
    },
    {
      icon: Users,
      title: 'Team Synchronization',
      description: 'Keep everyone aligned with live meeting insights',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {/* Gradient orbs background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 left-10 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-4xl px-6 text-center"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">
            <span className="gradient-text">Meridian</span>
          </h1>
          <p className="text-xl text-white/70">Meeting Intelligence Platform</p>
        </motion.div>

        {/* Headline */}
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Transform Meetings Into <br />
            <span className="gradient-text">Actionable Intelligence</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Capture decisions, track action items, and visualize knowledge graphs in real-time.
            Keep your organization aligned and moving forward.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div variants={itemVariants} className="mb-16">
          <button
            onClick={handleNavigate}
            className="group glass-glow px-8 py-3 text-white font-semibold text-lg inline-flex items-center gap-3 hover:scale-105 transition-transform"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-interactive p-6"
              >
                <Icon className="w-8 h-8 text-cyan-400 mb-3 mx-auto" />
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 text-white/40 text-sm"
      >
        <p>© 2024 Meridian. All rights reserved.</p>
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LandingPageContent />
    </Suspense>
  );
}
