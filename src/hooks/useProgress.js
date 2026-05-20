const STORAGE_KEY = 'geoquiz_progress'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const DEFAULT_STATS = {
  attempts: 0,
  correct: 0,
  interval: 1,
  easeFactor: 2.5,
  repetitions: 0,
  nextDue: 0,
  lastSeen: 0,
}

export function useProgress() {
  function updateStats(countryName, isCorrect) {
    const all = load()
    const prev = all[countryName] || { ...DEFAULT_STATS }
    const now = Date.now()

    let { interval, easeFactor, repetitions } = prev

    if (isCorrect) {
      interval = repetitions === 0 ? 1 : Math.round(interval * easeFactor)
      repetitions += 1
    } else {
      interval = 1
      repetitions = 0
      easeFactor = Math.max(1.3, easeFactor - 0.2)
    }

    all[countryName] = {
      ...prev,
      attempts: prev.attempts + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      interval,
      easeFactor,
      repetitions,
      nextDue: now + interval * 86_400_000,
      lastSeen: now,
    }
    save(all)
  }

  function getStats(countryName) {
    return load()[countryName] || null
  }

  function getAllStats() {
    return load()
  }

  // Sorteert pool: landen met nextDue <= now vooraan (willekeurig), rest achteraan (willekeurig)
  function getWeightedPool(pool) {
    const all = load()
    const now = Date.now()
    const due = []
    const notDue = []

    for (const country of pool) {
      const stats = all[country.name]
      if (!stats || stats.nextDue <= now) {
        due.push(country)
      } else {
        notDue.push(country)
      }
    }

    return [...due, ...notDue]
  }

  // Landen met ≥3 correct answers
  function getLearnedCount() {
    const all = load()
    return Object.values(all).filter(s => s.correct >= 3).length
  }

  // Gezien = ooit een poging gedaan
  function getSeenCount() {
    return Object.keys(load()).length
  }

  // n landen met laagste easeFactor (slechtste beheersing)
  function getWeakest(n) {
    const all = load()
    return Object.entries(all)
      .filter(([, s]) => s.attempts > 0)
      .sort(([, a], [, b]) => a.easeFactor - b.easeFactor)
      .slice(0, n)
      .map(([name, stats]) => ({ name, ...stats }))
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    updateStats,
    getStats,
    getAllStats,
    getWeightedPool,
    getLearnedCount,
    getSeenCount,
    getWeakest,
    reset,
  }
}
