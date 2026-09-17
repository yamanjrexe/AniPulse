import React from "react";

const SOCIAL_ICON = {
    anilist: "fa-list-ul",
    myanimelist: "fa-book",
    twitter: "fa-twitter",
    instagram: "fa-instagram",
};

export default function ProfilePreviewBanner({ profile }) {
    const name = profile.name || profile.username || "User";
    const avatar =
        profile.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FCE706&color=050505&bold=true&size=200`;

    const socialKeys = Object.keys(profile.social || {}).filter(
        (k) => profile.social[k],
    );

    return (
        <div id="profilePreviewBanner">
            {profile.cover && (
                <img id="coverPreviewImage" src={profile.cover} alt="Cover" />
            )}
            <div className="banner-gradient" />
            <div className="banner-content">
                <img
                    id="profilePreviewAvatar"
                    className="profile-preview-avatar"
                    src={avatar}
                    alt={name}
                />
                <div className="profile-preview-info">
                    <div className="profile-preview-name">{name}</div>
                    <div className="profile-preview-join-date">
                        <i
                            className="fas fa-calendar-plus"
                            aria-hidden="true"
                        />
                        <span>
                            Member since {profile.memberSince || "Recently"}
                        </span>
                    </div>
                    <div id="profilePreviewDetails">
                        {profile.bio && (
                            <span id="previewBio">{profile.bio}</span>
                        )}
                        {profile.status && (
                            <span id="previewStatus">{profile.status}</span>
                        )}
                        {profile.favoriteAnime?.length > 0 && (
                            <div id="previewFavAnime">
                                {profile.favoriteAnime.map((id, i) => (
                                    <span key={i} className="fav-tag">
                                        #{id}
                                    </span>
                                ))}
                            </div>
                        )}
                        {socialKeys.length > 0 && (
                            <div id="previewSocials">
                                {socialKeys.map((k) => (
                                    <a
                                        key={k}
                                        href={`https://${k}.com/${profile.social[k]}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <i
                                            className={`${k === "twitter" || k === "instagram" ? "fab" : "fas"} ${SOCIAL_ICON[k]}`}
                                        />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
