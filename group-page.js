

// Optional: close on outside click
document.addEventListener("click", function (e) {
  const navIcons = document.getElementById("navIcons");
  const toggleBtn = document.querySelector(".menu-toggle");

  if (
    navIcons &&
    toggleBtn &&
    !navIcons.contains(e.target) &&
    !toggleBtn.contains(e.target)
  ) {
    navIcons.classList.remove("show");
  }
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

const selectedGroupId = localStorage.getItem("selectedGroupId");
const selectedGroupName = localStorage.getItem("selectedGroupName");

if (selectedGroupId && selectedGroupName) {
  console.log("Group ID:", selectedGroupId);
  console.log("Group Name:", selectedGroupName);
  // You can now use this info to fetch folders or create them in the correct group
} else {
  console.warn("No group selected — redirecting or showing message.");
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

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

document.addEventListener("DOMContentLoaded", () => {

  const toggleBtn = document.querySelector('.menu-toggle');
  toggleBtn.addEventListener('click', () => {
    document.getElementById('navIcons').classList.toggle('show');
  });
  

  // GROUP DISPLAY
  const params = new URLSearchParams(window.location.search);
  const groupName = decodeURIComponent(params.get("name"));

  if (groupName) {
    const displayElement = document.getElementById("group-title");
    if (displayElement) {
      displayElement.textContent = groupName;
    }
    if (!groupName) {
      alert("Group name not found in URL");
      return; // Stop further execution
    }
  }

// ========================
// 1. MEETINGS SECTION
// ========================
const meetingsRef = collection(db, "groups", groupName, "meetings");
const meetingList = document.getElementById("meetingList");
const noMeetingsMessage = document.getElementById("noMeetingsMessage");

// Real-time listener to update meeting list
onSnapshot(meetingsRef, (snapshot) => {
  meetingList.innerHTML = "";
  if (snapshot.empty) {
    noMeetingsMessage.style.display = "block";
    return;
  }

  noMeetingsMessage.style.display = "none";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "meeting-item";
    div.setAttribute("data-id", docSnap.id);
    div.innerHTML = `
      <div class="meeting-details">
        <strong>${data.name}</strong><br>
        Type: ${data.type === "face" ? "Face to Face" : "Online"}<br>
        Time: ${data.startTime} - ${data.endTime}<br>
        Place: ${data.location}<br>
        ${
          data.link
            ? `Link: <a href="${data.link}" target="_blank" style="color:#1a5e63;">${data.link}</a><br>`
            : ""
        }
      </div>
      <i class="fas fa-trash delete-meeting" style="cursor:pointer;"></i>
    `;
    meetingList.appendChild(div);
  });
});

// Delete meeting
meetingList.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-meeting")) {
    const id = e.target.closest(".meeting-item").getAttribute("data-id");
    const confirmDelete = confirm("Are you sure you want to delete this meeting?");
    if (confirmDelete) {
      await deleteDoc(doc(db, "groups", groupName, "meetings", id));
    }
  }
});

// Modal controls
const meetingModal = document.getElementById("meetingModal");
const openMeetingModalBtn = document.getElementById("openMeetingModalBtn");
const closeMeetingModal = document.getElementById("closeModalBtn");
const meetingForm = document.getElementById("meetingForm");

if (openMeetingModalBtn && closeMeetingModal && meetingModal && meetingForm) {
  openMeetingModalBtn.onclick = () => {
    meetingModal.style.display = "block";
    meetingForm.reset();
  };

  closeMeetingModal.onclick = () => {
    meetingModal.style.display = "none";
  };
}

