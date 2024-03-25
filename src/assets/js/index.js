import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as ErrorHandler from "./data-connector/error-handler.js";
import { navigate } from "./universal.js";

function init() {
  testConnection();
  const button = document.querySelector("button");
  button.addEventListener('click', () => navigate('a.html'));
}

function testConnection() {
  CommunicationAbstractor.fetchFromServer('/treasures', 'GET').then(treasures => console.log(treasures)).catch(ErrorHandler.handleError);
}


init();
