/*
 * Description: File for authorization of github and processing access token.
 */

/***********[START] : FUNCTIONS ************* */

//Constant Params
function init() {
  this.KEY = "apexSandboxGithub_accessToken";
  this.ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
  this.AUTHORIZATION_URL = "https://github.com/login/oauth/authorize";
  this.CLIENT_ID = "b830fb461abeb9e53a57";
  this.CLIENT_SECRET = "c6ec8aa4c160ff7c8bd45c7819629c1e0629ca1b";
  this.REDIRECT_URL = "https://github.com/"; // for example, https://github.com
  this.SCOPES = ["public_repo"];
  this.GITHUB_USER_API = "https://api.github.com/user";
}

/*
 *Parse the github code from github url
 */
function parseAccessCode(url) {
  if (url?.match(/\?error=(.+)/)) {
    //Close the github tab if error occurred.
    chrome.tabs.getCurrent(function (tab) {
      chrome.tabs.remove(tab.id, function () {});
    });
  } else if (url?.match(/\?code=([\w\/\-]+)/) != null) {
    //If code is present in github url - request for access token.
    this.requestToken(url.match(/\?code=([\w\/\-]+)/)[1]);
  }
}

/*
 *  Request github access token
 */

async function requestToken(githubUrlCode) {
  const that = this;

  const data = new FormData();
  data.append("client_id", this.CLIENT_ID);
  data.append("client_secret", this.CLIENT_SECRET);
  data.append("code", githubUrlCode);

  const plainFormData = Object.fromEntries(data.entries());
  const formDataJsonString = JSON.stringify(plainFormData);

  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: formDataJsonString,
  };

  fetch(this.ACCESS_TOKEN_URL, fetchOptions)
    .then((response) => response.json())
    .then((data) => {
     // console.log("Success:", JSON.stringify(data));
      if (data?.access_token != undefined && data?.access_token != null) {
        //Store the access token
        chrome.storage.local.set({
          apexSandboxGithub_accessToken: "token " + data.access_token,
        });
        // call the finish method.
        this.finish("token " + data.access_token);
      } else {
        // Unable to access then token.
        chrome.runtime.sendMessage({
          closeWebPage: true,
          isSuccess: false,
        });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

/*
 * Store Github Details
 */

function setGithubUserDetails(data) {
  if (data && data.githubUserURL && data.githubUserName) {
    let userDetails = {
      repoURL: data?.html_url,
      githubUserName: data.login,
      githubUserURL: data?.html_url,
    };

    chrome.storage.local.set(
      { apexSandboxGithub_userGithubDetails: userDetails },
      () => {
        console.log("Github Details Stored." + JSON.stringify(data));
      }
    );
  }
}

/*
 * Validate the provided acess_token by fetching userdetails.
 */

async function finish(access_token) {
  // To validate user, load user object from GitHub.

  const fetchOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: access_token,
    },
  };

  fetch(this.GITHUB_USER_API, fetchOptions)
    .then((response) => response.json())
    .then((data) => {
      //console.log("Get user Success:", data);
      //save data.html_url for Github link

      //alert(JSON.stringify(data));
      if (data) {
        setGithubUserDetails(data);
        chrome.runtime.sendMessage({
          closeWebPage: true,
          isSuccess: true,
          access_token,
          data,
          KEY: this.KEY,
        });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

/***********[END] : FUNCTIONS ************* */

/***********[START] : CODE Execution ************* */

this.init(); // load params.

/* Check for open pipe */
if (window.location.host === "github.com") {
  const link = window.location.href;

  chrome.storage.local.get("apexSandboxGithub_pipe", (data) => {
    if (data && data.apexSandboxGithub_pipe) {
      this.parseAccessCode(link);
    }
  });
}

/***********[END] : CODE Execution ************* */
