import { navigate } from './universal.js';
import { GAMEPREFIX } from './config.js';
import { loadFromStorage, saveToStorage } from './data-connector/local-storage-abstractor.js';
import *  as CommunicationAbstractor from './data-connector/api-communication-abstractor.js';

function init() {
    document.querySelector('#back').addEventListener('click', () => navigate('createOrJoin.html'));
    document.querySelector('form').addEventListener('submit', (e) => createGame(e));
}

function createGame(e) {
    e.preventDefault();
    const playerName = localStorage.getItem('playerName');
    const game = {
        prefix: GAMEPREFIX,
        playerName: playerName,
        gameMode: document.querySelector('input[name="game-mode"]:checked').value,
        gameName: document.querySelector('#gameName').value,
        minPlayers: 2,
        maxPlayers: parseInt(document.querySelector('#max-players').value),
    };
    postGame(game);
    navigate('game.html');
}

function postGame(game) {
    CommunicationAbstractor.fetchFromServer('/games', 'POST', game)
        .then(response => {
            saveToStorage("playerToken", response.playerToken);
            saveToStorage("gameId", response.gameId);
        }).catch((error) => console.error(error));
}

init();