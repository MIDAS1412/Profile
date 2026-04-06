import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { Shell } from '../components/Shell'

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
  const [geo, setGeo] = useState<GeoState>({
    loading: true,
    error: null,
    latitude: null,
    longitude: null,
    accuracy: null,
    updatedAt: null,
  })

  useEffect(() => {
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
  }, [])

  const mapLink = useMemo(() => {
    if (geo.latitude === null || geo.longitude === null) {
      return '#'
    }

    return `https://www.google.com/maps?q=${geo.latitude},${geo.longitude}`
  }, [geo.latitude, geo.longitude])

  const center =
    geo.latitude !== null && geo.longitude !== null
      ? [geo.latitude, geo.longitude]
      : [10.8231, 106.6297]

  return (
    <Shell accent="ocean">
      <div className="page map-page">
        <header className="topbar">
          <div>
            <p className="topbar-label">Live map</p>
            <strong>Current device location</strong>
          </div>
          <nav className="topbar-nav">
            <Link to="/">Profile</Link>
          </nav>
        </header>

        <section className="hero-grid map-layout">
          <article className="card map-panel">
            <p className="card-kicker">Geolocation</p>
            <h1>See where you are right now.</h1>
            <p className="hero-bio">
              This page reads the current browser position, places it on a real map,
              and gives quick actions for external navigation.
            </p>

            <div className="map-status-grid">
              <div className="status-box">
                <span>Status</span>
                <strong>{geo.loading ? 'Requesting permission' : geo.error ? 'Unavailable' : 'Live'}</strong>
              </div>
              <div className="status-box">
                <span>Latitude</span>
                <strong>{geo.latitude?.toFixed(6) ?? '--'}</strong>
              </div>
              <div className="status-box">
                <span>Longitude</span>
                <strong>{geo.longitude?.toFixed(6) ?? '--'}</strong>
              </div>
              <div className="status-box">
                <span>Accuracy</span>
                <strong>{geo.accuracy ? `${Math.round(geo.accuracy)} m` : '--'}</strong>
              </div>
            </div>

            <div className="hero-actions">
              <a
                className="primary-button"
                href={mapLink}
                rel="noreferrer"
                target="_blank"
              >
                Open in Google Maps
              </a>
              <Link className="ghost-button" to="/">
                Back to profile
              </Link>
            </div>

            {geo.updatedAt && (
              <p className="map-updated">
                Updated at{' '}
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
              <MapContainer center={center as [number, number]} zoom={15} scrollWheelZoom>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {geo.latitude !== null && geo.longitude !== null && (
                  <Marker icon={defaultIcon} position={[geo.latitude, geo.longitude]}>
                    <Popup>You are here.</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </article>
        </section>
      </div>
    </Shell>
  )
}
