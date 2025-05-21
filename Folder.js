

// ===== IMPORTS (Must be at the top of a module script) =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  update,
  push,
  child,
  onValue,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
  apiKey: "AIzaSyCPiw_BpB0lQqpJ8M_XkJgukwCAb9I2vQM",
  authDomain: "edutasker-cd056.firebaseapp.com",
  databaseURL: "https://edutasker-cd056-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "edutasker-cd056",
  storageBucket: "edutasker-cd056.appspot.com",
  messagingSenderId: "499676743785",
  appId: "1:499676743785:web:d6b93b8e695d1bf656baf8",
  measurementId: "G-H7MKZDPJS3",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

// ===== CLOUDINARY CONFIGURATION =====
const CLOUDINARY_PRESET = "EduTasker_folder_upload";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dgyw6dtv3/auto/upload";

let folderEditActive = false;
let folderInput = null;

// ===== UI SETUP =====
document.addEventListener("DOMContentLoaded", () => {

  const toggleBtn = document.querySelector('.menu-toggle');
  toggleBtn.addEventListener('click', () => {
    document.getElementById('navIcons').classList.toggle('show');
  });
  
  // Sidebar toggle
  const sidebar = document.getElementById("sidebar");
  const menuIcon = document.querySelector(".menu-icon i");
  const closeSidebar = document.getElementById("closeSidebar");

  menuIcon?.addEventListener("click", () => sidebar?.classList.add("open"));
  closeSidebar?.addEventListener("click", () => sidebar?.classList.remove("open"));

  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "group-page.html";
    });
  }

 // GROUP DISPLAY
 const params = new URLSearchParams(window.location.search);
 const groupName = decodeURIComponent(params.get("name"));
 const folderName = localStorage.getItem("selectedFolder");
 const folderTitle = document.getElementById("folderTitle");

 if (groupName) {
   const groupDisplay = document.getElementById("groupDisplay");
   if (groupDisplay) {
     groupDisplay.textContent = groupName;
   }
 }

 if (folderTitle) {
  const folderName = localStorage.getItem("selectedFolder") || "My Folder";
  folderTitle.textContent = folderName.toUpperCase();
}

  // Upload button and spinner
  const uploadBtn = document.querySelector(".upload-btn");
  const uploadSpinner = document.getElementById("uploadSpinner");

  // Load Cloudinary widget
  function loadCloudinaryWidget() {
    return new Promise((resolve) => {
      if (window.cloudinary) return resolve();
      const script = document.createElement("script");
      script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  

  function initAppForUser(user) {
    console.log("Logged in as:", user.email);
  
    // Optional: update UI with user info
    const userEmailDisplay = document.getElementById("user-email");
    if (userEmailDisplay) {
      userEmailDisplay.textContent = user.email;
    }
  
    // Step 1: Load the group the user belongs to
    const userId = user.uid;
  
    const userRef = ref(db, `users/${userId}`);
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log(data);
      }
    });
      
    getDoc(userRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const groupId = userData.groupId;
  
          if (groupId) {
            console.log("User is in group:", groupId);
            
            // Step 2: Load and render folders for this group
            loadFolders(groupId);
  
            // Optional: store current groupId in a global variable if needed elsewhere
            window.currentGroupId = groupId;
  
          } else {
            console.warn("User has no group assigned.");
          }
        } else {
          console.warn("No such user document!");
        }
      })
      .catch((error) => {
        console.error("Error getting user group:", error);
      });
  }
  
  function loadFolders(groupId) {
    const foldersRef = collection(db, "groups", groupId, "folders");
  
    getDocs(foldersRef)
      .then((querySnapshot) => {
        const folderList = document.getElementById("folder-list"); // Replace with your folder container ID
        folderList.innerHTML = ""; // Clear current list
  
        querySnapshot.forEach((doc) => {
          const folderData = doc.data();
          const folderId = doc.id;
  
          // Create and insert folder card or list item
          const folderItem = document.createElement("div");
          folderItem.className = "folder-card";
          folderItem.textContent = folderData.name || "Untitled Folder";
  
          folderList.appendChild(folderItem);
        });
      })
      .catch((error) => {
        console.error("Error loading folders:", error);
      });
  }
  

  async function initUploadWidget() {
    await loadCloudinaryWidget();
    if (!uploadBtn) return;

    const widget = cloudinary.createUploadWidget(
      {
        cloudName: "dgyw6dtv3",
        uploadPreset: CLOUDINARY_PRESET,
        folder: "folder_files",
        multiple: false,
        maxFiles: 1,
        sources: ["local", "url", "camera"],
        clientAllowedFormats: [
          "jpg",
          "png",
          "pdf",
          "doc",
          "docx",
          "mp4",
          "txt",
        ],
      },
      async (error, result) => {
        if (error) {
          console.error("Upload Widget Error:", error);
          alert("Upload failed: " + error.message);
          uploadSpinner.style.display = "none";
          return;
        }

        if (result.event === "start") {
          uploadSpinner.style.display = "block";
        }

        if (result.event === "success") {
          uploadSpinner.style.display = "none";
          const info = result.info;

          if (!groupName) {
            alert("Group not defined. Can't save upload info.");
            return;
          }

          try {
            const uploadsRef = ref(db, `groups/${groupName}/uploads`);
            const snapshot = await get(uploadsRef);
            const existingFiles = snapshot.exists() ? snapshot.val() : {};

            const fileName = info.original_filename + "." + info.format;
            const isDuplicate = Object.values(existingFiles).some(
              (f) => f.name === fileName
            );

            if (isDuplicate) {
              alert(
                `Warning: A file named "${fileName}" already exists. This upload will not overwrite the existing file.`
              );
            }

            try {
              console.log("Saving file info:", fileName, info.secure_url);
              await push(uploadsRef, {
                name: fileName,
                type:
                  info.resource_type === "image"
                    ? "image/" + info.format
                    : info.format,
                url: info.secure_url,
                uploadedAt: new Date().toLocaleDateString(),
              });
              alert("File uploaded successfully!");
            } catch (err) {
              console.error("Error saving upload info:", err);
            }
          } catch (err) {
            console.error("Error saving upload info:", err);
          }
        }
      }
    );

    uploadBtn.addEventListener("click", () => {
      widget.open();
    });
  }

  initUploadWidget();

  // Live file list from Firebase
  if (groupName) {
    console.log("Listening for uploads in group:", groupName);
    const uploadsRef = ref(db, `groups/${groupName}/uploads`);
    onValue(uploadsRef, (snapshot) => {
      const fileListContainer = document.getElementById("fileList");
      if (!fileListContainer) {
        console.warn("fileList container not found");
        return;
      }
      fileListContainer.innerHTML = "";
      const uploads = snapshot.val();
      console.log("Uploads snapshot value:", uploads);
      if (uploads) {
        Object.values(uploads).forEach((file) => {
          const fileItem = document.createElement("div");
          fileItem.classList.add("file-item");
          fileItem.innerHTML = `
            <div class="file-name-group">
              <span class="file-name">
                <i class="fa-solid fa-file"></i> 
                <a href="${file.url}" target="_blank" rel="noopener noreferrer">${file.name}</a>
                <span class="file-controls"></span>

              </span>
            </div>
              <span class="file-date">${file.uploadedAt}</span>
          `;
          fileListContainer.appendChild(fileItem);
        });
        enhanceFileListWithActions();
      } else {
        fileListContainer.innerHTML =
          '<p style="color:#999;">No files uploaded yet.</p>';
      }
    });
  }

  // Folder control buttons (edit & sort placeholders)

  function enableFolderRename() {
    const folderTitle = document.getElementById("folderTitle");
    const currentName = folderTitle.textContent;
  
    folderInput = document.createElement("input");
    folderInput.type = "text";
    folderInput.value = currentName;
    folderInput.classList.add("folder-title-input");
  
    folderTitle.replaceWith(folderInput);
    folderInput.focus();
    folderEditActive = true;
  
    // Handles save (Enter) or cancel (Escape or outside click)
    function saveOrCancelEdit(save = false) {
      const title = document.createElement("div");
      title.id = "folderTitle";
      title.classList.add("folder-title");
  
      const newName = folderInput.value.trim();
      title.textContent = save && newName ? newName : currentName;
  
      folderInput.replaceWith(title);
      folderEditActive = false;
      folderInput = null;
      document.removeEventListener("mousedown", handleClickOutside);
  
      if (save && newName && newName !== currentName) {
        const groupName = decodeURIComponent(new URLSearchParams(window.location.search).get("name"));
        const folderRef = ref(db, `groups/${groupName}/folders`);
        update(folderRef, { [newName]: true, [currentName]: null })
          .then(() => localStorage.setItem("selectedFolder", newName))
          .catch(err => console.error("Rename error:", err));
      }
    }
  
    // Handle enter and escape keys
    folderInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveOrCancelEdit(true);
      if (e.key === "Escape") saveOrCancelEdit(false);
    });
  
    // Cancel on click outside
    function handleClickOutside(e) {
      if (folderInput && !folderInput.contains(e.target)) {
        saveOrCancelEdit(false);
      }
    }
  
    // Delay to prevent immediate trigger
    setTimeout(() => document.addEventListener("mousedown", handleClickOutside), 50);
  }
  
  // Add buttons (edit mode)
  function enhanceFileListWithActions() {
    if (!document.body.classList.contains("edit-mode")) return;
  
    document.querySelectorAll(".file-controls").forEach(controlSpan => {
      if (!controlSpan.querySelector(".file-download-btn")) {
        const downloadBtn = document.createElement("button");
        downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i>';
        downloadBtn.title = "Download file";
        downloadBtn.classList.add("file-download-btn");
  
        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteBtn.title = "Delete file";
        deleteBtn.classList.add("file-delete-btn");
  
        controlSpan.appendChild(downloadBtn);
        controlSpan.appendChild(deleteBtn);
  
        const fileItem = controlSpan.closest(".file-item");
        const fileLink = fileItem.querySelector("a");
  
        downloadBtn.addEventListener("click", () => {
          if (fileLink?.href) {
            const a = document.createElement("a");
            a.href = fileLink.href;
            a.download = fileLink.textContent;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        });
  
        deleteBtn.addEventListener("click", () => {
          const fileName = fileLink?.textContent;
          if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
            alert("Delete functionality to be implemented.");
          }
        });
      }
    });
  }
  
  // Remove buttons (exit edit mode)
  function removeFileListActions() {
    document.querySelectorAll(".file-controls").forEach(controlSpan => {
      controlSpan.querySelector(".file-download-btn")?.remove();
      controlSpan.querySelector(".file-delete-btn")?.remove();
    });
  }
  
  // Exit edit mode
  function exitEditMode() {
    document.body.classList.remove("edit-mode");
  
    // Restore folder title if renaming
    if (folderEditActive && folderInput) {
      const currentName = folderInput.value.trim();
      const title = document.createElement("div");
      title.id = "folderTitle";
      title.classList.add("folder-title");
      title.textContent = currentName || "Untitled Folder";
      folderInput.replaceWith(title);
      folderEditActive = false;
      folderInput = null;
    }
  
    removeFileListActions();
  }
  
  // MAIN TOGGLE BUTTON
  const editModeBtn = document.getElementById("editModeBtn");
  if (editModeBtn) {
    editModeBtn.addEventListener("click", () => {
      const isEditMode = document.body.classList.contains("edit-mode");
      if (isEditMode) {
        exitEditMode();
      } else {
        document.body.classList.add("edit-mode");
        enhanceFileListWithActions();
        if (!folderEditActive) {
          enableFolderRename();
        }
      }
    });
  } else {
    console.warn('"editModeBtn" not found in the DOM.');
  }

  const folderSortBtn = document.querySelector(".folder-sort");
  async function sortFiles() {
    if (!groupName) {
      alert("Group name not found, cannot sort files.");
      return;
    }
  
    try {
      const uploadsRef = ref(db, `groups/${groupName}/uploads`);
      const snapshot = await get(uploadsRef);
  
      if (!snapshot.exists()) {
        alert("No files found to sort.");
        return;
      }
  
      const uploadsObj = snapshot.val();
  
      // Convert uploads object into an array for sorting
      const filesArray = Object.entries(uploadsObj).map(([key, file]) => ({
        key,
        name: file.name || key,
        type: file.type,
        uploadedAt: file.uploadedAt,
        url: file.url
      }));
  
      // Sort files alphabetically by name, case insensitive
      filesArray.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  
      // Update the UI to show the first file's name as a "selected file" example
      const fileTitle = document.getElementById("fileTitle");
      if (fileTitle && filesArray.length > 0) {
        fileTitle.textContent = filesArray[0].name;
        localStorage.setItem("selectedFile", filesArray[0].key);
      }
      renderFileList(filesArray);  
      alert(`Sorted ${filesArray.length} files alphabetically.`);
  
      // TODO: Render sorted file list in the UI
      // Example function:
      // renderFileList(filesArray);
  
    } catch (error) {
      console.error("Error sorting files:", error);
      alert("Failed to sort files. See console for details.");
    }
  }
  
  if (folderSortBtn) {
    folderSortBtn.addEventListener("click", sortFiles);
  } else {
    console.warn("Folder sort button not found.");
  }

  function renderFileList(files) {
    const fileList = document.getElementById("fileList");
    if (!fileList) {
      console.warn("fileList container not found");
      return;
    }
  
    fileList.innerHTML = ""; 
  
    files.forEach(file => {
      const fileItem = document.createElement("div");
      fileItem.classList.add("file-item"); 
  
      fileItem.innerHTML = `
        <div class="file-name-group">
          <span class="file-name">
            <i class="fa-solid fa-file"></i> 
            <a href="${file.url}" target="_blank" rel="noopener noreferrer">${file.name}</a>
            <span class="file-controls"></span>
          </span>
        </div>
        <span class="file-date">${file.uploadedAt}</span>
      `;
  
      fileList.appendChild(fileItem);
    });
  }  
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, proceed with app initialization
      initAppForUser(user);
    } else {
      // No user signed in, sign in anonymously
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
        alert("Unable to authenticate. Please try again later.");
      });
    }
  });


});

