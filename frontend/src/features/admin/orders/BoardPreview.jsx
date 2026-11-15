import { lazy, Suspense, useEffect, useState } from 'react'
import { Card, Skeleton } from '../../../components/ui'
import { fileLink } from '../../../api/sales'
import { useAdmin } from '../shell/AdminContext'
import { ErrorState } from './ListEmpty'

const GerberViewer = lazy(() => import('../../quote/GerberViewer'))

const Loading = () => <Card title="Board preview"><Skeleton className="h-48 w-full" rounded="rounded-lg" /></Card>

// Fetches the stored zip through a signed link and hands it to the quote page's viewer.
export default function BoardPreview({ fileId }) {
  const { token } = useAdmin()
  const [blob, setBlob] = useState(null)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let live = true
    setError(null)
    fileLink(token, fileId)
      .then(({ url }) => fetch(url))
      .then((res) => { if (!res.ok) throw new Error('The file could not be fetched.'); return res.blob() })
      .then((b) => live && setBlob(b), (err) => live && setError(err))
    return () => { live = false }
  }, [token, fileId, tick])

  if (error) return <Card title="Board preview"><ErrorState error={error} title="Could not load the preview" onRetry={() => setTick((t) => t + 1)} /></Card>
  if (!blob) return <Loading />
  return <Suspense fallback={<Loading />}><GerberViewer file={blob} /></Suspense>
}
