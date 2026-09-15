export interface TrendingEntry {
  rank: number;
  artist: string;
  title: string;
  label: string;
  genre: string;
  releaseDate: string;
  metacriticScore: number;
}

// "Still Trending — Best of 2026": notable releases from this year, new studio
// albums only (no comps, live albums, or reissues). Mirrors the marketing
// site's Year to Date · Highest Rated section — static editorial content,
// not user/Firestore data.
export const TRENDING_2026: TrendingEntry[] = [
  { rank: 1, artist: 'Phoebe Bridgers', title: 'Lost Weekend', label: 'Dead Oceans', genre: 'Indie Folk', releaseDate: 'Aug 14', metacriticScore: 91 },
  { rank: 2, artist: 'Olivia Rodrigo', title: 'you seem pretty sad for a girl so in love', label: 'Geffen', genre: 'Pop', releaseDate: 'Jun 12', metacriticScore: 90 },
  { rank: 3, artist: 'Ella Langley', title: 'Dandelion', label: 'Sawgod / Columbia', genre: 'Country', releaseDate: 'Apr 10', metacriticScore: 86 },
  { rank: 4, artist: 'Death Cab for Cutie', title: 'I Built You a Tower', label: 'ANTI-', genre: 'Indie Rock', releaseDate: 'Jun 5', metacriticScore: 84 },
  { rank: 5, artist: 'Madonna', title: 'Confessions II', label: 'Warner', genre: 'Dance-Pop', releaseDate: 'Jul 3', metacriticScore: 83 },
  { rank: 6, artist: 'Iceage', title: 'For Love of Grace & the Hereafter', label: 'Mexican Summer', genre: 'Post-Punk', releaseDate: 'May 29', metacriticScore: 83 },
  { rank: 7, artist: "Ed O'Brien", title: 'Blue Morpho', label: 'Transgressive', genre: 'Art Rock', releaseDate: 'May 22', metacriticScore: 82 },
  { rank: 8, artist: 'Paul McCartney', title: 'The Boys of Dungeon Lane', label: 'Capitol', genre: 'Pop/Rock', releaseDate: 'May 29', metacriticScore: 82 },
  { rank: 9, artist: 'Boards of Canada', title: 'Inferno', label: 'Warp', genre: 'Electronic', releaseDate: 'May 29', metacriticScore: 81 },
  { rank: 10, artist: 'Kurt Vile', title: "Philadelphia's Been Good to Me", label: 'Verve Forecast', genre: 'Indie Rock', releaseDate: 'May 29', metacriticScore: 79 },
];
