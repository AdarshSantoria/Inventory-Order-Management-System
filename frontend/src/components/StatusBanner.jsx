function StatusBanner({ message, onDismiss }) {
  if (!message) {
    return null
  }

  return (
    <div className={`status-banner status-banner--${message.type}`} role="status">
      <span>{message.text}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss message">
        Close
      </button>
    </div>
  )
}

export default StatusBanner
