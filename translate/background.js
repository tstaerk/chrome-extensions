// background.js

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
  // Try to reuse existing popup
  let popup = document.querySelector('.translation-popup');
  if (!popup) {
    // First time: create it
    popup = document.createElement("div");
    popup.className = "translation-popup";
    Object.assign(popup.style, {
      position: "absolute",
      backgroundColor: "white",
      border: "1px solid #ccc",
      padding: "10px 16px",
      zIndex: "10000",
      boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.3)",
      borderRadius: "6px",
      fontFamily: "sans-serif",
      fontSize: "14px",
      maxWidth: "300px",
      lineHeight: "1.5",
      color: "#222",
      pointerEvents: "auto"  // ensure we can click outside
    });
    document.body.appendChild(popup);

    // Close on outside click
    const outsideClickHandler = (e) => {
      if (!popup.contains(e.target)) {
        popup.remove();
        window.removeEventListener('click', outsideClickHandler);
      }
    };
    setTimeout(() => window.addEventListener('click', outsideClickHandler), 0);
  }

  // Update text
  popup.textContent = translation;

  // Position it
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const rect = selection.getRangeAt(0).getBoundingClientRect();
  const top = rect.bottom + window.scrollY;
  const left = rect.left + window.scrollX;
  Object.assign(popup.style, {
    top: `${top}px`,
    left: `${left}px`
  });
}
