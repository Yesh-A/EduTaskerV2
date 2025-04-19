const sidebar = document.getElementById('sidebar');
  const menuIcon = document.querySelector('.menu-icon i');
  const closeSidebar = document.getElementById('closeSidebar');

  menuIcon.addEventListener('click', () => {
    sidebar.classList.add('open');
  });

  closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });

//
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addGroupBtn").addEventListener("click", openModal);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("confirmAddGroupBtn").addEventListener("click", addGroup);
});

function openModal() {
  document.getElementById("modal").style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

function addGroup() {
  const number = document.getElementById("groupNumber").value.trim();
  const name = document.getElementById("groupName").value.trim();

  if (!number || !name) return;

  const encodedName = encodeURIComponent(name);
  const link = `group-page.html?group=${number}&name=${encodedName}`;

  const a = document.createElement("a");
  a.className = "team-btn custom-border";
  a.innerText = `GROUP ${number} | ${name.toUpperCase()}`;
  a.href = link;

  document.querySelector(".container").appendChild(a);
  closeModal();

  // Clear input fields
  document.getElementById("groupNumber").value = "";
  document.getElementById("groupName").value = "";
  document.getElementById("groupMembers").value = "";
}