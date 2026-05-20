import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomeScreen from './screens/HomeScreen.jsx'
import QuizScreen from './screens/QuizScreen.jsx'
import ResultScreen from './screens/ResultScreen.jsx'
import { QuizProvider } from './context/QuizContext.jsx'

export default function App() {
  return (
    <QuizProvider>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/quiz" element={<QuizScreen />} />
        <Route path="/result" element={<ResultScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </QuizProvider>
  )
}
