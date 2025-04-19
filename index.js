  const sidebar = document.getElementById('sidebar');
  const menuIcon = document.querySelector('.menu-icon i');
  const closeSidebar = document.getElementById('closeSidebar');

  menuIcon.addEventListener('click', () => {
    sidebar.classList.add('open');
  });

  closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });

  //DASHBOARD
  setTimeout(() => {
    // Ongoing Project
    document.getElementById("ongoing-projects").innerHTML = `
      <div class="info">
        <div class="info-box">
          <div class="progress-circle">56%</div>
          <p style="text-align: center;">Progress</p>
        </div>
        <div class="info-box">
          <h3>GROUP 1 REPORTING | EAPP</h3>
          <p><strong>Remaining Tasks:</strong> 7</p>
          <p><strong>Your Task:</strong> Research Topic <em>(Due: Mar 5)</em></p>
          <p>Script <em>(Due: Mar 6)</em></p>
        </div>
      </div>
    `;

    // Due Tasks
    document.getElementById("due-tasks").innerHTML = `
      <ul>
        <li>Research Topic - Due Mar 5</li>
        <li>Submit Script - Due Mar 6</li>
      </ul>
    `;

    // Notifications
    document.getElementById("notifications").innerHTML = `
      <ul>
        <li>Reminder: Group meeting at 4 PM</li>
        <li>New feedback from your instructor</li>
      </ul>
    `;

    // Badges
    document.getElementById("badge-container").innerHTML = `
      <div class="badge">
        <img src="https://via.placeholder.com/100x100.png?text=MVP" alt="MVP Badge">
        <button class="claim-btn">CLAIM REWARDS</button>
      </div>
      <div class="badge">
        <img src="https://via.placeholder.com/100x100.png?text=Most+Likable" alt="Most Likable Badge">
        <button class="claim-btn">CLAIM REWARDS</button>
      </div>
      <div class="badge">
        <img src="https://via.placeholder.com/100x100.png?text=Best+Work" alt="Best Work Badge">
        <button class="claim-btn">CLAIM REWARDS</button>
      </div>
    `;
  }, 2000);


