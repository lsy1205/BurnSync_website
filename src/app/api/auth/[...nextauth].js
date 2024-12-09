import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';
import { FirebaseAdapter } from '@next-auth/firebase-adapter';
import { getFirestore } from 'firebase/firestore';
import app from '../../../utils/firebase';

const firestore = getFirestore(app);

export default NextAuth({
  providers: [
    Providers.Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        // 在此處理使用者驗證邏輯
      },
    }),
  ],
  adapter: FirebaseAdapter(firestore),
  pages: {
    signIn: '/auth/signin',
  },
});
