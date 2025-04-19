document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById('taskModal');
    const plusBtn = document.getElementById('NewTaskBtn');

    plusBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        modal.classList.add('flex', 'animate__fadeIn', 'animate__faster');

        // Remove fadeOut if it was applied before
        modal.classList.remove('animate__fadeOut');
    });

    // Optional: close when clicking outside modal content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Optional: ESC key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
});

function closeModal() {
    const modal = document.getElementById('taskModal');

    // Animate out
    modal.classList.remove('animate__fadeIn');
    modal.classList.add('animate__fadeOut', 'animate__faster');

    // Wait for animation to finish before hiding
    modal.addEventListener('animationend', function handleClose() {
        modal.classList.add('hidden');
        modal.classList.remove('flex', 'animate__fadeOut');
        modal.removeEventListener('animationend', handleClose);
    });
}

window.closeModal = closeModal;
