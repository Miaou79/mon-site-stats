// Sélection des éléments du DOM
const form = document.getElementById('match-stats-form');
const dateContainer = document.getElementById('date-container');
const playerSelect = document.getElementById('player-name');
const addPlayerBtn = document.getElementById('add-player-btn');
const addPlayerForm = document.getElementById('add-player-form');
const newPlayerInput = document.getElementById('new-player-name');
const savePlayerBtn = document.getElementById('save-player-btn');
const ctx = document.getElementById('stats-chart').getContext('2d');

// Variables globales
let playersList = JSON.parse(localStorage.getItem('playersList')) || [];
let statsData = JSON.parse(localStorage.getItem('statsData')) || [];
let editIndex = null; // Index de la statistique en cours d'édition

// Tri des statistiques par date
statsData.sort((a, b) => new Date(a.date) - new Date(b.date));

// Fonction pour afficher un message toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Mettre à jour la liste déroulante des joueurs
function updatePlayerSelect() {
    playerSelect.innerHTML = '<option value="" disabled selected>Choisissez un joueur</option>';
    playersList.forEach((player) => {
        const option = document.createElement('option');
        option.value = player;
        option.textContent = player;
        playerSelect.appendChild(option);
    });
}

// Ajouter un joueur à la liste
addPlayerBtn.addEventListener('click', () => {
    addPlayerForm.style.display = 'block';
    newPlayerInput.focus();
});

// Sauvegarder un joueur et l'ajouter à la liste déroulante
savePlayerBtn.addEventListener('click', () => {
    const playerName = newPlayerInput.value.trim();
    if (!playerName) {
        showToast('Veuillez entrer un nom de joueur.', 'error');
        return;
    }
    if (playersList.includes(playerName)) {
        showToast('Ce joueur existe déjà.', 'error');
        return;
    }

    playersList.push(playerName);
    localStorage.setItem('playersList', JSON.stringify(playersList));
    updatePlayerSelect();
    displayPlayersList();
    newPlayerInput.value = '';
    addPlayerForm.style.display = 'none';
    showToast('Joueur ajouté avec succès!');
});

// Supprimer un joueur de la liste
function removePlayer(playerName) {
    playersList = playersList.filter(player => player !== playerName);
    localStorage.setItem('playersList', JSON.stringify(playersList));
    updatePlayerSelect();
    displayPlayersList();
    showToast('Joueur supprimé avec succès!');
}

// Afficher la liste des joueurs avec des boutons de suppression
function displayPlayersList() {
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = '';
    playersList.forEach(player => {
        const li = document.createElement('li');
        li.textContent = player;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Supprimer';
        removeButton.setAttribute('aria-label', `Supprimer le joueur ${player}`);
        removeButton.addEventListener('click', () => {
            if (confirm(`Êtes-vous sûr de vouloir supprimer le joueur "${player}" ?`)) {
                removePlayer(player);
            }
        });

        li.appendChild(removeButton);
        playerList.appendChild(li);
    });
}

// Regrouper les statistiques par date
function groupByDate() {
    return statsData.reduce((acc, stat) => {
        if (!acc[stat.date]) acc[stat.date] = [];
        acc[stat.date].push(stat);
        return acc;
    }, {});
}

