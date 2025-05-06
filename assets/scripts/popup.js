/**
 * Script for Popup.html
 */

/***********[START] : FUNCTIONS ************* */

function storeOriginalURL() {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    let originalURL = tabs[0].url;
    if (
      originalURL == undefined ||
      originalURL == null ||
      !originalURL.includes("apexsandbox.io")
    ) {
      originalURL = "https://www.apexsandbox.io/";
    }
    chrome.storage.local.set(
      { apexsandboxgithub_originalURLRedirect: originalURL },
      () => {
        oAuth2.begin();
      }
    );
  });
}

/**
 * Store the orginial url for redirecting after authorization.
 * Begin the Authenication.
 */
function authorizedGithub() {
  storeOriginalURL();
}

/**
 * Logout from Github
 */
function logoutGithub() {
  chrome.storage.local.set({ apexSandboxGithub_accessToken: null }, () => {
    document.querySelector("#auth_mode").style.display = "block";
    document.querySelector("#commit_mode").style.display = "none";
    console.log("GithHub Logout successfully.");
    let tabURL ='https://www.apexsandbox.io/';
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      tabURL = tabs[0].url;
      chrome.tabs.create({ url: tabURL, active: true }); 
      chrome.tabs.remove(tabs[0]?.id);
    });
    // creates new tab
      
  });
}

function setGithubUserDetailsOnPopup(userDetails) {
  let details = "";
  if (userDetails && userDetails.githubUserURL && userDetails.githubUserName) {
    details =
      "<p class='githubDetails' >Github Username: <a target='_blank' class='userDetails' href='";
    details += userDetails.githubUserURL;
    details += "'>";
    details += userDetails.githubUserName;
    details += "</a></p>";
  }
  if (userDetails && userDetails.repoURL) {
    details +=
      "<p class='githubDetails'>Github Repository: <a target='_blank' class='userDetails' href='";
    details += userDetails.repoURL;
    details += "'> ApexSandbox.io Solutions</a></p>";
  }
  document.querySelector("#githubUserName").innerHTML = details;
}

/***********[END] : FUNCTIONS ************* */

/***********[START] : CODE Execution ************* */

// Initially commitMode is disabled.
let commitMode = document.querySelector("#commit_mode");
if (commitMode) {
  commitMode.style.display = "none";
}

//Logout
let logout = document.getElementById("logout");
if (logout) {
  logout.addEventListener("click", logoutGithub);
}

//Attached EventListener on Authenticate Github button on popup
let authorizedButton = document.getElementById("authenticate");
if (authorizedButton) {
  authorizedButton.addEventListener("click", authorizedGithub);
}

//Check the access_Token and display accordingly.
chrome.storage.local.get("apexSandboxGithub_accessToken", function (result) {
  if (result && result.apexSandboxGithub_accessToken) {
    document.querySelector("#auth_mode").style.display = "none";
    document.querySelector("#commit_mode").style.display = "block";
  }
});

// Get githubUserDetails to display on Popup.html
chrome.storage.local.get(
  "apexSandboxGithub_userGithubDetails",
  function (result) {
    if (result && result.apexSandboxGithub_userGithubDetails) {
      let userDetails = result.apexSandboxGithub_userGithubDetails;
      setGithubUserDetailsOnPopup(userDetails);
    }
  }
);

/***********[END] : CODE Execution ************* */
