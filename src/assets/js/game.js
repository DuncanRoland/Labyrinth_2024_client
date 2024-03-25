
init();


function init() {
    createEventListeners();
}



//TODO: update button event listener with navigate function from universal.js
function createEventListeners() {
    const button = document.querySelector('button');
    button.addEventListener('click', () => window.location.href = "index.html");
}
