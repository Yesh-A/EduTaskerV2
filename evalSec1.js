const sidebar = document.getElementById("sidebar");
const menuIcon = document.querySelector(".menu-icon i");
const closeSidebar = document.getElementById("closeSidebar");

menuIcon.addEventListener("click", () => {
  sidebar.classList.add("open");
});

closeSidebar.addEventListener("click", () => {
  sidebar.classList.remove("open");
});
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCPiw_BpB0lQqpJ8M_XkJgukwCAb9I2vQM",
  authDomain: "edutasker-cd056.firebaseapp.com",
  projectId: "edutasker-cd056",
  storageBucket: "edutasker-cd056.appspot.com",
  messagingSenderId: "499676743785",
  appId: "1:499676743785:web:d6b93b8e695d1bf656baf8",
  measurementId: "G-H7MKZDPJS3",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth();


onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const groupListDiv = document.getElementById("groupList");
      groupListDiv.innerHTML = "";

      const snapshot = await getDocs(collection(db, "groups"));

      snapshot.forEach((doc) => {
        const group = doc.data();
        const groupId = doc.id;

        const groupEl = document.createElement("div");
        groupEl.textContent = group.name || "Unnamed Group";
        groupEl.style.border = "2px solid orange";
        groupEl.style.color = "#1a5e63";
        groupEl.style.cursor = "pointer";
        groupEl.style.padding = "10px";
        groupEl.style.marginBottom = "10px";

        groupEl.addEventListener("click", () => {
          window.location.href = `evalSec2.html?groupId=${groupId}`;
        });

        groupListDiv.appendChild(groupEl);
      });
    } catch (err) {
      console.error("Error loading groups:", err);
    }
  } else {
    console.warn("User is not signed in.");
  }
});
