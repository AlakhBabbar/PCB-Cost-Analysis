import { useState } from 'react'
import { useToast } from '../../../components/ui'
import useApi from '../../../lib/useApi'
import { getOrder, patchOrder, syncOrder } from '../../../api/sales'
import { useAdmin } from '../shell/AdminContext'
import { errorText } from '../../../lib/errorText'
import { paymentOf, stageOf } from './labels'

// Loads one order and owns its writes. Stage changes show at once and roll back on error.
export default function useOrder(id) {
  const { token } = useAdmin()
  const toast = useToast()
  const api = useApi(() => getOrder(token, id), [token, id])
  const [syncing, setSyncing] = useState(false)
  const { data, setData } = api

  const setStage = async (stage) => {
    const before = data.stage
    if (stage === before) return
    setData((d) => ({ ...d, stage }))
    try {
      setData(await patchOrder(token, id, { stage }))
      toast(`Moved to ${stageOf(stage).label}`)
    } catch (err) {
      setData((d) => ({ ...d, stage: before }))
      toast(`Could not change the stage. ${errorText(err)}`, { tone: 'alert' })
    }
  }

  const saveNote = async (adminNote) => {
    try {
      setData(await patchOrder(token, id, { adminNote }))
      toast('Note saved')
    } catch (err) {
      toast(`Could not save the note. ${errorText(err)}`, { tone: 'alert' })
    }
  }

  const sync = async () => {
    setSyncing(true)
    try {
      const next = await syncOrder(token, id)
      setData(next)
      toast(`Payment: ${paymentOf(next.paymentStatus).label}`)
    } catch (err) {
      toast(`Could not check the payment. ${errorText(err)}`, { tone: 'alert' })
    } finally {
      setSyncing(false)
    }
  }

  return { ...api, setStage, saveNote, sync, syncing }
}
