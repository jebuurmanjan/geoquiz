import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '../context/QuizContext.jsx'
import { buildQuiz } from '../hooks/useQuizEngine.js'
import StatPill from '../components/StatPill.jsx'
import '../styles/result.css'

function getResultEmoji(pct) {
  if (pct >= 90) return '🏆'
  if (pct >= 70) return '🎉'
  if (pct >= 50) return '💪'
  return '📚'
}

function getResultTitle(pct) {
  if (pct >= 90) return 'Uitstekend gedaan!'
  if (pct >= 70) return 'Goed bezig!'
  if (pct >= 50) return 'Aardig op weg!'
  return 'Blijf oefenen!'
}

export default function ResultScreen() {
  const navigate = useNavigate()
  const { quizState, setQuizState } = useQuiz()

  if (!quizState) {
    navigate('/', { replace: true })
    return null
  }

  const { finalScore, wrongAnswers, questions, settings } = quizState
  const total = questions?.length ?? 0
  const correct = finalScore ?? 0
  const wrong = total - correct
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0

  function handleRetry() {
    const questions = buildQuiz(settings)
    setQuizState({ questions, settings, finalScore: undefined, wrongAnswers: [] })
    navigate('/quiz')
  }

  return (
    <div className="result-screen">
      <div className="result-inner">
        {/* Hero */}
        <div className="card result-hero">
          <span className="result-emoji anim-pop">{getResultEmoji(pct)}</span>
          <h1>{getResultTitle(pct)}</h1>
          <div className="result-score-display gradient-text">{correct}/{total}</div>
          <div className="result-percentage">{pct}% goed beantwoord</div>
        </div>

        {/* Stats */}
        <div className="stat-pills">
          <StatPill value={correct} label="Goed" type="correct" />
          <StatPill value={wrong} label="Fout" type="wrong" />
          <StatPill value={`${pct}%`} label="Score" type="score" />
        </div>

        {/* Missed */}
        {wrongAnswers && wrongAnswers.length > 0 && (
          <div className="card missed-section">
            <h2>Nog te leren ({wrongAnswers.length})</h2>
            <div className="missed-list">
              {wrongAnswers.map(country => (
                <div className="missed-item" key={country.name}>
                  <span className="missed-flag">{country.flag}</span>
                  <span>{country.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="result-actions">
          <button className="btn-primary" onClick={handleRetry}>
            Opnieuw proberen
          </button>
          <button className="link-btn" onClick={() => navigate('/')}>
            Kies een andere oefening
          </button>
        </div>
      </div>
    </div>
  )
}
