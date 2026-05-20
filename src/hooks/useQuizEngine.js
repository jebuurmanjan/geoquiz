import { useState, useCallback } from 'react'
import { getCountriesByRegion } from '../data/countries.js'

// Fisher-Yates shuffle — correct implementatie
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Antwoord-validatie voor open invoer ──────────────────────────────────────

// Normaliseer: lowercase, verwijder diakritische tekens, verwijder leestekens
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // diakritische tekens weg (ë→e, é→e)
    .replace(/[^a-z0-9\s]/g, ' ')      // leestekens → spatie
    .trim()
    .replace(/\s+/g, ' ')
}

// Levenshtein-afstand (aantal bewerkingen om a→b te maken)
function levenshtein(a, b) {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, (_, i) => [i])
  for (let j = 1; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

// Controleer of getypt antwoord overeenkomt met het juiste land
// Strategie:
//   1. Exacte match (genormaliseerd) op naam of alias
//   2. Typo-tolerantie: 1 fout bij ≥5 tekens, 2 fouten bij ≥10 tekens
export function checkOpenAnswer(input, country) {
  const norm = normalize(input)
  if (norm.length < 2) return false

  const targets = [country.name, ...(country.aliases || [])].map(normalize)

  for (const target of targets) {
    if (norm === target) return true
    const maxDist = target.length >= 10 ? 2 : target.length >= 5 ? 1 : 0
    if (maxDist > 0 && levenshtein(norm, target) <= maxDist) return true
  }
  return false
}

// ── Kleur-similariteit voor moeilijke afleidingen ────────────────────────────

function colorSimilarity(c1, c2) {
  const a = c1.slice(0, 3)
  const b = c2.slice(0, 3)
  const intersection = a.filter(x => b.includes(x)).length
  const union = new Set([...a, ...b]).size
  return intersection / union
}

function generateQuestion(correct, allCountries, mode, difficulty) {
  const others = allCountries.filter(c => c.name !== correct.name)

  let distractors
  if (difficulty >= 4) {
    const sorted = [...others].sort((a, b) =>
      colorSimilarity(b.colors, correct.colors) - colorSimilarity(a.colors, correct.colors)
    )
    const candidates = sorted.slice(0, Math.min(12, sorted.length))
    const numSimilar = difficulty >= 5 ? 3 : 2
    const similar = shuffle(candidates).slice(0, numSimilar)
    const rest = shuffle(others.filter(c => !similar.includes(c))).slice(0, 3 - similar.length)
    distractors = shuffle([...similar, ...rest])
  } else {
    distractors = shuffle(others).slice(0, 3)
  }

  // Bij expert + naam-bij-vlag: open invoer, geen multiple choice
  const isOpen = difficulty === 5 && mode === 'flag-to-name'
  return { correct, options: shuffle([correct, ...distractors]), mode, isOpen }
}

export function buildQuiz(settings) {
  const { difficulty = 3, questionCount, mode, region } = settings
  const allInRegion = getCountriesByRegion(region)
  const minPop = Math.max(1, 6 - difficulty)
  const pool = allInRegion.filter(c => c.pop >= minPop)

  // Zorg voor echte willekeur: shuffle meerdere keren voor betere verdeling
  const s1 = shuffle(pool)
  const s2 = shuffle(s1)
  const selected = s2.slice(0, Math.min(questionCount, pool.length))

  return selected.map(c => generateQuestion(c, allInRegion, mode, difficulty))
}

// ── Quiz engine hook ─────────────────────────────────────────────────────────

export function useQuizEngine(questions) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)       // country-object (MC) of string (open)
  const [answerCorrect, setAnswerCorrect] = useState(null) // voor open invoer
  const [score, setScore] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState([])
  const [finished, setFinished] = useState(false)

  const current = questions[currentIndex]
  const isAnswered = selected !== null

  // Multiple-choice antwoord
  const answer = useCallback((option) => {
    if (isAnswered) return
    setSelected(option)
    if (option.name === current.correct.name) {
      setScore(s => s + 1)
    } else {
      setWrongAnswers(w => [...w, current.correct])
    }
  }, [isAnswered, current])

  // Open-invoer antwoord
  const answerOpen = useCallback((text) => {
    if (isAnswered) return
    setSelected(text)
    const correct = checkOpenAnswer(text, current.correct)
    setAnswerCorrect(correct)
    if (correct) {
      setScore(s => s + 1)
    } else {
      setWrongAnswers(w => [...w, current.correct])
    }
  }, [isAnswered, current])

  const next = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true)
    } else {
      setCurrentIndex(i => i + 1)
      setSelected(null)
      setAnswerCorrect(null)
    }
  }, [currentIndex, questions.length])

  return {
    current, currentIndex, total: questions.length,
    selected, answerCorrect, score, wrongAnswers, finished, isAnswered,
    answer, answerOpen, next,
  }
}
