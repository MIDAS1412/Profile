import { Link } from 'react-router-dom'

export function MapPreviewCard() {
  return (
    <aside className="card map-preview-card">
      <div className="mini-map-grid" aria-hidden="true">
        <span />
        <span />
        <span />
        <span className="pin" />
      </div>
      <p className="card-kicker">Live location</p>
      <h3>Open the map page to see your position in real time.</h3>
      <p>
        The map view requests browser geolocation, shows coordinates, accuracy,
        and lets you jump to an external map instantly.
      </p>
      <Link className="ghost-button" to="/map">
        View map
      </Link>
    </aside>
  )
}
