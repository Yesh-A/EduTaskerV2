const sidebar = document.getElementById('sidebar');
const menuIcon = document.querySelector('.menu-icon i');
const closeSidebar = document.getElementById('closeSidebar');

menuIcon.addEventListener('click', () => {
  sidebar.classList.add('open');
});

closeSidebar.addEventListener('click', () => {
  sidebar.classList.remove('open');
});
 
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCPiw_BpB0lQqpJ8M_XkJgukwCAb9I2vQM",
  authDomain: "edutasker-cd056.firebaseapp.com",
  projectId: "edutasker-cd056",
  storageBucket: "edutasker-cd056.appspot.com",
  messagingSenderId: "499676743785",
  appId: "1:499676743785:web:d6b93b8e695d1bf656baf8",
  measurementId: "G-H7MKZDPJS3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const coinDisplay = document.querySelector('.coin-display span');
const claimButtons = document.querySelectorAll('.daily-rewards .claim-button');
const achievementButtons = document.querySelectorAll('.achievement-card button');

let userRef;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        coins: 0,
        lastClaimedDaily: null,
        claimedAchievements: {
          mvp: false,
          mostLikable: false,
          bestWork: false
        }
      });
    }

    updateCoinDisplay();
    handleDailyReward();
    setupAchievementClaims();
  }
});

// Display coin count
async function updateCoinDisplay() {
  const userSnap = await getDoc(userRef);
  coinDisplay.textContent = userSnap.data().coins;
}

// Handle daily reward
async function handleDailyReward() {
  const userSnap = await getDoc(userRef);
  const lastClaimed = userSnap.data().lastClaimedDaily?.toDate?.() || new Date(userSnap.data().lastClaimedDaily);
  const now = new Date();

  const diff = now - new Date(lastClaimed);
  const hoursPassed = diff / (1000 * 60 * 60);

  claimButtons.forEach(btn => {
    btn.disabled = hoursPassed < 24;
    if (!btn.disabled) {
      btn.addEventListener('click', async () => {
        await updateDoc(userRef, {
          coins: userSnap.data().coins + 1,
          lastClaimedDaily: now.toISOString()
        });
        updateCoinDisplay();
        btn.disabled = true;
      });
    }
  });
}

// Handle achievement claims
function setupAchievementClaims() {
  achievementButtons.forEach(async (btn, idx) => {
    const key = ["mvp", "mostLikable", "bestWork"][idx];
    const userSnap = await getDoc(userRef);
    const claimed = userSnap.data().claimedAchievements[key];

    if (claimed) {
      btn.disabled = true;
      btn.textContent = "CLAIMED";
    } else {
      btn.addEventListener("click", async () => {
        await updateDoc(userRef, {
          coins: userSnap.data().coins + 5,
          [`claimedAchievements.${key}`]: true
        });
        updateCoinDisplay();
        btn.disabled = true;
        btn.textContent = "CLAIMED";
      });
    }
  });
}