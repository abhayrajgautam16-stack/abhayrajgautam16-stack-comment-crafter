document.addEventListener("DOMContentLoaded", function() {
  const apiKeyInput = document.getElementById("apiKey");
  const saveBtn = document.getElementById("saveBtn");
  const testBtn = document.getElementById("testBtn");
  const clearBtn = document.getElementById("clearBtn");
  const messageDiv = document.getElementById("message");
  const statusIndicator = document.getElementById("statusIndicator");
  const statusText = document.getElementById("statusText");

  // Load existing API key
  loadApiKey();

  saveBtn.addEventListener("click", saveApiKey);
  testBtn.addEventListener("click", testApiKey);
  clearBtn.addEventListener("click", clearApiKey);

  function loadApiKey() {
    chrome.storage.local.get(["geminiApiKey"], function(result) {
      if (result.geminiApiKey) {
        apiKeyInput.value = result.geminiApiKey;
        updateStatus(true);
      } else {
        updateStatus(false);
      }
    });
  }

  function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showMessage("Please enter an API key", "error");
      return;
    }

    if (!apiKey.startsWith("AIzaSy") || apiKey.length < 20) {
      showMessage("Invalid API key format. Gemini API keys start with 'AIzaSy'", "error");
      return;
    }

    chrome.storage.local.set({ geminiApiKey: apiKey }, function() {
      showMessage("API key saved successfully!", "success");
      updateStatus(true);
    });
  }

  function testApiKey() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showMessage("Please enter an API key first", "error");
      return;
    }

    showMessage("Testing API key...", "info");
    testBtn.disabled = true;
    testBtn.textContent = "Testing...";

    // Test the API key with a simple request
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Respond with 'OK' if you can read this."
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10,
        }
      })
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    })
    .then(data => {
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        showMessage("API key is working correctly!", "success");
        updateStatus(true);
      } else {
        showMessage("API key test failed: Invalid response", "error");
      }
    })
    .catch(error => {
      showMessage(`API key test failed: ${error.message}`, "error");
      updateStatus(false);
    })
    .finally(() => {
      testBtn.disabled = false;
      testBtn.textContent = "Test Connection";
    });
  }

  function clearApiKey() {
    if (confirm("Are you sure you want to clear the API key?")) {
      chrome.storage.local.remove(["geminiApiKey"], function() {
        apiKeyInput.value = "";
        showMessage("API key cleared", "success");
        updateStatus(false);
      });
    }
  }

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    
    // Clear message after 5 seconds
    setTimeout(() => {
      messageDiv.textContent = "";
      messageDiv.className = "";
    }, 5000);
  }

  function updateStatus(hasKey) {
    if (hasKey) {
      statusIndicator.className = "status-indicator status-connected";
      statusText.textContent = "Connected";
    } else {
      statusIndicator.className = "status-indicator status-disconnected";
      statusText.textContent = "Not configured";
    }
  }
});