// Handle form submission
meetingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = meetingForm["meeting-name"].value;
  const type = meetingForm["meeting-type"].value;
  const location = meetingForm["meeting-location"].value;
  const startTime = meetingForm["meeting-start-time"].value;
  const endTime = meetingForm["meeting-end-time"].value;
  const link = meetingForm["meeting-link"].value;

  await addDoc(meetingsRef, {
    name,
    type,
    location,
    startTime,
    endTime,
    link,
  });

  meetingForm.reset();
  meetingModal.style.display = "none";
});

  // ========================
  // 2. FOLDERS SECTION
  // ========================
  const foldersRef = collection(db, "groups", groupName, "folders");
  const folderList = document.getElementById("folderList");
  const noFoldersMessage = document.getElementById("noFoldersMessage");

  onSnapshot(foldersRef, (snapshot) => {
    folderList.innerHTML = "";
    if (snapshot.empty) {
      noFoldersMessage.style.display = "block";
      return;
    }
    noFoldersMessage.style.display = "none";

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const folderDiv = document.createElement("div");
      folderDiv.className = "folder-item";
      folderDiv.setAttribute("data-id", docSnap.id);
      folderDiv.innerHTML = `
        <i class="fas fa-folder" style="color:${data.color};"></i>
        <span>${data.name}</span>
        <span class="folder-date">Created on: ${data.creationDate}</span>
        <i class="fas fa-trash delete-folder" style="float:right; cursor:pointer; color:red;"></i>
      `;

      console.log("Folder Data:", data);

      folderDiv.onclick = () => {
        localStorage.setItem("selectedFolder", data.name);
    
        // Just use groupName
        console.log("Redirecting to:", `Folder.html?name=${groupName}`);
        window.location.href = `Folder.html?name=${encodeURIComponent(groupName)}`;
      };      
    
      folderList.appendChild(folderDiv);
    });
    
  });
  const folderModal = document.getElementById("folderModal");
  const openFolderModalBtn = document.getElementById("openFolderModalBtn");
  const closeFolderModal = document.getElementById("closeFolderModal");
  const folderForm = document.getElementById("folderForm");

  if (openFolderModalBtn && closeFolderModal && folderModal && folderForm) {
    openFolderModalBtn.onclick = () => (folderModal.style.display = "block");
    closeFolderModal.onclick = () => (folderModal.style.display = "none");

    folderForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("folderName").value;
      const color = document.getElementById("folderColor").value;
      const creationDate = new Date().toLocaleDateString();

      console.log("Using groupName for foldersRef:", groupName);

      await addDoc(collection(db, "groups", groupName, "folders"), {
        name,
        color,
        creationDate,
        groupName,
        groupNo,
      });      
    });
  }

  folderList.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-folder")) {
      const folderDiv = e.target.closest(".folder-item");
      const id = folderDiv.getAttribute("data-id");
  
      if (confirm("Are you sure you want to delete this folder?")) {
        await deleteDoc(doc(db, "groups", groupName, "folders", id));
      }
    }
  });
  
  // ========================
  // 3. LINKS SECTION
  // ========================
  const linksRef = collection(db, "groups", groupName, "links");
  const linkList = document.getElementById("linkList");
  const noLinkMessage = document.getElementById("noLinkMessage");

  onSnapshot(linksRef, (snapshot) => {
    linkList.innerHTML = "";
    if (snapshot.empty) {
      noLinkMessage.style.display = "block";
      return;
    }
    noLinkMessage.style.display = "none";

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const item = document.createElement("div");
      item.className = "link-item";
      item.setAttribute("data-id", docSnap.id); // <== Add this line if not present
      item.innerHTML = `
      <h4>${data.type}</h4>
      <a href="${data.url}" target="_blank">${data.url}</a>
      <p style="color:#bfb8b8;">${data.description}</p>
      <i class="fas fa-trash delete-link" style="cursor:pointer; float:right; color:red;"></i>
      `;

      linkList.appendChild(item);
    });
  });

  linkList.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-link")) {
      const itemDiv = e.target.closest(".link-item");
      const id = itemDiv.getAttribute("data-id");
  
      if (confirm("Are you sure you want to delete this link?")) {
        await deleteDoc(doc(db, "groups", groupName, "links", id));
      }
    }
  });  

  const dropLinkBtn = document.getElementById("dropLinkBtn");
  const linkFormContainer = document.getElementById("linkFormContainer");
  const linkForm = document.getElementById("linkForm");

  if (dropLinkBtn && linkFormContainer && linkForm) {
    // Toggle the form visibility
    dropLinkBtn.onclick = () => {
      const isVisible = linkFormContainer.style.display === "block";
      linkFormContainer.style.display = isVisible ? "none" : "block";
    };

    // Handle form submission
    linkForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      console.log(
        linkForm["link-type"],
        linkForm["link-url"],
        linkForm["link-description"]
      );

      const type = linkForm["link-type"].value;
      const url = linkForm["link-url"].value;
      const description = linkForm["link-description"].value;

      await addDoc(linksRef, { type, url, description });
      linkForm.reset();
      linkFormContainer.style.display = "none";
    });
  }

  const addNewTypeBtn = document.getElementById("addNewTypeBtn");
  const newTypeModal = document.getElementById("newTypeModal");
  const closeTypeModal = document.getElementById("closeTypeModal");
  const saveNewTypeBtn = document.getElementById("saveNewType");
  const newTypeInput = document.getElementById("newTypeInput");
  const linkTypeSelect = document.getElementById("link-type");

  // Show modal on button click
  addNewTypeBtn.addEventListener("click", () => {
    console.log("addNewTypeBtn clicked");
    newTypeModal.style.display = "block";
    newTypeInput.value = "";
    newTypeInput.focus();
  });

  // Close modal on × click
  closeTypeModal.addEventListener("click", () => {
    newTypeModal.style.display = "none";
  });

  // Close modal if user clicks outside modal content
  window.addEventListener("click", (event) => {
    if (event.target === newTypeModal) {
      newTypeModal.style.display = "none";
    }
  });

  // Save new type on button click
  saveNewTypeBtn.addEventListener("click", () => {
    const newType = newTypeInput.value.trim();
    if (!newType) {
      alert("Please enter a type name.");
      return;
    }

    // Check if type already exists (case insensitive)
    const exists = Array.from(linkTypeSelect.options).some(
      (opt) => opt.value.toLowerCase() === newType.toLowerCase()
    );
    if (exists) {
      alert("This link type already exists.");
      return;
    }

    // Add new option to select dropdown
    const newOption = document.createElement("option");
    newOption.value = newType;
    newOption.textContent = newType;
    linkTypeSelect.appendChild(newOption);

    // Select the new type
    linkTypeSelect.value = newType;

    // Clear and close modal
    newTypeInput.value = "";
    newTypeModal.style.display = "none";
  });

  const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Authenticated as", user.uid);
    // safe to access Firestore
  } else {
    console.warn("User not authenticated");
    // redirect to login or show error
  }
});

});
