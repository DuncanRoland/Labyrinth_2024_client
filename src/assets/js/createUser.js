import { navigate } from "./universal.js";

init();

function init() {
    document.querySelector('form').addEventListener('submit', (e) => createUser(e));
}

function createUser(e) {
    e.preventDefault();
    const playerName = document.querySelector('input').value;
    localStorage.setItem('playerName', playerName);
    navigate('createOrJoin.html');
}