// background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translateToGerman",
    title: "Translate to German",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translateToGerman" && info.selectionText) {
    translateText(info.selectionText, tab.id);
  }
});

async function translateText(text, tabId) {
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=de&dt=t&q=${encodeURIComponent(
        text
      )}`
    );
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const translation = data[0][0][0];

    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: showTranslation,
      args: [translation, text], // Pass both original and translation
    });
  } catch (error) {
    console.error("Translation error:", error);
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: showError,
    });
  }
}

function showTranslation(translation, originalText) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  const popup = document.createElement("div");
  popup.style.position = "absolute";
  popup.style.top = rect.bottom + window.scrollY + "px";
  popup.style.left = rect.left + window.scrollX + "px";
  popup.style.backgroundColor = "white";
  popup.style.border = "1px solid #ccc";
  popup.style.padding = "10px";
  popup.style.zIndex = "1000";
  popup.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
  popup.style.borderRadius = "5px";
  popup.style.fontFamily = "sans-serif";
  popup.style.maxWidth = "300px"; // Limit width

  const translatedParagraph = document.createElement("p");
  translatedParagraph.textContent = `Translation: ${translation}`;

  popup.appendChild(translatedParagraph);

  document.body.appendChild(popup);

  popup.addEventListener("click", () => {
    popup.remove();
  });

  // Remove the popup when clicking outside of it
  document.addEventListener('click', function(event) {
    if (!popup.contains(event.target)) {
      popup.remove();
    }
  }, { once: true });
}

function showError() {
  alert("Translation failed. Please try again later.");
}
