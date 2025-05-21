const sidebar = document.getElementById("sidebar");
const menuIcon = document.querySelector(".menu-icon i");
const closeSidebar = document.getElementById("closeSidebar");

menuIcon.addEventListener("click", () => {
  sidebar.classList.add("open");
});
closeSidebar.addEventListener("click", () => {
  sidebar.classList.remove("open");
});

// CLOUDINARY
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dgyw6dtv3/image/upload";
const CLOUDINARY_PRESET = "EduTasker_preset";

// FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  push,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCPiw_BpB0lQqpJ8M_XkJgukwCAb9I2vQM",
  authDomain: "edutasker-cd056.firebaseapp.com",
  databaseURL:
    "https://edutasker-cd056-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "edutasker-cd056",
  storageBucket: "edutasker-cd056.appspot.com",
  messagingSenderId: "499676743785",
  appId: "1:499676743785:web:d6b93b8e695d1bf656baf8",
  measurementId: "G-H7MKZDPJS3",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const firestore = getFirestore(app);

// DOM Elements
const profileImage = document.getElementById("profileImage");
const editPicBtn = document.getElementById("editPicBtn");
const uploadPicInput = document.getElementById("uploadPic");
const uploadSpinner = document.getElementById("uploadSpinner");
const borderColorPicker = document.getElementById("borderColorPicker");
const changeColorBtn = document.getElementById("changeColorBtn");

const userIDEl = document.getElementById("userID");
const usernameEl = document.getElementById("username");

const nicknameInput = document.getElementById("nickname");
const birthdayInput = document.getElementById("birthday");
const ageInput = document.getElementById("age");
const pronounsInput = document.getElementById("pronouns");
const bioInput = document.getElementById("bio");
const availabilityInput = document.getElementById("availability");

const editBtn = document.getElementById("editBtn");
const saveExitBtn = document.getElementById("saveExitBtn");
const deleteChangesBtn = document.getElementById("deleteChangesBtn");
const logoutBtn = document.getElementById("logoutBtn");
const feedbackBtn = document.getElementById("feedbackBtn");
const editOptions = document.getElementById("editOptions");
const triggerUpload = document.getElementById("triggerUpload");
const speechBubble = document.getElementById("speechBubble");

const profileForm = document.getElementById("profileForm");

let currentUserID = null;
let originalData = {};

// Load user data
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserID = user.uid;
    userIDEl.textContent = currentUserID;
    usernameEl.textContent = user.displayName || "N/A";

    const userRef = ref(db, `users/${currentUserID}`);
    get(userRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          originalData = { ...data };
          nicknameInput.value = data.nickname || "";
          birthdayInput.value = data.birthday || "";
          ageInput.value = data.age || "";
          pronounsInput.value = data.pronouns || "";
          bioInput.value = data.bio || "";
          availabilityInput.value = data.availability || "";
          if (data.profilePicture) {
            profileImage.src = data.profilePicture;
          }
          if (data.profileBorderColor) {
            profileImage.style.borderColor = data.profileBorderColor;
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load user data:", err);
      });
  } else {
    alert("Please sign in to view your account.");
    window.location.href = "index.html";
  }
});

// === Edit Mode for Form ===
editBtn.addEventListener("click", () => {
  profileForm.classList.remove("read-only");
  [...profileForm.elements].forEach((input) => (input.disabled = false));

  saveExitBtn.classList.remove("hidden");
  deleteChangesBtn.classList.remove("hidden");
  editBtn.classList.add("hidden");
});

