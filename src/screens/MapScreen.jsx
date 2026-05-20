import React, { useState, useMemo, useEffect, useRef } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '../context/QuizContext.jsx'
import { useProgress } from '../hooks/useProgress.js'
import { isoNumToDutch, dutchToIsoNum, geoDutchName, countriesInMap } from '../data/geoMapping.js'
import { getCountriesByRegion } from '../data/countries.js'
import { checkOpenAnswer } from '../hooks/useQuizEngine.js'
import '../styles/map.css'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildMapQuestions(settings) {
  if (!settings) return []
  const { difficulty = 3, questionCount = 10, region = 'Heel de wereld', mode } = settings
  const all = getCountriesByRegion(region)
  const minPop = Math.max(1, 6 - difficulty)
  let pool = all.filter(c => c.pop >= minPop)

  // Alleen landen die in de topojson staan
  pool = pool.filter(c => countriesInMap.has(c.name))

  // Voor map-click: tiny eilandstaten zijn te klein om op te klikken
  if (mode === 'map-click') {
    pool = pool.filter(c => c.pop >= 2)
  }

  return shuffle(shuffle(pool)).slice(0, Math.min(questionCount, pool.length))
}

function OpenAnswerInput({ onSubmit, isAnswered, answerCorrect, correctAnswer }) {
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
          placeholder="Typ de naam van het land…"
          value={value}
          onChange={e => setValue(e.target.value)}
          disabled={isAnswered}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        {!isAnswered && (
          <button type="submit" className="open-answer-submit" disabled={!value.trim()}>✓</button>
        )}
      </div>
      {!isAnswered && (
        <button type="button" className="open-answer-skip" onClick={() => onSubmit('__skip__')}>
          Ik weet het niet
        </button>
      )}
      {isAnswered && (
        <div className={`open-answer-feedback anim-slide-up ${answerCorrect ? 'correct' : 'wrong'}`}>
          {answerCorrect ? '✓ Correct!' : `✗ Het was: ${correctAnswer}`}
        </div>
      )}
    </form>
  )
}

