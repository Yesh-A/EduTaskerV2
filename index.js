import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// 🔥 Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPiw_BpB0lQqpJ8M_XkJgukwCAb9I2vQM",
  authDomain: "edutasker-cd056.firebaseapp.com",
  projectId: "edutasker-cd056",
  storageBucket: "edutasker-cd056.firebasestorage.app",
  messagingSenderId: "499676743785",
  appId: "1:499676743785:web:d6b93b8e695d1bf656baf8",
  measurementId: "G-H7MKZDPJS3",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

let isLoggingIn = false;

// ✅ Email/Password Login
const submit = document.getElementById("submit"); 
submit.addEventListener("click", function (event) {
  event.preventDefault();

  if (isLoggingIn) return;
  isLoggingIn = true;

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          photoURL: user.photoURL || "https://via.placeholder.com/100"
        });
        console.log("User added to Firestore ✅");
      }

      alert("Logging in...");
      window.location.href = "homepage.html";
    })
    .catch((error) => {
      alert(error.message);
    })
    .finally(() => {
      isLoggingIn = false;
    });
});

// ✅ Google Sign-In
const googleLoginBtn = document.querySelector(".google-login");
googleLoginBtn.addEventListener("click", function () {
  if (isLoggingIn) return;
  isLoggingIn = true;

  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider)
    .then(async (result) => {
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          photoURL: user.photoURL || "https://via.placeholder.com/100"
        });
        console.log("Google user added to Firestore ✅");
      }

      alert("Logged in with Google!");
      window.location.href = "homepage.html";
    })
    .catch((error) => {
      console.error("Google Login Error:", error);
      alert(error.message);
    })
    .finally(() => {
      isLoggingIn = false;
    });
});

// GENERAL FUNCTIONS
document.addEventListener("DOMContentLoaded", () => {
  const dropdowns = ["mission", "vision", "team"];

  dropdowns.forEach((id) => {
    const toggle = document.querySelector(`#arrow-${id}`).parentElement;
    const content = document.getElementById(`content-${id}`);
    const arrow = document.getElementById(`arrow-${id}`);

    toggle.addEventListener("click", () => {
      content.classList.toggle("open");
      arrow.classList.toggle("rotate");
    });
  });
});

function showHelp() {
  alert(
    "Need help?\n\n1. Visit the About section to learn more.\n2. Follow the Tutorial for a walkthrough.\n3. Contact us if you need more support!"
  );
}
