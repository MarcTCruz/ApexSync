/**
 *Description: Github OAuth URL creation and redirect
 * 
 */

const oAuth2 = {

  /**
   * Constants params.
  */
  init() {
    this.ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
    this.AUTHORIZATION_URL = "https://github.com/login/oauth/authorize";
    this.CLIENT_ID = "b830fb461abeb9e53a57";
    this.CLIENT_SECRET = "c6ec8aa4c160ff7c8bd45c7819629c1e0629ca1b";
    this.REDIRECT_URL = "https://github.com/";
    this.SCOPES = ["public_repo"];
  },

  /**
   * Begin the Authenication process.
   */
  begin() {
   
    this.init(); // secure token params.

    let githubOAuthURL = `${this.AUTHORIZATION_URL}?client_id=${this.CLIENT_ID}&redirect_uri${this.REDIRECT_URL}&scope=`;

    for (let i = 0; i < this.SCOPES.length; i += 1) {
      githubOAuthURL += this.SCOPES[i];
    }
    
   // Open the pipe temporarily for authenication and close it with authenication process it completed.
   chrome.storage.local.set({ apexSandboxGithub_pipe: true }, () => {
  
    // Closed the current tab 
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      chrome.tabs.remove(tabs[0].id);
    });

    //open the OAuth Github URL for Authenication code and access token.
    chrome.tabs.create({ url:githubOAuthURL, active: true }, function () {
      window.close();
    });
  });
  },
};
