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

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import { EmojiButton } from "https://cdn.jsdelivr.net/npm/@joeattardi/emoji-button@4.6.2/dist/index.js";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dgyw6dtv3/auto/upload";
const CLOUDINARY_PRESET = "chat_attachments_preset";

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
const auth = getAuth(app);

function updateActivityLog(groupId, uid) {
  const logRef = doc(db, "groups", groupId, "activityLogs", uid);
  return setDoc(logRef, {
    lastActive: serverTimestamp()
  }, { merge: true });
}

document.addEventListener("DOMContentLoaded", () => {
  
  const toggleBtn = document.querySelector('.menu-toggle');
  toggleBtn.addEventListener('click', () => {
    document.getElementById('navIcons').classList.toggle('show');
  });
  
  let currentTab = "general";
  const groupId = new URLSearchParams(window.location.search).get("id");
  let chatUnsubscribe = null;
  const groupDisplay = document.getElementById("groupDisplay");
  const tabs = document.querySelectorAll(".tab");
  const chatTitle = document.getElementById("chat-title");

  if (!groupDisplay || tabs.length === 0 || !chatTitle) {
    console.error("Essential elements not found");
    return;
  }

  if (!groupId) {
    groupDisplay.textContent = "No group ID found in URL.";
    return;
  }

  const emojiPickers = {};
  const fileStates = {
    general: null,
    personal: null,
  };

  const getSelectors = (tab) => ({
    box: document.getElementById(`${tab}-box`),
    input:
      document.getElementById(`messageInput-${tab}`) ||
      document.getElementById(`${tab}Input`),
    sendBtn:
      document.getElementById(`sendBtn-${tab}`) ||
      document.getElementById(`${tab}SendBtn`),
    attachBtn: document.getElementById(`attachBtn-${tab}`),
    fileInput: document.getElementById(`fileInput-${tab}`),
    filePreview: document.getElementById(`filePreview-${tab}`),
    emojiBtn: document.getElementById(`emojiBtn-${tab}`),
    emojiPicker: document.getElementById(`emojiPicker-${tab}`),
  });

  const scrollToBottom = (box) => {
    if (!box) return;
    box.scrollTop = box.scrollHeight;
  };

  const initEmojiPicker = (tab) => {
    const { emojiBtn, input, emojiPicker } = getSelectors(tab);
    if (!emojiBtn || !input || !emojiPicker) return;

    if (emojiPickers[tab]) return; // prevent multiple initializations

    const picker = new EmojiButton({
      position: "top-end",
      rootElement: emojiPicker,
    });
    emojiPickers[tab] = picker;

    emojiBtn.addEventListener("click", () => picker.togglePicker(emojiBtn));
    picker.on("emoji", (selection) => {
      const emoji = selection.emoji;
      // Insert emoji at cursor position in input
      const start = input.selectionStart;
      const end = input.selectionEnd;
      input.setRangeText(emoji, start, end, "end");
      input.focus();
    });
  };

  const handleAttach = (tab) => {
    const { attachBtn, fileInput, filePreview, input } = getSelectors(tab);
    if (!attachBtn || !fileInput || !filePreview || !input) return;

    attachBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileStates[tab] = file;
        filePreview.textContent = `📎 ${file.name}`;
        // Only replace input value if empty or matches previous file name (avoid overriding typed text)
        if (!input.value || input.value === file.name) {
          input.value = file.name;
        }
        input.focus();
      }
    });
  };

  const sendMessage = async (tab) => {
    const { input, fileInput, filePreview, box } = getSelectors(tab);
    if (!input || !fileInput || !filePreview || !box) return;

    const user = auth.currentUser;
    const text = input.value.trim();
    const file = fileStates[tab];

    if (!user || !groupId || (!text && !file)) return;

    const messageData = {
      senderId: user.uid,
      senderEmail: user.email,
      senderName: user.displayName || user.email,
      senderPhotoURL: user.photoURL || "default-avatar.png",
      type: tab,
      timestamp: serverTimestamp(),
    };

    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_PRESET);

        const res = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        messageData.fileURL = data.secure_url;
        messageData.fileType = file.type;
        // Remove text if it's just the filename to avoid duplication
        if (text === file.name) delete messageData.text;
      } catch (error) {
        console.error("Cloudinary upload failed:", error);
        alert("File upload failed. Please try again.");
        return;
      }
    }

    if (text && text !== file?.name) messageData.text = text;

    try {

      await addDoc(collection(db, "groups", groupId, "chats"), messageData);


    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message.");
      return;
    }

    input.value = "";
    fileInput.value = "";
    filePreview.textContent = "";
    fileStates[tab] = null;

    // Scroll after a short delay to allow DOM update
    setTimeout(() => scrollToBottom(box), 100);
  };

  const loadMessages = (tab) => {
    const { box } = getSelectors(tab);
    if (!box) return;

    chatTitle.textContent = tab.toUpperCase().replace("_", " ");
    box.innerHTML = `<p style="text-align:center;color:#aaa;">Loading ${tab} messages...</p>`;

    if (chatUnsubscribe) {
      chatUnsubscribe();
      chatUnsubscribe = null;
    }

    const q = query(
      collection(db, "groups", groupId, "chats"),
      where("type", "==", tab),
      orderBy("timestamp", "asc")
    );

    chatUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        box.innerHTML = "";
        if (snapshot.empty) {
          box.innerHTML = `<p style="text-align:center;color:#aaa;">No messages yet.</p>`;
          return;
        }

        function fileNameFromURL(url) {
          try {
            return decodeURIComponent(url.split("/").pop().split("?")[0]);
          } catch {
            return "attachment";
          }
        }

        snapshot.forEach((doc) => {
          const msg = doc.data();

          // 🔥 HANDLE ANNOUNCEMENTS
          if (msg.type === "announcement") {
            const announcement = document.createElement("div");
            announcement.className = "announcement-message";
            announcement.innerHTML = `
              <div class="announcement-bubble">
                <div class="announcement-sender">${msg.senderName}</div>
                ${
                  msg.subject
                    ? `<div class="announcement-subject">${msg.subject}</div>`
                    : ""
                }
                ${
                  msg.text
                    ? `<div class="announcement-text">${msg.text}</div>`
                    : ""
                }
              </div>
            `;
            box.appendChild(announcement);
            return; // Skip regular message rendering
          }

          // 🔽 Standard message rendering continues here...
          const div = document.createElement("div");
          div.className =
            "message " +
            (msg.senderId === auth.currentUser?.uid ? "self" : "other");
          const isImage = msg.fileType?.startsWith("image");
          div.innerHTML = `
            <div class="message-content">
              <div class="avatar">
              <img src="${msg.senderPhotoURL || "default-avatar.png"}" alt="${
            msg.senderName
          }'s avatar" />
              </div>
              <div class="bubble">
                <div class="sender-name">${msg.senderName}</div>
                ${msg.text ? `<p class="message-text">${msg.text}</p>` : ""}
                ${
                  msg.fileURL
                    ? isImage
                      ? `<img src="${
                          msg.fileURL || ""
                        }" class="chat-image" alt="attachment"/>`
                      : `<a href="${
                          msg.fileURL
                        }" class="file-link" target="_blank">📎 ${fileNameFromURL(
                          msg.fileURL
                        )}</a>`
                    : ""
                }
              </div>
            </div>
          `;

          box.appendChild(div);
        });

        setTimeout(() => scrollToBottom(box), 100);
      },
      (error) => {
        console.error("Failed to load messages:", error);
        box.innerHTML = `<p style="text-align:center;color:#f00;">Failed to load messages.</p>`;
      }
    );
  };

  // Remove previous event listeners helper
  const clearEventListeners = (element) => {
    const newElement = element.cloneNode(true);
    element.parentNode.replaceChild(newElement, element);
    return newElement;
  };

  const setupTab = (tab) => {
    const { input, sendBtn } = getSelectors(tab);
    if (!input || !sendBtn) return;

    // Clear previous listeners on send button to avoid duplicates
    const newSendBtn = clearEventListeners(sendBtn);
    newSendBtn.addEventListener("click", () => sendMessage(tab));

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(tab);
      }
    });

    initEmojiPicker(tab);
    handleAttach(tab);
  };

  loadMessages(currentTab);
  setupTab(currentTab);

  tabs.forEach((tabElement) => {
    tabElement.addEventListener("click", () => {
      const tab = tabElement.getAttribute("data-tab");
      if (!tab || tab === currentTab) return;
  
      tabs.forEach((t) => t.classList.remove("active"));
      tabElement.classList.add("active");
  
      ["general", "personal", "announcement"].forEach((t) => {
        const section = document.getElementById(`${t}-section`);
        if (section) section.style.display = t === tab ? "block" : "none";
      });
  
      currentTab = tab;
      chatTitle.textContent = tab.toUpperCase();
  
      if (tab === "personal") {
        loadGroupMembers();
      } else if (tab === "announcement") {
        loadAnnouncements();
      } else {
        loadMessages(tab);
        setupTab(tab);  // Keep this
      }
    });
  });  

  const announcementSubject = document.getElementById("announcementSubject");
  const announcementInput = document.getElementById("announcementInput");
  const announcementSendBtn = document.getElementById("announcementSendBtn");
  const announcementBox = document.getElementById("announcement-box");

  const setupAnnouncementInput = () => {
    if (
      !announcementSubject ||
      !announcementInput ||
      !announcementSendBtn ||
      !announcementBox
    ) {
      console.warn("Announcement input elements not found.");
      return;
    }

    announcementSendBtn.addEventListener("click", sendAnnouncement);

    announcementInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendAnnouncement();
      }
    });
    initEmojiPicker("announcement");

    document
      .getElementById("announcementLinkBtn")
      ?.addEventListener("click", () => {
        const link = prompt("Enter a link URL:");
        if (link) {
          const input = document.getElementById("announcementInput");
          const start = input.selectionStart;
          const end = input.selectionEnd;
          input.setRangeText(link, start, end, "end");
          input.focus();
        }
      });
    document
      .querySelectorAll(".toolbar button[data-command]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const command = button.getAttribute("data-command");
          const value = button.getAttribute("data-value");

          if (command === "formatBlock" && value) {
            document.execCommand(command, false, value);
          } else {
            document.execCommand(command, false, null);
          }

          announcementInput.focus();
        });
      });
  };

  const sendAnnouncement = async () => {
    const subject = announcementSubject.value.trim();
    const message = announcementInput.innerHTML.trim().replace(/<br>$/g, "");
    const user = auth.currentUser;

    if (!user || !groupId || (!subject && !message)) return;

    const data = {
      type: "announcement",
      senderId: user.uid,
      senderEmail: user.email,
      senderName: user.displayName || user.email,
      senderPhotoURL: user.photoURL || "default-avatar.png",
      subject,
      text: message,
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "groups", groupId, "chats"), data);
      announcementInput.value = "";
      announcementSubject.value = "";
      setTimeout(() => scrollToBottom(announcementBox), 100);
    } catch (err) {
      console.error("Failed to send announcement:", err);
      alert("Failed to send announcement.");
    }
  };

  const loadAnnouncements = () => {
    if (!announcementBox) return;

    const q = query(
      collection(db, "groups", groupId, "chats"),
      where("type", "==", "announcement"),
      orderBy("timestamp", "asc")
    );

    onSnapshot(q, (snapshot) => {
      announcementBox.innerHTML = "";

      if (snapshot.empty) {
        announcementBox.innerHTML = `<p style="text-align:center;color:#aaa;">No announcements yet.</p>`;
        return;
      }

      snapshot.forEach((doc) => {
        const msg = doc.data();
        const announcement = document.createElement("div");
        announcement.className = "announcement-message";
        announcement.innerHTML = `
          <div class="announcement-bubble">
            <div class="announcement-sender">${msg.senderName}</div>
            ${
              msg.subject
                ? `<div class="announcement-subject">${msg.subject}</div>`
                : ""
            }
            ${
              msg.text ? `<div class="announcement-text">${msg.text}</div>` : ""
            }
          </div>
        `;
        announcementBox.appendChild(announcement);
      });

      setTimeout(() => scrollToBottom(announcementBox), 100);
    });
  };

  setupAnnouncementInput();
  loadAnnouncements();

  let selectedMember = null;
  const personalChatEl = document.getElementById("personalChat");
  const personalBox = document.getElementById("personal-box");
  const personalListView = document.querySelector(".member-list-view");
  const personalChatUserName = document.getElementById("personalChatUserName");
  const backToListBtn = document.getElementById("backToList");
  const personalMemberList = document.getElementById("personalMemberList");

  const loadGroupMembers = async () => {
    const membersRef = collection(db, "groups", groupId, "members");
    const snapshot = await getDoc(doc(db, "groups", groupId));
    if (!snapshot.exists()) return;
  
    const members = snapshot.data().members || [];
    personalMemberList.innerHTML = "";

    console.log("Members array:", members);
  
    members.forEach((user) => {
      if (!user?.uid || user.uid === auth.currentUser.uid) return;
    
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="${user.photoURL || 'default-avatar.png'}" class="member-avatar" />
        <div class="member-info">
          <div class="member-nickname">${user.nickname || user.displayName || user.email}</div>
          <div class="member-email">${user.email}</div>
        </div>
      `;
    
      li.addEventListener("click", () => openPersonalChat(user));
      personalMemberList.appendChild(li);
    });
    
  };
  
  let personalChatUnsubscribe = null;

  const openPersonalChat = (user) => {
    selectedMember = { ...user, uid: user.uid }; // ✅ Ensure UID is available
    personalChatUserName.textContent = user.nickname || user.displayName;
    personalListView.style.display = "none";
    personalChatEl.style.display = "flex";
  
    if (personalChatUnsubscribe) personalChatUnsubscribe();
  
    const chatId = [auth.currentUser.uid, user.uid].sort().join("_");
  
    const q = query(
      collection(db, "privateChats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
  
    personalChatUnsubscribe = onSnapshot(q, (snapshot) => {
      personalBox.innerHTML = "";
  
      if (snapshot.empty) {
        personalBox.innerHTML = `<p style="text-align:center;color:#aaa;">No messages yet.</p>`;
        return;
      }
  
      snapshot.forEach((doc) => {
        const msg = doc.data();
        const div = document.createElement("div");
        div.className = "message " + (msg.senderId === auth.currentUser.uid ? "self" : "other");
      
        const isImage = msg.fileType?.startsWith("image");
      
        div.innerHTML = `
          <div class="message-content">
            <div class="avatar">
              <img src="${msg.senderPhotoURL || 'default-avatar.png'}" alt="${msg.senderName}" />
            </div>
            <div class="bubble">
              <div class="sender-name">${msg.senderName}</div>
              ${msg.text ? `<p class="message-text">${msg.text}</p>` : ""}
              ${
                msg.fileURL
                  ? isImage
                    ? `<img src="${msg.fileURL}" class="chat-image" alt="attachment"/>`
                    : `<a href="${msg.fileURL}" class="file-link" target="_blank">📎 ${decodeURIComponent(msg.fileURL.split("/").pop().split("?")[0])}</a>`
                  : ""
              }
            </div>
          </div>
        `;
      
        personalBox.appendChild(div);
      });      
  
      setTimeout(() => scrollToBottom(personalBox), 100);
    });
  
    // 👇 Initialize emoji + attach (only once)
    initEmojiPicker("personal");
    handleAttach("personal");
  };
  

  const sendPersonalMessage = async () => {
    const input = document.getElementById("messageInput-personal");
    const fileInput = document.getElementById("fileInput-personal");
    const filePreview = document.getElementById("filePreview-personal");
  
    const text = input.value.trim();
    const file = fileStates.personal;
  
    if (!text && !file) return;
    if (!selectedMember) return;
  
    const chatId = [auth.currentUser.uid, selectedMember.uid].sort().join("_");
  
    const messageData = {
      senderId: auth.currentUser.uid,
      senderEmail: auth.currentUser.email,
      senderName: auth.currentUser.displayName || auth.currentUser.email,
      senderPhotoURL: auth.currentUser.photoURL || "default-avatar.png",
      timestamp: serverTimestamp(),
    };
  
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_PRESET);
  
        const res = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
        });
  
        const data = await res.json();
        messageData.fileURL = data.secure_url;
        messageData.fileType = file.type;
  
        if (text !== file.name) messageData.text = text;
      } catch (err) {
        console.error("Upload error", err);
        return;
      }
    } else {
      messageData.text = text;
    }
  
    try {
      await addDoc(collection(db, "privateChats", chatId, "messages"), messageData);
      input.value = "";
      fileInput.value = "";
      filePreview.textContent = "";
      fileStates.personal = null;
  
      setTimeout(() => scrollToBottom(personalBox), 100);
    } catch (err) {
      console.error("Error sending message", err);
    }
  };

  


