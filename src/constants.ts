// Constants and default values

export const CLOUDFLARE_PORTS = [443, 2053, 2083, 2087, 2096, 8443];

export const DEFAULT_ALPN_LIST = ['h3', 'h2', 'http/1.1'];

export const DEFAULT_FINGERPRINTS = [
  'chrome',
  'firefox',
  'safari',
  'edge',
  'ios',
  'android',
  'random',
  'randomized'
];

export const SUPPORTED_PROTOCOLS = ['vless', 'vmess', 'trojan'];

export const DEFAULT_PROVIDERS = [
  'https://raw.githubusercontent.com/vfarid/v2ray-worker/main/resources/provider-list.txt'
];

export const DEFAULT_PROXY_IPS = [
  'bpb.yousef.isegaro.com',
  'cdn.xn--b6gac.eu.org',
  'cdn-all.xn--b6gac.eu.org',
  'workers.cloudflare.cyou'
];

export const CLOUDFLARE_CIDRS = [
  '162.159.192.0/24',
  '162.159.193.0/24',
  '162.159.195.0/24',
  '188.114.96.0/24',
  '188.114.97.0/24',
  '188.114.98.0/24',
  '188.114.99.0/24'
];

export const WS_READY_STATE_OPEN = 1;
export const WS_READY_STATE_CLOSING = 2;

// Fragment settings for bypassing DPI
export const FRAGMENT_SETTINGS = {
  packets: 'tlshello',
  length: '100-200',
  interval: '10-20'
};

// Countries list (Cloudflare CDN countries)
export const AVAILABLE_COUNTRIES = [
  'US', 'GB', 'DE', 'FR', 'NL', 'CA', 'AU', 'SG', 'JP', 'IN', 'BR', 'IT', 'ES', 'SE', 'CH', 'NO'
];

// Panel color scheme
export const PANEL_THEME = {
  primary: '#4a90e2',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  dark: '#343a40',
  light: '#f8f9fa'
};
