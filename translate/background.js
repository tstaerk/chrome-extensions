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

  // 1) figure out what text to translate
  let textToTranslate = info.selectionText?.trim() || "";

  if (!textToTranslate) {
    // no selection → inject small script to grab the element at our last right-click
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // first try any selection just in case
        const sel = window.getSelection();
        if (sel && sel.toString().trim()) {
          return sel.toString();
        }
        // else use the coords stamped by content.js
        const coords = window._lastContextMenuCoords || { x: 0, y: 0 };
        const el = document.elementFromPoint(coords.x, coords.y);
        return el ? (el.innerText || el.alt || "") : "";
      }
    });
    textToTranslate = (res.result || "").trim();
  }

  if (!textToTranslate) {
    // nothing to translate
    return;
  }

  // 2) show loading popup
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: showTranslationPopup,
    args: ["Translating… 🇩🇪"]
  });

  // 3) call your API
  let translated = "Fehler beim Übersetzen";
  try {
    const resp = await fetch("https://translate-api-thorsten.replit.app/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textToTranslate })
    });
    const { translation } = await resp.json();
    translated = translation || translated;
  } catch (e) {
    console.error("Translation API error", e);
  }

  // 4) update popup with real result
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: showTranslationPopup,
    args: [translated]
  });
});

function showTranslationPopup(translation) {
  // reuse or create a single popup
  let popup = document.querySelector(".translation-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.className = "translation-popup";
    Object.assign(popup.style, {
      position: "absolute",
      backgroundColor: "white",
      border: "1px solid #ccc",
      padding: "10px 16px",
      zIndex: "10000",
      boxShadow: "2px 2px 5px rgba(0,0,0,0.3)",
      borderRadius: "6px",
      fontFamily: "sans-serif",
      fontSize: "14px",
      maxWidth: "300px",
      lineHeight: "1.5",
      color: "#222",
      pointerEvents: "auto"
    });
    document.body.appendChild(popup);

    // dismiss when clicking outside
    const handler = e => {
      if (!popup.contains(e.target)) {
        popup.remove();
        window.removeEventListener("click", handler);
      }
    };
    setTimeout(() => window.addEventListener("click", handler), 0);
  }

  // set the text
  popup.textContent = translation;

  // position: use coords if available, else selection rect
  const coords = window._lastContextMenuCoords;
  let top, left;
  if (coords) {
    top  = coords.y + window.scrollY;
    left = coords.x + window.scrollX;
  } else {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    top  = rect.bottom + window.scrollY;
    left = rect.left   + window.scrollX;
  }

  Object.assign(popup.style, {
    top:  `${top}px`,
    left: `${left}px`
  });
}
