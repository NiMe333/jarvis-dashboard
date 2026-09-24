export function HudPanelHeader({ title, subtitle, eyebrow, action, icon: Icon }) {
  return (
    <header className="hud-panel__header">
      <div className="hud-panel__heading">
        {Icon && <Icon className="hud-panel__icon" size={16} aria-hidden="true" />}
        <div className="hud-panel__title-group">
          {eyebrow && <span className="hud-panel__eyebrow">{eyebrow}</span>}
          {title && <h2 className="hud-panel__title">{title}</h2>}
          {subtitle && <p className="hud-panel__subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <span className="hud-panel__action" aria-label={typeof action === "string" ? action : undefined}>
          {action}
        </span>
      )}
    </header>
  );
}
