import type { Barber, TattooArtist } from '@/types';

export const BARBERS: Barber[] = [
  {
    name: 'Lionel Chavez',
    ghlUserId: '1kFG5FWdUDhXLUX46snG',
    photoUrl: 'https://storage.googleapis.com/msgsndr/GLRkNAxfPtWTqTiN83xj/media/68780cc2204f2d4cf6d61a1d.jpeg',
    calendars: {
      haircut: 'Bsv9ngkRgsbLzgtN3Vpq',
      haircutBeard: 'pGNsYjGyEYW9LCD1GcQN',
    },
  },
  {
    name: 'Drew Smith',
    ghlUserId: 'zKiZ5w3ImX0bA7zrFIZx',
    photoUrl: 'https://storage.googleapis.com/msgsndr/GLRkNAxfPtWTqTiN83xj/media/6776135510dd0d56888c6556.jpeg',
    calendars: {
      haircut: 'AzIK0eW09u4V1jJTXQ0x',
      haircutBeard: 'dCuPcZbqylgwftyDu8kw',
    },
  },
  {
    name: 'Logan Jensen',
    ghlUserId: 'XrbRTwVGMwgcGOgD2a5n',
    photoUrl: 'https://storage.googleapis.com/msgsndr/GLRkNAxfPtWTqTiN83xj/media/674558dbe0a90824854ccdc9.jpeg',
    calendars: {
      haircut: 'o1fvyti3GnoFGKZN5Hwr',
      haircutBeard: 'lsBgjayKLFOUahMvuVNe',
    },
  },
  {
    name: 'Elle Gibeau',
    ghlUserId: 'sLkO5CwFrhdcM7EOtTvg',
    photoUrl: 'https://storage.googleapis.com/msgsndr/GLRkNAxfPtWTqTiN83xj/media/67761327b0a11f1886bd0c31.jpeg',
    calendars: {
      haircut: 'Bcqa2hqjUX7xhNu37cL1',
      haircutBeard: 'D9l8VEIX7hOLrqSrSJVc',
    },
  },
  {
    name: 'David Mackflin',
    ghlUserId: '47m7vgAy8cwELwCBE3LT',
    photoUrl: 'https://storage.googleapis.com/msgsndr/GLRkNAxfPtWTqTiN83xj/media/672aff993db84f7fc885c3c0.jpeg',
    calendars: {
      haircut: 'qvcPzTqyaQOxsijIQqAN',
      haircutBeard: 'prLxqGcd2JYNnb0sPGmc',
    },
  },
  {
    name: 'Joshua Flores',
    ghlUserId: 'Dm20lBxWvG393LUoxuEV',
    photoUrl: 'https://storage.googleapis.com/msgsndr/GLRkNAxfPtWTqTiN83xj/media/6752720a988a5fa5209a4c0f.jpeg',
    calendars: {
      haircut: 'X1xINoRML65yAOVUsAGa',
      haircutBeard: 'Vs496YAmFt5uX2JTg2Bs',
    },
  },
  {
    name: 'Albe Herrera',
    ghlUserId: 'm0i0Q9vfa2YTmxLrrriK',
    photoUrl: 'https://storage.googleapis.com/msgsndr/GLRkNAxfPtWTqTiN83xj/media/674e5a20d9a12ed259a96d7a.jpeg',
    calendars: {
      haircut: 'h9VQL30IBqr6TTiKwAQm',
      haircutBeard: 'NZSQNzPM10Fe6mUuJuyU',
    },
  },
  {
    name: 'Liam Meagher',
    ghlUserId: 'GBzpanPloybTcnPEIzpE',
    photoUrl: 'https://storage.googleapis.com/msgsndr/GLRkNAxfPtWTqTiN83xj/media/67a460d2d78c08132ea508a1.jpeg',
    calendars: {
      haircut: 'kiGx7ec1vj9e62U33ZhU',
      haircutBeard: 'vLpnhjAc93piHn1e2cfQ',
    },
  },
  {
    name: 'Gilberto Castro',
    ghlUserId: 'F6m7GBKeyIRcehYkubfe',
    photoUrl: 'https://storage.googleapis.com/msgsndr/GLRkNAxfPtWTqTiN83xj/media/698a50f6a41b878dfb2300da.jpg',
    calendars: {
      haircut: '38Uhu6i5W4L5yGJbE0My',
      haircutBeard: '7Bj9t1Gwi0zcJRTwCvYA',
    },
  },
  {
    name: 'Anna Kinkead',
    ghlUserId: '7iWsFK2Lao8GNZIawDDx',
    photoUrl: 'https://msgsndr-private.storage.googleapis.com/user/7iWsFK2Lao8GNZIawDDx/profile/a8a4bc70-af11-44e5-9614-15f2fc15a9c7.jpg',
  },
];

export const TATTOO_ARTISTS: TattooArtist[] = [
  {
    name: 'Joan Martinez',
    ghlUserId: '1wuLf50VMODExBSJ9xPI',
    photoUrl: 'https://storage.googleapis.com/msgsndr/mUemx2jG4wly4kJWBkI4/media/687e8015c4e6b05baad9752b.jpeg',
    calendarId: '0oW0C4kLB6qh1qa1WV9c',
  },
  {
    name: 'Andrew Fernan',
    ghlUserId: 'O8ChoMYj1BmMWJJsDlvC',
    photoUrl: 'https://storage.googleapis.com/msgsndr/mUemx2jG4wly4kJWBkI4/media/6890f7c2275c41683a54eec5.jpeg',
    calendarId: '9KwARaShHhymNjgarXgA',
  },
];

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://studio-az-setter-backend.onrender.com';

export const LOGO_WHITE = 'https://assets.cdn.filesafe.space/GLRkNAxfPtWTqTiN83xj/media/69a5f238618c8d1afd552d67.png';
export const LOGO_BLACK = 'https://assets.cdn.filesafe.space/GLRkNAxfPtWTqTiN83xj/media/69a5f238320ef4ff2cd71f70.png';
