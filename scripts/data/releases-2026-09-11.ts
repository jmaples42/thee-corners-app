import { Release } from '../../src/firebase/firestore';

type WeekRelease = Omit<Release, 'id' | 'commentCount' | 'createdAt' | 'publishedBy'> & {
  commentCount?: number;
  createdAt?: number;
};

export const WEEK_RELEASES: WeekRelease[] = [
  {
    weekOf: '2026-09-11',
    artist: 'Sylvan Esso',
    title: 'Ow ∞',
    coverArtUrl: 'https://f4.bcbits.com/img/a0712120107_10.jpg',
    format: 'LP',
    tier: 'indie',
    genres: ['Electronic'],
    label: 'Psychic Hotline',
    blurb: 'The duo’s most rhythmically restless record yet.',
    releaseDate: Date.parse('2026-09-11'),
    links: {
      spotify: 'https://open.spotify.com',
      bandcamp: 'https://sylvanesso.bandcamp.com',
    },
    isFeatured: true,
  },
  {
    weekOf: '2026-09-11',
    artist: 'Pretty Sick',
    title: 'Anarchy',
    coverArtUrl: 'https://f4.bcbits.com/img/a0825338573_10.jpg',
    format: 'LP',
    tier: 'indie',
    genres: ['Shoegaze', 'Rock-Electronic'],
    label: 'Dirty Hit',
    trackCount: 10,
    blurb: 'Sabrina Fuentes, prod. Oscar Scheller — sophomore LP.',
    releaseDate: Date.parse('2026-09-11'),
    links: {
      bandcamp: 'https://prettysick.bandcamp.com/album/anarchy',
      spotify: 'https://open.spotify.com',
    },
    editorsTake: {
      uid: 'editorial-jon',
      username: 'jon m.',
      text: "Sabrina Fuentes doesn't sound like she's trying to fit any scene here — shoegaze, rap cadence, rock-electronic maximalism, all crashing together on her own terms. 'Star' is the hook that'll get you in, but the record earns its title.",
      isEssential: true,
    },
    isFeatured: true,
  },
];
