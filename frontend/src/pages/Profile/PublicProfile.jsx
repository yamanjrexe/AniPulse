import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { profileService } from "../../services/profileService";
import { useToast } from "../../context/ToastContext.jsx";
import ProfileHeader from "./components/ProfileHeader";
import OverviewStats from "./components/OverviewStats";
import AnimeStats from "./components/AnimeStats";
import FavouritesShelf from "./components/FavouritesShelf";
import AchievementsShelf from "./components/AchievementsShelf";
import WatchingSidebar from "./components/WatchingSidebar";
import RecentDiscussions from "./components/RecentDiscussions";
import LatestActivities from "./components/LatestActivities";
import ReportProfileModal from "./components/ReportProfileModal";
import Seo from "../../components/seo/Seo.jsx";
import "../../styles/pages/PublicProfile.css";

function ProfileSkeleton() {
  return (
    <div className="publicProfileWrapper">
      <div className="publicProfileGrid">
        <div className="publicProfileMain">
          <div className="profileHeader skeleton-box" style={{ height: 350 }} />
          <div
            className="profileSection skeleton-box"
            style={{ height: 120 }}
          />
          <div
            className="profileSection skeleton-box"
            style={{ height: 250 }}
          />
          <div
            className="profileSection skeleton-box"
            style={{ height: 200 }}
          />
        </div>
        <div className="publicProfileSidebar">
          <div
            className="profileSection skeleton-box"
            style={{ height: 350 }}
          />
          <div
            className="profileSection skeleton-box"
            style={{ height: 200 }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PublicProfile() {
  const { username } = useParams();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [previewAsVisitor, setPreviewAsVisitor] = useState(false);

  useEffect(() => {
    let active = true;
    profileService
      .getPublicProfile(username, previewAsVisitor)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [username, previewAsVisitor]);

  const handleShare = async () => {
    const targetUrl = `${window.location.origin}/u/${username.toLowerCase()}/profile`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username}'s Anime Profile`,
          url: targetUrl,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(targetUrl);
      showToast("Profile link copied.", "success");
    }
  };

  if (error)
    return (
      <div className="publicProfileError">
        <h2>Oops!</h2>
        <p>{error}</p>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    );

  if (!data) return <ProfileSkeleton />;

  const profileSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: data.name,
      description: data.bio || `AniPulse Anime Profile for ${data.name}`,
      image:
        data.avatar && !data.avatar.startsWith("data:image")
          ? data.avatar
          : "https://ani-pulse.netlify.app/icon/Anipulse.png",
      url: `https://ani-pulse.netlify.app/u/${username.toLowerCase()}/profile`,
    },
  };

  return (
    <div className="publicProfileWrapper">
      <Seo
        title={`${data.name}'s Profile`}
        description={
          data.bio ||
          `Check out ${data.name}'s anime stats, level, and achievements on AniPulse!`
        }
        url={`/u/${username.toLowerCase()}/profile`}
        image={
          data.avatar && !data.avatar.startsWith("data:image")
            ? data.avatar
            : undefined
        }
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(profileSchema)}
        </script>
      </Helmet>

      <div className="publicProfileGrid">
        <div className="publicProfileMain">
          <ProfileHeader
            data={data}
            onShare={handleShare}
            onReport={() => setReportOpen(true)}
            onEdit={() => navigate("/settings?tab=profile")}
            isPreview={previewAsVisitor}
            onTogglePreview={() => setPreviewAsVisitor(!previewAsVisitor)}
          />

          {data.stats !== undefined && <OverviewStats stats={data.stats} />}
          {data.stats !== undefined && <AnimeStats stats={data.stats} />}

          {data.favoriteAnime !== undefined && (
            <FavouritesShelf
              items={data.favoriteAnime}
              isOwner={data.isOwner}
              onEdit={() => navigate("/settings?tab=profile")}
            />
          )}

          {data.unlockedAchievements !== undefined && (
            <AchievementsShelf achievements={data.unlockedAchievements} />
          )}

          {data.recentCompletions !== undefined && (
            <LatestActivities
              activities={data.recentCompletions}
              name={data.name}
            />
          )}
        </div>

        <div className="publicProfileSidebar">
          {data.currentlyWatching !== undefined && (
            <WatchingSidebar items={data.currentlyWatching} />
          )}
          {data.recentDiscussions !== undefined && (
            <RecentDiscussions discussions={data.recentDiscussions} />
          )}
        </div>
      </div>

      {reportOpen && (
        <ReportProfileModal
          uid={data.uid}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}
