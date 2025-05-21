import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const db = getFirestore(app);

async function loadGroupsForUser(userId) {
  const groupsRef = collection(db, "groups");
  const q = query(groupsRef, where("memberUIDs", "array-contains", userId));
  const querySnapshot = await getDocs(q);

  groupsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

const COLOR_PALETTE = ['#640D5F', '#D91656', '#EB5E00', '#FFB200'];
const parentContainer = document.getElementById('parent-container');
let currentTerminateGroupId = null;

const TEST_USER = "You"; // Temporary user for testing

let groupsData = []; // In-memory group storage

// Task Modal Elements
const taskModal = document.getElementById('taskModal');
const createTaskBtn = document.getElementById('createTaskBtn');
let currentGroupForTask = null;
let assignedMembers = [];

// Helper Functions
function calculateRemainingTasks(tasks) {
  return tasks.todo.length + tasks.inProgress.length;
}


// Modal Elements
const terminateConfirmModal = document.getElementById('terminateConfirmModal');
const terminateConfirmBtn = document.getElementById('terminateConfirm');
const terminateCancelBtn = document.getElementById('terminateCancel');

function renderYourTasks(tasks, currentUser = TEST_USER) {
  const yourTasks = [...tasks.todo, ...tasks.inProgress].filter(task => 
    task.assigned === currentUser || task.assigned === 'All'
  );

  if (yourTasks.length === 0) {
    return '<div class="task-item">No tasks assigned</div><button class="view-project-detail hover:animate-pulse">VIEW PROJECT DETAIL</button>';
  }

  return yourTasks.slice(0, 2)
    .map(task => `
      <div class="task-item">
        ${task.name} <span class="due">DUE: ${task.due}</span>
      </div>
      <div class="task-divider"></div>
    `).join('') + 
    '<button class="view-project-detail hover:animate-pulse">VIEW PROJECT DETAIL</button>';
}


function updateTaskStatusTables(trackerBox, tasks) {
  // To-Do Table
  const todoTable = trackerBox.querySelector('.task-table1 tbody');
  todoTable.innerHTML = tasks.todo.length > 0 
    ? tasks.todo.map(task => `
        <tr>
          <td>${task.name}</td>
          <td>${task.assigned}</td>
          <td>${task.due}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="3" class="empty-task">No tasks</td></tr>`;

  // In Progress Table
  const inProgressTable = trackerBox.querySelector('.task-table2 tbody');
  inProgressTable.innerHTML = tasks.inProgress.length > 0
    ? tasks.inProgress.map(task => `
        <tr>
          <td>${task.name}</td>
          <td>${task.assigned}</td>
          <td>${task.due}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="3" class="empty-task">No tasks</td></tr>`;

  // Completed Section
  const completedSection = trackerBox.querySelector('.completed-section');
  completedSection.innerHTML = tasks.completed.length > 0
    ? tasks.completed.map(task => `
        <div class="completed-task">${task.name}</div>
      `).join('')
    : `<div class="empty-task">No tasks</div>`;
}

function updateYourTasksSection(trackerBox, tasks) {
  const tasksSection = trackerBox.querySelector('.tracker-section.tasks');
  if (tasksSection) {
    tasksSection.innerHTML = `
      <h4 class="section-label">YOUR TASK:</h4>
      ${renderYourTasks(tasks, TEST_USER)}
    `;
    
    setupDetailToggle(trackerBox);
  }
}

function updateAllTaskViews(groupId) {
  const group = groupsData.find(g => g.id === groupId);
  if (!group) return;

  const trackerBox = document.querySelector(`[data-group-id="${groupId}"]`);
  if (!trackerBox) return;

  updateProgressPercentage(groupId);
  renderKanbanTasks(trackerBox, groupId);
  updateTaskStatusTables(trackerBox, group.tasks);
  renderTaskCalendar(groupId);
  updateYourTasksSection(trackerBox, group.tasks);
  
  
  setupDetailToggle(trackerBox);
}

function renderTaskCalendar(groupId) {
  const group = groupsData.find(g => g.id === groupId);
  if (!group) return;

  /* DATABASE INTEGRATION POINT - Replace with actual task dates from database
  const allTaskDates = await fetchTaskDatesForGroup(groupId);
  */
  const allDates = new Set();
  Object.values(group.tasks).forEach(status => {
    status.forEach(task => {
      if (task.dueDateKey) {
        allDates.add(task.dueDateKey);
      } else if (task.dueFull) {
        allDates.add(task.dueFull.toLocaleDateString('en-CA'));
      } else {
        allDates.add(task.due);
      }
    });
  });
  
  const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
  const allMembers = [...new Set(group.members)];

  let calendarHTML = `
    <thead>
      <tr>
        <th>MEMBERS</th>
        ${sortedDates.map(date => {
          const displayDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return `<th>${displayDate}</th>`;
        }).join('')}
      </tr>
    </thead>
    <tbody>
  `;

  allMembers.forEach(member => {
    calendarHTML += `<tr><td class="member-cell">${member}</td>`;
    
    sortedDates.forEach(date => {
      const tasksOnDate = [];
      Object.entries(group.tasks).forEach(([status, tasks]) => {
        tasks.forEach(task => {
          const taskDate = task.dueDateKey || 
                         (task.dueFull ? task.dueFull.toLocaleDateString('en-CA') : task.due);
          
          if (taskDate === date && 
              (task.assigned.toLowerCase() === 'all' || 
               task.assigned === member)) {
            tasksOnDate.push({
              name: task.name,
              status: status === 'completed' ? 'completed' : 
                     status === 'inProgress' ? 'inProgress' : 'todo',
              detail: task.detail,
              dueTime: task.dueTime
            });
          }
        });
      });

      calendarHTML += `<td>${tasksOnDate.map(task => 
        `<div class="task-item-calendar ${task.status}" title="${task.detail || ''}">${task.name}</div>`
      ).join('')}</td>`;
    });

    calendarHTML += `</tr>`;
  });

  calendarHTML += `</tbody>`;

  const trackerBox = document.querySelector(`[data-group-id="${groupId}"]`);
  const calendarTable = trackerBox?.querySelector('.task-calendar');
  if (calendarTable) {
    calendarTable.innerHTML = calendarHTML;
  }
}
//st

function updateTaskStatusInData(groupId, taskId, newStatus) {
  const group = groupsData.find(g => g.id === groupId);
  if (!group) return;

  let foundTask = null;
  const statusArrays = ['todo', 'inProgress', 'completed'];
  
  statusArrays.forEach(status => {
    const index = group.tasks[status].findIndex(t => t.id === taskId);
    if (index > -1) {
      foundTask = group.tasks[status][index];
      group.tasks[status].splice(index, 1);
    }
  });

  if (foundTask) {
    group.tasks[newStatus].push(foundTask);
    
    /* DATABASE INTEGRATION POINT - Task Status Update
    await db.query(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [newStatus, taskId]
    );
    */
    
    updateAllTaskViews(groupId);
  }
}

function updateProgressPercentage(groupId) {
  const group = groupsData.find(g => g.id === groupId);
  if (!group) return;
  
  const totalTasks = 
    group.tasks.todo.length + 
    group.tasks.inProgress.length + 
    group.tasks.completed.length;
  
  if (totalTasks > 0) {
    const completedPercentage = Math.round(
      (group.tasks.completed.length / totalTasks) * 100
    );
    group.progress = completedPercentage;
    setCircularProgress(completedPercentage, groupId);
    
    const trackerBox = document.querySelector(`[data-group-id="${groupId}"]`);
    if (trackerBox) {
      trackerBox.querySelector('.task-count').textContent = calculateRemainingTasks(group.tasks);
      updateTaskStatusTables(trackerBox, group.tasks);
      updateYourTasksSection(trackerBox, group.tasks);
    }
  }
}

function updateKanbanTaskDragListeners(trackerBox) {
  const tasks = trackerBox.querySelectorAll('.kanban-task');
  const groupId = trackerBox.dataset.groupId;
  
  tasks.forEach(task => {
    task.addEventListener('dragstart', () => {
      task.classList.add('dragging');
    });
    
    task.addEventListener('dragend', () => {
      task.classList.remove('dragging');
      const newColumn = task.closest('.kanban-column');
      const newStatus = newColumn.dataset.status;
      const taskId = task.dataset.taskId;
      
      updateTaskStatusInData(groupId, taskId, newStatus);
    });
  });
}

function getRandomColor() {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
}

function setCircularProgress(percent, groupId) {
  const tracker = document.querySelector(`[data-group-id="${groupId}"]`);
  if (!tracker) return;

  const circle = tracker.querySelector('.progress-bar');
  const text = tracker.querySelector('.progress-label');
  
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = offset;
  text.textContent = `${Math.round(percent)}%`;
  void circle.offsetHeight;
}

function initializeKanbanDragDrop(trackerBox) {
  const columns = trackerBox.querySelectorAll('.kanban-column');
  
  columns.forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      const draggingTask = document.querySelector('.dragging');
      if (draggingTask) {
        const afterElement = getDragAfterElement(column, e.clientY);
        if (afterElement) {
          column.insertBefore(draggingTask, afterElement);
        } else {
          column.appendChild(draggingTask);
        }
      }
    });
  });
  
  updateKanbanTaskDragListeners(trackerBox);
}

