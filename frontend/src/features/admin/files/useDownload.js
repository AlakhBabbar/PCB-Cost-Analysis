import { useState } from 'react'
import { useToast } from '../../../components/ui'
import { fileLink } from '../../../api/sales'
import { useAdmin } from '../shell/AdminContext'
import { errorText } from '../../../lib/errorText'

// Asks for a 5 minute signed link and starts the download. busy holds the file id being fetched.
export default function useDownload() {
  const { token } = useAdmin()
  const toast = useToast()
  const [busy, setBusy] = useState(null)
  const download = async (id) => {
    setBusy(id)
    try {
      const { url } = await fileLink(token, id)
      const a = document.createElement('a')
      a.href = url
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      toast(`Could not download the file. ${errorText(err)}`, { tone: 'alert' })
    } finally {
      setBusy(null)
    }
  }
  return { download, busy }
}
