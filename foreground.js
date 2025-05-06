/*
 * Description: Main file to inject to apexsandbox.io. Responsible for code sync and retrieval.
 */

/***********[START] : Variable Declaration and Initialization ************* */

let access_token;
let shaList;
let problemIdVsName;
let githubUserDetails;

const ce_main_container = document.createElement("DIV");
const ce_name = document.createElement("DIV");
const ce_input = document.createElement("INPUT");
const ce_button = document.createElement("BUTTON");

/*const ce_syncAllButton = document.createElement("BUTTON");
ce_syncAllButton.id = "syncAll";
ce_syncAllButton.innerText = "Sync All";
ce_syncAllButton.classList.add("slds-button");
*/
const resetSpan = document.createElement("span");

const ce_resetEditor = document.createElement("BUTTON");

const approvedSpan = document.createElement("span");
const disconnectedSpan = document.createElement("span");
const downloadCodeSpan = document.createElement("span");

resetSpan.innerHTML = "\u27F2";

ce_resetEditor.id = "ResetEditor";
ce_resetEditor.innerHTML = "<u>Reset Editor</u>";
ce_resetEditor.style.marginLeft = "16px";
ce_resetEditor.classList.add("slds-button");
ce_resetEditor.prepend(resetSpan);

resetSpan.innerHTML = "\u27F2";
approvedSpan.innerHTML = "\u2705";
disconnectedSpan.innerHTML = "\u274C";
downloadCodeSpan.innerHTML = "\u2B07";

ce_main_container.classList.add("ApexSync");
ce_name.id = "ce_name";
ce_button.id = "ce_button";
ce_button.classList.add("slds-button");

ce_name.innerHTML = `Your Github profile is not connected.`;
ce_name.prepend(disconnectedSpan);
ce_main_container.appendChild(ce_name);

/***********[END] : Variable Declaration and Initialization ************* */

/***********[START] : FUNCTIONS ************* */

/*
 * Give KebabCase name of problem statement.
 */
function toKebabCase(prbName) {
  return prbName
    .replace(/[^a-zA-Z0-9\. ]/g, "") //remove special chars
    .replace(/([a-z])([A-Z])/g, "$1-$2") // get all lowercase letters that are near to uppercase ones
    .replace(/[\s_]+/g, "-") // replace all spaces and low dash
    .toLowerCase(); // convert to lower case
}

// Problem Statements
function findProblemNameVsId() {
  let tag = "a";
  let hash = new Map();
  let elements = document.getElementsByTagName(tag);
  let found = [];
  for (let i = 0; i < elements.length; i++) {
    if (
      elements[i]?.href?.includes("/problem/") &&
      !elements[i]?.href?.includes("/problem/edit") &&
      !elements[i]?.href?.includes("/problem/create")
    ) {
      let ids = elements[i]?.href?.split("https://www.apexsandbox.io/problem/");
      hash.set(ids[1], toKebabCase(ids[1] + " " + elements[i]?.title));
      // found.push(elements[i]?.title + "==>" + elements[i]?.href);
    }
  }
  return hash;
}

/*
 * Store the Problem Id vs name
 */
function storeProblemIdVsName() {
  problemIdVsName = findProblemNameVsId();
  chrome.storage.local.set(
    { apexSandboxGithub_problemIdVsName: problemIdVsName },
    () => {
      console.log("Problem Id vs name stored.");
    }
  );
}

function checkAccessToken() {
  chrome.storage.local.get("apexSandboxGithub_accessToken", function (result) {
    if (result && result.apexSandboxGithub_accessToken) {
      access_token = result.apexSandboxGithub_accessToken;
      ce_name.innerHTML = `Your Github profile is connected.`;
      ce_name.prepend(approvedSpan);
      ce_button.innerHTML = `<u>Retrieve Code from GitHub</u>`;
      ce_button.prepend(downloadCodeSpan);
      ce_main_container.appendChild(ce_button);
      ce_main_container.appendChild(ce_resetEditor);
      //ce_main_container.appendChild(ce_syncAllButton);
    } else {
      access_token = null;
    }
    let executionBlock = document.querySelectorAll(".slds-media__body");
    if (executionBlock) {
      executionBlock[1]?.appendChild(ce_main_container);
    }
  });
}

