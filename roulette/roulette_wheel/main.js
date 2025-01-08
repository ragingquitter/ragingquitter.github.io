let balance = localStorage.getItem('rouletteBalance') !== null
    ? parseInt(localStorage.getItem('rouletteBalance'))
    : 5000;
    
let spinHistory = JSON.parse(localStorage.getItem('rouletteHistory')) || [];
let totalSpins = localStorage.getItem('totalSpins') !== null
    ? parseInt(localStorage.getItem('totalSpins'))
    : 0;

document.getElementById('balance').textContent = `Balance: $${balance}`;
document.getElementById('spin-counter').textContent = `(${totalSpins} spins)`;
updateHistoryBox();

function spinRoulette() {
    const outcome = Math.floor(Math.random() * 37); // Simulates 0-36
    const color = outcome === 0 ? 'green' : outcome % 2 === 0 ? 'black' : 'red';
    return { number: outcome.toString(), color: color };
}

function placeBet(type) {
    const betAmount = parseInt(document.getElementById('bet-amount').value);
    const spinCount = parseInt(document.getElementById('spin-count').value);
    const placeholderScreen = document.getElementById('placeholder-screen');
    const betNumberInput = document.getElementById('bet-number');
    const betNumber = parseInt(betNumberInput.value);

    if (isNaN(betAmount) || betAmount <= 0) {
        placeholderScreen.textContent = 'Invalid bet amount!';
        placeholderScreen.style.color = '#f00';
        return;
    }

    if (isNaN(spinCount) || spinCount <= 0 || spinCount > 500) {
        placeholderScreen.textContent = 'Invalid number of spins!';
        placeholderScreen.style.color = '#f00';
        return;
    }

    if (type === 'number' && (isNaN(betNumber) || betNumber < 0 || betNumber > 36)) {
        placeholderScreen.textContent = 'Invalid number bet!';
        placeholderScreen.style.color = '#f00';
        return;
    }

    let wins = 0;
    let losses = 0;
    let outcomes = [];

    for (let i = 0; i < spinCount; i++) {
        const outcome = spinRoulette();
        outcomes.push(outcome.number);
        balance -= betAmount;

        if (
            (type === 'red' && outcome.color === 'red') ||
            (type === 'black' && outcome.color === 'black') ||
            (type === 'number' && outcome.number === betNumber.toString())
        ) {
            const winnings = type === 'number' ? betAmount * 36 : betAmount * 2;
            balance += winnings;
            wins++;
        } else {
            losses++;
        }

        spinHistory.unshift(outcome.number);
    }

    totalSpins += spinCount;
    localStorage.setItem('totalSpins', totalSpins);
    document.getElementById('spin-counter').textContent = `(${totalSpins} spins)`;

    localStorage.setItem('rouletteBalance', balance);
    localStorage.setItem('rouletteHistory', JSON.stringify(spinHistory));

    if (spinCount === 1) {
        const singleOutcome = outcomes[0];
        const outcomeColor = spinHistory.length > 0 ? spinRoulette().color : '';
        placeholderScreen.textContent = `Landed on: ${singleOutcome} (${outcomeColor.toUpperCase()})`;

    } else {
        placeholderScreen.textContent = `After ${spinCount} spins: ${wins} Wins, ${losses} Losses`;
    }

    document.getElementById('balance').textContent = `Balance: $${balance}`;
    updateHistoryBox();
}

function copyHistoryToClipboard() {
    const historyBox = document.getElementById('history-box');
    navigator.clipboard.writeText(historyBox.textContent)
        .then(() => alert('Spin history copied to clipboard!'))
        .catch(() => alert('Failed to copy spin history.'));
}

function resetGame() {
    balance = 5000;
    spinHistory = [];
    totalSpins = 0;
    localStorage.setItem('rouletteBalance', balance);
    localStorage.setItem('rouletteHistory', JSON.stringify(spinHistory));
    localStorage.setItem('totalSpins', totalSpins);
    document.getElementById('balance').textContent = `Balance: $${balance}`;
    document.getElementById('spin-counter').textContent = `(0 spins)`;
    const placeholderScreen = document.getElementById('placeholder-screen');
    placeholderScreen.textContent = 'Waiting to spin...';
    placeholderScreen.style.backgroundColor = '#000';
    placeholderScreen.style.color = '#0f0';
    document.getElementById('bet-amount').value = 100;
    document.getElementById('spin-count').value = 1;
    document.getElementById('bet-number').value = '';
    updateHistoryBox();
}

function updateHistoryBox() {
    const historyBox = document.getElementById('history-box');
    historyBox.textContent = spinHistory.join(' ');
}