import React from "react";

function SocialIcon({ platform }) {
  if (platform === "anilist")
    return (
      <img
        src="/svg/anilist.svg"
        alt="AniList"
        style={{ width: 18, height: 18, objectFit: "contain" }}
      />
    );
  if (platform === "myanimelist")
    return (
      <img
        src="/svg/myanimelist.svg"
        alt="MAL"
        style={{ width: 18, height: 18, objectFit: "contain" }}
      />
    );
  if (platform === "twitter")
    return <i className="fab fa-twitter" style={{ fontSize: "1rem" }} />;
  if (platform === "instagram")
    return <i className="fab fa-instagram" style={{ fontSize: "1rem" }} />;
  return null;
}

function getSocialUrl(platform, username) {
  if (!username) return "#";
  const cleanUsername = username.replace(/^@/, "").trim();
  switch (platform) {
    case "anilist":
      return `https://anilist.co/user/${cleanUsername}`;
    case "myanimelist":
      return `https://myanimelist.net/profile/${cleanUsername}`;
    case "twitter":
      return `https://twitter.com/${cleanUsername}`;
    case "instagram":
      return `https://instagram.com/${cleanUsername}`;
    default:
      return `https://${platform}.com/${cleanUsername}`;
  }
}

export default function ProfileHeader({
  data,
  onShare,
  onReport,
  onEdit,
  isPreview,
  onTogglePreview,
}) {
  const ld = data.levelData || {
    level: 1,
    title: "Newbie",
    totalXP: 0,
    progress: 0,
    nextLevelXP: 100,
    nextTitle: "Scout",
  };

  const formatJoinDate = (dateStr) => {
    if (!dateStr) return "Recently";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const socialKeys = Object.keys(data.socialLinks || {}).filter(
    (k) => data.socialLinks[k],
  );

  return (
    <header className="profileHeader">
      <div className="profileHeaderTop">
        <div className="profileHeaderAvatarArea">
          <img
            src={
              data.avatar ||
              `https://ui-avatars.com/api/?name=${data.name}&background=FCE706&color=000&size=200`
            }
            alt={data.name}
            className="profileHeaderAvatar"
          />
        </div>

        <div className="profileHeaderInfo">
          <div className="profileHeaderNameRow">
            <h1>{data.name}</h1>
            {data.isOwner && (
              <i
                className="fas fa-check-circle verifiedBadge"
                title="This is you"
              />
            )}
          </div>
          <div className="profileHeaderTitle">
            <span className="titleBadge">
              <i className="fas fa-medal" /> Level {ld.level} - {ld.title}
            </span>
          </div>

          {data.createdAt && (
            <div className="profileHeaderMeta">
              <i className="fas fa-calendar-plus" /> Member since{" "}
              {formatJoinDate(data.createdAt)}
            </div>
          )}

          <div className="profileHeaderActions">
            {data.isOwner ? (
              <>
                <button className="btn btn-secondary btn-sm" onClick={onEdit}>
                  Edit Profile
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={onTogglePreview}
                >
                  {isPreview ? "Exit Preview" : "Preview as Visitor"}
                </button>
              </>
            ) : data.isRealOwner ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={onTogglePreview}
              >
                Exit Preview
              </button>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={onReport}>
                Report
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={onShare}>
              <i className="fas fa-link" /> Copy URL
            </button>

            {socialKeys.length > 0 && (
              <div className="profileHeaderSocials">
                {socialKeys.map((k) => (
                  <a
                    key={k}
                    href={getSocialUrl(k, data.socialLinks[k])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="socialIconBtn"
                    title={`${k}: ${data.socialLinks[k]}`}
                  >
                    <SocialIcon platform={k} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="profileHeaderXpArea">
          <div className="xpHeader">
            <span className="xpLabel">Total XP</span>
            <span className="xpValue">{ld.totalXP.toLocaleString()}</span>
          </div>
          <div className="xpProgressWrapper">
            <div className="xpProgressBar">
              <div
                className="xpProgressFill"
                style={{ width: `${ld.progress}%` }}
              />
            </div>
            <span className="xpProgressText">{ld.progress.toFixed(1)}%</span>
          </div>
          <div className="xpNextLevel">
            Next: {ld.nextTitle} ({ld.nextLevelXP.toLocaleString()})
          </div>
        </div>
      </div>

      <div className="profileLevelTrackWrapper">
        <div className="profileLevelTrack">
          <div className="levelNode">
            <div className="levelIcon">
              <i className="fas fa-shield-alt" />
            </div>
            <div className="levelName">Start</div>
            <div className="levelReq">0 XP</div>
          </div>
          <div className="levelLine">
            <div className="levelLineFill" style={{ width: "100%" }} />
          </div>
          <div className="levelNode active">
            <div className="levelIcon">
              <i className="fas fa-star" />
            </div>
            <div className="levelName">Current</div>
            <div className="levelReq">Lv. {ld.level}</div>
          </div>
          <div className="levelLine" />
          <div className="levelNode">
            <div className="levelIcon">
              <i className="fas fa-lock" />
            </div>
            <div className="levelName">Next</div>
            <div className="levelReq">{ld.nextLevelXP.toLocaleString()} XP</div>
          </div>
        </div>
      </div>

      <div className="profileBioRow">
        <div>
          <div className="bioLabel">BIO</div>
          <div className="bioText">
            {data.bio ||
              "No bio yet. Add a short intro for your public profile."}
          </div>
        </div>
        {data.isOwner && (
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>
            <i className="fas fa-pen" /> Edit
          </button>
        )}
      </div>
    </header>
  );
}
