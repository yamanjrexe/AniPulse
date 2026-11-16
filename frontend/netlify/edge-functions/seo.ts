// @ts-nocheck
import type { Context } from "https://edge.netlify.com/";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent") || "";


  const isBot =
    /bot|crawler|spider|prerender|discord|twitter|facebook|slack|whatsapp|telegram/i.test(
      userAgent,
    );

  if (
    isBot &&
    url.pathname.startsWith("/u/") &&
    url.pathname.endsWith("/profile")
  ) {
    const username = url.pathname.split("/")[2];

    try {
      const res = await fetch(
        `https://anipulse-63jv.onrender.com/api/user/profile/${username}`,
      );

      if (res.ok) {
        const data = await res.json();
        const html = await context.next();
        const text = await html.text();

        const newHtml = text
          .replace(
            /<title>.*?<\/title>/,
            `<title>${data.name}'s Profile | AniPulse</title>`,
          )
          .replace(
            /<meta property="og:title" content=".*?"/,
            `<meta property="og:title" content="${data.name}'s Profile | AniPulse"`,
          )
          .replace(
            /<meta property="og:description" content=".*?"/,
            `<meta property="og:description" content="${data.bio || "Check out my anime stats, level, and achievements on AniPulse!"}"`,
          )
          .replace(
            /<meta property="og:image" content=".*?"/,
            `<meta property="og:image" content="${data.avatar || "https://ani-pulse.netlify.app/og-image.jpg"}"`,
          )
          .replace(
            /<meta property="twitter:title" content=".*?"/,
            `<meta property="twitter:title" content="${data.name}'s Profile | AniPulse"`,
          )
          .replace(
            /<meta property="twitter:description" content=".*?"/,
            `<meta property="twitter:description" content="${data.bio || "Check out my anime stats, level, and achievements on AniPulse!"}"`,
          )
          .replace(
            /<meta property="twitter:image" content=".*?"/,
            `<meta property="twitter:image" content="${data.avatar || "https://ani-pulse.netlify.app/og-image.jpg"}"`,
          );

        return new Response(newHtml, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
    } catch (e) {
    }
  }

  return context.next();
};
