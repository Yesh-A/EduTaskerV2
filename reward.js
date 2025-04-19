const sidebar = document.getElementById('sidebar');
const menuIcon = document.querySelector('.menu-icon i');
const closeSidebar = document.getElementById('closeSidebar');

menuIcon.addEventListener('click', () => {
  sidebar.classList.add('open');
});

closeSidebar.addEventListener('click', () => {
  sidebar.classList.remove('open');
});
 
 // === Simulate whether the user has achievements ===
 const hasAchievements = false; // Change to true later when needed

 const achievementsSection = document.getElementById("achievements");
 const noAchievementsMessage = document.getElementById("no-achievements");

 if (hasAchievements) {
   achievementsSection.style.display = "flex";
   noAchievementsMessage.style.display = "none";
 } else {
   achievementsSection.style.display = "none";
   noAchievementsMessage.style.display = "block";
 }