let addedMembers = [];

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
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

const toggleBtn = document.querySelector(".menu-toggle");
toggleBtn.addEventListener("click", () => {
  document.getElementById("navIcons").classList.toggle("show");
});

const sidebar = document.getElementById("sidebar");
const menuIcon = document.querySelector(".menu-icon i");
const closeSidebar = document.getElementById("closeSidebar");

menuIcon.addEventListener("click", () => {
  sidebar.classList.add("open");
});

closeSidebar.addEventListener("click", () => {
  sidebar.classList.remove("open");
});

const showFeedback = (msg, isError = true) => {
  const feedback = document.getElementById("feedback");
  feedback.textContent = msg;
  feedback.style.color = isError ? "red" : "green";
  feedback.classList.add("visible");
  setTimeout(() => feedback.classList.remove("visible"), 3000);
};

document.addEventListener("DOMContentLoaded", () => {
  // Sidebar toggle logic
  const sidebar = document.getElementById("sidebar");
  const menuIcon = document.querySelector(".menu-icon i");
  const closeSidebar = document.getElementById("closeSidebar");

  if (menuIcon && sidebar && closeSidebar) {
    menuIcon.addEventListener("click", () => {
      sidebar.classList.add("open");
    });

    closeSidebar.addEventListener("click", () => {
      sidebar.classList.remove("open");
    });
  }

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

    const results = userList.filter(
      (u) =>
        u.email.toLowerCase().includes(query.toLowerCase()) &&
        u.uid !== user.uid // 🔥 Exclude current user
    );

    displaySearchResults(results);
  } catch (error) {
    console.error("Error fetching users:", error);
    showFeedback("Failed to load user list.");
  }
}

window.searchMembers = searchMembers;

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
      <button onclick='addMember("${user.email}", "${user.uid}", "${
      user.photoURL || "https://via.placeholder.com/40"
    }")'>+</button>
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
  if (addedMembers.length === 0)
    return showFeedback("Please add at least one member.");

  const fullTitle = groupName.toUpperCase();
  btn.disabled = true;
  btn.innerText = "Creating...";

  try {
    const groupQuery = query(
      collection(db, "groups"),
      where("fullTitle", "==", fullTitle)
    );
    const existingGroups = await getDocs(groupQuery);
    if (!existingGroups.empty)
      return showFeedback("A group with this name already exists.");

    const currentUser = auth.currentUser;
    if (!addedMembers.some((m) => m.uid === currentUser.uid)) {
      addedMembers.push({
        uid: currentUser.uid,
        email: currentUser.email,
        photoURL: currentUser.photoURL || "https://via.placeholder.com/40",
      });
    }

    const groupRef = await addDoc(collection(db, "groups"), {
      name: groupName,
      fullTitle,
      members: addedMembers,
      memberUIDs: addedMembers.map((m) => m.uid),
      createdAt: serverTimestamp(),
      createdBy: currentUser.uid, // <--- Add this!
    });

    // Automatically add a default task to the new group
    await addDoc(collection(db, `groups/${groupRef.id}/tasks`), {
      title: "Welcome Task",
      status: "pending",
      assignedTo: null,
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
    const isMember = group.members?.some((m) => m.uid === user.uid);
    const name = (group.name || "").toLowerCase();
    const isNew = name && !seenNames.has(name);
    if (isMember && isNew) {
      seenNames.add(name);
      return true;
    }
    return false;
  });

  for (const doc of userGroups) {
    const group = doc.data();
    const groupId = doc.id;

    // Fetch tasks for this group
    const taskSnapshot = await getDocs(collection(db, `groups/${groupId}/tasks`));
    const tasks = taskSnapshot.docs.map(d => d.data());

    const totalTasks = tasks.length || 1;
    const completedTasks = tasks.filter(t => t.status === "Done").length;
    const remainingTasks = tasks.filter(t => t.status === "To Do").length;
    const userTasks = tasks.filter(t => t.assignedTo === user.uid);

    const progress = Math.round((completedTasks / totalTasks) * 100);
    const circumference = 188.4;
    const offset = circumference - (circumference * progress) / 100;

    const div = document.createElement("div");
    div.className = "group-card";
    div.innerHTML = `
      <div class="group-header">${group.fullTitle}</div>
      <div class="group-content horizontal">
        <div class="card-section">
          <div class="section-title">Progress</div>
          <div class="progress-container">
            <svg class="progress-ring" width="80" height="80">
              <circle class="ring-bg" cx="40" cy="40" r="30" />
              <circle class="ring-fill" cx="40" cy="40" r="30"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}" />
              <text x="40" y="45" text-anchor="middle" font-size="14" fill="#333">${progress}%</text>
            </svg>
          </div>
        </div>

        <div class="card-section">
          <div class="section-title">Remaining Tasks</div>
          <div class="section-detail">${remainingTasks}</div>
        </div>

        <div class="card-section">
          <div class="section-title">Your Tasks</div>
          ${userTasks.length > 0
            ? userTasks.slice(0, 2).map(t => `<div class="user-task-placeholder">${t.title}</div>`).join("")
            : '<div class="user-task-placeholder">-</div><div class="user-task-placeholder">-</div>'
          }
        </div>
      </div>

      <div class="group-footer">
        <a href="projectDetails.html?groupId=${groupId}&groupName=${encodeURIComponent(group.fullTitle)}">View Project Details ></a>
      </div>
    `;

    groupDisplay.appendChild(div);
  }
}


onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("✅ Logged in as:", user.email);
    setTimeout(loadUserGroups, 200); // give time for auth.currentUser
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
