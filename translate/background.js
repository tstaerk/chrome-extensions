chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "translateToGerman",
    title: "Translate to German",
    contexts: ["selection", "link"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "translateToGerman") return;

  // Step 1: Inject script to get innerText of whatever's under the click
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        return selection.toString();
      }

      // If nothing selected, try to find the element under the context menu click
      const clickedElem = document.activeElement;
      return clickedElem ? clickedElem.innerText || clickedElem.alt || "No text found" : "No text found";
    }
  }, async ([injectionResult]) => {
    const selectedText = injectionResult?.result || "No text";

    // Step 2: Show loading popup
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showTranslationPopup,
      args: ["Translating… 🇩🇪"]
    });

    // Step 3: Translate
    const response = await fetch("https://translate-api-thorsten.replit.app/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: selectedText })
    });

    const result = await response.json();

    // Step 4: Show translation
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showTranslationPopup,
      args: [result.translation]
    });
  });
});

function showTranslationPopup(translation) {
  // Remove any existing popups
  document.querySelectorAll('.translation-popup').forEach(el => el.remove());

  const selection = window.getSelection();
  const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  if (!range) return;

  let top = 0;
  let left = 0;
  if (range) {
    const rect = range.getBoundingClientRect();

    if (rect.width > 0 || rect.height > 0) {
      // Normal case
      top = rect.bottom + window.scrollY;
      left = rect.left + window.scrollX;
    } else {
      // Fallback fallback — still use same rect values
      top = rect.bottom + window.scrollY;
      left = rect.left + window.scrollX;
    }
  }

  const popup = document.createElement("div");
  popup.className = "translation-popup";
  popup.style.position = "absolute";
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
  popup.style.backgroundColor = "white";
  popup.style.border = "1px solid #ccc";
  popup.style.padding = "10px 16px";
  popup.style.zIndex = "10000";
  popup.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
  popup.style.borderRadius = "6px";
  popup.style.fontFamily = "sans-serif";
  popup.style.fontSize = "14px";
  popup.style.maxWidth = "300px";
  popup.style.lineHeight = "1.5";
  popup.style.color = "#222";

  const content = document.createElement("div");
  content.textContent = translation;
  popup.appendChild(content);
  document.body.appendChild(popup);

  // Close popup when clicking outside
  const outsideClickHandler = (event) => {
    if (!popup.contains(event.target)) {
      popup.remove();
      document.removeEventListener('click', outsideClickHandler);
    }
  };

  // Delay listener to avoid self-close
  setTimeout(() => {
    document.addEventListener('click', outsideClickHandler);
  }, 0);
}
