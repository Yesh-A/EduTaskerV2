/*function toggleMenu() {
  document.getElementById('navIcons').classList.toggle('show');
}

// Optional: close on outside click
document.addEventListener('click', function (e) {
  const navIcons = document.getElementById('navIcons');
  const toggleBtn = document.querySelector('.menu-toggle');
  if (!navIcons.contains(e.target) && !toggleBtn.contains(e.target)) {
    navIcons.classList.remove('show');
  }
});*/


import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  query,
  where,
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
const auth = getAuth(app);

let addedMembers = [];

const showFeedback = (msg, isError = true) => {
  const feedback = document.getElementById("feedback");
  feedback.textContent = msg;
  feedback.style.color = isError ? "red" : "green";
  feedback.classList.add("visible");
  setTimeout(() => feedback.classList.remove("visible"), 3000);
};

function updateActivityLog(groupId, uid) {
  const logRef = doc(db, "groups", groupId, "activityLogs", uid);
  setDoc(logRef, {
    lastActive: serverTimestamp()
  }, { merge: true });
}
document.addEventListener("DOMContentLoaded", () => {


  // Sidebar toggle logic
  const sidebar = document.getElementById('sidebar');
  const menuIcon = document.querySelector('.menu-icon i');
  const closeSidebar = document.getElementById('closeSidebar');

  if (menuIcon && sidebar && closeSidebar) {
    menuIcon.addEventListener('click', () => {
      sidebar.classList.add('open');
    });

    closeSidebar.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
  }

  const toggleBtn = document.querySelector('.menu-toggle');
  toggleBtn.addEventListener('click', () => {
    document.getElementById('navIcons').classList.toggle('show');
  });

  document.getElementById("openModal").addEventListener("click", () => {
    document.getElementById("modalContainer").classList.remove("hidden");
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

document.getElementById("modalContainer").addEventListener("click", (e) => {
  if (e.target.id === "modalContainer") closeModal();
});

async function searchMembers(query) {
  const user = auth.currentUser;
  if (!user) return showFeedback("Please log in to search users.");

  try {
    const usersCol = collection(db, "users");
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map((doc) => doc.data());

    const results = userList.filter((user) =>
      user.email.toLowerCase().includes(query.toLowerCase())
    );

    displaySearchResults(results);
  } catch (error) {
    console.error("Error fetching users:", error);
    showFeedback("Failed to load user list.");
  }
}

function displaySearchResults(results) {
  const resultsContainer = document.getElementById("search-results");
  resultsContainer.innerHTML = "";

  results.forEach((user) => {
    const userDiv = document.createElement("div");
    userDiv.classList.add("search-item");

    userDiv.innerHTML = `
      <div class="user-info">
        <img src="${user.photoURL || "https://via.placeholder.com/40"}" />
        <div class="labels">
          <div><strong>EMAIL:</strong> ${user.email}</div>
          <div><strong>UID:</strong> ${user.uid}</div>
        </div>
      </div>
      <button onclick='addMember("${user.email}", "${user.uid}", "${user.photoURL || "https://via.placeholder.com/40"}")'>+</button>
    `;
    resultsContainer.appendChild(userDiv);
  });
}

function addMember(email, uid, photoURL) {
  if (addedMembers.some((member) => member.uid === uid)) {
    return showFeedback("Member already added!");
  }

  addedMembers.push({ email, uid, photoURL });
  updateAddedMembersDisplay();
}

function removeMember(uid) {
  addedMembers = addedMembers.filter((m) => m.uid !== uid);
  updateAddedMembersDisplay();
}

function updateAddedMembersDisplay() {
  const container = document.getElementById("added-members");
  container.innerHTML = "";

  addedMembers.forEach((member) => {
    const div = document.createElement("div");
    div.classList.add("added-member");
    div.innerHTML = `
      <div class="user-info">
        <img src="${member.photoURL}" />
        <div class="labels">
          <div><strong>EMAIL:</strong> ${member.email}</div>
          <div><strong>UID:</strong> ${member.uid}</div>
        </div>
      </div>
      <button onclick='removeMember("${member.uid}")'>−</button>
    `;
    container.appendChild(div);
  });
}

async function createGroup() {
  const groupName = document.getElementById("group-name").value.trim();
  const btn = document.querySelector(".create-btn");

  if (!groupName) return showFeedback("Please enter a group name.");
  if (addedMembers.length === 0) return showFeedback("Please add at least one member.");

  const fullTitle = groupName.toUpperCase();
  btn.disabled = true;
  btn.innerText = "Creating...";

  try {
    const groupQuery = query(collection(db, "groups"), where("fullTitle", "==", fullTitle));
    const existingGroups = await getDocs(groupQuery);
    if (!existingGroups.empty) return showFeedback("A group with this name already exists.");

    const currentUser = auth.currentUser;
    if (!addedMembers.some((m) => m.uid === currentUser.uid)) {
      addedMembers.push({
        uid: currentUser.uid,
        email: currentUser.email,
        photoURL: currentUser.photoURL || "https://via.placeholder.com/40",
      });
    }

    await addDoc(collection(db, "groups"), {
      name: groupName,
      fullTitle,
      members: addedMembers,
      memberUIDs: addedMembers.map(m => m.uid), 
      createdAt: serverTimestamp(),
    });

    showFeedback("Group created successfully!", false);

    addedMembers = [];
    updateAddedMembersDisplay();
    document.getElementById("group-name").value = "";
    document.getElementById("member-search").value = "";
    document.getElementById("search-results").innerHTML = "";
    document.getElementById("modalContainer").classList.add("hidden");

    loadUserGroups();
  } catch (error) {
    console.error("Error creating group:", error);
    showFeedback("Failed to create group.");
  } finally {
    btn.disabled = false;
    btn.innerText = "CREATE NEW GROUP";
  }
}

async function loadUserGroups() {
  const user = auth.currentUser;
  if (!user) return;

  const groupDisplay = document.getElementById("group-display");
  groupDisplay.innerHTML = "";

  const snapshot = await getDocs(collection(db, "groups"));
  const seenNames = new Set();

  const userGroups = snapshot.docs.filter((doc) => {
    const group = doc.data();
    if (!group.name || typeof group.name !== "string") return false; // prevent error
  
    const isMember = Array.isArray(group.members) && group.members.some((m) => m.uid === user.uid);
    const name = group.name.toLowerCase();
    const isNew = !seenNames.has(name);
  
    if (isMember && isNew) {
      seenNames.add(name);
      return true;
    }
    return false;
  });
  
  
  userGroups.forEach((doc) => {
    const group = doc.data();
    const groupId = doc.id;
  
    const div = document.createElement("div");
    div.className = "group-list";
    div.innerHTML = `<span data-id="${groupId}">${group.fullTitle || group.name.toUpperCase()}</span>`;
    groupDisplay.appendChild(div);
  });
}

document.getElementById("member-search").addEventListener("input", (e) => {
  const query = e.target.value.trim();
  if (query.length >= 3) {
    searchMembers(query);
  } else {
    document.getElementById("search-results").innerHTML = "";
  }
});

document.getElementById("group-display").addEventListener("click", (e) => {
  if (e.target.tagName === "SPAN") {
    document.querySelectorAll(".group-list span").forEach((el) => {
      el.style.backgroundColor = "#fff";
    });
    e.target.style.backgroundColor = "#ffeecc";

    const groupName = e.target.textContent.trim();
    const groupId = e.target.getAttribute("data-id");
    const encodedName = encodeURIComponent(groupName);

    window.location.href = `commSec2.html?id=${groupId}&name=${encodedName}`;
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✅ Logged in as:", user.email);
    setTimeout(loadUserGroups, 200); 
    updateActivityLog(groupId, user.uid);
  } if (groupId) {
    updateActivityLog(groupId, user.uid);
  } else {
    showFeedback("You must log in to use this page.");
  }
});

function closeModal() {
  document.getElementById("modalContainer").classList.add("hidden");
}

window.addMember = addMember;
window.removeMember = removeMember;
window.createGroup = createGroup;
window.closeModal = closeModal;
