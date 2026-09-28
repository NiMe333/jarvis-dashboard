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

function formatNumber(value, digits = 2) {
  return value === null || value === undefined || value === ""
    ? dashboardCopy.common.unavailable
    : Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : dashboardCopy.common.unavailable;
}

function serviceSecondaryLine(service) {
  if (service.kind || service.node) {
    return `${service.kind ? service.kind.toUpperCase() : "SERVICE"}${service.node ? ` · ${service.node}` : ""}`;
  }
  return service.description ?? dashboardCopy.common.unavailable;
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
      <div className="services-panel__card-head">
        <span className="services-panel__icon" aria-hidden="true">
          <Icon size={18} strokeWidth={1.55} />
        </span>
        <span className="services-panel__identity">
          <strong>{service.name ?? dashboardCopy.common.unavailable}</strong>
          <small>{serviceSecondaryLine(service)}</small>
        </span>
        <span className="services-panel__state">
          <span className="services-panel__state-line">
            <span className="services-panel__state-dot" aria-hidden="true" />
            <span>{statusLabel}</span>
          </span>
        </span>
      </div>

      <div className="services-panel__resources" aria-label={`${service.name ?? "Service"} resources`}>
        <div className="services-panel__resource">
          <span className="services-panel__resource-label">CPU</span>
          <strong>{formatNumber(service.cpuUsage)}<small>%</small></strong>
          <span className="services-panel__resource-detail">LIVE USAGE</span>
        </div>
        <div className="services-panel__resource">
          <span className="services-panel__resource-label">RAM</span>
          <strong>
            {service.memoryUsed == null || service.memoryTotal == null
              ? dashboardCopy.common.unavailable
              : `${formatNumber(service.memoryUsed)} / ${formatNumber(service.memoryTotal)} GB`}
          </strong>
          <span className="services-panel__resource-detail">USED / ALLOCATED</span>
        </div>
      </div>
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

export default function ServicesPanel({ services = [], className = "" }) {
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
