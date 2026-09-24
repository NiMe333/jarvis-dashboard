import {
  Activity,
  Boxes,
  CircleHelp,
  Database,
  Network,
  ServerCog,
  ShieldCheck,
} from "lucide-react";
import HudPanel from "../panel/HudPanel.jsx";
import { dashboardCopy } from "../../config/dashboardContent.js";
import { dashboardMockData } from "../../config/dashboardMockData.js";
import "./ServicesPanel.css";

const VALID_STATUSES = new Set(Object.keys(dashboardCopy.services.statusLabels));

const SERVICE_ICONS = {
  activity: Activity,
  containers: Boxes,
  database: Database,
  network: Network,
  server: ServerCog,
  shield: ShieldCheck,
};

function normalizeStatus(status) {
  return VALID_STATUSES.has(status) ? status : "unknown";
}

function ServiceRow({ service }) {
  const status = normalizeStatus(service.status);
  const Icon = SERVICE_ICONS[service.icon] ?? CircleHelp;
  const statusLabel = service.statusLabel ?? dashboardCopy.services.statusLabels[status];
  const isExternalUrl = /^https?:\/\//i.test(service.url ?? "");
  const sharedProps = {
    className: `services-panel__row services-panel__row--${status}${service.url ? " is-linked" : " is-static"}`,
    id: `service-${service.id}`,
  };

  const content = (
    <>
      <span className="services-panel__icon" aria-hidden="true">
        <Icon size={17} strokeWidth={1.7} />
      </span>
      <span className="services-panel__identity">
        <strong>{service.name}</strong>
        <small>{service.description}</small>
      </span>
      <span className="services-panel__state">
        <span className="services-panel__state-line">
          <span className="services-panel__state-dot" aria-hidden="true" />
          <span>{statusLabel}</span>
        </span>
        {service.statusDetails && <small>{service.statusDetails}</small>}
      </span>
    </>
  );

  if (!service.url) {
    return <div {...sharedProps}>{content}</div>;
  }

  return (
    <a
      {...sharedProps}
      href={service.url}
      target={isExternalUrl ? "_blank" : undefined}
      rel={isExternalUrl ? "noopener noreferrer" : undefined}
      aria-label={`${dashboardCopy.accessibility.openServicePrefix} ${service.name}`}
    >
      {content}
    </a>
  );
}

export default function ServicesPanel({ services = dashboardMockData.services, className = "" }) {
  return (
    <HudPanel
      id="services-panel"
      title={dashboardCopy.panels.services.title}
      subtitle={dashboardCopy.panels.services.subtitle}
      className={`services-panel ${className}`.trim()}
      frameStyle="contained"
    >
      <div id="services-list" className="services-panel__list">
        {services.length > 0 ? (
          services.map((service) => <ServiceRow key={service.id} service={service} />)
        ) : (
          <p className="services-panel__empty">{dashboardCopy.services.empty}</p>
        )}
      </div>
    </HudPanel>
  );
}