function getDragAfterElement(column, y) {
  const draggableElements = [...column.querySelectorAll('.kanban-task:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function renderKanbanTasks(trackerBox, groupId) {
  const group = groupsData.find(g => g.id === groupId);
  if (!group) return;

  const todoColumn = trackerBox.querySelector('.todo-column');
  const inProgressColumn = trackerBox.querySelector('.inprogress-column');
  const completedColumn = trackerBox.querySelector('.completed-column');

  [todoColumn, inProgressColumn, completedColumn].forEach(col => col.innerHTML = '');

  group.tasks.todo.forEach(task => {
    todoColumn.appendChild(createKanbanTaskElement(task, 'todo'));
  });
  group.tasks.inProgress.forEach(task => {
    inProgressColumn.appendChild(createKanbanTaskElement(task, 'inProgress'));
  });
  group.tasks.completed.forEach(task => {
    completedColumn.appendChild(createKanbanTaskElement(task, 'completed'));
  });

  initializeKanbanDragDrop(trackerBox);
}

function createKanbanTaskElement(task, status) {
  const taskElement = document.createElement('div');
  taskElement.className = `kanban-task ${status}`;
  taskElement.draggable = true;
  taskElement.dataset.taskId = task.id;
  
  if (task.detail) {
    taskElement.title = task.detail;
  }

  taskElement.innerHTML = `
    <div class="task-name">${task.name}</div>
    <div class="task-info">
      <span class="task-assigned">Assigned: ${task.assigned}</span>
      <span class="task-due">Due: ${task.due}${task.dueTime ? ' at ' + task.dueTime : ''}</span>
    </div>
  `;
  
  return taskElement;
}

// Task Modal Functions
function showTaskModal() {
  const group = getCurrentGroup();
  if (!group) return;

  resetTaskModal();
  taskModal.classList.remove('hidden');
  taskModal.style.display = 'flex';
}

function closeTaskModal() {
  taskModal.classList.add('hidden');
  taskModal.style.display = 'none';
}

function setupAddTaskButton(trackerBox) {
  const addTaskBtn = trackerBox.querySelector('.add-task-btn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
      currentGroupForTask = trackerBox.dataset.groupId;
      showTaskModal();
    });
  }
}

