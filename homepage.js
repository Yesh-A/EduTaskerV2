function toggleMenu() {
  document.getElementById('navIcons').classList.toggle('show');
}

// Optional: close on outside click
document.addEventListener('click', function (e) {
  const navIcons = document.getElementById('navIcons');
  const toggleBtn = document.querySelector('.menu-toggle');
  if (!navIcons.contains(e.target) && !toggleBtn.contains(e.target)) {
    navIcons.classList.remove('show');
  }
});

const sidebar = document.getElementById('sidebar');
const menuIcon = document.querySelector('.menu-icon i');
const closeSidebar = document.getElementById('closeSidebar');

menuIcon.addEventListener('click', () => {
  sidebar.classList.add('open');
});

closeSidebar.addEventListener('click', () => {
  sidebar.classList.remove('open');
});

async function loadDueTasks() {
  const user = auth.currentUser;
  if (!user) return;

  const container = document.getElementById("taskListContainer");
  container.innerHTML = `<p class="placeholder-text">Loading tasks...</p>`;

  const snapshot = await getDocs(collection(db, "groups"));
  const tasksToShow = [];

  for (const doc of snapshot.docs) {
    const group = doc.data();
    const groupId = doc.id;

    const isMember = group.memberUIDs?.includes(user.uid);
    if (!isMember) continue;

    const taskSnapshot = await getDocs(collection(db, `groups/${groupId}/tasks`));
    taskSnapshot.forEach(taskDoc => {
      const task = taskDoc.data();
      if (task.assignedTo === user.uid && task.status === "To Do") {
        tasksToShow.push({
          ...task,
          groupName: group.fullTitle,
          groupId,
        });
      }
    });
  }

  container.innerHTML = "";

  if (tasksToShow.length === 0) {
    container.innerHTML = `<p class="placeholder-text">You have no due tasks assigned.</p>`;
    return;
  }

  for (const task of tasksToShow) {
    const taskDiv = document.createElement("div");
    taskDiv.classList.add("due-task-card");
    taskDiv.innerHTML = `
      <div class="task-title">${task.taskName || task.title}</div>
      <div class="task-group">Group: ${task.groupName}</div>
      <div class="task-deadline">Due: ${task.dateDeadline || "No deadline set"}</div>
    `;
    container.appendChild(taskDiv);
  }
}

async function loadRecentNotifications(uid) {
  const notificationContainer = document.getElementById("notificationContainer");
  notificationContainer.innerHTML = "<p class='placeholder-text'>Loading...</p>";

  try {
    // Get user's groups
    const groupsSnapshot = await getDocs(query(collection(db, "groups"), where("members", "array-contains", uid)));
    const notifications = [];

    for (const groupDoc of groupsSnapshot.docs) {
      const groupId = groupDoc.id;

      // 1. Get latest chat messages (limit 1)
      const chatSnapshot = await getDocs(query(collection(db, `groups/${groupId}/chat`), ));
      chatSnapshot.forEach(doc => {
        notifications.push({
          type: "chat",
          group: groupDoc.data().groupName,
          text: `New message in ${groupDoc.data().groupName}`,
          timestamp: doc.data().timestamp?.toDate()
        });
      });

      // 2. Get latest uploaded files
      const fileSnapshot = await getDocs(query(collection(db, `groups/${groupId}/files`), ));
      fileSnapshot.forEach(doc => {
        notifications.push({
          type: "file",
          group: groupDoc.data().groupName,
          text: `New file uploaded in ${groupDoc.data().groupName}`,
          timestamp: doc.data().uploadedAt?.toDate()
        });
      });

      // 3. Get latest meeting/event
      const meetingSnapshot = await getDocs(query(collection(db, `groups/${groupId}/meetings`), /* orderBy("createdAt", "desc"), limit(1) */));
      meetingSnapshot.forEach(doc => {
        notifications.push({
          type: "meeting",
          group: groupDoc.data().groupName,
          text: `New meeting scheduled in ${groupDoc.data().groupName}`,
          timestamp: doc.data().createdAt?.toDate()
        });
      });
    }

    // Sort by latest
    notifications.sort((a, b) => b.timestamp - a.timestamp);

    // Render
    if (notifications.length === 0) {
      notificationContainer.innerHTML = "<p class='placeholder-text'>No recent notifications.</p>";
    } else {
      notificationContainer.innerHTML = "";
      notifications.slice(0, 5).forEach(notif => {
        const item = document.createElement("div");
        item.className = "notification-item";
        item.innerHTML = `<strong>${notif.group}</strong>: ${notif.text} <br><small>${notif.timestamp.toLocaleString()}</small>`;
        notificationContainer.appendChild(item);
      });
    }

  } catch (error) {
    console.error("Error loading notifications:", error);
    notificationContainer.innerHTML = "<p class='placeholder-text'>Failed to load notifications.</p>";
  }
}


import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";



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
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    setTimeout(() => {
      loadDueTasks(); 
      loadRecentNotifications(user.uid);
    }, 200);
  } else {
    showFeedback("You must log in to use this page.");
  }
});

