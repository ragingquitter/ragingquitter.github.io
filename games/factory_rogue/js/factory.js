const resources = {
    stone: 0,
    iron: 0,
    silver: 0,
    gold: 0,
};

function updateResourceDisplay(resource) {
    const displayElement = document.querySelector(`#${resource}-count`);
    if (displayElement) {
        displayElement.textContent = resources[resource];
    }
}

function handleMineClick(event) {
    const resource = event.target.getAttribute('resource-mine');
    if (resource && resources.hasOwnProperty(resource)) {
        resources[resource] += 1;
        updateResourceDisplay(resource);
    }
}

const resourceButtons = document.querySelectorAll('[resource-mine]');
resourceButtons.forEach(button => {
    button.addEventListener('click', handleMineClick);
});