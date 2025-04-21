const sidebar = document.getElementById('sidebar');
const menuIcon = document.querySelector('.menu-icon i');
const closeSidebar = document.getElementById('closeSidebar');

menuIcon.addEventListener('click', () => {
  sidebar.classList.add('open');
});
closeSidebar.addEventListener('click', () => {
  sidebar.classList.remove('open');
});

// CLOUDINARY
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dgyw6dtv3/image/upload';
const CLOUDINARY_PRESET = 'EduTasker_preset'; 

// FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCPiw_BpB0lQqpJ8M_XkJgukwCAb9I2vQM",
  authDomain: "edutasker-cd056.firebaseapp.com",
  databaseURL: "https://edutasker-cd056-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "edutasker-cd056",
  storageBucket: "edutasker-cd056.appspot.com",
  messagingSenderId: "499676743785",
  appId: "1:499676743785:web:d6b93b8e695d1bf656baf8",
  measurementId: "G-H7MKZDPJS3"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const profileImage = document.getElementById("profileImage");
const changePicBtn = document.getElementById("changePicBtn");
const uploadPicInput = document.getElementById("uploadPic");
const uploadSpinner = document.getElementById("uploadSpinner");

const userIDEl = document.getElementById("userID");
const usernameEl = document.getElementById("username");

const nicknameInput = document.getElementById("nickname");
const birthdayInput = document.getElementById("birthday");
const ageInput = document.getElementById("age");
const pronounsInput = document.getElementById("pronouns");
const bioInput = document.getElementById("bio");
const availabilityInput = document.getElementById("availability");

const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");

let currentUserID = null;

// Load user data
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserID = user.uid;
    userIDEl.textContent = currentUserID;
    usernameEl.textContent = user.displayName || "N/A";

    const userRef = ref(db, `users/${currentUserID}`);
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        nicknameInput.value = data.nickname || "";
        birthdayInput.value = data.birthday || "";
        ageInput.value = data.age || "";
        pronounsInput.value = data.pronouns || "";
        bioInput.value = data.bio || "";
        availabilityInput.value = data.availability || "";
        if (data.profilePicture) {
          profileImage.src = data.profilePicture;
        }
      }
    }).catch((err) => {
      console.error("Failed to load user data:", err);
    });
  } else {
    alert("Please sign in to view your account.");
    window.location.href = "index.html";
  }
});

// Save changes
saveBtn.addEventListener("click", () => {
  if (!currentUserID) return;

  const updates = {
    nickname: nicknameInput.value,
    birthday: birthdayInput.value,
    age: ageInput.value,
    pronouns: pronounsInput.value,
    bio: bioInput.value,
    availability: availabilityInput.value
  };

  const userRef = ref(db, `users/${currentUserID}`);
  set(userRef, updates)
    .then(() => alert("Profile saved!"))
    .catch((err) => alert("Error saving profile: " + err.message));
});

// Reset form
resetBtn.addEventListener("click", () => {
  nicknameInput.value = "";
  birthdayInput.value = "";
  ageInput.value = "";
  pronounsInput.value = "";
  bioInput.value = "";
  availabilityInput.value = "";
});

// Upload profile picture
changePicBtn.addEventListener("click", () => {
  uploadPicInput.click();
});

uploadPicInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  uploadSpinner.style.display = "block";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    console.log("Cloudinary response:", data); 

    if (!data.secure_url) {
      throw new Error("Cloudinary did not return a secure URL");
    }

    const imageUrl = data.secure_url;

    const profileImageElement = document.getElementById("profileImage");
    profileImageElement.setAttribute("src", imageUrl);

    const userRef = ref(db, `users/${currentUserID}`);
    const snapshot = await get(userRef);
    const oldData = snapshot.val() || {};
    await update(userRef, {
      ...oldData,
      profilePicture: imageUrl
    });

  } catch (error) {
    console.error("Upload error:", error);
    alert("Image upload failed.");
  } finally {
    uploadSpinner.style.display = "none";
  }
});