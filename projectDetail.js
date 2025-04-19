// Function to attach toggle functionality to all "VIEW PROJECT DETAIL" buttons
function setupProjectDetailToggles() {
    const buttons = document.querySelectorAll('.view-project-detail');
  
    

    buttons.forEach(button => {


        
      // Prevent duplicate listeners
      if (!button.dataset.listenerAdded) {
        button.dataset.listenerAdded = 'true';
  
        button.addEventListener('click', () => {
          const tracker = button.closest('.group-tracker');
          const detail = tracker.querySelector('.project-detail');
          const isVisible = detail.style.display === 'block';

          if (detail.style.display === 'block') {
            detail.style.display = 'none';
          } else {
            detail.style.display = 'block';
          }

          if (!isVisible){
            detail.scrollIntoView({behavior:"smooth",block:'start'})
          }
  
        });
      }
    });
  }
  
  
  // Re-run this after each new tracker is added
  document.addEventListener('trackerAdded', setupProjectDetailToggles);
  
  // Optionally run it once on initial load (for static trackers)
  document.addEventListener('DOMContentLoaded', setupProjectDetailToggles);
  