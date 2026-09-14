import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBYke6HHvcYxh-0UglHVC-pcYbdifxRBpc',
  authDomain: 'thee-corners.firebaseapp.com',
  projectId: 'thee-corners',
  storageBucket: 'thee-corners.firebasestorage.app',
  messagingSenderId: '320646789578',
  appId: '1:320646789578:web:03d3d013279f588374b733',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const COLLECTIONS = {
  USERS: 'users',
  POSTS: 'posts',
  CORNERS: 'corners',
  RELEASES: 'releases',
};
