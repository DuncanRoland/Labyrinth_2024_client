const GROUPNUMBER = "25";
const LANG = "nl";
const GAMEPREFIX = "group25";
const TIMEOUTDELAY = 2500;

const ERRORHANDLERSELECTOR = ".errormessages p";

const LOCALSERVER = `http://localhost:8000`;
const DEPLOYEDSERVER = `https://project-1.ti.howest.be/2023-2024/labyrinth/api`;
const GROUPDEPLOYEDSERVER = `https://project-1.ti.howest.be/2023-2024/${LANG}/group-${GROUPNUMBER}/api`;

function getAPIUrl() {
  return LOCALSERVER;
}

export { getAPIUrl, GROUPNUMBER, GAMEPREFIX, ERRORHANDLERSELECTOR, TIMEOUTDELAY };