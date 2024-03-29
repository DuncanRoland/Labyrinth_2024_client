import { navigate } from './universal.js';
import { GAMEPREFIX } from './config.js';
import { saveToStorage } from './data-connector/local-storage-abstractor.js';
import *  as CommunicationAbstractor from './data-connector/api-communication-abstractor.js';

let GAME = {
    prefix: GAMEPREFIX,
    playerName: 'test',
    gameMode: 'simple',
    gameName: 'testGame',
    minPlayers: 2,
    maxPlayers: 4,
    numberOfTreasuresPerPlayer: 3,
};
const maxCharacters = 15;

function init() {
    document.querySelector('#back').addEventListener('click', () => navigate('createOrJoin.html'));
    document.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        checkForm();
        createGame(e);
    });
}

function createGame(e) {
    e.preventDefault();
    const playerName = localStorage.getItem('playerName');
    const game = GAME;
    game.playerName = playerName;
    game.gameName = document.querySelector('#gameName').value;
    game.maxPlayers = parseInt(document.querySelector('#max-players').value)
    if (!document.querySelector('#error').classList.contains('hidden')) {
        return;
    }
    postGame(game);
}

function postGame(game) {
    console.log(game)
    CommunicationAbstractor.fetchFromServer('/games', 'POST', game)
        .then(response => {
            console.log(response)
            saveToStorage("playerToken", response.playerToken);
            saveToStorage("gameId", response.gameId);
            navigate('game.html');
        }).catch((error) => console.error(error));
}

function checkForm() {
    const checkedRadioButton = document.querySelector('input[name="game-mode"]:checked');
    const gameNameInput = document.querySelector("#gameName").value.trim();
    const error = document.querySelector('#error');
    error.innerHTML = "";

    if(checkedRadioButton === null){
        error.insertAdjacentHTML('beforeend', '<p>Please select a game mode</p>')
    } else if(gameNameInput === ""){
        error.insertAdjacentHTML('beforeend', '<p>Please enter a game name</p>')
    } else if(gameNameInput.length > maxCharacters){
        error.insertAdjacentHTML('beforeend', `<p>Game name cannot exceed ${maxCharacters} characters</p>`)
    }

    if(checkedRadioButton === null || gameNameInput === "" || gameNameInput.length > maxCharacters){
        document.querySelector('#error').classList.remove('hidden');
    } else {
        document.querySelector('#error').classList.add('hidden');
        GAME.gameMode = checkedRadioButton.value;
        GAME.gameName = gameNameInput;
    }
   
}

init();