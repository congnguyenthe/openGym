import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { login } from '../lib/api.js'
import { t } from '../lib/i18n.js'
import { DEMO, REPO } from '../lib/demo.js'
import { useState, useRef, useEffect } from 'react'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'

// Username + password for the instance's single owner account (set via ADMIN_USERNAME /
// ADMIN_PASSWORD on the server). Shared by the sign-in screen and Settings.
export function SignInForm({ onDone }) {
  const { setUser, pullState } = useStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)
  useEffect(() => { setTimeout(() => ref.current?.focus(), 250) }, [])
  const go = async e => {
    e.preventDefault()
    if (busy) return
    if (!username.trim() || !password) { useUI.getState().toast(t('Enter your username and password')); return }
    setBusy(true)
    try {
      const u = await login(username.trim(), password)
      setUser(u); onDone?.()
      await pullState()
      useUI.getState().toast(t('Welcome back, {0}', u.name))
    } catch (e) { useUI.getState().toast(e.message || t('Sign-in failed')) }
    finally { setBusy(false) }
  }
  return <form onSubmit={go}>
    <input ref={ref} className="input" placeholder={t('Username')} autoComplete="username" autoCapitalize="none"
      maxLength={60} value={username} onChange={e => setUsername(e.target.value)} />
    <div style={{ height: 10 }} />
    <input className="input" type="password" placeholder={t('Password')} autoComplete="current-password"
      value={password} onChange={e => setPassword(e.target.value)} />
    <div style={{ height: 12 }} />
    <Button variant="primary" icon="person" type="submit" disabled={busy}>{t('Sign in')}</Button>
  </form>
}

export default function Login() {
  const { setGuest } = useStore()
  const head = <>
    <div style={{ fontSize: 54, display: 'flex', justifyContent: 'center', color: 'var(--acc)' }}><Icon name="dumbbell" /></div>
    <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.028em', margin: '10px 0 4px' }}>openGym</h1>
  </>
  const wrap = { display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '78vh', textAlign: 'center' }

  // Demo build: no backend to sign in against — the only way in is the local guest profile.
  if (DEMO) return (
    <div className="narrow" style={wrap}>
      {head}
      <div className="muted" style={{ marginBottom: 30 }}>{t('Live demo — everything stays in this browser.')}</div>
      <Button variant="primary" icon="sparkles" onClick={() => setGuest(true)}>{t('Start the demo')}</Button>
      <div className="card small muted" style={{ textAlign: 'left', marginTop: 16 }}>
        {t('This demo runs entirely in your browser on example data — nothing is sent anywhere. Passkey sign-in and sync across your devices come with the openGym server, which you get by self-hosting it.')}
      </div>
      <div className="dim small" style={{ marginTop: 22, lineHeight: 1.6 }}>
        <a href={REPO} target="_blank" rel="noopener">{t('Self-host it in a minute →')}</a>
      </div>
    </div>
  )

  return (
    <div className="narrow" style={wrap}>
      {head}
      <div className="muted" style={{ marginBottom: 34 }}>{t('Your workouts. Your weights. Your profile.')}</div>
      <SignInForm />
      <div style={{ height: 10 }} />
      <Button variant="ghost" className="dim" onClick={() => setGuest(true)}>{t('Continue without account')}</Button>
    </div>
  )
}
