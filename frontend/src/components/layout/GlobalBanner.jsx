import React, { useState, useEffect } from "react";
import { RELEASES } from "../../pages/Resources/Changelog.jsx";

const SHARE_DISMISS_KEY = "anipulse_share_banner_dismissed";
const FINAL_DISMISS_KEY = "anipulse_final_banner_dismissed";
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export default function GlobalBanner() {
  const [showShare, setShowShare] = useState(false);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    const isFinalVersionLive = RELEASES && RELEASES[0]?.version === "3.3.0";

    const isDismissedRecently = (key) => {
      const dismissedAt = localStorage.getItem(key);
      if (!dismissedAt) return false;
      return Date.now() - parseInt(dismissedAt, 10) < COOLDOWN_MS;
    };

    setShowShare(!isDismissedRecently(SHARE_DISMISS_KEY));
    if (isFinalVersionLive) {
      setShowFinal(!isDismissedRecently(FINAL_DISMISS_KEY));
    }
  }, []);

  const handleDismissShare = () => {
    localStorage.setItem(SHARE_DISMISS_KEY, Date.now().toString());
    setShowShare(false);
  };

  const handleDismissFinal = () => {
    localStorage.setItem(FINAL_DISMISS_KEY, Date.now().toString());
    setShowFinal(false);
  };

  if (!showShare && !showFinal) return null;

  return (
    <div className="global-banner-wrapper">
      {showFinal && (
        <div className="global-banner final-banner">
          <div className="banner-content">
            <i className="fas fa-flag-checkered banner-icon" />
            <span>
              <strong>AniPulse v3.3.0 is here.</strong> This is the final major
              release. Thank you for an incredible journey!
            </span>
          </div>
          <button
            className="banner-close"
            onClick={handleDismissFinal}
            aria-label="Dismiss"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      {showShare && (
        <div className="global-banner share-banner">
          <div className="banner-content">
            <i className="fas fa-info-circle banner-icon" />
            <span>
              If you enjoy the website, please consider sharing it with your
              friends. Thank you!
            </span>
          </div>
          <button
            className="banner-close"
            onClick={handleDismissShare}
            aria-label="Dismiss"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      )}
    </div>
  );
}
