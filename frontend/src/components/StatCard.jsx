function StatCard({ label, value, caption, tone = 'default' }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      <p className="stat-card__caption">{caption}</p>
    </article>
  )
}

export default StatCard
