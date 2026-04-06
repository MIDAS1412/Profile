import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { Shell } from '../components/Shell'
import { useProfile } from '../hooks/useProfile'

type GeoState = {
  loading: boolean
  error: string | null
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  updatedAt: number | null
}

const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
})

export function MapPage() {
  const { data } = useProfile()
  const [geo, setGeo] = useState<GeoState>({
    loading: false,
    error: null,
    latitude: null,
    longitude: null,
    accuracy: null,
    updatedAt: null,
  })

  const requestDeviceLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeo({
        loading: false,
        error: 'This browser does not support geolocation.',
        latitude: null,
        longitude: null,
        accuracy: null,
        updatedAt: null,
      })
      return
    }

    setGeo((current) => ({
      ...current,
      loading: true,
      error: null,
    }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({
          loading: false,
          error: null,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          updatedAt: Date.now(),
        })
      },
      (error) => {
        setGeo({
          loading: false,
          error: error.message,
          latitude: null,
          longitude: null,
          accuracy: null,
          updatedAt: null,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    )
  }

  const activeLatitude = geo.latitude ?? data?.location.latitude ?? 10.8231
  const activeLongitude = geo.longitude ?? data?.location.longitude ?? 106.6297
  const activeSource = geo.latitude !== null && geo.longitude !== null ? 'Device' : 'Saved'
  const locationLabel = geo.latitude !== null && geo.longitude !== null ? 'Current device position' : data?.location.label ?? 'Saved profile location'
  const locationDescription =
    geo.latitude !== null && geo.longitude !== null
      ? 'Pulled from browser geolocation.'
      : data?.location.description ?? 'No saved location configured.'

  const mapLink = useMemo(
    () => `https://www.google.com/maps?q=${activeLatitude},${activeLongitude}`,
    [activeLatitude, activeLongitude],
  )

  return (
    <Shell accent="ocean">
      <div className="page map-page">
        <header className="topbar">
          <div>
            <p className="topbar-label">Live map</p>
            <strong>Saved location + device fallback</strong>
          </div>
          <nav className="topbar-nav">
            <Link to="/">Profile</Link>
            <Link to="/admin">Admin</Link>
          </nav>
        </header>

        <section className="hero-grid map-layout">
          <article className="card map-panel">
            <p className="card-kicker">Location view</p>
            <h1>See your saved spot and update it from admin.</h1>
            <p className="hero-bio">
              The map centers on the saved coordinates from the admin page. If you want,
              you can also read the current device location and temporarily switch to it.
            </p>

            <div className="map-status-grid">
              <div className="status-box">
                <span>Source</span>
                <strong>{geo.loading ? 'Requesting device location' : activeSource}</strong>
              </div>
              <div className="status-box">
                <span>Location</span>
                <strong>{locationLabel}</strong>
              </div>
              <div className="status-box">
                <span>Latitude</span>
                <strong>{activeLatitude.toFixed(6)}</strong>
              </div>
              <div className="status-box">
                <span>Longitude</span>
                <strong>{activeLongitude.toFixed(6)}</strong>
              </div>
            </div>

            <p className="map-updated">{locationDescription}</p>

            <div className="hero-actions">
              <a
                className="primary-button"
                href={mapLink}
                rel="noreferrer"
                target="_blank"
              >
                Open in Google Maps
              </a>
              <button className="ghost-button" onClick={requestDeviceLocation} type="button">
                {geo.loading ? 'Reading location...' : 'Use current device location'}
              </button>
              <Link className="ghost-button" to="/admin">
                Edit saved location
              </Link>
            </div>

            {geo.updatedAt && (
              <p className="map-updated">
                Device location updated at{' '}
                {new Intl.DateTimeFormat('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }).format(new Date(geo.updatedAt))}
              </p>
            )}

            {geo.error && <p className="map-error">{geo.error}</p>}
          </article>

          <article className="card map-canvas-card">
            <div className="map-canvas">
              <MapContainer
                center={[activeLatitude, activeLongitude]}
                key={`${activeLatitude}-${activeLongitude}`}
                scrollWheelZoom
                zoom={15}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker icon={defaultIcon} position={[activeLatitude, activeLongitude]}>
                  <Popup>{locationLabel}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </article>
        </section>
      </div>
    </Shell>
  )
}
