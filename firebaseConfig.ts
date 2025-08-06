import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDye2Fw-Vv6gH-r6GFWcBvg-gRc-rvWcEg",
  authDomain: "soulmayte-ai.firebaseapp.com",
  projectId: "soulmayte-ai",
  storageBucket: "soulmayte-ai.firebasestorage.app",
  messagingSenderId: "670940802161",
  appId: "1:670940802161:web:bfc22f16cb22578051bfd0",
  measurementId: "G-L4NMT7DKS3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
