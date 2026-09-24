export default function HudFrame({ frameStyle, energy }) {
  return (
    <span className="hud-frame" aria-hidden="true">
      <i className="hud-frame__segment hud-frame__segment--tl" />
      <i className="hud-frame__segment hud-frame__segment--top" />
      <i className="hud-frame__segment hud-frame__segment--tr" />
      <i className="hud-frame__segment hud-frame__segment--left" />
      <i className="hud-frame__segment hud-frame__segment--right" />
      <i className="hud-frame__segment hud-frame__segment--bl" />
      <i className="hud-frame__segment hud-frame__segment--bottom" />
      <i className="hud-frame__segment hud-frame__segment--br" />
      <i className="hud-frame__tick hud-frame__tick--left" />
      <i className="hud-frame__tick hud-frame__tick--right" />
      {energy === "pair" && (
        <>
          <span className="hud-frame__energy hud-frame__energy--tl" />
          <span className="hud-frame__energy hud-frame__energy--br" />
        </>
      )}
      {energy === "single" && <span className="hud-frame__energy hud-frame__energy--single" />}
      <span className={`hud-frame__style hud-frame__style--${frameStyle}`} />
    </span>
  );
}
