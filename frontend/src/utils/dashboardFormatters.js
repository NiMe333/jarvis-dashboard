import { dashboardCopy } from "../config/dashboardContent.js";

export function formatNullable(value, suffix = "") {
  return value === null || value === undefined || value === ""
    ? dashboardCopy.common.unavailable
    : `${value}${suffix}`;
}

export function formatFiniteNumber(value, suffix = "") {
  return Number.isFinite(value)
    ? `${value}${suffix}`
    : dashboardCopy.common.unavailable;
}

export function dataSourceLabel(source) {
  if (source === "live") return dashboardCopy.common.liveLabel;
  if (source === "partial") return "PARTIAL DATA";
  if (source === "loading") return "LOADING";
  return "BACKEND OFFLINE";
}
