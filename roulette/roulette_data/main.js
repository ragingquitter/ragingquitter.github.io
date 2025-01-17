const totalPockets = 37;
let counts = Array.from({ length: totalPockets }, () => 0);
let notClickedCounts = Array.from({ length: totalPockets }, () => 0);
// let enteredNumbers = [];
let actionHistory = [];
let sortColumn = null;
let sortAscending = true;
let totalNumbersHit = 0;
let streakTrackers = Array.from({ length: totalPockets }, () => 0); // Tracks current streaks
let milestoneCounts = {
    100: Array.from({ length: totalPockets }, () => 0),
    200: Array.from({ length: totalPockets }, () => 0),
    300: Array.from({ length: totalPockets }, () => 0),
    400: Array.from({ length: totalPockets }, () => 0),
    500: Array.from({ length: totalPockets }, () => 0),
}; // Tracks counts for each milestone

function updateHitTable() {
    const hitTableBody = document.querySelector('#hitTable tbody');
    if (!hitTableBody) {
        console.error('hitTableBody is null. Ensure the table is correctly rendered.');
        return;
    }

    hitTableBody.innerHTML = ''; // Clear existing rows

    const selectedMilestone = parseInt(document.getElementById('streakSelector').value, 10);

    for (let i = 0; i < totalPockets; i++) {
        const probability = totalNumbersHit > 0 ? ((counts[i] / totalNumbersHit) * 100).toFixed(2) : 0;

        // Add a new row for each number
        hitTableBody.innerHTML += `
        <tr>
            <td>${i}</td>
            <td>${notClickedCounts[i]}</td>
            <td>${counts[i]}</td>
            <td>${probability}%</td>
            <td>${milestoneCounts[selectedMilestone][i] || 0}</td>
        </tr>`;
    }

    // Reapply sorting if a column is sorted
    if (sortColumn !== null) {
        const rows = Array.from(hitTableBody.rows);
        rows.sort((a, b) => {
            let aValue = a.cells[sortColumn].textContent.trim();
            let bValue = b.cells[sortColumn].textContent.trim();

            // Handle numeric sorting (strip % for probability)
            aValue = parseFloat(aValue.replace('%', '')) || 0;
            bValue = parseFloat(bValue.replace('%', '')) || 0;

            return sortAscending ? aValue - bValue : bValue - aValue;
        });
        rows.forEach((row) => hitTableBody.appendChild(row)); // Reappend sorted rows
    }

    // Update total spins display
    document.getElementById('totalNumbersHit').textContent = totalNumbersHit;
}

function resetAll() {
    counts.fill(0);
    notClickedCounts.fill(0);
    streakTrackers.fill(0);
    localStorage.setItem('counts', JSON.stringify(counts));
    localStorage.setItem('notClickedCounts', JSON.stringify(notClickedCounts));
    localStorage.setItem('streakTrackers', JSON.stringify(streakTrackers));

    Object.keys(milestoneCounts).forEach((milestone) => {
        milestoneCounts[milestone].fill(0);
    });

    totalNumbersHit = 0;
    // enteredNumbers = [];
    actionHistory = [];
    sortColumn = null;
    sortAscending = true;

    localStorage.setItem('totalNumbersHit', totalNumbersHit);
    // localStorage.setItem('enteredNumbers', JSON.stringify(enteredNumbers));
    localStorage.setItem('actionHistory', JSON.stringify(actionHistory));
    localStorage.setItem('milestoneCounts', JSON.stringify(milestoneCounts));

    console.log(localStorage);

    // Reset dropdown to default value (100)
    document.getElementById('streakSelector').value = '100';

    updateHitTable();
}

function incrementCountAndRecordHit(number) {
    counts[number]++; // Increment the hit count for the clicked number
    totalNumbersHit++; // Increment total spins

    // Save current state for undo
    actionHistory.push({
        number,
        type: 'increment',
        previousNotClicked: [...notClickedCounts],
        previousStreakTrackers: [...streakTrackers], // Save the current streaks
        previousMilestoneCounts: JSON.parse(JSON.stringify(milestoneCounts)), // Deep copy milestone counts
    });

    // Limit undo history to the last 5 actions
    if (actionHistory.length > 5) {
        actionHistory.shift();
    }

    // Update "Not Hit" and streak logic
    for (let i = 0; i < totalPockets; i++) {
        if (i === number) {
            streakTrackers[i] = 0; // Reset streak for the hit number
            notClickedCounts[i] = 0; // Reset "Not Hit" for the hit number
        } else {
            streakTrackers[i]++;
            notClickedCounts[i]++;

            // Update milestones
            Object.keys(milestoneCounts).forEach((milestone) => {
                const milestoneValue = parseInt(milestone, 10);
                if (streakTrackers[i] === milestoneValue) {
                    milestoneCounts[milestone][i]++;
                    Object.keys(milestoneCounts).forEach((lowerMilestone) => {
                        const lowerValue = parseInt(lowerMilestone, 10);
                        if (lowerValue < milestoneValue) {
                            milestoneCounts[lowerMilestone][i] = 0;
                        }
                    });
                }
            });
        }
    }

    saveToLocalStorage();
    updateHitTable();
}

function updateStreakColumn() {
    const selectedMilestone = parseInt(document.getElementById('streakSelector').value, 10);

    const hitTableBody = document.querySelector('#hitTable tbody');
    Array.from(hitTableBody.rows).forEach((row, i) => {
        const milestoneCount = milestoneCounts[selectedMilestone][i];
        row.cells[4].textContent = milestoneCount || 0; // Update the Streaks column
    });
}

