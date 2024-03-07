const GROUPNUMBER = "00";
const GAMEPREFIX = "group00";

const ERRORHANDLERSELECTOR = ".errormessages p";

const LOCALSERVER = `http://localhost:8080`;
const DEPLOYEDSERVER = `https://project-1.ti.howest.be/2023-2024/group-00/api`;
const GROUPDEPLOYEDSERVER = `https://project-1.ti.howest.be/2023-2024/group-${GROUPNUMBER}/api`;

function getAPIUrl() {
  return DEPLOYEDSERVER;
}

export { getAPIUrl, GROUPNUMBER, GAMEPREFIX, ERRORHANDLERSELECTOR };
