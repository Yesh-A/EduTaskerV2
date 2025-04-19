// Placeholder members for testing
const placeholderMembers = ["John Doe", "Jane Smith", "Alice Brown", "Bob White", "Charlie Black", "Clara Green"];
const memberInput = document.getElementById('memberInput');
const addMemberBtn = document.getElementById('addMemberBtn');
const memberList = document.getElementById('memberList');
const memberSuggestions = document.getElementById('memberSuggestions'); // To display suggestions
const createGroupBtn = document.getElementById('createGroupBtn');
const groupNameInput = document.getElementById('groupNameInput');

// To hold the added members
let addedMembers = [];

// Function to add a member
addMemberBtn.addEventListener('click', () => {
  const memberName = memberInput.value.trim();
  if (memberName && !addedMembers.includes(memberName)) {
    addedMembers.push(memberName);
    updateMemberList();
    memberInput.value = ''; // Clear input field
  }
});

// Function to update the member list display
function updateMemberList() {
  memberList.innerHTML = ''; // Clear current list
  addedMembers.forEach((member, index) => {
    const memberItem = document.createElement('div');
    memberItem.classList.add('bg-[#1A5E63]', 'text-white', 'px-3', 'py-1', 'rounded-full', 'flex', 'items-center', 'gap-2', 'mb-2');
    memberItem.innerHTML = ` 
      ${member}
      <span class="cursor-pointer text-xs" onclick="removeMember(${index})">X</span>
    `;
    memberList.appendChild(memberItem);
  });

  // Enable the "Create Group" button if there are members
  createGroupBtn.disabled = addedMembers.length === 0 || groupNameInput.value.trim() === '';
  
  // Show the group name and members for testing/debugging
  showGroupInfo();
}

// Function to remove a member
function removeMember(index) {
  addedMembers.splice(index, 1); // Remove member from array
  updateMemberList(); // Update the display
}

// Function to handle group creation
createGroupBtn.addEventListener('click', () => {
  const groupName = groupNameInput.value.trim();
  if (groupName && addedMembers.length > 0) {
    console.log("Group Created:");
    console.log("Group Name:", groupName);
    console.log("Members:", addedMembers);
    
    // Create the group tracker only after successful group creation
    createGroupTracker(groupName, addedMembers);

    // Clear the addedMembers array after creation
    addedMembers = [];
    updateMemberList(); // Update the display (this clears the list)
    groupNameInput.value = ''; // Optionally clear the group name input
    closeGroupModal(); // Close the modal after group creation
  }
});

// Function to handle user input and show suggestions
memberInput.addEventListener('input', () => {
  const inputText = memberInput.value.toLowerCase();
  const filteredNames = placeholderMembers
    .filter(name => name.toLowerCase().startsWith(inputText))
    .filter(name => !addedMembers.includes(name)); // filters out already-added members

  console.log("Filtered Names:", filteredNames);  // Debugging line

  // Only show suggestions if there are matching names
  if (filteredNames.length > 0) {
    displaySuggestions(filteredNames);
  } else {
    memberSuggestions.innerHTML = '';  // Clear suggestions when no match
  }
});

// Function to display filtered suggestions
function displaySuggestions(names) {
  memberSuggestions.innerHTML = ''; // Clear previous suggestions
  names.forEach(name => {
    const suggestionItem = document.createElement('div');
    suggestionItem.classList.add('cursor-pointer', 'px-3', 'py-1', 'hover:bg-[#1A5E63]', 'hover:text-white');
    suggestionItem.textContent = name;
    suggestionItem.addEventListener('click', () => {
      memberInput.value = name; // Fill the input with selected name
      addMemberBtn.click(); // Add member to the list
      memberSuggestions.innerHTML = ''; // Clear suggestions
    });
    memberSuggestions.appendChild(suggestionItem);
  });
}

// Function to open the modal
document.getElementById('NewTaskBtn').addEventListener('click', () => {
  const modal = document.getElementById('groupModal');
  modal.classList.remove('hidden');
  modal.style.display = 'flex'; //this ensures it centers correctly
  modal.classList.add('animate__fadeIn');
});

// Add a flag to prevent closing when interacting inside the modal
let isInsideModal = false;

// Add a listener for mouse events on the modal content to prevent closing when clicking inside
document.querySelector('.modal-content').addEventListener('mousedown', (e) => {
  isInsideModal = true;
});

// Listen for the mouseup event globally (on window)
window.addEventListener('mouseup', (e) => {
  // Check if the click happened outside the modal and modal content
  if (!e.target.closest('.modal-content') && !isInsideModal) {
    closeGroupModal();
  }
  isInsideModal = false; // Reset the flag after the mouseup
});

// Function to handle closing the modal
function closeGroupModal() {
  const modal = document.getElementById('groupModal');
  modal.classList.add('hidden');
  modal.classList.remove('animate__fadeIn');
  modal.style.display = 'none'; //reset to none after closing
}

// Ensure close button inside the modal works as expected
const closeModalButton = document.querySelector('.close-btn');
closeModalButton.addEventListener('click', closeGroupModal);

// Function to show group name and members for debugging/testing
function showGroupInfo() {
  const groupInfoDisplay = document.getElementById('groupInfoDisplay');
  const groupName = groupNameInput.value.trim();
  groupInfoDisplay.innerHTML = `
    <h3>Group Name: ${groupName || 'No name entered'}</h3>
    <h4>Members:</h4>
    <ul>
      ${addedMembers.map(member => `<li>${member}</li>`).join('')}
    </ul>
  `;
}
