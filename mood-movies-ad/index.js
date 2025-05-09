const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const result = document.getElementById("result");
const scanButton = document.querySelector(".scan-button"); // Get the scan button

const movieMap = {
  Happy: {
    title: "Welcome",
    poster:
      "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcR4aqGT0d_m20aT9GwiZtUqSVCCGWpGH9NFWmWUirmYr7gB6eIRn-ZhO1j7hbMCMvwosbbydQ",
  },
  Excited: {
    title: "Inception",
    poster:
      "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQovCe0H45fWwAtV31ajOdXRPTxSsMQgPIQ3lcZX_mAW0jXV3kH",
  },
  Neutral: {
    title: "Forrest Gump",
    poster:
      "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcScf5su68o8oOp0D89ESlb3_8RW2ge3ZWIPFv_OBVSObb680o3H",
  },
  Angry: {
    title: "Gladiator",
    poster:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFabKsWv9ru_kpMttjPf2493GGI7L3LpW3XjgPTE9FyHdNDIwV",
  },
  Sad: {
    title: "Inside Out",
    poster:
      "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcR7IE8YJaJlh3CW-KYU745oE2WzjyvRgKwNyAwe73di_U0uuD5Q",
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
