import { navigate } from "./universal.js";

function init() {
  if (localStorage.getItem('playerName')) {
    document.querySelector("main").insertAdjacentHTML('afterBegin', `<h2>Welcome ${localStorage.getItem('playerName')}!</h2>`);
    document.querySelector("#create").addEventListener('click', () => navigate('createGamePage.html'));
    document.querySelector("#join").addEventListener('click', () => navigate('gameList.html'));
  } else {
    navigate('index.html');
  }

}


init();
