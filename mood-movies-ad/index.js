const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const result = document.getElementById("result");
const scanButton = document.querySelector(".scan-button"); // Get the scan button

const movieMap = {
  Happy: {
    name: "Welcome",
    link: "https://www.primevideo.com/detail/0MJFLZHIV04F9V9V21RAY2Z8ZZ/",
    thumbnail:
      "https://m.media-amazon.com/images/S/pv-target-images/af13e1c59556eb143d2b213c9f95567677f409033d4c9619c553367d71bee982._SX1920_FMwebp_.jpg",
  },
  Sad: {
    name: "Call me Bae",
    link: "https://www.primevideo.com/detail/0TF2BODX83KZOWTP08NXFE897E/",
    thumbnail:
      "https://m.media-amazon.com/images/S/pv-target-images/0cb7ac74d1d6e8eb2e3d59aa5354359714eb54d84fcfaa616d9de19d64b492ca._SX1920_FMwebp_.jpg",
  },
  Excited: {
    name: "Citadel Honey Bunny",
    link: "https://www.primevideo.com/detail/0KYRVT4JDB957NXZO72E2MIFW5",
    thumbnail:
      "https://m.media-amazon.com/images/S/pv-target-images/51c2c75da778c109ccc33ff293ff48f0cccc60b18c3fef8a42afe2a80e07acac._SX1920_FMwebp_.jpg",
  },
  Neutral: {
    name: "Farzi",
    link: "https://www.primevideo.com/detail/0HDHQAUF5LPWOJRCO025LFJSJI",
    thumbnail:
      "https://m.media-amazon.com/images/S/pv-target-images/8aed532f0875925f72c4012aab688ed409773ecbfb3b18e1a39cd9ad1a4dd485._SX1920_FMwebp_.jpg",
  },
  Angry: {
    name: "Agneepath",
    link: "https://www.primevideo.com/detail/0NU7IFXPL2WWSDHNGAR5Z1GUJE/",
    thumbnail:
      "https://images-eu.ssl-images-amazon.com/images/S/pv-target-images/1863426056ae862def9a69ca76e8af54cdb6b8a5a2be1100e096e59b00060847._UX1920_.png",
  },
};

let stream = null;

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    alert("Camera access denied: " + err);
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }
}

async function detectMoodUsingGemini(base64Image) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyB9PN5dBdCW2qYedLxDNJsKaugdBOmtRoY`, // **REPLACE WITH YOUR ACTUAL API KEY**
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "What is the mood of this person? Respond only with one of: Happy, Excited, Neutral, Angry, Sad.",
              },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await response.json();
  console.log("Gemini response:", data); // Debug log

  try {
    if (
      data &&
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts.length > 0 &&
      data.candidates[0].content.parts[0].text
    ) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error("Invalid response structure from Gemini API");
    }
  } catch (err) {
    throw new Error("Error processing Gemini API response: " + err.message);
  }
}

async function captureImage() {
  const scanBar = document.getElementById("scanBar");
  const result = document.getElementById("result");

  // Disable the scan button
  scanButton.disabled = true;
  scanButton.textContent = "Scanning..."; // Optionally change button text

  // Reset scanner if already active
  scanBar.classList.remove("scan-active");
  void scanBar.offsetWidth; // Force reflow to restart animation

  result.innerHTML = "Starting camera...";
  await startCamera();

  // Start scanner animation
  scanBar.classList.add("scan-active");

  // Wait for scanner to finish (3s), then take picture
  setTimeout(async () => {
    const canvas = document.getElementById("canvas");
    const video = document.getElementById("video");
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL("image/png").split(",")[1];
    result.innerHTML = "Detecting mood...";

    try {
      const mood = await detectMoodUsingGemini(base64);

      const movie = movieMap[mood] || movieMap["Neutral"];

      // Store the movie details in localStorage
      localStorage.setItem("recommendedMovie", JSON.stringify(movie));

      result.innerHTML = `
                <h3>Mood Detected: ${mood}</h3>
                <button class="view-movie-button" onclick="window.location.href='movies.html'">View Movie</button>
            `;
    } catch (err) {
      result.innerHTML = "Error detecting mood. " + err.message;
      console.error(err);
    } finally {
      stopCamera();
      // Re-enable the scan button
      scanButton.disabled = false;
      scanButton.textContent = "Scan Mood"; // Restore button text
    }
  }, 4000); // matches 3s animation time
}
