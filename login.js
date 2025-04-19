import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword,  GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

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

const submit = document.getElementById("submit"); 
submit.addEventListener("click", function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      alert("Loging in");
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert(error.message);
    });
});

const googleLoginBtn = document.querySelector(".google-login");

googleLoginBtn.addEventListener("click", function () {
  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider)
    .then((result) => {
      alert("Logged in with Google!");
      window.location.href = "index.html"; 
    })
    .catch((error) => {
      console.error("Google Login Error:", error);
      alert(error.message);
    });
});

//GENERAL FUNCTIONS

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