function undoLastAction() {
    if (actionHistory.length === 0) return;

    const lastAction = actionHistory.pop();
    totalNumbersHit--; // Decrement total spins

    if (lastAction.type === 'increment') {
        const number = lastAction.number;

        // Restore the previous state of "Not Hit" counts and streaks
        notClickedCounts = lastAction.previousNotClicked;
        streakTrackers = lastAction.previousStreakTrackers || streakTrackers;

        // Restore the previous milestone counts
        milestoneCounts = lastAction.previousMilestoneCounts || milestoneCounts;

        counts[number]--; // Decrement the hit count for the undone number
    }

    saveToLocalStorage();
    updateHitTable();
}

function saveToLocalStorage() {
    localStorage.setItem('counts', JSON.stringify(counts));
    localStorage.setItem('notClickedCounts', JSON.stringify(notClickedCounts));
    // localStorage.setItem('enteredNumbers', JSON.stringify(enteredNumbers));
    localStorage.setItem('actionHistory', JSON.stringify(actionHistory));
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    localStorage.setItem('totalNumbersHit', totalNumbersHit);
    localStorage.setItem('milestoneCounts', JSON.stringify(milestoneCounts));
}

function loadFromLocalStorage() {
    const savedCounts = localStorage.getItem('counts');
    const savedNotClickedCounts = localStorage.getItem('notClickedCounts');
    // const savedEnteredNumbers = localStorage.getItem('enteredNumbers');
    const savedActionHistory = localStorage.getItem('actionHistory');
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedtotalNumbersHit = localStorage.getItem('totalNumbersHit');
    const savedMilestoneCounts = localStorage.getItem('milestoneCounts');

    if (savedCounts) counts = JSON.parse(savedCounts);
    if (savedNotClickedCounts) notClickedCounts = JSON.parse(savedNotClickedCounts);
    // if (savedEnteredNumbers) enteredNumbers = JSON.parse(savedEnteredNumbers);
    if (savedActionHistory) actionHistory = JSON.parse(savedActionHistory);
    if (savedMilestoneCounts) milestoneCounts = JSON.parse(savedMilestoneCounts);
    if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('darkModeToggle').checked = false;
    }
    if (savedtotalNumbersHit) totalNumbersHit = parseInt(savedtotalNumbersHit, 10) || 0;

    updateHitTable();
}

function setSort(columnIndex) {
    const tbody = document.querySelector('#hitTable tbody');
    const rows = Array.from(tbody.rows);

    // Check if columnIndex is valid
    if (rows.length === 0 || columnIndex >= rows[0].cells.length) {
        console.error(`Invalid column index: ${columnIndex}`);
        return;
    }

    // Toggle sorting direction
    if (sortColumn === columnIndex) {
        sortAscending = !sortAscending;
    } else {
        sortColumn = columnIndex;
        sortAscending = true;
    }

    // Sorting logic
    rows.sort((a, b) => {
        let aValue = a.cells[columnIndex].textContent.trim();
        let bValue = b.cells[columnIndex].textContent.trim();

        // Handle numeric sorting (strip % for probability)
        aValue = parseFloat(aValue.replace('%', '')) || 0;
        bValue = parseFloat(bValue.replace('%', '')) || 0;

        return sortAscending ? aValue - bValue : bValue - aValue;
    });

    // Re-append sorted rows
    rows.forEach((row) => tbody.appendChild(row));
}


function initializeTable() {
    const rouletteTableDiv = document.getElementById('rouletteTable');
    for (let i = 0; i < totalPockets; i++) {
        const div = document.createElement('div');
        div.textContent = i;
        div.addEventListener('click', () => incrementCountAndRecordHit(i));
        rouletteTableDiv.appendChild(div);
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}


function handleNumberInput() {
    const inputField = document.getElementById('numberInput');
    const inputValue = parseInt(inputField.value, 10);

    if (!isNaN(inputValue) && inputValue >= 0 && inputValue <= 36) {
        incrementCountAndRecordHit(inputValue);
        inputField.value = ''; // Clear the field after successful input
    } else {
        alert('Please enter a valid number between 0 and 36.');
    }
}

function handleBulkInput() {
    const bulkInputField = document.getElementById('bulkInput');
    const rawInput = bulkInputField.value.trim();
    const numbers = rawInput.split(/\s+/).map(Number);

    const invalidNumbers = numbers.filter((num) => isNaN(num) || num < 0 || num > 36);
    if (invalidNumbers.length > 0) {
        alert(`Invalid numbers: ${invalidNumbers.join(', ')}`);
        return;
    }

    // Process numbers in chunks
    const chunkSize = 100; // Process 100 numbers at a time
    let index = 0;

    function processChunk() {
        const chunk = numbers.slice(index, index + chunkSize);
        chunk.forEach((number) => incrementCountAndRecordHit(number));

        index += chunkSize;
        if (index < numbers.length) {
            setTimeout(processChunk, 0); // Process the next chunk asynchronously
        } else {
            bulkInputField.value = ''; // Clear the input field
        }
    }

    processChunk();
}

window.onload = function () {
    initializeTable();
    loadFromLocalStorage();
    updateHitTable(); // Populate the hit table after the DOM is ready

    document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);

    document.querySelector('#hitTable thead').innerHTML = `
        <tr>
            <th><button onclick="setSort(0)">Number</button></th>
            <th><button onclick="setSort(1)">Not Hit</button></th>
            <th><button onclick="setSort(2)">Total Hit</button></th>
            <th><button onclick="setSort(3)">Average Ratio</button></th>
            <th>
                Streaks:
                <select id="streakSelector" onchange="updateStreakColumn()">
                    <option value="100">100</option>
                    <option value="200">200</option>
                    <option value="300">300</option>
                    <option value="400">400</option>
                    <option value="500">500</option>
                </select>
            </th>
        </tr>`;
};

updateHitTable();