import { createContext, useContext } from 'react'

export const PricingContext = createContext(null)

export const usePricing = () => useContext(PricingContext)
