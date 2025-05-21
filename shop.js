const sidebar = document.getElementById('sidebar');
  const menuIcon = document.querySelector('.menu-icon i');
  const closeSidebar = document.getElementById('closeSidebar');

  menuIcon.addEventListener('click', () => {
    sidebar.classList.add('open');
  });

  closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });

  //
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
     
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.style.display = 'none');

      tab.classList.add('active');
      const id = tab.getAttribute('data-tab');
      document.getElementById(id).style.display = 'grid';
    });
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


  // coin.js
document.addEventListener("DOMContentLoaded", () => {
  const coinDisplay = document.querySelector(".coin-wrapper .coin-display span");
  const addBtn = document.querySelector(".coin-wrapper .add-coin-btn");

  auth.onAuthStateChanged((user) => {
    if (!user) {
      console.warn("User not signed in");
      return;
    }

    const userDoc = db.collection("users").doc(user.uid);

    // Listen for coin changes in real time
    userDoc.onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        const coins = data.coins || 0;
        coinDisplay.textContent = coins;
      } else {
        // Initialize coin count if not present
        userDoc.set({ coins: 0 });
      }
    });

    // Function to update coins
    const updateCoins = async (amount) => {
      try {
        await db.runTransaction(async (transaction) => {
          const doc = await transaction.get(userDoc);
          const currentCoins = doc.exists ? doc.data().coins || 0 : 0;
          transaction.update(userDoc, {
            coins: currentCoins + amount,
          });
        });
      } catch (e) {
        console.error("Transaction failed: ", e);
      }
    };

    // Handle + button click
    addBtn?.addEventListener("click", () => updateCoins(1));

    // Optional: Expose globally
    window.updateCoins = updateCoins;
  });
});

