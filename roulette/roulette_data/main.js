const totalPockets = 37;
let counts = Array.from({ length: totalPockets }, () => 0);
let notClickedCounts = Array.from({ length: totalPockets }, () => 0);
let enteredNumbers = [];
let actionHistory = [];
let sortColumn = null;
let sortAscending = true;
let totalSpins = 0;

function updateHitTable() {
    const hitTableBody = document.querySelector('#hitTable tbody'); // Select the table body
    hitTableBody.innerHTML = ''; // Clear existing rows

    for (let i = 0; i < totalPockets; i++) {
        const probability = totalSpins > 0 ? ((counts[i] / totalSpins) * 100).toFixed(2) : 0;
        const averageRatio = totalSpins > 0 ? (counts[i] / totalSpins).toFixed(3) : 0;

        // Add a new row for each number
        hitTableBody.innerHTML += `
        <tr>
            <td>${i}</td>
            <td>${notClickedCounts[i]}</td>
            <td>${counts[i]}</td>
            <td>${probability}%</td>
        </tr>`;
    }

    // Reapply sorting if a column is sorted
    if (sortColumn !== null) {
        const rows = Array.from(hitTableBody.rows);
        rows.sort((a, b) => {
            let aValue = a.cells[sortColumn].textContent.trim();
            let bValue = b.cells[sortColumn].textContent.trim();

            // Handle numeric sorting, stripping % for probability
            aValue = parseFloat(aValue.replace('%', '')) || 0;
            bValue = parseFloat(bValue.replace('%', '')) || 0;

            return sortAscending ? aValue - bValue : bValue - aValue;
        });
        rows.forEach((row) => hitTableBody.appendChild(row)); // Reappend sorted rows
    }
    // Update total spins display
    document.getElementById('totalSpins').textContent = totalSpins;
}


function resetAll() {
    counts.fill(0);
    totalSpins = 0;
    notClickedCounts.fill(0);
    enteredNumbers = [];
    actionHistory = [];
    sortColumn = null;
    sortAscending = true;
    localStorage.clear();
    updateHitTable();
}

function incrementCountAndRecordHit(number) {
    const previousNotClicked = [...notClickedCounts];
    counts[number]++;
    totalSpins++;
    enteredNumbers.push(number);
    actionHistory.push({ number, type: 'increment', previousNotClicked });

    for (let i = 0; i < totalPockets; i++) {
        if (i !== number) {
            notClickedCounts[i]++;
        } else {
            notClickedCounts[i] = 0;
        }
    }

    saveToLocalStorage();
    updateHitTable();
}

function undoLastAction() {
    if (actionHistory.length === 0) return;
    const lastAction = actionHistory.pop();

    if (actionHistory.length === 0) return;
    totalSpins--; // Decrement total spins

    if (lastAction.type === 'increment') {
        const number = lastAction.number;
        counts[number]--;
        enteredNumbers.pop();
        notClickedCounts = lastAction.previousNotClicked;
        saveToLocalStorage();
        updateHitTable();
    }
}

function saveToLocalStorage() {
    localStorage.setItem('counts', JSON.stringify(counts));
    localStorage.setItem('notClickedCounts', JSON.stringify(notClickedCounts));
    localStorage.setItem('enteredNumbers', JSON.stringify(enteredNumbers));
    localStorage.setItem('actionHistory', JSON.stringify(actionHistory));
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    localStorage.setItem('totalSpins', totalSpins);
}

function loadFromLocalStorage() {
    const savedCounts = localStorage.getItem('counts');
    const savedNotClickedCounts = localStorage.getItem('notClickedCounts');
    const savedEnteredNumbers = localStorage.getItem('enteredNumbers');
    const savedActionHistory = localStorage.getItem('actionHistory');
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedTotalSpins = localStorage.getItem('totalSpins');

    if (savedCounts) counts = JSON.parse(savedCounts);
    if (savedNotClickedCounts) notClickedCounts = JSON.parse(savedNotClickedCounts);
    if (savedEnteredNumbers) enteredNumbers = JSON.parse(savedEnteredNumbers);
    if (savedActionHistory) actionHistory = JSON.parse(savedActionHistory);
    if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('darkModeToggle').checked = false;
    }
    if (savedTotalSpins) totalSpins = parseInt(savedTotalSpins, 10) || 0;

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

    numbers.reverse().forEach((number) => incrementCountAndRecordHit(number));
    totalSpins++;
    bulkInputField.value = ''; // Clear the field after processing
}

document.getElementById('numberInput').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleNumberInput();
    }
});

window.onload = function () {
    initializeTable();
    loadFromLocalStorage();

    document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);

    document.querySelector('#hitTable thead').innerHTML = `
        <tr>
            <th><button onclick="setSort(0)">Number</button></th>
            <th><button onclick="setSort(1)">Not Hit</button></th>
            <th><button onclick="setSort(2)">Total Hit</button></th>
            <th><button onclick="setSort(3)">Average Ratio</button></th>
        </tr>`;
};

updateHitTable();