const IP_HEADER_CANDIDATES = [
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "true-client-ip",
  "x-client-ip",
  "fastly-client-ip",
];

function normalizeIpHeaderValue(value: string, headerName: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (headerName === "x-forwarded-for") {
    const firstForwardedIp = trimmed.split(",")[0]?.trim();
    return firstForwardedIp || null;
  }

  return trimmed;
}

export function getRequestIp(request: Request) {
  for (const headerName of IP_HEADER_CANDIDATES) {
    const headerValue = request.headers.get(headerName);

    if (!headerValue) {
      continue;
    }

    const normalizedIp = normalizeIpHeaderValue(headerValue, headerName);

    if (normalizedIp) {
      return normalizedIp;
    }
  }

  return null;
}