/*
 * Reset the Editor
 */
function resetEditor() {
  let problemURL = window.location.pathname;
  debugger;
  if (
    problemURL?.includes("/problem/") &&
    !problemURL?.includes("/problem/edit") &&
    !problemURL?.includes("/problem/create")
  ) {
    let problemId = problemURL.split("/")?.[2];
    if (window && problemId) {
      window.localStorage.removeItem("problem/" + problemId);
      alert("Reset successfully.");
      location.reload();
    }
  }
}

/*
 * Update and store SHA of uploaded file.
It is required if repo is private otherwise sha is always null.
 */
function updateSHA(data) {
  if (!shaList) {
    shaList = new Map();
  }
  shaList[data?.content?.name] = data?.content?.sha;
  chrome.storage.local.set({ apexSandboxGithub_shaList: shaList }, () => {
    console.log("Sha List updated");
  });
}

function updateRetrieveSHA(data) {
  if (!shaList) {
    shaList = new Map();
  }
  shaList[data?.name] = data?.sha;
  chrome.storage.local.set({ apexSandboxGithub_shaList: shaList }, () => {
    console.log("Sha List updated");
  });
}

/*
 * Execute on Run Button to upload the code on Github.
 */
function executeApexRun() {
  checkAccessToken();
  let problemURL = window.location.pathname;
  if (
    window &&
    window.location.host == "www.apexsandbox.io" &&
    problemURL.includes("/problem/") &&
    !problemURL.includes("/problem/edit") &&
    !problemURL.includes("/problem/create")
  ) {
    let problemId = problemURL.split("/")?.[2];
    if (problemId) {
      if (access_token) {
        uploadProblem(problemId, false);
      } else {
        access_token = null;
        ce_name.innerText = "Your Github account is not connected.";
        ce_name.prepend(disconnectedSpan);
      }
    }
  } else {
    ce_name.innerHTML = "Your Github account is not connected.";
    ce_name.prepend(disconnectedSpan);
    let executionBlock = document.querySelectorAll(".slds-media__body");
    if (executionBlock) {
      executionBlock[1]?.appendChild(ce_main_container);
    }
  }
}

/*
 * Upload code
 */
