const LEVEL_THRESHOLDS = {
  1: 0, 2: 100, 3: 250, 4: 500, 5: 800,
  6: 1200, 7: 1700, 8: 2300, 9: 3000, 10: 4000,
  11: 5200, 12: 6500, 13: 8000, 14: 10000, 15: 12500,
  16: 15000, 17: 18000, 18: 22000, 19: 27000, 20: 35000,
  21: 45000, 22: 53000, 23: 62000, 24: 72000, 25: 83000,
  26: 95000, 27: 108000, 28: 122000, 29: 137000, 30: 153000,
  31: 170000, 32: 188000, 33: 207000, 34: 227000, 35: 248000,
  36: 270000, 37: 293000, 38: 317000, 39: 342000, 40: 368000,
  41: 395000, 42: 423000, 43: 452000, 44: 482000, 45: 513000,
  46: 545000, 47: 578000, 48: 612000, 49: 647000, 50: 683000,
};

const LEVEL_TITLES = {
  1: 'Rookie', 2: 'Scout', 3: 'Watcher', 4: 'Otaku', 5: 'Binger',
  6: 'Enthusiast', 7: 'Senpai', 8: 'Shonen', 9: 'Protagonist', 10: 'Veteran',
  11: 'Ronin', 12: 'Shinobi', 13: 'Vanguard', 14: 'Captain', 15: 'Hashira',
  16: 'Sensei', 17: 'Sage', 18: 'Kage', 19: 'Warlord', 20: 'Champion',
  21: 'Hero', 22: 'Legend', 23: 'Mythic', 24: 'Paragon', 25: 'Phantom',
  26: 'Sovereign', 27: 'Overlord', 28: 'Emperor', 29: 'Awakened', 30: 'Ascendant',
  31: 'Demigod', 32: 'Valkyrie', 33: 'Titan', 34: 'Archon', 35: 'Deity',
  36: 'Seraph', 37: 'Celestial', 38: 'Immortal', 39: 'Transcendent', 40: 'Divine',
  41: 'Astral', 42: 'Nebula', 43: 'Supernova', 44: 'Chronos', 45: 'Voidwalker',
  46: 'Genesis', 47: 'Apex', 48: 'Omega', 49: 'Infinite', 50: 'Omnipotent',
};

function getLevelFromXP(xp) {
  const v = Math.max(0, Number(xp) || 0);
  for (let level = 50; level >= 1; level--) {
    if (v >= LEVEL_THRESHOLDS[level]) return level;
  }
  return 1;
}

function getTitleForLevel(level) {
  return LEVEL_TITLES[level] || LEVEL_TITLES[50];
}

function getXPToNextLevel(currentLevel, currentXP) {
  const nextXP = LEVEL_THRESHOLDS[currentLevel + 1];
  if (!nextXP) return 0;
  return Math.max(0, nextXP - currentXP);
}

function getXPProgress(currentLevel, currentXP) {
  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel] || 0;
  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel + 1] || currentLevelXP;
  if (nextLevelXP === currentLevelXP) return 100;
  return ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
}

function calculateExpFromParts(
  { episodes = 0, progress = 0, duration = 20, type = 'TV', score = 0, hasScore = false } = {},
  options = {}
) {
  const safeEpisodes = Math.min(episodes, 2000);
  const safeProgress = Math.min(progress, safeEpisodes);
  const safeDuration = Math.min(duration, 180);
  const safeScore = Math.min(Math.max(score, 0), 10);

  const eps = options.useProgress ? Math.max(0, safeProgress) : Math.max(0, safeEpisodes);
  const episodeBonus = Math.floor(eps / 2);

  let scoreBonus = 0;
  if (safeScore >= 9) scoreBonus = 8;
  else if (safeScore >= 8) scoreBonus = 5;
  else if (safeScore >= 7) scoreBonus = 3;

  const movieBonus = type && type.toLowerCase() === 'movie' ? 15 : 0;
  const progressBonus = Math.floor(safeProgress / 5);
  const ratingBonus = hasScore ? 2 : 0;
  const totalMinutes = safeProgress * safeDuration;
  const timeBonus = Math.floor((totalMinutes / 60) * 2);

  return Math.max(
    0,
    Math.floor(episodeBonus + scoreBonus + movieBonus + progressBonus + ratingBonus + timeBonus)
  );
}

function calculateTotalXPFromAnimeList(animeList) {
  if (!Array.isArray(animeList)) return 0;
  let total = 0;
  animeList.forEach((a) => {
    if (a.userStatus !== 'Completed') return;
    const effectiveProgress =
      a.progress > 0 ? a.progress : (a.episodes || 0);
    total +=
      calculateExpFromParts(
        {
          episodes: a.episodes || 0,
          progress: effectiveProgress,
          duration: a.duration || 20,
          type: a.type,
          score: a.score || 0,
          hasScore: !!a.score,
        },
        { useProgress: true }
      ) + 10;
  });
  return Math.max(0, Math.floor(total));
}

function calculateTotalHours(animeList) {
  if (!animeList || !Array.isArray(animeList)) return 0;
  let totalMinutes = 0;
  animeList.forEach((anime) => {
    if (anime.type === 'Movie') {
      totalMinutes += anime.duration || 120;
    } else {
      const eps = anime.progress || anime.episodes || 0;
      const epDur = anime.duration || 20;
      totalMinutes += eps * epDur;
    }
  });
  return Math.round(totalMinutes / 60);
}

module.exports = {
  LEVEL_THRESHOLDS,
  LEVEL_TITLES,
  getLevelFromXP,
  getTitleForLevel,
  getXPToNextLevel,
  getXPProgress,
  calculateExpFromParts,
  calculateTotalXPFromAnimeList,
  calculateTotalHours,
};