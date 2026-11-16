import React from "react";
import { Helmet } from "react-helmet-async";

export default function Seo({
  title,
  description,
  url,
  image,
  type = "website",
}) {
  const siteTitle = "AniPulse";
  const fullTitle = title
    ? `${title} | ${siteTitle}`
    : `${siteTitle} | Modern Anime Tracker & Analytics`;
  const defaultDesc =
    "Track your anime watchlist, sync with AniList, visualize your viewing habits with deep analytics, and compete on lightning-fast global leaderboards.";
  const finalDesc = description || defaultDesc;

  const siteUrl = "https://ani-pulse.netlify.app";
  const finalUrl = url ? `${siteUrl}${url}` : siteUrl;

  const defaultImage = `${siteUrl}/og-image.jpg`;
  const finalImage = image || defaultImage;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={finalDesc} />
      <link rel="canonical" href={finalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:site_name" content="AniPulse" />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={finalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDesc} />
      <meta name="twitter:image" content={finalImage} />
    </Helmet>
  );
}
