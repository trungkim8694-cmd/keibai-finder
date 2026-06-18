import { headers } from 'next/headers';

/**
 * Validates whether an incoming API request is sent from the official browser client
 * by checking Referer hosts and custom validation headers.
 * 
 * Returns true if valid, false if blocked.
 */
export async function validateApiRequest(): Promise<boolean> {
  const headersList = await headers();
  const referer = headersList.get('referer');
  const origin = headersList.get('origin');
  const customHeader = headersList.get('x-app-client');

  const isDev = process.env.NODE_ENV === 'development';
  const allowedHost = process.env.NEXTAUTH_URL || 'https://www.keibai-koubai.com';
  
  // 1. Verify custom header
  if (customHeader !== 'keibai-finder-client') {
    console.warn('API Blocked: Missing or invalid x-app-client header.');
    return false;
  }

  // 2. Verify referer or origin
  if (!referer && !origin) {
    console.warn('API Blocked: Missing both Referer and Origin headers.');
    return false;
  }

  const checkHost = (hostStr: string): boolean => {
    if (isDev) {
      return hostStr.startsWith('localhost') || hostStr.startsWith('127.0.0.1');
    }
    try {
      const allowedUrlObj = new URL(allowedHost);
      return hostStr === allowedUrlObj.host || hostStr === 'keibai-koubai.com' || hostStr === 'www.keibai-koubai.com';
    } catch {
      return false;
    }
  };

  try {
    if (referer) {
      if (referer.startsWith('chrome-extension://')) {
        return true;
      }
      const refererUrl = new URL(referer);
      if (checkHost(refererUrl.host)) {
        return true;
      }
    }

    if (origin) {
      if (origin.startsWith('chrome-extension://')) {
        return true;
      }
      const originUrl = new URL(origin);
      if (checkHost(originUrl.host)) {
        return true;
      }
    }

    console.warn('API Blocked: Referer/Origin does not match allowed hosts.');
    return false;
  } catch (e) {
    console.warn('API Blocked: Invalid Referer or Origin URL syntax.');
    return false;
  }
}
