'use client'

import { useEffect, useState } from 'react'
import { getTodayLabel } from './catalogData'

export function useTodayLabel() {
  const [todayLabel, setTodayLabel] = useState('')

  useEffect(() => {
    setTodayLabel(getTodayLabel())
  }, [])

  return todayLabel
}