// Mettre à jour les cartes de date avec les statistiques
function updateDateCards() {
    dateContainer.innerHTML = '';
    const groupedStats = groupByDate();

    Object.keys(groupedStats).forEach((date) => {
        const card = document.createElement('div');
        card.classList.add('date-card');
        card.textContent = new Date(date).toLocaleDateString();

        const details = document.createElement('div');
        details.classList.add('date-details');
        details.style.display = 'none';

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Joueur</th>
                    <th>Buts</th>
                    <th>Passes Décisives</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');

        groupedStats[date].forEach((stat) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${stat.name}</td>
                <td>${stat.goals}</td>
                <td>${stat.assists}</td>
                <td>
                    <button class="edit-btn" aria-label="Modifier">M</button>
                    <button class="delete-btn" aria-label="Supprimer">S</button>
                </td>
            `;

            row.querySelector('.edit-btn').addEventListener('click', (event) => {
                event.stopPropagation();
                editStat(statsData.indexOf(stat));
            });

            row.querySelector('.delete-btn').addEventListener('click', (event) => {
                event.stopPropagation();
                removeStat(statsData.indexOf(stat));
                updateDateCards();
                updateChart();
            });

            tbody.appendChild(row);
        });

        details.appendChild(table);
        card.appendChild(details);

        card.addEventListener('click', () => {
            const isVisible = details.style.display === 'block';
            document.querySelectorAll('.date-details').forEach((detail) => (detail.style.display = 'none'));
            details.style.display = isVisible ? 'none' : 'block';
        });

        dateContainer.appendChild(card);
    });
}

// Modifier une statistique
function editStat(index) {
    const stat = statsData[index];
    document.getElementById('player-name').value = stat.name;
    document.getElementById('goals').value = stat.goals;
    document.getElementById('assists').value = stat.assists;
    document.getElementById('match-date').value = stat.date;

    editIndex = index;
    form.querySelector('button[type="submit"]').textContent = 'Modifier les Statistiques';
}

// Supprimer une statistique
function removeStat(index) {
    statsData.splice(index, 1);
    localStorage.setItem('statsData', JSON.stringify(statsData));
    showToast('Statistique supprimée avec succès!');
}

// Mettre à jour le graphique
function updateChart() {
    const groupedStats = groupByDate();
    const dates = Object.keys(groupedStats);

    const goalsPerDate = dates.map((date) => groupedStats[date].reduce((acc, stat) => acc + stat.goals, 0));
    const assistsPerDate = dates.map((date) => groupedStats[date].reduce((acc, stat) => acc + stat.assists, 0));

    if (window.chart) {
        window.chart.data.labels = dates.map((date) => new Date(date).toLocaleDateString());
        window.chart.data.datasets[0].data = goalsPerDate;
        window.chart.data.datasets[1].data = assistsPerDate;
        window.chart.update();
    } else {
        window.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map((date) => new Date(date).toLocaleDateString()),
                datasets: [
                    {
                        label: 'Total des Buts',
                        data: goalsPerDate,
                        borderColor: 'green',
                        backgroundColor: 'rgba(0, 128, 0, 0.2)',
                        fill: true,
                        tension: 0.1
                    },
                    {
                        label: 'Total des Passes Décisives',
                        data: assistsPerDate,
                        borderColor: 'navy',
                        backgroundColor: 'rgba(0, 0, 128, 0.2)',
                        fill: true,
                        tension: 0.1
                    }
                ]
            },
            options: {
                scales: {
                    x: { title: { display: true, text: 'Date du Match' } },
                    y: { title: { display: true, text: 'Nombre' }, beginAtZero: true }
                }
            }
        });
    }
}

// Gestion du formulaire
form.addEventListener('submit', (event) => {
    event.preventDefault();

    const playerName = document.getElementById('player-name').value;
    const goals = parseInt(document.getElementById('goals').value) || 0;
    const assists = parseInt(document.getElementById('assists').value) || 0;
    const matchDate = document.getElementById('match-date').value;

    if (!playerName || !matchDate) {
        showToast('Veuillez remplir tous les champs obligatoires.', 'error');
        return;
    }

    if (isNaN(goals) || isNaN(assists) || goals < 0 || assists < 0) {
        showToast('Les buts et les passes décisives doivent être des nombres positifs.', 'error');
        return;
    }

    if (editIndex !== null) {
        statsData[editIndex] = { date: matchDate, name: playerName, goals, assists };
        editIndex = null;
        form.querySelector('button[type="submit"]').textContent = 'Ajouter les Statistiques';
    } else {
        statsData.push({ date: matchDate, name: playerName, goals, assists });
    }

    statsData.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem('statsData', JSON.stringify(statsData));

    updateDateCards();
    updateChart();
    form.reset();
    showToast('Statistique enregistrée avec succès!');
});

// Chargement initial
document.addEventListener('DOMContentLoaded', () => {
    updatePlayerSelect();
    displayPlayersList();
    updateDateCards();
    updateChart();
});