function getCurrentGroup() {
  return groupsData.find(g => g.id === currentGroupForTask);
}

function initTaskModal() {
  // Member input suggestions
  const memberInput = document.getElementById('taskMemberInput');
  memberInput.addEventListener('input', updateTaskMemberSuggestions);

  // Add member button
  document.getElementById('addTaskMemberBtn').addEventListener('click', addTaskMember);

  // Assign all checkbox
  document.getElementById('assignAllCheckbox').addEventListener('change', (e) => {
    if (e.target.checked) {
      assignedMembers = [...getCurrentGroup().members];
      updateTaskMemberList();
      document.getElementById('taskMemberInput').value = '';
      document.getElementById('taskMemberSuggestions').classList.add('hidden');
    } else {
      assignedMembers = [];
      updateTaskMemberList();
    }
  });

  // Create task button
  createTaskBtn.addEventListener('click', createNewTask);

  // Click outside to close
  let isInsideTaskModal = false;
  document.querySelector('#taskModal .modal-content').addEventListener('mousedown', () => {
    isInsideTaskModal = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (!e.target.closest('#taskModal .modal-content') && !isInsideTaskModal) {
      closeTaskModal();
    }
    isInsideTaskModal = false;
  });
}

function updateTaskMemberSuggestions() {

  /* DATABASE INTEGRATION POINT - Member Search
  const members = await db.query(`
    SELECT users.name FROM users
    JOIN group_members ON users.id = group_members.user_id
    WHERE group_members.group_id = ? AND users.name LIKE ?
  `, [currentGroupForTask, `%${inputText}%`]);
  */

  const inputText = this.value.toLowerCase();
  const group = getCurrentGroup();
  if (!group) return;

  

  const suggestionsContainer = document.getElementById('taskMemberSuggestions');
  suggestionsContainer.innerHTML = '';
  
  const filteredNames = group.members
    .filter(name => name.toLowerCase().includes(inputText))
    .filter(name => !assignedMembers.includes(name));

  if (filteredNames.length > 0 && !document.getElementById('assignAllCheckbox').checked) {
    suggestionsContainer.classList.remove('hidden');
    filteredNames.forEach(name => {
      const suggestionItem = document.createElement('div');
      suggestionItem.textContent = name;
      suggestionItem.addEventListener('click', () => {
        addTaskMember(name);
      });
      suggestionsContainer.appendChild(suggestionItem);
    });
  } else {
    suggestionsContainer.classList.add('hidden');
  }
}

