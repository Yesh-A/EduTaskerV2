// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
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

// ──────────────────────────────
// UI INTERACTIONS
window.addEventListener("DOMContentLoaded", () => {
  const nicknameDisplay = document.getElementById("nicknameDisplay");

  onAuthStateChanged(auth, async (user) => {
    if (!nicknameDisplay) return;
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      nicknameDisplay.textContent =
        userDoc.exists() && userDoc.data().nickname
          ? userDoc.data().nickname
          : "No nickname set";
    } else {
      nicknameDisplay.textContent = "Not signed in";
    }
  });

  const sidebar = document.getElementById("sidebar");
  const menuIcon = document.querySelector(".menu-icon i");
  const closeSidebar = document.getElementById("closeSidebar");

  menuIcon?.addEventListener("click", () => sidebar?.classList.add("open"));
  closeSidebar?.addEventListener("click", () =>
    sidebar?.classList.remove("open")
  );

  // Get groupId from URL
  const urlParams = new URLSearchParams(window.location.search);
  const groupId = urlParams.get("groupId");

  if (!groupId) {
    console.warn("No groupId found in URL.");
    return;
  }

  const groupRef = doc(db, "groups", groupId);

  getDoc(groupRef)
    .then((docSnap) => {
      if (docSnap.exists()) {
        const groupData = docSnap.data();
        document.getElementById("groupDisplay").textContent =
          groupData.name || "Unnamed Group";
      } else {
        console.error("No such group!");
      }
    })
    .catch((error) => console.error("Error getting group:", error));

  // ──────────────────────────────
  // FETCH & DISPLAY DATA

  async function loadGroupData() {
    try {
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) return;

      const groupData = groupSnap.data();

      // Project Start Date
      if (groupData.createdAt) {
        const startDate = groupData.createdAt.toDate();
        document.getElementById("projectStartDate").textContent =
          startDate.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
      }

      // Load Project Deadline
      const deadlineInput = document.querySelector(".deadline-input");
      if (groupData.projectDeadline) {
        deadlineInput.value = groupData.projectDeadline;
      }

      deadlineInput.addEventListener("change", async () => {
        const newDate = deadlineInput.value;
        await updateDoc(groupRef, { projectDeadline: newDate });
      });

      // Fetch Tasks
      const taskSnap = await getDocs(collection(groupRef, "tasks"));
      const tasks = [];
      taskSnap.forEach((doc) => tasks.push({ id: doc.id, ...doc.data() }));

      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === "Done").length;
      const remaining = total - completed;
      const percent = total > 0 ? (completed / total) * 100 : 0;

      const percentRounded = Math.round(percent);
      const selfEvalBtn = document.getElementById("selfEvalBtn");
      const peerEvalBtn = document.getElementById("peerEvalBtn");
      const unlockModal = document.getElementById("unlockModal");
      const confirmUnlock = document.getElementById("confirmUnlock");
      const unlockNote = document.querySelector(".unlock-note"); // fixed selector
      const toast = document.getElementById("toast");

      let evaluationUnlocked = false;

      function showToast(message) {
        toast.textContent = message;
        toast.style.display = "block";
        setTimeout(() => {
          toast.style.display = "none";
        }, 2500);
      }

      function unlockEvaluationButtons() {
        selfEvalBtn.disabled = false;
        peerEvalBtn.disabled = false;
        selfEvalBtn.innerHTML = '<i class="fas fa-unlock"></i> Self-Evaluation';
        peerEvalBtn.innerHTML = '<i class="fas fa-unlock"></i> Peer Evaluation';
        unlockNote.textContent = "Evaluations are now unlocked.";
        evaluationUnlocked = true;
      }

      // If progress is 100%, show modal
      if (percentRounded === 100) {
        unlockModal.style.display = "flex";
      }

      // Confirm unlock
      confirmUnlock.addEventListener("click", () => {
        unlockModal.style.display = "none";
        unlockEvaluationButtons();
      });

      // If user tries to click early, show toast
      [selfEvalBtn, peerEvalBtn].forEach((btn) => {
        btn.addEventListener("click", (e) => {
          if (!evaluationUnlocked) {
            e.preventDefault();
            showToast("Unlock when progress chart reached 100%");
          }
        });
      });

      // Update Stats
      document.getElementById("totalTasks").innerText = total;
      document.getElementById("remainingTasks").innerText = remaining;
      document.getElementById("completedTasks").innerText = completed;
      document.getElementById("progressLabel").innerText =
        percent.toFixed(1) + "%";

      // Doughnut Chart
      const ctx = document.getElementById("progressChart").getContext("2d");
      new Chart(ctx, {
        type: "doughnut",
        data: {
          datasets: [
            {
              data: [completed, remaining],
              backgroundColor: ["#15803d", "#d1fae5"],
              borderWidth: 1,
            },
          ],
        },
        options: {
          cutout: "70%",
          plugins: { legend: { display: false } },
        },
      });

      // Member Task Breakdown
      const memberStats = {};
      tasks.forEach((task) => {
        const uid = task.assignMember;
        if (!memberStats[uid]) memberStats[uid] = 0;
        if (task.status === "Done") memberStats[uid]++;
      });

      const tbody = document.querySelector("tbody");
      tbody.innerHTML = "";

      const sortedStats = Object.entries(memberStats).sort(
        ([, a], [, b]) => b - a
      );
      for (const [uid, userCompleted] of sortedStats) {
        const memberRef = doc(db, "users", uid);
        const memberSnap = await getDoc(memberRef);
        const name = memberSnap.exists()
          ? memberSnap.data().nickname || uid
          : uid;
        const userPercent =
          total > 0 ? ((userCompleted / total) * 100).toFixed(1) : "0.0";

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${name}</td>
          <td>${userCompleted}</td>
          <td>${userPercent}%</td>
        `;
        tbody.appendChild(row);
      }

      // Average Task Completion Time calculation and display
      let totalCompletionTime = 0;
      let completedCount = 0;

      tasks.forEach((task) => {
        if (
          task.status === "Done" &&
          task.createdAt?.toDate &&
          task.completedAt?.toDate
        ) {
          const created = task.createdAt.toDate();
          const completed = task.completedAt.toDate();
          const duration = completed - created;
          if (duration >= 0) {
            totalCompletionTime += duration;
            completedCount++;
          }
        }
      });

      const avgCompletionChart = document.getElementById(
        "averageCompletionChart"
      );
      if (completedCount > 0) {
        const avgMillis = totalCompletionTime / completedCount;
        const avgHours = avgMillis / (1000 * 60 * 60);
        const maxHours = 40;
        const widthPercent = Math.min((avgHours / maxHours) * 100, 100);

        avgCompletionChart.innerHTML = `
          <div style="background-color: #ddddad; border-radius: 12px; height: 24px; width: 100%; position: relative; overflow: hidden;">
            <div style="width: ${widthPercent}%; background-color: #15803d; height: 100%; border-radius: 12px; position: absolute; top: 0; left: 0; transition: width 0.5s ease;"></div>
            <div style="position: absolute; width: 100%; height: 100%; text-align: center; line-height: 24px; font-weight: bold; color: #fff; user-select: none;">
              ${avgHours.toFixed(2)} hrs
            </div>
          </div>
        `;
      } else {
        avgCompletionChart.innerHTML = `
          <div style="background-color: #ddddad; border-radius: 12px; height: 24px; width: 100%; text-align: center; line-height: 24px; font-weight: bold; color: #666; user-select: none;">
            N/A
          </div>
        `;
      }

      // Missed vs. On-Time Tasks (💡 Place here so tasks is available)
      let onTime = 0;
      let missed = 0;

      tasks.forEach((task) => {
        if (task.status === "Done" && task.createdAt && task.dateDeadline) {
          const completedDate = task.createdAt.toDate();
          const deadlineDate = new Date(task.dateDeadline + "T23:59:59");
          if (completedDate <= deadlineDate) {
            onTime++;
          } else {
            missed++;
          }
        }
      });

      const totalEvaluated = onTime + missed;
      const onTimePercent = totalEvaluated
        ? ((onTime / totalEvaluated) * 100).toFixed(1)
        : "0.0";
      const missedPercent = totalEvaluated
        ? ((missed / totalEvaluated) * 100).toFixed(1)
        : "0.0";

      document.getElementById(
        "onTimeLabel"
      ).innerHTML = `On Time Task<br>${onTimePercent}%`;
      document.getElementById(
        "missedLabel"
      ).innerHTML = `Missed Task<br>${missedPercent}%`;

      const donutCtx = document.createElement("canvas");
      donutCtx.width = 200;
      donutCtx.height = 200;
      document.getElementById("missedDonutChart").innerHTML = "";
      document.getElementById("missedDonutChart").appendChild(donutCtx);

      new Chart(donutCtx, {
        type: "doughnut",
        data: {
          datasets: [
            {
              data: [onTime, missed],
              backgroundColor: ["#10b981", "#f87171"],
              borderWidth: 1,
            },
          ],
          labels: ["On Time", "Missed"],
        },
        options: {
          cutout: "70%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || "";
                  const value = context.raw;
                  const percent = ((value / totalEvaluated) * 100).toFixed(1);
                  return `${label}: ${value} (${percent}%)`;
                },
              },
            },
          },
        },
      });
    } catch (err) {
      console.error("Error loading group data:", err);
    }
  }

  loadGroupData();
});
