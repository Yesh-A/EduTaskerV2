/*const placeholderMembers = ["John Doe", "Jane Smith", "Alice Brown", "Bob White", "Charlie Black", "Clara Green", "You"];
const memberInput = document.getElementById('memberInput');
const addMemberBtn = document.getElementById('addMemberBtn');
const memberList = document.getElementById('memberList');
const memberSuggestions = document.getElementById('memberSuggestions');
const createGroupBtn = document.getElementById('createGroupBtn');
const groupNameInput = document.getElementById('groupNameInput');



let addedMembers = [];*/

// Member Management
/*addMemberBtn.addEventListener('click', () => {
  const memberName = memberInput.value.trim();
  if (memberName && !addedMembers.includes(memberName)) {
    addedMembers.push(memberName);
    updateMemberList();
    memberInput.value = '';
  }
});*/


/*function updateMemberList() {
  memberList.innerHTML = '';
  addedMembers.forEach((member, index) => {
    const memberItem = document.createElement('div');
    memberItem.classList.add('bg-[#1A5E63]', 'text-white', 'px-3', 'py-1', 'rounded-full', 'flex', 'items-center', 'gap-2', 'mb-2');
    memberItem.innerHTML = ` 
      ${member}
      <span class="cursor-pointer text-xs" onclick="removeMember(${index})">X</span>
    `;
    memberList.appendChild(memberItem);
  });

  createGroupBtn.disabled = addedMembers.length === 0 || groupNameInput.value.trim() === '';
}

function removeMember(index) {
  addedMembers.splice(index, 1);
  updateMemberList();
}

// Group Creation
createGroupBtn.addEventListener('click', () => {
  const groupName = groupNameInput.value.trim();

  if (!groupName) {
    alert('Please enter a group name');
    return;
  }
  
  if (addedMembers.length === 0) {
    alert('Please add at least one member');
    return;
  }


  if (groupName && addedMembers.length > 0) {
    const groupId = Date.now().toString();
    const borderColor = getRandomColor();
    
    const newGroup = {
      id: groupId,
      name: groupName,
      members: [...addedMembers],
      progress: 0,
      status: false,
      borderColor: borderColor,
      tasks: {
        todo: [],
        inProgress: [],
        completed: []
      }
    };
    
    /* DATABASE INTEGRATION POINT - Save new group to database
    const savedGroup = await saveGroupToDatabase(newGroup);
    groupsData.push(savedGroup);
    createGroupTracker(savedGroup.name, savedGroup.members, savedGroup);
    */
    
    // Temporary in-memory implementation
    /*groupsData.push(newGroup);
    createGroupTracker(newGroup.name, newGroup.members, newGroup);
    
    addedMembers = [];
    updateMemberList();
    groupNameInput.value = '';
    closeGroupModal();
  }
});*/

// Member Suggestions
/*memberInput.addEventListener('input', () => {
  const inputText = memberInput.value.toLowerCase();
  const filteredNames = placeholderMembers
    .filter(name => name.toLowerCase().startsWith(inputText))
    .filter(name => !addedMembers.includes(name));

  if (filteredNames.length > 0) {
    displaySuggestions(filteredNames);
  } else {
    memberSuggestions.innerHTML = '';
  }
});

function displaySuggestions(names) {
  memberSuggestions.innerHTML = '';
  names.forEach(name => {
    const suggestionItem = document.createElement('div');
    suggestionItem.classList.add('cursor-pointer', 'px-3', 'py-1', 'hover:bg-[#1A5E63]', 'hover:text-white');
    suggestionItem.textContent = name;
    suggestionItem.addEventListener('click', () => {
      memberInput.value = name;
      addMemberBtn.click();
      memberSuggestions.innerHTML = '';
    });
    memberSuggestions.appendChild(suggestionItem);
  });
}

// Modal Control
document.getElementById('NewTaskBtn').addEventListener('click', () => {
  const modal = document.getElementById('groupModal');
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  modal.classList.add('animate__fadeIn');
});

let isInsideModal = false;
document.querySelector('.modal-content').addEventListener('mousedown', () => {
  isInsideModal = true;
});

window.addEventListener('mouseup', (e) => {
  if (!e.target.closest('.modal-content') && !isInsideModal) {
    closeGroupModal();
  }
  isInsideModal = false;
});

function closeGroupModal() {
  const modal = document.getElementById('groupModal');
  modal.classList.add('hidden');
  modal.classList.remove('animate__fadeIn');
  modal.style.display = 'none';
}*/

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

let addedMembers = [];

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

  document.getElementById("NewTaskBtn").addEventListener("click", () => {
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

    await addDoc(collection(db, "groups"), {
      name: groupName,
      fullTitle,
      members: addedMembers,
      memberUIDs: addedMembers.map((m) => m.uid),
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

  const groupDisplay = document.getElementById("parent-container");
  groupDisplay.innerHTML = "";

  const snapshot = await getDocs(collection(db, "groups"));
  const seenNames = new Set();

  const userGroups = snapshot.docs.filter((doc) => {
    const group = doc.data();
    const isMember = group.members?.some((m) => m.uid === user.uid);
    const name = (group.name || "").toLowerCase(); // safe fallback
    const isNew = name && !seenNames.has(name);
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
    div.innerHTML = `<span data-id="${groupId}">${
      group.fullTitle || group.name.toUpperCase()
    }</span>`;
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

document.getElementById("parent-container").addEventListener("click", (e) => {
  if (e.target.tagName === "SPAN") {
    document.querySelectorAll(".group-list span").forEach((el) => {
      el.style.backgroundColor = "#fff";
    });
    e.target.style.backgroundColor = "#ffeecc";

    const groupName = e.target.textContent.trim();
    const groupId = e.target.getAttribute("data-id");

    // Save to localStorage
    localStorage.setItem("selectedGroupId", groupId);
    localStorage.setItem("selectedGroupName", groupName);

    const encodedName = encodeURIComponent(groupName);
    window.location.href = `group-page.html?id=${groupId}&name=${encodedName}`;
  }
});

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

