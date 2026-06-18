function SectionCard({ eyebrow, title, description, actions, children, id }) {
  return (
    <section className="section-card" id={id}>
      <div className="section-card__header">
        <div>
          <span className="section-card__eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {actions ? <div className="section-card__actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

export default SectionCard
