import { navigate } from "./universal.js";

function init() {
  if (localStorage.getItem('playerName')) {
    document.querySelector("main").insertAdjacentHTML('afterBegin', `<h2>Welcome ${localStorage.getItem('playerName')}!</h1>`);
    document.querySelector("button").addEventListener('click', () => navigate('createGame.html'));
    document.querySelector("button").addEventListener('click', () => navigate('gameList.html'));
  } else {
    navigate('createUser.html');
  }

}


init();
