import Dialog from './Dialog'
import Button from './Button'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'primary', busy, onConfirm, onCancel }) {
  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onCancel}
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={busy} data-autofocus>{confirmLabel}</Button>
        </>
      }
    >
      {message && <p className="text-[15px] md:text-sm leading-relaxed text-muted">{message}</p>}
    </Dialog>
  )
}
