const ABSOLUTE_URL = /^(?:[a-z]+:)?\/\//i;

const getConfiguredApiBaseUrl = () => {
  const rawValue = import.meta.env.VITE_API_BASE_URL?.trim();
  return rawValue ? rawValue.replace(/\/+$/, '') : '';
};

export const resolveMediaUrl = (value?: string | null) => {
  if (!value) return '';
  if (ABSOLUTE_URL.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  if (!value.startsWith('/')) {
    return value;
  }

  const apiBaseUrl = getConfiguredApiBaseUrl();
  if (!apiBaseUrl) {
    return value;
  }

  try {
    return new URL(value, `${apiBaseUrl}/`).toString();
  } catch {
    return value;
  }
};

export const toAbsoluteMediaUrl = (value?: string | null) => {
  const resolved = resolveMediaUrl(value);
  if (!resolved || ABSOLUTE_URL.test(resolved)) {
    return resolved;
  }

  if (typeof window === 'undefined') {
    return resolved;
  }

  try {
    return new URL(resolved, window.location.origin).toString();
  } catch {
    return resolved;
  }
};
