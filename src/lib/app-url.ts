function normalizeUrl(value: string) {
  return value.replace(/\/$/, '');
}

export function getAppUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (explicitUrl) {
    return normalizeUrl(explicitUrl);
  }

  const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionDomain) {
    return normalizeUrl(`https://${productionDomain}`);
  }

  const previewDomain = process.env.VERCEL_URL;
  if (previewDomain) {
    return normalizeUrl(`https://${previewDomain}`);
  }

  return 'http://localhost:3000';
}

export function getAppHost() {
  return new URL(getAppUrl()).host;
}
