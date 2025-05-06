/*
 * Description: Background processing.
 */

/***********[START] : FUNCTIONS ************* */

function handleMessage(request) {
  if (request && request.closeWebPage === true && request.isSuccess === true) {
    // accessToken and username setting removed - checking.
    setGithubUserDetails(request.data);
    /* Close pipe */
    chrome.storage.local.set({ apexSandboxGithub_pipe: false }, () => {
      console.log("Closed pipe.");
    });

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      chrome.tabs.remove(tabs[0]?.id);
    });

    /* Go to welcome page*/
    const urlOnboarding = chrome.runtime.getURL("welcome.html");
    // creates new tab
    chrome.tabs.create({ url: urlOnboarding, active: true });
  } else if (
    request &&
    request.closeWebPage === true &&
    request.isSuccess === true
  ) {
    alert("Something went wrong while trying to authenticate your profile!");

    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      chrome.tabs.remove(tabs[0].id);
    });
  }
}

function setGithubUserDetails(data) {
  if (data?.html_url) {
    let userDetails = {
      repoURL: data?.html_url,
      githubUserName: data.name,
      githubUserURL: data?.owner?.html_url,
    };
    chrome.storage.local.set(
      { apexSandboxGithub_userGithubDetails: userDetails },
      () => {
        // console.log("repo name stored" + JSON.stringify(data));
      }
    );
  }
}

/***********[END] : FUNCTIONS ************* */

/***********[START] : CODE Execution ************* */

// Add listner to chrome messages.
chrome.runtime.onMessage.addListener(handleMessage);

// listner to inject foreground.js to apexsandbox.io
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    /^http/.test(tab.url) &&
    tab?.url?.includes("apexsandbox.io/problem") &&
    !tab?.url?.includes("problem/edit") &&
    !tab?.url?.includes("problem/create")
  ) {
    chrome.scripting
      .insertCSS({
        target: { tabId: tabId },
        files: ["./assets/css/foreground_styles.css"],
      })
      .then(() => {
        console.log("INJECTED THE FOREGROUND STYLES.");

        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            files: ["./foreground.js"],
          })
          .then(() => {
            console.log("INJECTED THE FOREGROUND SCRIPT.");
          });
      })
      .catch((err) => console.log(err));
  }
});
