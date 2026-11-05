import { useState, type FormEvent } from 'react'
import './WelcomeScreen.css'

type WelcomeScreenProps = {
  onContinue: (name: string) => void
}

function TeamIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="8" r="3.5" />
      <path d="M17 4.8a3.5 3.5 0 0 1 0 6.7M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35" />
    </svg>
  )
}

function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const [name, setName] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (trimmedName) onContinue(trimmedName)
  }

  return (
    <main className="welcome-screen">
      <header className="welcome-header">
        <span className="welcome-brand-mark" aria-hidden="true">
          M
        </span>
        <span className="welcome-brand-name">MealMate</span>
      </header>

      <section className="welcome-content">
        <div className="welcome-icon" aria-hidden="true">
          <TeamIcon />
        </div>
        <p className="welcome-eyebrow">Office lunch, made simple</p>
        <h1>Welcome to MealMate</h1>
        <p className="welcome-description">
          Tell us your name to see today’s lunch menu. No password needed.
        </p>

        <form className="welcome-form" onSubmit={handleSubmit}>
          <label htmlFor="welcome-name">Your name</label>
          <input
            autoComplete="name"
            id="welcome-name"
            name="name"
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Maya Chen"
            type="text"
            value={name}
          />
          <button disabled={!name.trim()} type="submit">
            <span>Continue to lunch</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </section>

      <footer className="welcome-footer">
        <span>For your office team only</span>
        <span className="welcome-owner">
          TARIVERDIYEV Murad, UID:3036345004
        </span>
      </footer>
    </main>
  )
}

export default WelcomeScreen
