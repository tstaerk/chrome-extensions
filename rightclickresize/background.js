chrome.runtime.onInstalled.addListener(() =>
{
  chrome.contextMenus.create(
  {
    id:       "right-click-resize",
    title:    "Download and Resize Image",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) =>
{
  chrome.scripting.executeScript(
  {
    target: { tabId: tab.id },
    files:  ["resize.js"]
  }).then(() =>
  {
    chrome.tabs.sendMessage(tab.id,
    {
      type:     "resize-image",
      imageUrl: info.srcUrl
    });
  });
});
