import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  browserLocalPersistence, setPersistence,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, doc, addDoc, setDoc, getDocs,
  deleteDoc, onSnapshot, query, orderBy }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyA8wS0zP4dcQaUgYgbsFHf7JtniR4_-BSQ",
  authDomain:        "goodman-ccd8c.firebaseapp.com",
  projectId:         "goodman-ccd8c",
  storageBucket:     "goodman-ccd8c.firebasestorage.app",
  messagingSenderId: "982073264367",
  appId:             "1:982073264367:web:fbae7e1fd0fae8a210731a",
  measurementId:     "G-ERXFM7SPN4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export {
  auth, db, provider,
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  browserLocalPersistence, setPersistence,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  collection, doc, addDoc, setDoc, getDocs, deleteDoc, onSnapshot, query, orderBy
};