function addTaskMember(name = null) {
  const memberInput = document.getElementById('taskMemberInput');
  const memberName = name || memberInput.value.trim();
  const group = getCurrentGroup();
  
  if (!memberName || !group) return;

  if (!group.members.includes(memberName)) {
    alert('This member is not part of the group');
    return;
  }

  if (!assignedMembers.includes(memberName)) {
    assignedMembers.push(memberName);
    updateTaskMemberList();
  }

  memberInput.value = '';
  document.getElementById('taskMemberSuggestions').classList.add('hidden');
  document.getElementById('assignAllCheckbox').checked = false;
}

function removeTaskMember(index) {
  assignedMembers.splice(index, 1);
  updateTaskMemberList();
  document.getElementById('assignAllCheckbox').checked = false;
}

function updateTaskMemberList() {
  const memberList = document.getElementById('taskMemberList');
  memberList.innerHTML = '';

  assignedMembers.forEach((member, index) => {
    const memberItem = document.createElement('div');
    memberItem.innerHTML = `
      ${member}
      <span onclick="removeTaskMember(${index})">X</span>
    `;
    memberList.appendChild(memberItem);
  });
}

function createNewTask() {
  const group = getCurrentGroup();
  if (!group) return;

  const taskName = document.getElementById('taskNameInput').value.trim();
  const taskDetail = document.getElementById('taskDetailInput').value.trim();
  const assignAll = document.getElementById('assignAllCheckbox').checked;
  const date = document.getElementById('taskDateInput').value;
  const time = document.getElementById('taskTimeInput').value;

  // Validation
  if (!taskName) {
    alert('Please enter a task name');
    return;
  }
  
  if (!assignAll && assignedMembers.length === 0) {
    alert('Please assign at least one member or select "Assign to all"');
    return;
  }

  if (!date) {
    alert('Please select a due date');
    return;
  }

  /* DATABASE INTEGRATION POINT - Task Creation
  await db.query(`
    INSERT INTO tasks (group_id, name, detail, assigned_to, due_date, status)
    VALUES (?, ?, ?, ?, ?, 'todo')
  `, [currentGroupForTask, taskName, taskDetail, assignedMember, dueDate]);
  */

  // Date handling with timezone safety
  let dueDate = new Date(date);
  dueDate.setHours(12, 0, 0, 0);
  
  if (time) {
    const [hours, minutes] = time.split(':');
    dueDate.setHours(parseInt(hours), parseInt(minutes));
  }

  const now = new Date();
  if (dueDate < now) {
    alert('Cannot create tasks with deadlines in the past');
    return;
  }
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dueDateFormatted = `${monthNames[dueDate.getMonth()]} ${dueDate.getDate()}`;
  const dueDateKey = dueDate.toLocaleDateString('en-CA');

  // Create task(s)
  const assignees = assignAll ? ['All'] : [...new Set(assignedMembers)];
  const newTasks = [];

  assignees.forEach(assignedMember => {
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: taskName,
      detail: taskDetail,
      assigned: assignedMember,
      due: dueDateFormatted,
      dueFull: dueDate,
      dueDateKey: dueDateKey,
      dueTime: time
    };

    group.tasks.todo.push(newTask);
    newTasks.push(newTask);
  });

  /* DATABASE INTEGRATION POINT - Save new tasks to database
  await saveTasksToDatabase(currentGroupForTask, newTasks);
  */

  // Update UI
  const trackerBox = document.querySelector(`[data-group-id="${currentGroupForTask}"]`);
  renderKanbanTasks(trackerBox, currentGroupForTask);
  renderTaskCalendar(currentGroupForTask);
  updateProgressPercentage(currentGroupForTask);

  // Reset form
  resetTaskModal();
  closeTaskModal();
}

