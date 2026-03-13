'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { FormEvent, InputHTMLAttributes, ReactNode, useState } from 'react';

const DUMMY_EMAIL = 'demo@meridian.ai';
const DUMMY_PASSWORD = 'demo-password';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
}

const AppInput = ({ label, placeholder, icon, ...rest }: InputProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="relative w-full min-w-[200px]">
      {label && <label className="mb-2 block text-sm">{label}</label>}
      <div className="relative w-full">
        <input
          className="peer relative z-10 h-13 w-full rounded-md border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-4 font-thin outline-none drop-shadow-sm transition-all duration-200 ease-in-out placeholder:font-medium focus:bg-[var(--color-bg)]"
          placeholder={placeholder}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          {...rest}
        />
        {isHovering && (
          <>
            <div
              className="pointer-events-none absolute left-0 right-0 top-0 z-20 h-[2px] overflow-hidden rounded-t-md"
              style={{
                background: `radial-gradient(30px circle at ${mousePosition.x}px 0px, var(--color-text-primary) 0%, transparent 70%)`,
              }}
            />
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-[2px] overflow-hidden rounded-b-md"
              style={{
                background: `radial-gradient(30px circle at ${mousePosition.x}px 2px, var(--color-text-primary) 0%, transparent 70%)`,
              }}
            />
          </>
        )}
        {icon && <div className="absolute right-3 top-1/2 z-20 -translate-y-1/2">{icon}</div>}
      </div>
    </div>
  );
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DUMMY_EMAIL);
  const [password, setPassword] = useState(DUMMY_PASSWORD);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const leftSection = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top,
    });
  };

  const socialIcons: { icon: ReactNode; href: string; fillClass: string }[] = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"
          />
        </svg>
      ),
      href: '#',
      fillClass: 'bg-[var(--color-bg)]',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M6.94 5a2 2 0 1 1-4-.002a2 2 0 0 1 4 .002M7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z"
          />
        </svg>
      ),
      href: '#',
      fillClass: 'bg-[var(--color-bg)]',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396z"
          />
        </svg>
      ),
      href: '#',
      fillClass: 'bg-[var(--color-bg)]',
    },
  ];

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      if (email.trim() === DUMMY_EMAIL && password === DUMMY_PASSWORD) {
        localStorage.setItem('meridian_auth', JSON.stringify({ loggedIn: true, user: 'Demo User' }));
        router.push('/dashboard');
        return;
      }

      setError(`Use ${DUMMY_EMAIL} / ${DUMMY_PASSWORD}`);
      setIsSubmitting(false);
    }, 350);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--color-bg)] p-4">
      <div className="card relative w-full max-w-6xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 backdrop-blur">
        <Link href="/" className="absolute left-6 top-6 z-30 inline-flex items-center gap-2 text-sm text-[var(--color-text-primary)]/80 hover:text-[var(--color-text-primary)]">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="flex min-h-[640px] w-full justify-between">
          <div
            className="relative h-full w-full overflow-hidden px-4 lg:w-1/2 lg:px-16"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div
              className={`pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-gradient-to-r from-purple-300/30 via-blue-300/30 to-pink-300/30 blur-3xl transition-opacity duration-200 ${
                isHovering ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
                transition: 'transform 0.1s ease-out',
              }}
            />

            <div className="relative z-10 h-full">
              <form className="grid h-full gap-2 py-14 text-center md:py-20" onSubmit={handleSubmit}>
                <div className="mb-2 grid gap-4 md:gap-6">
                  <h1 className="text-3xl font-extrabold md:text-4xl">Sign in to Meridian</h1>
                  <div className="social-container">
                    <div className="flex items-center justify-center">
                      <ul className="flex gap-3 md:gap-4">
                        {socialIcons.map((social, index) => (
                          <li key={index} className="list-none">
                            <a
                              href={social.href}
                              className="group relative z-[1] flex h-[2.5rem] w-[2.5rem] items-center justify-center overflow-hidden rounded-full border-2 border-[var(--color-text-primary)] bg-[var(--color-bg-2)] md:h-[3rem] md:w-[3rem]"
                            >
                              <div
                                className={`absolute inset-0 h-full w-full ${social.fillClass} origin-bottom scale-y-0 transition-transform duration-500 ease-in-out group-hover:scale-y-100`}
                              />
                              <span className="z-[2] text-[1.5rem] text-[hsl(203,92%,8%)] transition-all duration-500 ease-in-out group-hover:text-[var(--color-text-primary)]">
                                {social.icon}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <span className="text-sm">or use your demo account</span>
                </div>

                <div className="grid items-center gap-4">
                  <AppInput
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <AppInput
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <a href="#" className="text-sm font-light md:text-md">
                  Forgot your password?
                </a>

                {error ? <p className="text-sm text-red-400">{error}</p> : null}

                <div className="flex items-center justify-center gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group/button relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-md bg-[var(--color-border)] px-4 py-1.5 text-xs font-normal text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="px-2 py-1 text-sm">{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                    <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                      <div className="relative h-full w-8 bg-white/20" />
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="right hidden h-full w-1/2 overflow-hidden lg:block">
            <div className="relative h-full w-full">
              <Image
                src="/placeholder.jpg"
                width={1200}
                height={1200}
                priority
                alt="Login visual placeholder"
                className="h-full w-full object-cover opacity-35"
              />
              <div className="absolute inset-0 flex items-end justify-center bg-black/20 pb-8">
                <p className="rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/70">
                  Image Placeholder
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
