// src/app/auth/signup/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSubmitted(true)
  }

  return (
    <main className="landing">
      <section className="hero">
        <div className="overlay" />

        <div className="content">
          <div className="brand">
            <Image
              src="/images/logo.png"
              alt="Scorecast XI"
              width={443}
              height={319}
              className="logo"
              priority
              style={{ width: '100%', height: 'auto' }}
            />
            <p className="tagline">Predict the scores. Climb the table. Beat your mates.</p>
          </div>

          <div className="loginCard">
            {submitted ? (
              <>
                <h2>Check your email</h2>
                <p className="subtitle">
                  We sent a confirmation link to <strong>{email}</strong>.
                  Please confirm your email before logging in.
                </p>
                <p className="signupRow">
                  <Link href="/">Back to login</Link>
                </p>
              </>
            ) : (
              <>
                <h2>Sign Up</h2>
                <p className="subtitle">Create an account to start predicting.</p>

                <form onSubmit={handleSignup}>
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Choose a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  {error && <div className="error">{error}</div>}

                  <button type="submit" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </button>
                </form>

                <p className="signupRow">
                  Already have an account? <Link href="/">Login</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        .landing {
          min-height: 100vh;
          background: #06152f;
          color: white;
          overflow: hidden;
        }

        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          background:
            radial-gradient(circle at center, rgba(0, 132, 255, 0.5), transparent 35%),
            linear-gradient(135deg, rgba(2, 6, 23, 0.85) 0%, rgba(8, 47, 73, 0.85) 45%, rgba(15, 23, 42, 0.85) 100%),
            url('/images/hero.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 44px 44px;
          opacity: 0.25;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.35), transparent 30%),
            radial-gradient(circle at bottom right, rgba(250, 204, 21, 0.18), transparent 30%);
        }

        .content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1100px;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 40px;
          align-items: center;
        }

        .brand {
          text-align: left;
        }

        .brand .logo {
          width: 443px;
          max-width: 100%;
          height: auto;
          margin-bottom: 12px;
        }

        .brand .tagline {
          margin-top: 22px;
          max-width: 560px;
          font-size: 22px;
          line-height: 1.45;
          color: #dbeafe;
        }

        .loginCard {
          background: rgba(2, 6, 23, 0.78);
          border: 1px solid rgba(147, 197, 253, 0.35);
          border-radius: 24px;
          padding: 30px;
          box-shadow:
            0 25px 80px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(14px);
        }

        .loginCard h2 {
          margin: 0 0 8px;
          font-size: 32px;
        }

        .subtitle {
          margin: 0 0 24px;
          color: #bfdbfe;
          font-size: 15px;
        }

        .subtitle strong {
          color: #ffffff;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        label {
          font-size: 14px;
          font-weight: 700;
          color: #dbeafe;
        }

        input {
          width: 100%;
          border: 1px solid rgba(147, 197, 253, 0.35);
          border-radius: 14px;
          padding: 14px 15px;
          background: rgba(15, 23, 42, 0.95);
          color: white;
          font-size: 15px;
          outline: none;
        }

        input:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.22);
        }

        button {
          margin-top: 12px;
          border: none;
          border-radius: 16px;
          padding: 15px 18px;
          background: linear-gradient(135deg, #2563eb, #38bdf8);
          color: white;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 14px 30px rgba(37, 99, 235, 0.35);
        }

        button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .error {
          margin-top: 6px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(248, 113, 113, 0.45);
          color: #fecaca;
          font-size: 14px;
        }

        .signupRow {
          margin-top: 18px;
          text-align: center;
          font-size: 14px;
          color: #bfdbfe;
        }

        .signupRow a {
          color: #60a5fa;
          font-weight: 800;
          text-decoration: none;
        }

        .signupRow a:hover {
          text-decoration: underline;
        }

        @media (max-width: 850px) {
          .content {
            grid-template-columns: 1fr;
          }

          .brand {
            text-align: center;
          }

          .brand .logo {
            width: 220px;
            margin: 0 auto 12px;
          }

          .brand .tagline {
            font-size: 16px;
            margin-left: auto;
            margin-right: auto;
          }
        }

        @media (max-width: 480px) {
          .brand .logo {
            width: 160px;
          }

          .brand .tagline {
            font-size: 14px;
          }
        }
      `}</style>
    </main>
  )
}
