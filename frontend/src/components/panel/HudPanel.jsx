import { HudPanelHeader } from "./HudPanelHeader.jsx";
import HudFrame from "./HudFrame.jsx";
import "./HudPanel.css";

export default function HudPanel({
  title,
  subtitle,
  eyebrow,
  action,
  icon: Icon,
  accent = "cyan",
  variant = "default",
  shape = "standard",
  frameStyle = "open",
  energy = "none",
  className = "",
  noPadding = false,
  children,
  ...sectionProps
}) {
  const classes = [
    "hud-panel",
    `hud-panel--${accent}`,
    `hud-panel--${variant}`,
    `hud-panel--shape-${shape}`,
    `hud-panel--frame-${frameStyle}`,
    `hud-panel--energy-${energy}`,
    noPadding && "hud-panel--no-padding",
    className,
  ].filter(Boolean).join(" ");

  return (
    <section className={classes} {...sectionProps}>
      <HudFrame frameStyle={frameStyle} energy={energy} />
      {(title || subtitle || eyebrow || action || Icon) && (
        <HudPanelHeader
          title={title}
          subtitle={subtitle}
          eyebrow={eyebrow}
          action={action}
          icon={Icon}
        />
      )}
      <div className="hud-panel__body">{children}</div>
    </section>
  );
}
