import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '../context/QuizContext.jsx'
import ModeCard from '../components/ModeCard.jsx'
import { buildQuiz } from '../hooks/useQuizEngine.js'
import { useProgress } from '../hooks/useProgress.js'
import { getPoolSize } from '../data/countries.js'
import '../styles/home.css'

const FLAG_MODES = [
  { id: 'flag-to-name', icon: '🏳️', title: 'Naam bij vlag', desc: 'Zie een vlag, raad het land' },
  { id: 'name-to-flag', icon: '🗺️', title: 'Vlag bij naam', desc: 'Zie een naam, kies de vlag' },
]

const CAPITAL_MODES = [
  { id: 'name-to-capital', icon: '🏛️', title: 'Hoofdstad bij land', desc: 'Zie een land, raad de hoofdstad' },
  { id: 'capital-to-name', icon: '🌆', title: 'Land bij hoofdstad', desc: 'Zie een hoofdstad, raad het land' },
]

const DIFFICULTIES = [
  { level: 1, label: 'Makkelijk',   desc: 'Grote landen, willekeurige afleidingen' },
  { level: 2, label: 'Gemakkelijk', desc: 'Bekende landen, willekeurige afleidingen' },
  { level: 3, label: 'Gemiddeld',   desc: 'Middelgrote landen, willekeurige afleidingen' },
  { level: 4, label: 'Moeilijk',    desc: 'Alle landen, gelijkende vlagkleuren' },
  { level: 5, label: 'Expert',      desc: 'Alle landen, maximaal gelijkende vlaggen' },
]

const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30, 40, 50]

export default function HomeScreen() {
  const navigate = useNavigate()
  const { quizSettings, setQuizSettings, setQuizState } = useQuiz()
  const { getWeightedPool } = useProgress()

  const poolSize = getPoolSize(quizSettings.difficulty, quizSettings.region)
  const effectiveCount = Math.min(quizSettings.questionCount, poolSize)

  function handleModeSelect(modeId) {
    setQuizSettings(s => ({ ...s, mode: modeId }))
  }

  function setDifficulty(d) {
    setQuizSettings(s => ({ ...s, difficulty: d }))
  }

  function changeCount(delta) {
    const idx = QUESTION_COUNTS.indexOf(quizSettings.questionCount)
    const newIdx = Math.max(0, Math.min(QUESTION_COUNTS.length - 1, idx + delta))
    setQuizSettings(s => ({ ...s, questionCount: QUESTION_COUNTS[newIdx] }))
  }

  function handleStart() {
    const weightedPool = quizSettings.useSpacedRepetition ? getWeightedPool : null
    const questions = buildQuiz(quizSettings, weightedPool)
    setQuizState({ questions, settings: quizSettings })
    navigate('/quiz')
  }

  const atMin = quizSettings.questionCount === QUESTION_COUNTS[0]
  const atMax = quizSettings.questionCount === QUESTION_COUNTS[QUESTION_COUNTS.length - 1]
  const currentDiff = DIFFICULTIES.find(d => d.level === quizSettings.difficulty)

  // Expert open-invoer is alleen beschikbaar bij vlag-modi
  const isCapitalMode = quizSettings.mode === 'name-to-capital' || quizSettings.mode === 'capital-to-name'
  const expertDesc = isCapitalMode
    ? 'Alle landen, gelijkende tekst-opties'
    : 'Alle landen, maximaal gelijkende vlaggen + open invoer'

  return (
    <div className="screen">
      <div className="screen-inner">
        {/* Hero */}
        <div className="home-hero">
          <span className="globe anim-float">🌍</span>
          <h1>
            Leer de wereld<br />
            kennen met{' '}
            <em className="gradient-text">GeoQuiz</em>
          </h1>
          <p>Test je kennis van vlaggen, landen en meer — stap voor stap.</p>
        </div>

        {/* Mode selection — Vlaggen */}
        <div>
          <div className="section-label">Vlaggen</div>
          <div className="mode-grid">
            {FLAG_MODES.map(m => (
              <ModeCard
                key={m.id}
                icon={m.icon}
                title={m.title}
                desc={m.desc}
                selected={quizSettings.mode === m.id}
                onClick={() => handleModeSelect(m.id)}
              />
            ))}
          </div>
        </div>

        {/* Mode selection — Hoofdsteden */}
        <div>
          <div className="section-label">Hoofdsteden</div>
          <div className="mode-grid">
            {CAPITAL_MODES.map(m => (
              <ModeCard
                key={m.id}
                icon={m.icon}
                title={m.title}
                desc={m.desc}
                selected={quizSettings.mode === m.id}
                onClick={() => handleModeSelect(m.id)}
              />
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <div className="section-label">Moeilijkheid</div>
          <div className="card diff-card">
            <div className="diff-header">
              <span className="diff-name">{currentDiff.label}</span>
              <span className="diff-pool">{poolSize} landen</span>
            </div>
            <div className="diff-desc">
              {currentDiff.level === 5 ? expertDesc : currentDiff.desc}
            </div>
            <div className="diff-track">
              <span className="diff-track-label">Makkelijk</span>
              <div className="diff-dots">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.level}
                    className={`diff-dot ${quizSettings.difficulty === d.level ? 'active' : ''}`}
                    onClick={() => setDifficulty(d.level)}
                    aria-label={d.label}
                  />
                ))}
              </div>
              <span className="diff-track-label">Expert</span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div>
          <div className="section-label">Instellingen</div>
          <div className="card settings-card">
            <div className="settings-label">
              Aantal vragen
              {effectiveCount < quizSettings.questionCount && (
                <span className="settings-warn">max {poolSize} bij deze moeilijkheid</span>
              )}
            </div>
            <div className="counter">
              <button className="counter-btn" onClick={() => changeCount(-1)} disabled={atMin} aria-label="Minder vragen">−</button>
              <span className="counter-value">
                {effectiveCount < quizSettings.questionCount
                  ? <><s style={{ opacity: 0.4, fontSize: '0.8em' }}>{quizSettings.questionCount}</s> {effectiveCount}</>
                  : quizSettings.questionCount}
              </span>
              <button className="counter-btn" onClick={() => changeCount(1)} disabled={atMax} aria-label="Meer vragen">+</button>
            </div>
          </div>

          {/* Slim herhalen toggle */}
          <div className="card settings-card" style={{ marginTop: 10 }}>
            <div className="settings-label">
              Slim herhalen
              <span>Landen die je minder goed kent komen vaker terug</span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={quizSettings.useSpacedRepetition}
                onChange={e => setQuizSettings(s => ({ ...s, useSpacedRepetition: e.target.checked }))}
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </label>
          </div>
        </div>

        {/* Start button */}
        <button className="btn-primary" onClick={handleStart}>
          Start quiz →
        </button>

        {/* Voortgang link */}
        <button className="btn-ghost progress-link" onClick={() => navigate('/progress')}>
          📊 Bekijk je voortgang
        </button>
      </div>
    </div>
  )
}
