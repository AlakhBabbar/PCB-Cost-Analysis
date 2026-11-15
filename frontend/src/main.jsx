import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { MotionProvider } from './components/motion'
import { ConfirmProvider, Spinner, ToastProvider } from './components/ui'

const QuotePage = lazy(() => import('./features/quote/QuotePage'))
const AdminApp = lazy(() => import('./features/admin/shell/AdminApp'))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotionProvider>
      <BrowserRouter>
        <ToastProvider>
          <ConfirmProvider>
            <Suspense fallback={<div className="min-h-dvh grid place-items-center"><Spinner /></div>}>
              <Routes>
                <Route path="/" element={<QuotePage />} />
                <Route path="/admin/*" element={<AdminApp />} />
              </Routes>
            </Suspense>
          </ConfirmProvider>
        </ToastProvider>
      </BrowserRouter>
    </MotionProvider>
  </React.StrictMode>,
)
