import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress.js'
import { getCountriesByRegion } from '../data/countries.js'
import '../styles/progress.css'

const TOTAL_COUNTRIES = getCountriesByRegion('Heel de wereld').length

export default function ProgressScreen() {
  const navigate = useNavigate()
  const { getAllStats, getLearnedCount, getSeenCount, getWeakest, reset } = useProgress()
  const [confirmReset, setConfirmReset] = useState(false)

  const allStats = getAllStats()
  const hasData = Object.keys(allStats).length > 0

  const seen = getSeenCount()
  const learned = getLearnedCount()
  const toLearn = TOTAL_COUNTRIES - learned

  const weakest = useMemo(() => getWeakest(10), [allStats])

  function handleReset() {
    if (confirmReset) {
      reset()
      setConfirmReset(false)
      // Forceer re-render door page reload
      window.location.reload()
    } else {
      setConfirmReset(true)
    }
  }

  const learnedPct = TOTAL_COUNTRIES > 0 ? (learned / TOTAL_COUNTRIES) * 100 : 0

  return (
    <div className="progress-screen">
      <div className="progress-inner">
        {/* Header */}
        <div className="progress-header">
          <button className="back-btn" onClick={() => navigate('/')}>← Terug</button>
        </div>

        {/* Hero */}
        <div className="progress-hero">
          <h2>Jouw voortgang</h2>
          {hasData
            ? <p>Je hebt al {seen} van de {TOTAL_COUNTRIES} landen gezien</p>
            : <p>Nog geen quizzes gemaakt — start een quiz om te beginnen!</p>
          }
        </div>

        {/* Overzicht */}
        <div className="progress-section-title">Overzicht</div>
        <div className="card progress-section-card">
          <div>
            <div className="prog-bar-track">
              <div className="prog-bar-fill" style={{ width: `${learnedPct}%` }} />
            </div>
            <div className="prog-bar-label">{learned} / {TOTAL_COUNTRIES} geleerd</div>
          </div>

          <div className="stat-pills">
            <div className="stat-pill">
              <span className="stat-pill-value">{seen}</span>
              <span className="stat-pill-label">Gezien</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-value">{learned}</span>
              <span className="stat-pill-label">Geleerd</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-value">{toLearn}</span>
              <span className="stat-pill-label">Te leren</span>
            </div>
          </div>
        </div>

        {/* Moeilijkste landen */}
        {hasData && weakest.length > 0 && (
          <>
            <div className="progress-section-title">Moeilijkste landen</div>
            <div className="card">
              <div className="weakest-list">
                {weakest.map(item => {
                  const pct = item.attempts > 0
                    ? Math.round((item.correct / item.attempts) * 100)
                    : 0
                  return (
                    <div key={item.name} className="weakest-item">
                      <span className="weakest-item-name">{item.name}</span>
                      <span className="weakest-item-stats">
                        {item.correct}/{item.attempts} correct ({pct}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {!hasData && (
          <div className="card progress-empty">
            <span>🌍</span>
            Maak een quiz om je voortgang bij te houden.<br />
            Met <strong>Slim herhalen</strong> aan leer je landen sneller.
          </div>
        )}

        {/* Reset */}
        {hasData && (
          <div className="reset-section">
            <button
              className={`btn-danger ${confirmReset ? 'btn-danger-confirm' : ''}`}
              onClick={handleReset}
            >
              {confirmReset ? 'Weet je het zeker? Klik nogmaals om te resetten' : 'Voortgang resetten'}
            </button>
            {confirmReset && (
              <button
                className="btn-ghost"
                style={{ fontSize: 14, padding: '8px 16px' }}
                onClick={() => setConfirmReset(false)}
              >
                Annuleren
              </button>
            )}
            {!confirmReset && (
              <p className="reset-hint">Dit verwijdert alle opgeslagen statistieken</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
