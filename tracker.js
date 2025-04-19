// Get the container for the trackers
const groupTrackerContainer = document.getElementById('groupTrackerContainer');


// Function to generate a random hex color
function getRandomColor() {
  const colors = ['#640D5F', '#D91656', '#EB5B00', '#FFB200'];
  return colors[Math.floor(Math.random() * colors.length)];
}

const groupsData = [];

// Function to create a new group tracker box
function createGroupTracker(groupName, members) {
  const borderColor = getRandomColor(); // Assign a random border color


  const groupData = {
    name: groupName,
    members: members,
    progress: 0 // start at 0%
  };
  groupsData.push(groupData);

  // Create the outer tracker box
  const trackerBox = document.createElement('div');
  trackerBox.classList.add('group-tracker');
  trackerBox.style.border = `4px solid ${borderColor}`; // Set the border color
  trackerBox.style.backgroundColor = 'white'

  // Function to update the circular progress (USE THIS TO TEST PROGRESSBAR)
function setCircularProgress(percent) {
  const circle = trackerBox.querySelector('.progress-bar');
  const text = trackerBox.querySelector('.progress-label');

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  circle.style.strokeDashoffset = offset;

  // Animate text counter
  let current = parseFloat(text.textContent) || 0;
  let target = percent;
  let duration = 800;
  let start = null;

  function animateLabel(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    const step = Math.min(progress / duration, 1);
    const value = Math.floor(current + (target - current) * step);
    text.textContent = `${value}%`;
    if (step < 1) requestAnimationFrame(animateLabel);
  }

  requestAnimationFrame(animateLabel);
  
}

  // Tracker content (you can add more elements here)
  const trackerContent = `
        <div class="tracker-header">
            <h3 class="group-title">${groupName}</h3>
        </div>

        <div class="tracker-body">
          <!- PROGRESS -->
          <div class="tracker-section progress">
            <h4 class="section-label">PROGRESS</h4>
            <div class="progress-container">
              <svg class="progress-ring" width"160" height="160">
                <g transform="rotate(-90 60 60)">
                  <circle class="progress-bg" cx="60" cy="60" r="40" />
                  <circle class="progress-bar" cx="60" cy="60" r="40" />
                </g>
                <text x="60" y="65" class="progress-label hover:animate-pulse">0%</text>
              </svg>
            </div>
          </div>

          
          <!-- DIVIDER -->
          <div class="divider-vertical"></div>

          <!-- REMAINING TASKS -->
          <div class="tracker-section remaining">
            <h4 class="section-label">REMAINING</h4>
            <h4 class="section-label"> TASK</h4>
            <div class="task-count">7</div>
          </div>

          <!-- DIVIDER -->
          <div class="divider-vertical"></div>

          <!-- YOUR TASKS -->
          <div class="tracker-section tasks">
            <h4 class="section-label">YOUR TASK:</h4>
            <div class="task-item">RESEARCH TOPIC <span class="due">DUE: MAR 5</span></div>
            <div class="task-divider"></div>
            <div class="task-item">SCRIPT <span class="due">DUE: MAR 6</span></div>
            <div class="task-divider"></div>
            <button class="view-project-detail hover:animate-pulse">VIEW PROJECT DETAIL</button>
          </div>
        </div>
        
        <!-- Expandable Project Detail Section -->
        <div class="project-detail">
          <h3>Task Management</h3>
      
          <div class="section">
            <div class="section-title">Your Tasks:</div>
            <ul>
              <li>RESEARCH TOPIC - Due: Mar 5</li>
              <li>SCRIPT - Due: Mar 6</li>
            </ul>
          </div>
      
          <div class="section">
            <div class="section-title">Task Status</div>
            <button class="kanban-board-button">KANBAN BOARD</button>
            <!-- Insert your Kanban structure here -->
          </div>
      
          <div class="section">
            <div class="section-title">Completed</div>
            <div class="completed-section">
              <p>RESEARCH TOPIC</p>
              <!-- Add completed tasks -->
            </div>
          </div>
      
          <div class="section">
            <button style="background-color: #05a34a; color: white; padding: 10px; border-radius: 10px;">Project Finish</button>
            <button style="color: red; border: 2px solid red; padding: 10px; border-radius: 10px;">Terminate Project</button>
          </div>
        </div>
      </div>
  `;
  
  
  trackerBox.innerHTML = trackerContent;
  const parentContainer = document.getElementById('parent-container');
  parentContainer.appendChild(trackerBox);
  
  document.dispatchEvent(new Event('trackerAdded'));

  setTimeout(() => setCircularProgress(30), 500);
   // Example progress value (change as needed)
}

// Always create one default tracker on page load for design editing (REMOVE THIS)
document.addEventListener('DOMContentLoaded', () => {
  createGroupTracker("Sample Group", ["Sample Member 1", "Sample Member 2"]);
});