export default function MapScreen() {
  const navigate = useNavigate()
  const { quizState, setQuizState } = useQuiz()
  const { updateStats } = useProgress()

  const settings = quizState?.settings
  const mode = settings?.mode
  const isExpert = settings?.difficulty === 5

  const [questions] = useState(() => buildMapQuestions(settings))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('question')
  const [mapZoom, setMapZoom] = useState(1)
  const [mapCenter, setMapCenter] = useState([0, 20])
  const [clickedGeoId, setClickedGeoId] = useState(null)   // geo.id of clicked country
  const [clickedName, setClickedName] = useState(null)     // Dutch name of clicked country
  const [selectedOption, setSelectedOption] = useState(null)
  const [answerCorrect, setAnswerCorrect] = useState(null)
  const [score, setScore] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState([])

  useEffect(() => {
    if (!quizState) navigate('/', { replace: true })
  }, [quizState, navigate])

  const current = questions[currentIndex]

  // Opties voor map-identify multiple choice
  const options = useMemo(() => {
    if (!current || mode !== 'map-identify' || isExpert) return []
    const pool = getCountriesByRegion(settings?.region || 'Heel de wereld')
      .filter(c => c.name !== current.name && countriesInMap.has(c.name))
    return shuffle([current, ...shuffle(pool).slice(0, 3)])
  }, [current, mode, isExpert])

  function handleGeoClick(geo) {
    if (phase !== 'question' || mode !== 'map-click') return
    const name = geoDutchName(geo)
    if (!name) return // land buiten onze dataset
    setClickedGeoId(geo.id || geo.properties?.name)
    setClickedName(name)
    const isCorrect = name === current.name
    setAnswerCorrect(isCorrect)
    setPhase('answered')
    updateStats(current.name, isCorrect)
    if (isCorrect) setScore(s => s + 1)
    else setWrongAnswers(w => [...w, current])
  }

  function handleOptionClick(option) {
    if (phase !== 'question') return
    const isCorrect = option.name === current.name
    setSelectedOption(option)
    setAnswerCorrect(isCorrect)
    setPhase('answered')
    updateStats(current.name, isCorrect)
    if (isCorrect) setScore(s => s + 1)
    else setWrongAnswers(w => [...w, current])
  }

  function handleOpenAnswer(text) {
    const isCorrect = checkOpenAnswer(text, current)
    setSelectedOption({ name: text })
    setAnswerCorrect(isCorrect)
    setPhase('answered')
    updateStats(current.name, isCorrect)
    if (isCorrect) setScore(s => s + 1)
    else setWrongAnswers(w => [...w, current])
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setQuizState(s => ({ ...s, finalScore: score, wrongAnswers }))
      navigate('/result')
    } else {
      setCurrentIndex(i => i + 1)
      setPhase('question')
      setClickedGeoId(null)
      setClickedName(null)
      setSelectedOption(null)
      setAnswerCorrect(null)
    }
  }

  function getGeoFill(geo) {
    const name = geoDutchName(geo)
    const geoKey = geo.id || geo.properties?.name
    const correctGeoKey = dutchToIsoNum[current?.name] || current?.name

    if (mode === 'map-click') {
      if (phase === 'answered') {
        if (geoKey === clickedGeoId) return answerCorrect ? '#2dce89' : '#f5365c'
        if (name === current?.name && !answerCorrect) return '#2dce89'
      }
      return '#D6D6DA'
    }

    if (mode === 'map-identify') {
      if (name === current?.name) {
        return phase === 'answered' ? '#2dce89' : '#F7C948'
      }
      return '#D6D6DA'
    }

    return '#D6D6DA'
  }

  if (!quizState || !current) return null

  return (
    <div className="map-screen">
      <div className="map-inner">
        {/* Header */}
        <div className="map-header">
          <button className="back-btn" onClick={() => navigate('/')}>← Terug</button>
          <div className="map-progress-text">{currentIndex + 1} / {questions.length}</div>
          <div className="score-badge">{score} ✓</div>
        </div>

        {/* Vraag */}
        {mode === 'map-click' && (
          <div className="map-question">
            Klik op de kaart:
            <strong>{current.name}</strong>
          </div>
        )}
        {mode === 'map-identify' && (
          <div className="map-question">
            {phase === 'question'
              ? 'Welk land is geel gemarkeerd?'
              : answerCorrect
                ? <strong style={{ color: 'var(--correct)' }}>✓ {current.name}</strong>
                : <><span style={{ color: 'var(--wrong)' }}>✗</span> <strong>{current.name}</strong></>
            }
          </div>
        )}

        {/* Kaart */}
        <div className="map-container">
          <ComposableMap
            projection="geoNaturalEarth1"
            projectionConfig={{ scale: 147 }}
          >
            <ZoomableGroup
              zoom={mapZoom}
              center={mapCenter}
              onMoveEnd={({ coordinates, zoom }) => {
                setMapCenter(coordinates)
                setMapZoom(zoom)
              }}
              minZoom={1}
              maxZoom={8}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const fill = getGeoFill(geo)
                    const isClickable = mode === 'map-click' && phase === 'question'
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke="#fff"
                        strokeWidth={0.5}
                        onClick={() => handleGeoClick(geo)}
                        style={{
                          default: { outline: 'none' },
                          hover: {
                            fill: isClickable ? '#8fa8f0' : fill,
                            outline: 'none',
                            cursor: isClickable ? 'pointer' : 'default',
                          },
                          pressed: { outline: 'none' },
                        }}
                      />
                    )
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
          <div className="map-zoom-controls">
            <button
              className="map-zoom-btn"
              onClick={() => setMapZoom(z => Math.min(8, +(z * 1.5).toFixed(2)))}
              aria-label="Inzoomen"
            >+</button>
            <button
              className="map-zoom-btn"
              onClick={() => setMapZoom(z => Math.max(1, +(z / 1.5).toFixed(2)))}
              aria-label="Uitzoomen"
            >−</button>
            <button
              className="map-zoom-btn map-zoom-reset"
              onClick={() => { setMapZoom(1); setMapCenter([0, 20]) }}
              aria-label="Reset kaart"
            >⌂</button>
          </div>
        </div>

        {/* Feedback voor map-click */}
        {mode === 'map-click' && phase === 'answered' && (
          <div className={`map-feedback ${answerCorrect ? 'correct' : 'wrong'}`}>
            {answerCorrect
              ? `✓ Correct! ${current.name}`
              : `✗ Dat was ${clickedName || 'een ander land'} — het juiste antwoord is groen`}
          </div>
        )}

        {/* Antwoord-opties of open invoer (map-identify) */}
        {mode === 'map-identify' && !isExpert && (
          <div className="map-options">
            {options.map(option => {
              let state = null
              if (phase === 'answered') {
                if (option.name === current.name) state = 'correct'
                else if (selectedOption?.name === option.name) state = 'wrong'
              }
              return (
                <button
                  key={option.name}
                  className={`map-option-btn ${state || ''}`}
                  onClick={() => handleOptionClick(option)}
                  disabled={phase === 'answered'}
                >
                  {option.name}
                </button>
              )
            })}
          </div>
        )}

        {mode === 'map-identify' && isExpert && (
          <OpenAnswerInput
            onSubmit={handleOpenAnswer}
            isAnswered={phase === 'answered'}
            answerCorrect={answerCorrect}
            correctAnswer={current.name}
          />
        )}

        {/* Volgende knop */}
        {phase === 'answered' && (
          <div className="map-next-wrapper">
            <button className="btn-primary" onClick={handleNext}>
              {currentIndex + 1 >= questions.length ? 'Bekijk resultaat 🏆' : 'Volgende →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
