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
  const params = new URLSearchParams(window.location.search);
  const groupNo = params.get("group");
  const groupName = params.get("name");

  const display = document.getElementById("groupDisplay");
  if (groupNo && groupName) {
    display.innerText = `GROUP ${groupNo} | ${decodeURIComponent(groupName).toUpperCase()}`;
  } else {
    display.innerText = "GROUP DETAILS";
  }

  //MODAL FOR MEETING 
  const modal = document.getElementById('modalOverlay');
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const meetingType = document.getElementById('meetingType');
  const faceToFaceFields = document.getElementById('faceToFaceFields');
  const onlineFields = document.getElementById('onlineFields');

  openModalBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target == modal) {
      modal.style.display = 'none';
    }
  });

  meetingType.addEventListener('change', (e) => {
    const value = e.target.value;
    faceToFaceFields.classList.add('hidden');
    onlineFields.classList.add('hidden');

    if (value === 'face') {
      faceToFaceFields.classList.remove('hidden');
    } else if (value === 'online') {
      onlineFields.classList.remove('hidden');
    }
  });

  //CONTENT FOR MEETING 
  const meetingForm = document.getElementById('meetingForm');
  const meetingList = document.getElementById('meetingList');
  const noMeetingsMessage = document.getElementById('noMeetingsMessage');

  meetingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const meetingName = document.getElementById('meetingName').value;
    const meetingTypeValue = document.getElementById('meetingType').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    let location = '';
    let link = '';

    if (meetingTypeValue === 'face') {
      location = document.getElementById('place').value;
    } else if (meetingTypeValue === 'online') {
      location = document.getElementById('onlinePlace').value;
      link = document.getElementById('link').value;
    }

    const meetingHTML = `
      <div class="meeting-item">
        <div class="meeting-details">
          <strong>${meetingName}</strong><br>
          Type: ${meetingTypeValue === 'face' ? 'Face to Face' : 'Online'}<br>
          Time: ${startTime} - ${endTime}<br>
          Place: ${location}<br>
          ${link ? `Link: <a href="${link}" target="_blank" style="color:#1a5e63;">${link}</a><br>` : ''}
        </div>
        <i class="fas fa-trash delete-meeting"></i>
      </div>
    `;

    noMeetingsMessage.style.display = 'none';

    meetingList.insertAdjacentHTML('beforeend', meetingHTML);
    modal.style.display = 'none';
    meetingForm.reset();
    faceToFaceFields.classList.add('hidden');
    onlineFields.classList.add('hidden');
  });

  // Event delegation for delete
  meetingList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-meeting')) {
      e.target.parentElement.remove();
  
      // If no more meetings exist, show the empty message again
      if (meetingList.children.length === 0) {
        noMeetingsMessage.style.display = 'block';
      }
    }
  });
// FOLDER MODAL AND FUNCTIONALITY
document.addEventListener('DOMContentLoaded', () => {
  const folderModal = document.getElementById('folderModal');
  const openFolderModalBtn = document.getElementById('addFolderBtn');
  const closeFolderModalBtn = document.getElementById('closeFolderModal');
  const folderForm = document.getElementById('folderForm');
  const folderList = document.getElementById('folderList');
  const noFoldersMessage = document.getElementById('noFoldersMessage');

  // Open folder modal
  openFolderModalBtn.addEventListener('click', () => {
    folderModal.style.display = 'flex';
  });

  // Close folder modal
  closeFolderModalBtn.addEventListener('click', () => {
    folderModal.style.display = 'none';
  });

  // Close folder modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === folderModal) {
      folderModal.style.display = 'none';
    }
  });

  // Handle folder creation
  folderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const folderName = document.getElementById('folderName').value;
    const folderColor = document.getElementById('folderColor').value;
    const creationDate = new Date().toLocaleString(); // Get current date and time

    // Create folder item container
    const folderDiv = document.createElement('div');
    folderDiv.classList.add('folder-item');

    // Create the Font Awesome folder icon
    const folderIcon = document.createElement('i');
    folderIcon.classList.add('fas', 'fa-folder');
    folderIcon.style.color = folderColor; // Set folder color from user input

    // Create the folder name text
    const folderText = document.createElement('span');
    folderText.textContent = folderName;

    // Create the creation date element
    const folderDate = document.createElement('span');
    folderDate.classList.add('folder-date');
    folderDate.textContent = `Created on: ${creationDate}`;

    // Append the icon, name, and date to the folder item
    folderDiv.appendChild(folderIcon);
    folderDiv.appendChild(folderText);
    folderDiv.appendChild(folderDate);

    // Add click behavior to open Folder.html
    folderDiv.addEventListener('click', () => {
      localStorage.setItem('selectedFolder', folderName);
      window.location.href = 'Folder.html';
    });

    // Add the new folder to the folder list
    folderList.appendChild(folderDiv);

    // Hide the "No folders" message and close the modal
    noFoldersMessage.style.display = 'none';
    folderModal.style.display = 'none';
    folderForm.reset();
  });
});

//LINKS
document.getElementById('dropLinkBtn').addEventListener('click', () => {
  const formContainer = document.getElementById('linkFormContainer');
  formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
});

document.getElementById("addNewTypeBtn").addEventListener("click", () => {
  document.getElementById("newTypeModal").classList.add("show");
});

document.getElementById("closeTypeModal").addEventListener("click", () => {
  document.getElementById("newTypeModal").classList.remove("show");
});

document.getElementById('saveNewType').addEventListener('click', () => {
  const newType = document.getElementById('newTypeInput').value.trim();
  if (newType) {
    const option = document.createElement('option');
    option.value = newType;
    option.textContent = newType;
    document.getElementById('linkType').appendChild(option);
    document.getElementById('linkType').value = newType;
    document.getElementById('newTypeModal').style.display = 'none';
    document.getElementById('newTypeInput').value = '';
  } else {
    alert('Please enter a valid type name.');
  }
});

document.getElementById('linkForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const type = document.getElementById('linkType').value;
  const desc = document.getElementById('linkDescription').value;
  const url = document.getElementById('linkURL').value;

  if (!url.trim()) return alert('Please enter a valid link.');

  const list = document.getElementById('linkList');
  const item = document.createElement('div');
  item.className = 'link-item';

  item.innerHTML = `
    <h4>${type}</h4>
    <a href="${url}" target="_blank">${url}</a>
    <p>${desc}</p>
  `;

  list.appendChild(item);

  this.reset();
  document.getElementById('noLinkMessage').style.display = 'none';
  document.getElementById('linkFormContainer').style.display = 'none';
});