document.getElementById("sendBtn-personal").addEventListener("click", sendPersonalMessage);
document.getElementById("messageInput-personal").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendPersonalMessage();
  }
});

backToListBtn.addEventListener("click", () => {
  personalChatEl.style.display = "none";
  personalListView.style.display = "block";
  if (personalChatUnsubscribe) personalChatUnsubscribe();
});

loadGroupMembers();

const sendBtnPersonal = document.getElementById("sendBtn-personal");
const inputPersonal = document.getElementById("messageInput-personal");

if (sendBtnPersonal) {
  sendBtnPersonal.addEventListener("click", sendPersonalMessage);
}
if (inputPersonal) {
  inputPersonal.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPersonalMessage();
    }
  });
}

if (backToListBtn) {
  backToListBtn.addEventListener("click", () => {
    personalChatEl.style.display = "none";
    personalListView.style.display = "block";
    if (personalChatUnsubscribe) personalChatUnsubscribe();
  });
}


  // Initial setup
  loadMessages(currentTab);
  setupTab(currentTab);

  // Get group name for header
  getDoc(doc(db, "groups", groupId))
    .then((docSnap) => {
      if (docSnap.exists()) {
        groupDisplay.textContent = docSnap.data().name || "Group Chat";
      } else {
        groupDisplay.textContent = "Group not found";
      }
    })
    .catch((err) => {
      console.error("Error fetching group:", err);
      groupDisplay.textContent = "Error loading group info";
    });

  // Listen for auth state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      updateActivityLog(groupId, user.uid);  // This will now work
    }
    if (!user) {
      alert("You must be logged in to chat.");
      window.location.href = "index.html";
    }
  });
});
