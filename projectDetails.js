// Firebase SDKs
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

let currentGroupId = null; 
const groupId = localStorage.getItem("selectedGroupId");
const groupTitleEl = document.getElementById("group-title");
const assignMemberSelect = document.getElementById("assign-member");
// Modal handlers
const addTaskBtn = document.getElementById("add-task-btn");
const modal = document.getElementById("add-task-modal");
const modalCloseBtn = document.getElementById("modal-close-btn");

addTaskBtn.addEventListener("click", () => {
  const groupId = localStorage.getItem("selectedGroupId");
  modal.classList.remove("modal-hidden");
   if (groupId) {
    populateAssignMemberDropdown(groupId);
  }
});

modalCloseBtn.addEventListener("click", () => {
  modal.classList.add("modal-hidden");
});

async function setGroupTitle(groupId) {
  const groupDocRef = doc(db, "groups", groupId);
  const groupSnap = await getDoc(groupDocRef);
  if (groupSnap.exists()) {
    const groupData = groupSnap.data();
    document.getElementById("group-title").textContent = groupData.groupName || "Untitled Group";
  } else {
    document.getElementById("group-title").textContent = "Group not found";
  }
}

// Populate Assign Member dropdown
async function populateAssignMemberDropdown(groupId) {
  const assignMemberSelect = document.getElementById("assign-member");
  assignMemberSelect.innerHTML = ""; // clear previous options

  const membersRef = collection(db, "groups", groupId, "members");
  const snapshot = await getDocs(membersRef);

  if (snapshot.empty) {
    const option = document.createElement("option");
    option.text = "No members found";
    option.disabled = true;
    assignMemberSelect.appendChild(option);
    return;
  }

  snapshot.forEach(doc => {
    const memberData = doc.data();
    const option = document.createElement("option");
    option.value = doc.id; // UID
    option.text = memberData.username || memberData.displayName || "Unnamed Member";
    assignMemberSelect.appendChild(option);
  });
}


// Handle form submission
document.getElementById("add-task-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const taskName = document.getElementById("task-name").value.trim();
  const taskDetail = document.getElementById("task-detail").value.trim();
  const assignMember = document.getElementById("assign-member").value;
  const dateDeadline = document.getElementById("date-deadline").value;
  const timeDeadline = document.getElementById("time-deadline").value;

  if (!currentGroupId) {
    console.error("Group ID not set.");
    return;
  }

  try {
    const taskRef = collection(db, "groups", currentGroupId, "tasks");
    await addDoc(taskRef, {
      taskName,
      taskDetail,
      assignMember,
      dateDeadline,
      timeDeadline,
      createdAt: serverTimestamp(),
      status: "To Do",
    });

    console.log("Task successfully created!");
    modal.classList.add("modal-hidden");
    e.target.reset(); // Clear the form
  } catch (error) {
    console.error("Error creating task:", error);
  }
});

function updateEmptyPlaceholder(tbody) {
  const existingPlaceholder = tbody.querySelector(".empty-placeholder");
  if (tbody.children.length === 0) {
    const row = document.createElement("tr");
    row.classList.add("empty-placeholder");

    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.style.textAlign = "center";
    cell.style.padding = "1rem";
    cell.style.color = "#888";
    cell.textContent = "Drop a task here";

    row.appendChild(cell);
    tbody.appendChild(row);
  } else if (existingPlaceholder) {
    existingPlaceholder.remove();
  }
}

async function populateTaskTables(groupId) {
  const tasksRef = collection(db, "groups", groupId, "tasks");
  const snapshot = await getDocs(tasksRef);

  const statusTbodyMap = {
    "To Do": document.getElementById("todo-tbody"),
    "In Progress": document.getElementById("inprogress-tbody"),
    "Done": document.getElementById("done-tbody"),
  };

  // Clear all tables
  Object.values(statusTbodyMap).forEach((tbody) => (tbody.innerHTML = ""));

  snapshot.forEach((docSnap) => {
    const task = docSnap.data();
    const taskId = docSnap.id;

    const row = document.createElement("tr");
    row.classList.add("draggable-task-row");
    row.draggable = true;
    row.dataset.taskId = taskId;

    // Row content
    const taskCell = document.createElement("td");
    taskCell.textContent = task.taskName;

    const detailCell = document.createElement("td");
    detailCell.textContent = task.taskDetail || "—";

    const assignedCell = document.createElement("td");
    assignedCell.textContent = task.assignMember || "Unassigned";

    const deadlineCell = document.createElement("td");
    deadlineCell.textContent = `${task.dateDeadline || ""} ${task.timeDeadline || ""}`.trim();

    const createdAtCell = document.createElement("td");
    if (task.createdAt && task.createdAt.toDate) {
      createdAtCell.textContent = task.createdAt.toDate().toLocaleString();
    } else {
      createdAtCell.textContent = "—";
    }
    
    row.append(taskCell, detailCell, assignedCell, deadlineCell, createdAtCell);

    // Drag behavior
    row.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", taskId);
    });

    const tbody = statusTbodyMap[task.status] || statusTbodyMap["To Do"];
    tbody.appendChild(row);
  });

  // 🟡 ADD THIS BLOCK: update placeholders after rendering
  Object.values(statusTbodyMap).forEach(updateEmptyPlaceholder);

  updateProgressAndRemainingTasks(groupId);
}

function getCurrentGroupId() {
  const groupIdElement = document.getElementById("group-id");
  if (groupIdElement) return groupIdElement.value;
  return new URLSearchParams(window.location.search).get("groupId");
}


