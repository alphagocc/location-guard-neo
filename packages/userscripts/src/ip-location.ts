interface IpPosition {
  latitude: number;
  longitude: number;
  ip: string;
}

function gmFetch(url: string, timeout = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: 'GET',
      url,
      timeout,
      onload(res) {
        if (res.status >= 200 && res.status < 300) {
          resolve(res.responseText);
        }
        else {
          reject(new Error(`HTTP ${res.status}`));
        }
      },
      onerror() {
        reject(new Error(`Network error: ${url}`));
      },
      ontimeout() {
        reject(new Error(`Timeout: ${url}`));
      },
    });
  });
}

const CF_TRACE_URLS = [
  'https://cloudflare.com/cdn-cgi/trace',
  'https://1.1.1.1/cdn-cgi/trace',
  'https://[2606:4700:4700::1001]/cdn-cgi/trace',
];

export async function fetchCurrentIp(): Promise<string> {
  for (const url of CF_TRACE_URLS) {
    try {
      const text = await gmFetch(url, 3000);
      const match = /^ip=(.+)$/m.exec(text);
      if (match)
        return match[1].trim();
    }
    catch {
      // try next
    }
  }
  throw new Error('Failed to detect current IP');
}

async function fromIpinfo(): Promise<IpPosition> {
  const text = await gmFetch('https://ipinfo.io/json');
  const data = JSON.parse(text);
  const [lat, lon] = (data.loc as string).split(',').map(Number);
  if (Number.isNaN(lat) || Number.isNaN(lon))
    throw new Error('Invalid ipinfo response');
  return { latitude: lat, longitude: lon, ip: data.ip };
}

async function fromIp2location(): Promise<IpPosition> {
  const text = await gmFetch('https://api.ip2location.io/');
  const data = JSON.parse(text);
  const lat = Number(data.latitude);
  const lon = Number(data.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lon))
    throw new Error('Invalid ip2location response');
  return { latitude: lat, longitude: lon, ip: data.ip };
}

async function fromIpApi(): Promise<IpPosition> {
  const text = await gmFetch('http://ip-api.com/json/?fields=8409');
  const data = JSON.parse(text);
  if (typeof data.lat !== 'number' || typeof data.lon !== 'number' || !data.query)
    throw new Error('Invalid ip-api response');
  return { latitude: data.lat, longitude: data.lon, ip: data.query };
}

const PROVIDERS = [fromIpinfo, fromIp2location, fromIpApi];

export async function fetchIpPosition(): Promise<IpPosition> {
  for (const provider of PROVIDERS) {
    try {
      return await provider();
    }
    catch {
      // try next
    }
  }
  throw new Error('All IP geolocation providers failed');
}
