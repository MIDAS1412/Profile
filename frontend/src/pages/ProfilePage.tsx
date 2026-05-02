import { Shell } from '../components/Shell'
import { ProfileExperience } from '../components/ProfileExperience'
import { useProfile } from '../hooks/useProfile'
import { useProfileViews } from '../hooks/useProfileViews'

export function ProfilePage() {
  const { data, loading, error } = useProfile()
  const { count: viewCount, loading: viewCountLoading } = useProfileViews()

  return (
    <Shell accent="ember">
      {loading && (
        <div className="page profile-page cyber-page">
          <section className="panel loading-card">
            <p className="card-kicker">Booting profile</p>
            <h1>Loading your profile experience...</h1>
            <p>Fetching the profile payload from the API before rendering the full layout.</p>
          </section>
        </div>
      )}

      {error && !loading && (
        <div className="page profile-page cyber-page">
          <section className="panel error-card">
            <p className="card-kicker">Profile error</p>
            <h1>Could not load profile data.</h1>
            <p>{error}</p>
          </section>
        </div>
      )}

      {data && !loading && !error && (
        <ProfileExperience data={data} viewCount={viewCount} viewCountLoading={viewCountLoading} />
      )}
    </Shell>
  )
}
