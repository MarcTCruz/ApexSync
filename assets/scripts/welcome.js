/*
 * Description: Landing page after authenication with github.
 */

/***********[START] : FUNCTIONS ************* */

const repositoryName = "ApexSandbox.io Solution";

//Store Github Details
function setGithubUserDetails(data) {
  if (data?.html_url) {
    let userDetails = {
      repoURL: data?.html_url+'/ApexSandbox.io-Solution',
      githubUserName: data?.login,
      githubUserURL: data.html_url,
    };
    //  alert('Github setup'+JSON.stringify(data));
    chrome.storage.local.set(
      { apexSandboxGithub_userGithubDetails: userDetails },
      () => {
        // console.log("repo name stored" + JSON.stringify(data));
      }
    );
  }
}
/*
 * Create Repository.
 */
async function createRepo(access_token) {
  let data = {
    name: repositoryName,
    public: true,
    auto_init: true,
    description:
      "Solutions of Apexsandbox.io - Created using [ApexSync](https://github.com/Sarsewar/ApexSync)",
  };

  data = JSON.stringify(data);

  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
      Authorization: access_token,
    },
    body: data,
  };

  fetch("https://api.github.com/user/repos", fetchOptions)
    .then((response) => response.json())
    .then((data) => {
      // alert(JSON.stringify(data));
      getUserDetails(access_token);
    })
    .catch((error) => {
      console.error(error);
    });
}

function getUserDetails(access_token) {
  const fetchOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: access_token,
    },
  };

  fetch("https://api.github.com/user", fetchOptions)
    .then((response) => response.json())
    .then((data) => {
     // alert('user info'+JSON.stringify(data));
      if (data) {
        setGithubUserDetails(data);
      }
      redirectBack();
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

/*
 *  Redirect Back to initated tab url
 */
function redirectBack() {
  let redirectURL;
  chrome.storage.local.get(
    "apexsandboxgithub_originalURLRedirect",
    function (result) {
      if (result && result.apexsandboxgithub_originalURLRedirect) {
        redirectURL = result.apexsandboxgithub_originalURLRedirect;
      }

      if (
        redirectURL == undefined ||
        redirectURL == null ||
        !redirectURL.includes("apexsandbox.io")
      ) {
        redirectURL = "https://www.apexsandbox.io/";
      }
      chrome.tabs?.query(
        { currentWindow: true, active: true },
        function (tabs) {
          chrome.tabs.remove(tabs[0].id);
        }
      );
      // redirect back to original url
      chrome.tabs.create({ url: redirectURL, active: true });
    }
  );
}
/***********[END] : FUNCTIONS ************* */

/***********[START] : CODE Execution ************* */

chrome.storage.local.get("apexSandboxGithub_accessToken", function (result) {
  if (result && result.apexSandboxGithub_accessToken) {
    this.createRepo(result.apexSandboxGithub_accessToken);
  }
});

/***********[END] : CODE Execution ************* */
