type ErrorReport = {
  scope: "app" | "global" | string;
  message: string;
  stack?: string;
  digest?: string;
  route?: string;
};

export function reportError(report: ErrorReport) {
  console.log("[CareHubError]", {
    scope: report.scope,
    message: report.message,
    stack: report.stack,
    digest: report.digest,
    route: report.route,
    timestamp: new Date().toISOString(),
  });
}
