if (!window.hasRightClickResizeListener)
{

  window.hasRightClickResizeListener=true;

 chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>
 {
  if (message.type === "resize-image")
  {
    const imageUrl = message.imageUrl;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onerror = () =>
    {
      alert("⚠️ Failed to load image. It might be blocked by CORS.");
    };

    img.onload = () =>
    {
      const originalWidth  = img.width;
      const originalHeight = img.height;

      const input = prompt(
        `This is your friendly Right(Click)Resize Chrome Extension to resize and download images. ` +
        `For feedback, latest version and more info, go to \nhttps://github.com/tstaerk/chrome-extensions\n\n` +
        `Original size: ${originalWidth} x ${originalHeight}\n` +
        `Enter target size (e.g., 100% or 1920x1080):`,
        "100%"
      );

      if (!input)
      {
        return;
      }

      let width, height;

      if (input.trim().endsWith("%"))
      {
        const percent = parseFloat(input);
        if (!percent || percent <= 0 || percent > 1000)
        {
          alert("Invalid percentage.");
          return;
        }

        width  = originalWidth  * (percent / 100);
        height = originalHeight * (percent / 100);
      }
      else if (/^\d+x\d+$/i.test(input))
      {
        const [w, h] = input.toLowerCase().split("x").map(Number);
        if (!w || !h)
        {
          alert("Invalid dimensions.");
          return;
        }

        width  = w;
        height = h;
      }
      else
      {
        alert("Invalid input. Use format like 100% or 1920x1080.");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) =>
      {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement("a");
        a.href     = url;
        a.download = `resized-image.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };

    img.src = imageUrl;
  }
 });
}