function resetTaskModal() {
  document.getElementById('taskNameInput').value = '';
  document.getElementById('taskDetailInput').value = '';
  document.getElementById('taskMemberInput').value = '';
  document.getElementById('assignAllCheckbox').checked = false;
  document.getElementById('taskDateInput').value = '';
  document.getElementById('taskTimeInput').value = '';
  assignedMembers = [];
  updateTaskMemberList();
  document.getElementById('taskMemberSuggestions').classList.add('hidden');
}

// Project Detail Toggle
function setupDetailToggle(trackerBox) {
  const detailButton = trackerBox.querySelector('.view-project-detail');
  const projectDetail = trackerBox.querySelector('.project-detail');
  
  if (detailButton && projectDetail) {
    detailButton.replaceWith(detailButton.cloneNode(true));
    const newDetailButton = trackerBox.querySelector('.view-project-detail');
    
    newDetailButton.addEventListener('click', () => {
      const isVisible = projectDetail.style.display === 'block';
      projectDetail.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        projectDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

// Kanban Board Toggle
function setupKanbanToggle(trackerBox) {
  const kanbanBtn = trackerBox.querySelector('.kanban-button');
  const taskStatusText = trackerBox.querySelector('.task-status');
  const taskStatusView = trackerBox.querySelector('.task-status-view');
  const kanbanView = trackerBox.querySelector('.kanban-board');
  const projectDetail = trackerBox.querySelector('.project-detail');

  projectDetail.style.perspective = '1000px';
  taskStatusView.style.transformStyle = 'preserve-3d';
  kanbanView.style.transformStyle = 'preserve-3d';
  taskStatusView.style.backfaceVisibility = 'hidden';
  kanbanView.style.backfaceVisibility = 'hidden';

  kanbanBtn.addEventListener('click', () => {
    const isKanbanVisible = kanbanView.style.display === 'block';
    
    kanbanBtn.style.transform = 'rotateY(180deg)';
    taskStatusText.style.opacity = '0';
    
    if (isKanbanVisible) {
      taskStatusView.style.transform = 'rotateY(0deg)';
      kanbanView.style.transform = 'rotateY(180deg)';
    } else {
      taskStatusView.style.transform = 'rotateY(180deg)';
      kanbanView.style.transform = 'rotateY(0deg)';
    }

    setTimeout(() => {
      taskStatusView.style.display = isKanbanVisible ? 'block' : 'none';
      kanbanView.style.display = isKanbanVisible ? 'none' : 'block';
      
      if (isKanbanVisible) {
        kanbanBtn.textContent = 'KANBAN BOARD';
        kanbanBtn.style.backgroundColor = 'orange';
        taskStatusText.textContent = 'TASK STATUS';
        taskStatusText.style.color = '#1A5E63';
      } else {
        kanbanBtn.textContent = 'TASK STATUS';
        kanbanBtn.style.backgroundColor = '#1A5E63';
        taskStatusText.textContent = 'KANBAN BOARD';
        taskStatusText.style.color = '#F58A07';
        initializeKanbanDragDrop(trackerBox);
      }
      
      kanbanBtn.style.transform = 'rotateY(0deg)';
      taskStatusText.style.opacity = '1';
    }, 300);
  });
}

// Termination Modal Functions
function showTerminateConfirm(groupId) {
  currentTerminateGroupId = groupId;
  terminateConfirmModal.classList.remove('hidden');
  terminateConfirmModal.style.display = 'flex';
}

function hideTerminateConfirm() {
  terminateConfirmModal.classList.add('hidden');
  terminateConfirmModal.style.display = 'none';
  currentTerminateGroupId = null;
}

function handleTerminateConfirm() {
  if (!currentTerminateGroupId) return;
  
  const groupIndex = groupsData.findIndex(g => g.id === currentTerminateGroupId);
  if (groupIndex > -1) {
    groupsData.splice(groupIndex, 1);
  }
  
  const tracker = document.querySelector(`[data-group-id="${currentTerminateGroupId}"]`);

  /* DATABASE INTEGRATION POINT - Group Deletion
  await db.query('DELETE FROM groups WHERE id = ?', [currentTerminateGroupId]);
  await db.query('DELETE FROM tasks WHERE group_id = ?', [currentTerminateGroupId]);
  */

  tracker?.remove();
  hideTerminateConfirm();
}

// Group Creation
function createGroupTracker(groupName, members, existingData = null) {

    /* DATABASE INTEGRATION POINT - Group Creation
  const groupId = await db.insertGroup({
    name: groupName,
    members: members,
    progress: 0,
    status: false,
    color: getRandomColor()
  });
  */

  const groupId = existingData?.id || Date.now().toString();
  const borderColor = existingData?.borderColor || getRandomColor();

  const groupData = {
    id: groupId,
    name: groupName,
    members: members,
    progress: 0,
    status: false,
    borderColor: borderColor,
    tasks: {
      todo: [],
      inProgress: [],
      completed: []
    }
  };

  if (!existingData) {
    groupsData.push(groupData);
    
    /* DATABASE INTEGRATION POINT - Save new group to database
    const savedGroup = await saveGroupToDatabase(newGroup);
    groupsData.push(savedGroup);
    createGroupTracker(savedGroup.name, savedGroup.members, savedGroup);
    */
  }

  const trackerBox = document.createElement('div');
  trackerBox.className = 'group-tracker';
  trackerBox.style.border = `4px solid ${borderColor}`;
  trackerBox.dataset.groupId = groupId;
  trackerBox.dataset.groupStatus = groupData.status;

  trackerBox.innerHTML = `
    <div class="tracker-header">
      <h3 class="group-title">${groupName}</h3>
    </div>
    <div class="tracker-body">
      <div class="tracker-section progress">
        <h4 class="section-label">PROGRESS</h4>
        <div class="progress-container">
          <svg class="progress-ring" width="160" height="160">
            <g transform="rotate(-90 60 60)">
              <circle class="progress-bg" cx="60" cy="60" r="40" />
              <circle class="progress-bar" cx="60" cy="60" r="40" />
            </g>
            <text x="60" y="65" class="progress-label">0%</text>
          </svg>
        </div>
        <div class="progress-controls style="display: none;">
          <input type="number" min="0" max="100" placeholder="Test %" class="progress-input" style="display: none;">
          <button class="progress-update-btn" style="display: none;">
            Test Progress
          </button>
        </div>
      </div>
      <div class="divider-vertical"></div>
      <div class="tracker-section remaining">
        <h4 class="section-label">REMAINING</h4>
        <h4 class="section-label">TASK</h4>
        <div class="task-count">0</div>
      </div>
      <div class="divider-vertical"></div>
      <div class="tracker-section tasks">
        <h4 class="section-label">YOUR TASK:</h4>
        <div class="task-item">No tasks assigned</div>
        <button class="view-project-detail hover:animate-pulse">VIEW PROJECT DETAIL</button>
      </div>
    </div>
    <div class="project-detail">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <h2 class="task-status">TASK STATUS</h2>
        <button class="kanban-button">KANBAN BOARD</button>
      </div>

      <!-- Task Status View (default) -->
      <div class="task-status-view">
        <h3 class="to-do">To-Do</h3>
        <table class="task-table1">
          <thead>
              <th>TASK</th>
              <th>ASSIGNED TASK</th>
              <th>DEADLINE</th>
          </thead>
          <tbody>
            <tr><td colspan="3" class="empty-task">No tasks</td></tr>
          </tbody>
        </table>

        <h3 class="in-progress">In Progress</h3>
        <table class="task-table2">
          <thead>
            <tr>
              <th>TASK</th>
              <th>ASSIGNED TASK</th>
              <th>DEADLINE</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="3" class="empty-task">No tasks</td></tr>
          </tbody>
        </table>

        <h3 class="completedtxt">Completed</h3>
        <div class="completed-section-outer">
          <div class="completed-section">
            <div class="empty-task">No tasks</div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="finish-project">PROJECT FINISH</button>
          <button class="terminate-project">TERMINATE PROJECT</button>
        </div>
      </div>

      <!-- Kanban Board View (hidden initially) -->
      <div class="kanban-board" style="display: none;">
        <div class="kanban-controls">
          <div style="display: flex; justify-content: flex-end;">
            <button class="add-task-btn">
              <i class="fas fa-plus"></i> ADD TASK
            <button>
          </div>
        </div>
        <div class="kanban-container">
          <div class="kanban-column-group">
            <h3 class="kanban-column-title" style="color: #FF4D3B">TO-DO</h3>
            <div class="kanban-column todo-column" data-status="todo"></div>
          </div>
          <div class="kanban-column-group">
            <h3 class="kanban-column-title" style="color: #FF8C00">IN PROGRESS</h3>
            <div class="kanban-column inprogress-column" data-status="inProgress"></div>
          </div>
          <div class="kanban-column-group">
            <h3 class="kanban-column-title" style="color: #04B466">COMPLETED</h3>
            <div class="kanban-column completed-column" data-status="completed"></div>
          </div>
        </div>

        <!-- Task Calendar -->
        <div class="task-calendar-container">
          <h3 class="calendar-title">CALENDAR</h3>
          <div class="calendar-scroll-wrapper">
            <table class="task-calendar">
              <!-- Dynamically populated by JavaScript -->
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  // Event Listeners
  trackerBox.querySelector('.progress-update-btn').addEventListener('click', () => {
    updateProgress(groupId);
  });

  trackerBox.querySelector('.finish-project').addEventListener('click', () => {
    handleProjectFinish(groupId);
  });

  trackerBox.querySelector('.terminate-project').addEventListener('click', () => {
    showTerminateConfirm(groupId);
  });

  // Add Task Button Event Listener
  setupAddTaskButton(trackerBox);

  parentContainer.appendChild(trackerBox);
  setCircularProgress(groupData.progress, groupId);
  setupDetailToggle(trackerBox);
  setupKanbanToggle(trackerBox);
  renderKanbanTasks(trackerBox, groupId);
  renderTaskCalendar(groupId);
  
  return trackerBox;
}

// Event Handlers
function updateProgress(groupId) {
  const group = groupsData.find(g => g.id === groupId);
  if (!group) return;

  const totalTasks = group.tasks.todo.length + 
                   group.tasks.inProgress.length + 
                   group.tasks.completed.length;
  
  if (totalTasks > 0) {
    const newProgress = Math.round(
      (group.tasks.completed.length / totalTasks) * 100
    );
    group.progress = newProgress;
    setCircularProgress(newProgress, groupId);
  } else {
    setCircularProgress(0, groupId);
  }
  
  /* DATABASE INTEGRATION POINT - Update progress in database
  await updateGroupProgress(currentUserId, groupId, newProgress);
  */
}

function handleProjectFinish(groupId) {
  const group = groupsData.find(g => g.id === groupId);
  if (!group) return;

  group.status = !group.status;
  const tracker = document.querySelector(`[data-group-id="${groupId}"]`);
  
  tracker.classList.toggle('project-completed', group.status);
  tracker.dataset.groupStatus = group.status;
  tracker.querySelector('.finish-project').textContent = 
    group.status ? "✔️ PROJECT COMPLETED" : "PROJECT FINISH";
}

// Modal Event Listeners
terminateConfirmBtn.addEventListener('click', handleTerminateConfirm);
terminateCancelBtn.addEventListener('click', hideTerminateConfirm);
terminateConfirmModal.addEventListener('click', (e) => {
  if (e.target === terminateConfirmModal) hideTerminateConfirm();
});

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  parentContainer.innerHTML = '';
  
  /* DATABASE INTEGRATION POINT - Initial Data Load
  try {
    const userId = getCurrentUserId(); // Implement auth system
    groupsData = await db.query(`
      SELECT groups.*, 
      (SELECT COUNT(*) FROM tasks WHERE group_id = groups.id AND status = 'completed') as completed_count,
      (SELECT COUNT(*) FROM tasks WHERE group_id = groups.id) as total_tasks
      FROM groups
      WHERE groups.user_id = ?
    `, [userId]);
    
    // Load members for each group
    for (let group of groupsData) {
      group.members = await db.query(`
        SELECT users.name FROM users
        JOIN group_members ON users.id = group_members.user_id
        WHERE group_members.group_id = ?
      `, [group.id]);
    }
  } catch (error) {
    console.error("Database load error:", error);
    groupsData = []; // Fallback to empty
  }
  */
  
  // Initialize task modal
  initTaskModal();
});