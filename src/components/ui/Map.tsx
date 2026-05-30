import type { CmsMapServiceName } from '@/lib/cms/site-settings';
import type { Locale } from '@/lib/i18n/locale';

type CompanyMapProps = Readonly<{
  locale: Locale;
  coordinates: {
    lat: number;
    lng: number;
    zoom: number;
  };
  mapService: CmsMapServiceName;
  title: string;
  text: string;
  placeholder: string;
  frameTitle: string;
  openMapLabel: string;
}>;

type MapService = Readonly<{
  attribution?: {
    href: string;
    label: string;
    title: string;
  };
  badge: string;
  externalUrl: string;
  iframeUrl: string | null;
}>;

const GCJ_PI = Math.PI;
const GCJ_A = 6378245.0;
const GCJ_EE = 0.006693421622965943;

function transformLat(x: number, y: number) {
  let result = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y;
  result += 0.2 * Math.sqrt(Math.abs(x));
  result += ((20.0 * Math.sin(6.0 * x * GCJ_PI) + 20.0 * Math.sin(2.0 * x * GCJ_PI)) * 2.0) / 3.0;
  result += ((20.0 * Math.sin(y * GCJ_PI) + 40.0 * Math.sin((y / 3.0) * GCJ_PI)) * 2.0) / 3.0;
  result +=
    ((160.0 * Math.sin((y / 12.0) * GCJ_PI) + 320 * Math.sin((y * GCJ_PI) / 30.0)) * 2.0) / 3.0;
  return result;
}

function transformLng(x: number, y: number) {
  let result = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y;
  result += 0.1 * Math.sqrt(Math.abs(x));
  result += ((20.0 * Math.sin(6.0 * x * GCJ_PI) + 20.0 * Math.sin(2.0 * x * GCJ_PI)) * 2.0) / 3.0;
  result += ((20.0 * Math.sin(x * GCJ_PI) + 40.0 * Math.sin((x / 3.0) * GCJ_PI)) * 2.0) / 3.0;
  result +=
    ((150.0 * Math.sin((x / 12.0) * GCJ_PI) + 300.0 * Math.sin((x / 30.0) * GCJ_PI)) * 2.0) / 3.0;
  return result;
}

function outOfChina(lng: number, lat: number) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function gcj02ToWgs84(lng: number, lat: number) {
  if (outOfChina(lng, lat)) {
    return { lat, lng };
  }

  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * GCJ_PI;
  let magic = Math.sin(radLat);
  magic = 1 - GCJ_EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((GCJ_A * (1 - GCJ_EE)) / (magic * sqrtMagic)) * GCJ_PI);
  dLng = (dLng * 180.0) / ((GCJ_A / sqrtMagic) * Math.cos(radLat) * GCJ_PI);
  const mgLat = lat + dLat;
  const mgLng = lng + dLng;

  return {
    lat: lat * 2 - mgLat,
    lng: lng * 2 - mgLng,
  };
}

function buildOpenStreetMapFrameUrl(
  coordinates: CompanyMapProps['coordinates'],
  useGcjOffset: boolean,
) {
  const normalized = useGcjOffset ? gcj02ToWgs84(coordinates.lng, coordinates.lat) : coordinates;
  const viewportSize = Math.max(0.004, 0.07 / Math.max(1, coordinates.zoom - 8));
  const frameUrl = new URL('https://www.openstreetmap.org/export/embed.html');

  frameUrl.searchParams.set(
    'bbox',
    [
      normalized.lng - viewportSize,
      normalized.lat - viewportSize,
      normalized.lng + viewportSize,
      normalized.lat + viewportSize,
    ].join(','),
  );
  frameUrl.searchParams.set('layer', 'mapnik');
  frameUrl.searchParams.set('marker', `${normalized.lat},${normalized.lng}`);

  return frameUrl.toString();
}

function buildMapService(
  locale: Locale,
  mapService: CmsMapServiceName,
  coordinates: CompanyMapProps['coordinates'],
): MapService {
  const amapCoordinates = `${coordinates.lng},${coordinates.lat}`;
  const googleCoordinates = `${coordinates.lat},${coordinates.lng}`;

  if (mapService === 'amap') {
    const url = new URL('https://uri.amap.com/marker');
    url.searchParams.set('position', amapCoordinates);
    url.searchParams.set('name', '湖南永霏特种防护用品有限公司');
    url.searchParams.set('src', 'yourfield');
    url.searchParams.set('coordinate', 'gaode');
    url.searchParams.set('callnative', '0');

    return {
      attribution: {
        href: 'https://www.openstreetmap.org/copyright',
        label: '© OpenStreetMap contributors',
        title: 'OpenStreetMap 版权与许可',
      },
      badge: '地图预览',
      externalUrl: url.toString(),
      iframeUrl: buildOpenStreetMapFrameUrl(coordinates, true),
    };
  }

  const language = locale === 'ru' ? 'ru' : 'en';
  const frameUrl = new URL('https://www.google.com/maps');
  frameUrl.searchParams.set('q', googleCoordinates);
  frameUrl.searchParams.set('z', String(coordinates.zoom));
  frameUrl.searchParams.set('output', 'embed');
  frameUrl.searchParams.set('hl', language);

  const externalUrl = new URL('https://www.google.com/maps/search/');
  externalUrl.searchParams.set('api', '1');
  externalUrl.searchParams.set('query', googleCoordinates);
  externalUrl.searchParams.set('hl', language);

  return {
    badge: 'Google Maps',
    externalUrl: externalUrl.toString(),
    iframeUrl: frameUrl.toString(),
  };
}

export function CompanyMap({
  locale,
  coordinates,
  mapService: mapServiceName,
  title,
  text,
  placeholder,
  frameTitle,
  openMapLabel,
}: CompanyMapProps) {
  const mapService = buildMapService(locale, mapServiceName, coordinates);
  const shellClassName = mapService.attribution
    ? 'map-shell map-shell--with-attribution'
    : 'map-shell';

  return (
    <div className={shellClassName} aria-label={frameTitle}>
      <div className="map-container">
        <div className="map-fallback">
          <p>{placeholder}</p>
        </div>

        {mapService.iframeUrl ? (
          <iframe
            className="map-frame"
            title={frameTitle}
            src={mapService.iframeUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : null}

        {mapService.attribution ? (
          <div className="map-attribution-mask">
            <a
              className="map-attribution"
              href={mapService.attribution.href}
              target="_blank"
              rel="noopener noreferrer"
              title={mapService.attribution.title}
            >
              {mapService.attribution.label}
            </a>
          </div>
        ) : null}
      </div>

      <div className="map-panel">
        <button className="map-panel__trigger" type="button" aria-label={title}>
          <span className="map-panel__pin" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
        </button>

        <div className="map-panel__detail">
          <div className="map-panel__top">
            <span className="map-panel__pin" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <span className="map-service-badge">{mapService.badge}</span>
          </div>

          <div className="map-panel__head">
            <h3>{title}</h3>
          </div>

          <p className="map-panel-text">{text}</p>

          <a
            className="map-open-link"
            href={mapService.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{openMapLabel}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 17 17 7" />
              <path d="M9 7h8v8" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
