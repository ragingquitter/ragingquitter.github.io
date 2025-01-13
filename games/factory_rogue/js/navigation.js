const sidebarButtons = document.querySelectorAll('#sidebar button');
const contentSections = document.querySelectorAll('#content section');

function handleNavigation(event) {
    // Highlight the active button
    sidebarButtons.forEach(button => button.classList.remove('active')); // Remove "active" from all buttons
    event.target.classList.add('active'); // Add "active" to the clicked button

    // Show the corresponding content section
    const targetTab = event.target.getAttribute('data-tab'); // Get the data-tab attribute of the clicked button
    contentSections.forEach(section => {
        if (section.id === targetTab) {
            section.classList.add('active'); // Show the matching section
        } else {
            section.classList.remove('active'); // Hide non-matching sections
        }
    });
    console.log('Button clicked', event.target);
}

//Button listener
sidebarButtons.forEach(button => {
    button.addEventListener('click', handleNavigation);
});