async function uploadProblem(problemId, syncAll) {
  let updatedsha = "null";
  let code;
  let problemURL = window.location.href;

  if (problemId == undefined || problemId == null) return;

  let URL = "https://api.github.com/repos/";
  if (githubUserDetails?.githubUserName) {
    URL += githubUserDetails.githubUserName;
  }
  URL += "/ApexSandbox.io-Solution/contents/";

  // Fetch all problem id vs name
  if (problemIdVsName == undefined || problemIdVsName?.size == 0) {
    problemIdVsName = findProblemNameVsId();
  }

  // Get problem name
  let problemName = problemIdVsName.get(problemId);

  //Get Code for particular problem id
  let solution = window.localStorage["problem/" + problemId];
  if (solution) {
    solution = JSON.parse(solution);
    code = solution.code;
  }
  if (code == undefined) {
    ce_name.innerHTML = "Something went wrong. Please try to reset the editor or retrieve the code from GitHub and try again.";

    let executeBlock = document.querySelectorAll(".slds-media__body");
    if (executeBlock) {
      executeBlock[1]?.appendChild(ce_main_container);
    }
    return;
  }
  // id problem Name is present then.
  if (problemName) {
    // Get the updated Sha for the problem name
    if (shaList && shaList[problemName]) {
      updatedsha = shaList[problemName];
    }

    let data = {
      message: "Solution of Problem :" + problemURL,
      content: btoa(code),
      name: problemName,
      sha: updatedsha,
    };
    //sha: updatedsha,
    data = JSON.stringify(data);

    const fetchOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        Authorization: access_token,
      },
      body: data,
    };
    // Upload it
    fetch(URL + "" + problemName, fetchOptions)
      .then((response) => response.json())
      .then((data) => {
        // console.log(JSON.stringify(data));
        if (data?.content) {
          updateSHA(data);
        }
        if (!syncAll) {
          updateFileStatusUI(data, problemId);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
}

/**
 *  Function to update the status on UI.
 * @param {*} data : Response after uploading a file
 */
function updateFileStatusUI(data, problemId) {
  if (data?.content) {
    ce_name.innerHTML =
      "Problem " +
      problemId +
      " synced with Github. Find uploaded file " +
      "<a target='_blank' href='" +
      data.content.html_url +
      "'>here.</a>";
  } else {
    ce_name.innerHTML = "Something went wrong.";
  }
  let executeBlock = document.querySelectorAll(".slds-media__body");
  if (executeBlock) {
    executeBlock[1]?.appendChild(ce_main_container);
  }
}

/**
 * Function to retrieve code from github.
 */
function retrieveCode() {
  //Get problem id from url
  let problemURL = window.location.pathname;
  let problemId = problemURL.split("/")?.[2];

  // Fetch all problem id vs name
  if (problemIdVsName == undefined || problemIdVsName.size == 0) {
    problemIdVsName = findProblemNameVsId();
  }

  let URL = "https://api.github.com/repos/";
  if (githubUserDetails?.githubUserName) {
    URL += githubUserDetails.githubUserName;
  }
  URL += "/ApexSandbox.io-Solution/contents/";

  // Get problem name
  let problemName = problemIdVsName.get(problemId);
  if (problemName) {
    const fetchOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
        Authorization: access_token,
      },
    };
    fetch(URL + problemName + "?ref=main", fetchOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data?.message == "Not Found") {
          alert("The code was not found on GitHub.");
        } else if (data?.message) {
          alert("Something went wrong while retrieving code.");
        } else if (data?.content) {
          let code = atob(data?.content);
          let localStore = JSON.stringify({
            code: code,
            timestamp: new Date().getTime().toString(),
          });
          window.localStorage.setItem("problem/" + problemId, localStore);
          // Update SHA also.
          //alert('Retrieve'+JSON.stringify(data));
          updateRetrieveSHA(data);
          alert("Retrieved Successfully.");
          window.location.reload();
        } else {
          alert("Something went wrong.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Something went wrong");
      });
  }
}

/***********[END] : FUNCTIONS ************* */

/***********[START] : CODE Execution ************* */

if (window.location.host == "www.apexsandbox.io") {
  checkAccessToken();

  // Get githubUserDetails
  chrome.storage.local.get(
    "apexSandboxGithub_userGithubDetails",
    function (result) {
      if (result && result.apexSandboxGithub_userGithubDetails) {
        githubUserDetails = result.apexSandboxGithub_userGithubDetails;
      }
    }
  );

  // get SHA List if present
  chrome.storage.local.get("apexSandboxGithub_shaList", function (result) {
    if (result && result.apexSandboxGithub_shaList) {
      shaList = result.apexSandboxGithub_shaList;
    }
  });

  //Reset the code in editor
  ce_resetEditor.addEventListener("click", resetEditor);

  ce_button.addEventListener("click", retrieveCode);

  let run = document.querySelector(".slds-button.slds-button_brand");
  if (run) {
    run.addEventListener("click", executeApexRun);
  }

  //ce_syncAllButton.addEventListener("click", syncAll);
  storeProblemIdVsName();
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.message === "logoutGithub") {
    if (window && window.location) {
      window.location.reload();
    }
  }
});

/***********[END] : CODE Execution ************* */
