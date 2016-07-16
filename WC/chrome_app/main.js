chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('player_client.html', {
    id: "mainwin",
    innerBounds: {
      width: 680,
      height: 480
    }
  });
});