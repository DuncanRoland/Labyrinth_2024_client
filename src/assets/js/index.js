import * as CommunicationAbstractor from "./data-connector/api-communication-abstractor.js";
import * as ErrorHandler from "./data-connector/error-handler.js";

function init() {
  testConnection();
}

function testConnection(){
  CommunicationAbstractor.fetchFromServer('/treasures', 'GET').then(treasures => console.log(treasures)).catch(ErrorHandler.handleError);
}


init();