// === Save & Exit ===
saveExitBtn.addEventListener("click", async () => {
  if (!currentUserID) return;

  const confirmSave = confirm("Do you want to save these profile changes?");
  if (!confirmSave) return;

  const updates = {
    nickname: nicknameInput.value,
    birthday: birthdayInput.value,
    age: ageInput.value,
    pronouns: pronounsInput.value,
    bio: bioInput.value,
    availability: availabilityInput.value,
    profileBorderColor: profileImage.style.borderColor || "#ccc",
  };

  const userRef = ref(db, `users/${currentUserID}`);
  try {
    await set(userRef, updates);
    try {
      const authUser = auth.currentUser;
      if (authUser) {
        const firestoreUserRef = doc(firestore, "users", auth.currentUser.uid);
        await setDoc(firestoreUserRef, { nickname: nicknameInput.value }, { merge: true });
        console.log("Nickname saved to Firestore.");
      }
    } catch (error) {
      console.error("Failed to save nickname to Firestore:", error);
    }    
    // Update Firebase Auth user profile (displayName and photoURL)
    const authUser = auth.currentUser;
    if (authUser) {
      try {
        await updateProfile(authUser, {
          displayName: nicknameInput.value || authUser.displayName,
          photoURL: profileImage.src || authUser.photoURL,
        });
        console.log("Firebase Auth profile updated");
      } catch (error) {
        console.error("Error updating Firebase Auth profile:", error);
      }
    }

    alert("Profile saved successfully!");
    profileForm.classList.add("read-only");
    [...profileForm.elements].forEach((input) => (input.disabled = true));
    editBtn.classList.remove("hidden");
    saveExitBtn.classList.add("hidden");
    deleteChangesBtn.classList.add("hidden");
  } catch (err) {
    alert("Error saving profile: " + err.message);
  }
});

// === Delete Changes ===
deleteChangesBtn.addEventListener("click", () => {
  const confirmReset = confirm("Are you sure you want to discard changes?");
  if (!confirmReset) return;

  nicknameInput.value = originalData.nickname || "";
  birthdayInput.value = originalData.birthday || "";
  ageInput.value = originalData.age || "";
  pronounsInput.value = originalData.pronouns || "";
  bioInput.value = originalData.bio || "";
  availabilityInput.value = originalData.availability || "";

  profileForm.classList.add("read-only");
  [...profileForm.elements].forEach((input) => (input.disabled = true));

  editBtn.classList.remove("hidden");
  saveExitBtn.classList.add("hidden");
  deleteChangesBtn.classList.add("hidden");
});

// === Edit Picture & Border Color ===
editPicBtn.addEventListener("click", () => {
  uploadPicInput.click();
  borderColorPicker.classList.toggle("hidden");
  speechBubble.style.display = "block";
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
      body: formData,
    });

    const data = await response.json();
    if (!data.secure_url)
      throw new Error("Cloudinary did not return a secure URL");

    const imageUrl = data.secure_url;
    profileImage.setAttribute("src", imageUrl);

    const userRef = ref(db, `users/${currentUserID}`);
    const snapshot = await get(userRef);
    const oldData = snapshot.val() || {};
    await update(userRef, {
      ...oldData,
      profilePicture: imageUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    alert("Image upload failed.");
  } finally {
    uploadSpinner.style.display = "none";
  }
});

// === Border Color Picker ===
window.addEventListener("DOMContentLoaded", () => {
  const borderColorPicker = document.getElementById("borderColorPicker");
  const profileImage = document.getElementById("profileImage");

  borderColorPicker.addEventListener("input", async (e) => {
    const newColor = e.target.value;
    profileImage.style.borderColor = newColor;

    if (currentUserID) {
      try {
        const userRef = ref(db, `users/${currentUserID}`);
        await update(userRef, {
          profileBorderColor: newColor,
        });
      } catch (err) {
        console.error("Failed to save border color:", err);
      }
    }
  });
});

// === Change Background Color Button ===
changeColorBtn.addEventListener("click", () => {
  borderColorPicker.click();
});

// === Logout ===
window.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn.addEventListener("click", () => {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      signOut(auth)
        .then(() => {
          window.location.href = "index.html";
        })
        .catch((error) => {
          alert("Logout failed: " + error.message);
        });
    }
  });
});

// === Feedback ===
feedbackBtn.addEventListener("click", () => {
  const confirmFeedback = confirm("Do you want to send your feedback?");
  if (!confirmFeedback) return;

  const feedbackText = prompt("Please enter your feedback below:");
  if (!feedbackText) return;

  const feedbackRef = ref(db, `feedback/${currentUserID}`);
  push(feedbackRef, {
    message: feedbackText,
    timestamp: Date.now(),
  })
    .then(() => alert("Thank you for your feedback!"))
    .catch((err) => alert("Feedback error: " + err.message));
});
