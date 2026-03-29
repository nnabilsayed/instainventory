function normalizeUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, '');
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
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
  try {
    return new URL(getAppUrl()).host;
  } catch {
    return getAppUrl().replace(/^https?:\/\//i, '');
  }
}