// Set groupId from context (for example, from URL or elsewhere)
onAuthStateChanged(auth, (user) => {
  if (user) {
    const groupIdElement = document.getElementById("group-id");
    if (groupIdElement) {
      currentGroupId = getCurrentGroupId();

    } else {
      currentGroupId = new URLSearchParams(window.location.search).get("groupId");
    }

    if (currentGroupId) {
      setGroupTitle(currentGroupId);

      populateAssignMemberDropdown(currentGroupId);
      updateProgressAndRemainingTasks(currentGroupId);
      loadUserTasks(user.uid, currentGroupId);
      populateTaskTables(currentGroupId);
    }
  }
});


async function loadUserTasks(userId, groupId) {
  const tasksRef = collection(db, "groups", groupId, "tasks");
  const snapshot = await getDocs(tasksRef);
  const taskListEl = document.getElementById("your-tasks-list");
  taskListEl.innerHTML = ""; // Clear previous entries

  snapshot.forEach(docSnap => {
    const task = docSnap.data();
    const taskId = docSnap.id;

    if (task.assignMember === userId) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.status === "Done";
      checkbox.addEventListener("change", () => toggleTaskStatus(groupId, taskId, checkbox.checked));

      const label = document.createElement("label");
      label.textContent = ` ${task.taskName}`;
      label.prepend(checkbox);

      const taskItem = document.createElement("div");
      taskItem.className = "user-task-item";
      taskItem.appendChild(label);

      taskListEl.appendChild(taskItem);
    }
  });
}

async function toggleTaskStatus(groupId, taskId, isDone) {
  const taskDocRef = doc(db, "groups", groupId, "tasks", taskId);
  try {
    await updateDoc(taskDocRef, {
      status: isDone ? "Done" : "To Do"
    });
    updateProgressAndRemainingTasks(groupId); // Refresh progress ring & remaining count
  } catch (err) {
    console.error("Error updating task status:", err);
  }
}


function updateProgressRing(percent) {
  const circle = document.getElementById("progress-ring");
  const text = document.getElementById("progress-text");

  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const offset = circumference - (percent / 100) * circumference;
  text.textContent = `${percent}%`;
}

// Monitor task progress to enable/disable finish button
async function updateProgressAndRemainingTasks(groupId) {
  const tasksRef = collection(db, "groups", groupId, "tasks");
  const snapshot = await getDocs(tasksRef);

  const tasks = [];
  snapshot.forEach((doc) => tasks.push(doc.data()));

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(task => task.status === "Done").length;
  const todoTasks = tasks.filter(task => task.status === "To Do").length;

  // Update UI
  document.getElementById("remaining-task-count").textContent = todoTasks;

  const progressPercent = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
  updateProgressRing(progressPercent);

  // Enable Finish button only if all tasks are done
  const finishBtn = document.querySelector(".finish-btn");
  if (finishBtn) {
    finishBtn.disabled = todoTasks > 0;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const groupIdElement = document.getElementById("group-id");
  if (groupIdElement) {
    currentGroupId = groupIdElement.value;
    updateProgressAndRemainingTasks(currentGroupId);
  } else {
    // OR use URL param fallback
    const urlParams = new URLSearchParams(window.location.search);
    currentGroupId = urlParams.get("groupId");
    if (currentGroupId) {
      updateProgressAndRemainingTasks(currentGroupId);
    }
  }

  const finishBtn = document.querySelector(".finish-btn");
const terminateBtn = document.querySelector(".terminate-btn");
const confirmModal = document.getElementById("confirm-terminate");
const confirmLeaveBtn = document.getElementById("confirm-leave-btn");
const cancelLeaveBtn = document.getElementById("cancel-leave-btn");




finishBtn.addEventListener("click", () => {
  alert("Project marked as finished! Evaluation unlocked.");
  // You can add logic here to unlock evaluation UI
});

// TERMINATE PROJECT
terminateBtn.addEventListener("click", () => {
  confirmModal.classList.remove("modal-hidden");
});

cancelLeaveBtn.addEventListener("click", () => {
  confirmModal.classList.add("modal-hidden");
});

confirmLeaveBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user || !currentGroupId) return;

  try {
    const memberRef = doc(db, "groups", currentGroupId, "members", user.uid);
    await updateDoc(memberRef, { leftAt: serverTimestamp() });
    await deleteDoc(memberRef);

    alert("You have left the project.");
    confirmModal.classList.add("modal-hidden");
    window.location.href = "/dashboard.html"; // Redirect to main page
  } catch (error) {
    console.error("Error removing user from group:", error);
  }
});

const sidebar = document.getElementById("sidebar");
const menuIcon = document.querySelector(".menu-icon i");
const closeSidebar = document.getElementById("closeSidebar");

if (menuIcon && sidebar) {
  menuIcon.addEventListener("click", () => {
    sidebar.classList.add("open");
  });
}

if (closeSidebar && sidebar) {
  closeSidebar.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });
}

document.querySelectorAll(".dropzone").forEach((zone) => {
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("highlight-drop");
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("highlight-drop");
  });

  zone.addEventListener("drop", async (e) => {
    e.preventDefault();
    zone.classList.remove("highlight-drop");

    const taskId = e.dataTransfer.getData("text/plain");
    const newStatus = zone.dataset.status;

    const taskDocRef = doc(db, "groups", currentGroupId, "tasks", taskId);
    await updateDoc(taskDocRef, { status: newStatus });

    populateTaskTables(currentGroupId); // Refresh UI
  });
});




});