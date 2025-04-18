const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/translate", async (req, res) => {
  const text = req.body.text;
  if (!text) return res.status(400).send("Missing text");

  console.log("Incoming text:", text);
  console.log("DEEPL_API_KEY present?", !!process.env.DEEPL_API_KEY);

  try {
    // Attempt DeepL translation
    const deeplResult = await axios.post("https://api-free.deepl.com/v2/translate", null, {
      params: {
        auth_key: process.env.DEEPL_API_KEY,
        text,
        target_lang: "DE"
      }
    });

    const translation = deeplResult.data.translations[0].text;
    return res.json({ translation });

  } catch (err) {
    if (err.response?.status === 456) {
      console.warn("⚠️ DeepL quota exceeded. Falling back to Google Translate.");

      try {
        // Fallback to Google Translate
        const googleResult = await axios.get("https://translate.googleapis.com/translate_a/single", {
          params: {
            client: "gtx",
            sl: "auto",
            tl: "de",
            dt: "t",
            q: text
          }
        });

        const fallbackTranslation = googleResult.data[0][0][0];
        return res.json({
          translation: `❌ DeepL free tier exhausted.\n🆓 Google Translate fallback:\n${fallbackTranslation}`
        });

      } catch (fallbackErr) {
        console.error("Fallback translation failed:", fallbackErr.message);
        return res.status(500).json({
          translation: "❌ DeepL quota exceeded and Google fallback failed. Please try again later."
        });
      }

    } else {
      console.error("DeepL API error:", err.response?.data || err.message);
      return res.status(500).json({
        translation: "❌ An unexpected error occurred while translating."
      });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Translation server running on port ${PORT}`);
});
