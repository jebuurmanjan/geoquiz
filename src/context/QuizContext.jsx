import React, { createContext, useContext, useState } from 'react'

const QuizContext = createContext(null)

export function QuizProvider({ children }) {
  const [quizSettings, setQuizSettings] = useState({
    mode: 'flag-to-name',
    questionCount: 10,
    region: 'Heel de wereld',
    difficulty: 3,
    useSpacedRepetition: false,
  })

  const [quizState, setQuizState] = useState(null)

  return (
    <QuizContext.Provider value={{ quizSettings, setQuizSettings, quizState, setQuizState }}>
      {children}
    </QuizContext.Provider>
  )
}

export function useQuiz() {
  return useContext(QuizContext)
}
