import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '../context/QuizContext.jsx'
import { useQuizEngine } from '../hooks/useQuizEngine.js'
import { useProgress } from '../hooks/useProgress.js'
import ProgressBar from '../components/ProgressBar.jsx'
import OptionButton from '../components/OptionButton.jsx'
import '../styles/quiz.css'

function OpenAnswerInput({ onSubmit, isAnswered, answerCorrect, correctAnswer, placeholder }) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!isAnswered) {
      setValue('')
      inputRef.current?.focus()
    }
  }, [isAnswered])

  function handleSubmit(e) {
    e.preventDefault()
    if (!value.trim() || isAnswered) return
    onSubmit(value.trim())
  }

  return (
    <form className="open-answer-form" onSubmit={handleSubmit}>
      <div className={`open-answer-wrapper ${isAnswered ? (answerCorrect ? 'correct' : 'wrong') : ''}`}>
        <input
          ref={inputRef}
          className="open-answer-input"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => setValue(e.target.value)}
          disabled={isAnswered}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        {!isAnswered && (
          <button type="submit" className="open-answer-submit" disabled={!value.trim()}>
            ✓
          </button>
        )}
      </div>

      {!isAnswered && (
        <button
          type="button"
          className="open-answer-skip"
          onClick={() => onSubmit('__skip__')}
        >
          Ik weet het niet
        </button>
      )}

      {isAnswered && (
        <div className={`open-answer-feedback anim-slide-up ${answerCorrect ? 'correct' : 'wrong'}`}>
          {answerCorrect
            ? `✓ Correct!`
            : `✗ Het was: ${correctAnswer}`}
        </div>
      )}
    </form>
  )
}

export default function QuizScreen() {
  const navigate = useNavigate()
  const { quizState, setQuizState } = useQuiz()
  const { updateStats } = useProgress()

  useEffect(() => {
    if (!quizState) navigate('/', { replace: true })
  }, [quizState, navigate])

  const engine = useQuizEngine(quizState?.questions ?? [])
  const {
    current, currentIndex, total, selected, answerCorrect,
    score, wrongAnswers, finished, isAnswered,
    answer, answerOpen, next,
  } = engine

  useEffect(() => {
    if (finished && quizState) {
      setQuizState(s => ({ ...s, finalScore: score, wrongAnswers }))
      navigate('/result')
    }
  }, [finished])

  if (!quizState || !current) return null

  const { mode, isOpen } = current

  function getOptionState(option) {
    if (!isAnswered) return null
    if (option.name === current.correct.name) return 'correct'
    if (selected?.name === option.name) return 'wrong'
    return null
  }

  function handleAnswer(option) {
    answer(option)
    updateStats(current.correct.name, option.name === current.correct.name)
  }

  function handleAnswerOpen(text) {
    const isCorrect = answerOpen(text)
    updateStats(current.correct.name, isCorrect)
  }

  // Vraagprompt per modus
  function getPrompt() {
    if (mode === 'flag-to-name') return isOpen ? 'Typ de naam van dit land' : 'Van welk land is deze vlag?'
    if (mode === 'name-to-flag') return 'Welke vlag hoort bij dit land?'
    if (mode === 'name-to-capital') return isOpen ? 'Typ de naam van de hoofdstad' : 'Wat is de hoofdstad van dit land?'
    if (mode === 'capital-to-name') return isOpen ? 'Typ de naam van het land' : 'Bij welk land hoort deze hoofdstad?'
    return ''
  }

  // Open invoer instellingen per modus
  const openPlaceholder = mode === 'name-to-capital' ? 'Typ de naam van de hoofdstad…' : 'Typ de naam van het land…'
  const openCorrectAnswer = mode === 'name-to-capital' ? current.correct.capital : current.correct.name

  return (
    <div className="quiz-screen">
      <div className="quiz-inner">
        {/* Header */}
        <div className="quiz-header">
          <button className="back-btn" onClick={() => navigate('/')}>← Terug</button>
          <ProgressBar current={currentIndex + (isAnswered ? 1 : 0)} total={total} />
          <div className="score-badge">{score} ✓</div>
        </div>

        {/* Question card */}
        <div className="card question-card" key={currentIndex}>
          <div className="question-prompt">{getPrompt()}</div>

          {mode === 'flag-to-name' && (
            <div className="question-flag">{current.correct.flag}</div>
          )}
          {(mode === 'name-to-flag' || mode === 'name-to-capital') && (
            <div className="question-country-name">{current.correct.name}</div>
          )}
          {mode === 'capital-to-name' && (
            <div className="question-capital-name">{current.correct.capital}</div>
          )}
        </div>

        {/* Open invoer of multiple choice */}
        {isOpen ? (
          <OpenAnswerInput
            onSubmit={handleAnswerOpen}
            isAnswered={isAnswered}
            answerCorrect={answerCorrect}
            correctAnswer={openCorrectAnswer}
            placeholder={openPlaceholder}
          />
        ) : (
          <div className="options-grid">
            {current.options.map(option => (
              <OptionButton
                key={option.name}
                option={option}
                mode={mode}
                onClick={() => handleAnswer(option)}
                state={getOptionState(option)}
                disabled={isAnswered}
              />
            ))}
          </div>
        )}

        {/* Volgende knop */}
        {isAnswered && (
          <div className="next-btn-wrapper">
            <button className="btn-primary" onClick={next}>
              {currentIndex + 1 >= total ? 'Bekijk resultaat 🏆' : 'Volgende →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
