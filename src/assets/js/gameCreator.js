import { navigate } from './universal.js';
import { GAMEPREFIX } from './config.js';
import { saveToStorage } from './data-connector/local-storage-abstractor.js';
import *  as CommunicationAbstractor from './data-connector/api-communication-abstractor.js';

// Define the initial game settings
let GAME = {
    prefix: GAMEPREFIX,
    playerName: 'test',
    gameMode: 'simple',
    gameName: 'testGame',
    minimumPlayers: 2,
    maximumPlayers: 4,
    numberOfTreasuresPerPlayer: 3,
};
const maxCharacters = 15;

// Initialize the game creation form
function init() {
    // Add event listener for the back button
    document.querySelector('#back').addEventListener('click', () => navigate('createOrJoin.html'));
    // Add event listener for the form submission
    document.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        checkForm();
        createGame(e);
    });
}

// Function to create a new game
function createGame(e) {
    e.preventDefault();
    const playerName = localStorage.getItem('playerName');
    const game = GAME;
    console.log(document.querySelector('#max-players').value)
    game.playerName = playerName;
    game.gameName = document.querySelector('#gameName').value;
    game.maximumPlayers = parseInt(document.querySelector('#max-players').value);
    if (!document.querySelector('#error').classList.contains('hidden')) {
        return;
    }
    postGame(game);
}

// Function to post the new game to the server
function postGame(game) {
    CommunicationAbstractor.fetchFromServer('/games', 'POST', game)
        .then(response => {
            console.log(response)
            saveToStorage("playerToken", response.playerToken);
            saveToStorage("gameId", response.gameId);
            navigate('game.html');
        }).catch((error) => console.error(error));
}

// Function to validate the form inputs
function checkForm() {
    const checkedRadioButton = document.querySelector('input[name="game-mode"]:checked');
    const gameNameInput = document.querySelector("#gameName").value.trim();
    const error = document.querySelector('#error');
    error.innerHTML = "";

    // Check if a game mode is selected
    if (checkedRadioButton === null) {
        error.insertAdjacentHTML('beforeend', '<p>Please select a game mode</p>')
    }
    // Check if a game name is entered
    else if (gameNameInput === "") {
        error.insertAdjacentHTML('beforeend', '<p>Please enter a game name</p>')
    }
    // Check if the game name exceeds the maximum character limit
    else if (gameNameInput.length > maxCharacters) {
        error.insertAdjacentHTML('beforeend', `<p>Game name cannot exceed ${maxCharacters} characters</p>`)
    }

    // If any of the above checks fail, display the error message
    if (checkedRadioButton === null || gameNameInput === "" || gameNameInput.length > maxCharacters) {
        document.querySelector('#error').classList.remove('hidden');
    } else {
        document.querySelector('#error').classList.add('hidden');
        GAME.gameMode = checkedRadioButton.value;
        GAME.gameName = gameNameInput;
    }
}

init();