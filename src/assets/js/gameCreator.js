import {navigate} from './universal.js';

function init() {
    const backButton = document.querySelector('#back');
    backButton.addEventListener('click', () => {
            navigate('index.html');
        }
    );

    const createGameButton = document.querySelector('#createGame');
    createGameButton.addEventListener('click', () => {
            navigate('gameCreated.html');
        }
    );
}

init();