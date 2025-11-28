import { geminiService } from "./services/geminiService"

// Background script for handling API calls and storage
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "generateComments") {
    generateCommentsHandler(message.data, sendResponse)
    return true // Keep message channel open for async response
  }
  
  if (message.action === "setApiKey") {
    setApiKeyHandler(message.apiKey, sendResponse)
    return true
  }
  
  if (message.action === "getApiKey") {
    getApiKeyHandler(sendResponse)
    return true
  }
})

async function generateCommentsHandler(postData: any, sendResponse: (response: any) => void) {
  try {
    // First try to get API key from storage (user-configured)
    const result = await chrome.storage.local.get(["geminiApiKey"])
    let apiKey = result.geminiApiKey
    
    // Fallback to environment variable if no user key is configured
    if (!apiKey && process.env.API_KEY) {
      apiKey = process.env.API_KEY
      console.log("CommentCraft: Using environment API key")
    }
    
    if (!apiKey) {
      sendResponse({ error: "API key not configured. Please set up your Gemini API key in the extension options." })
      return
    }

    // Generate comments using the service
    const response = await geminiService.generateComments(postData, apiKey)
    sendResponse(response)
  } catch (error) {
    console.error("Error generating comments:", error)
    sendResponse({ 
      error: error instanceof Error ? error.message : "Failed to generate comments" 
    })
  }
}

async function setApiKeyHandler(apiKey: string, sendResponse: (response: any) => void) {
  try {
    await chrome.storage.local.set({ geminiApiKey: apiKey })
    sendResponse({ success: true })
  } catch (error) {
    console.error("Error setting API key:", error)
    sendResponse({ 
      error: error instanceof Error ? error.message : "Failed to set API key" 
    })
  }
}

async function getApiKeyHandler(sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get(["geminiApiKey"])
    sendResponse({ apiKey: result.geminiApiKey || "" })
  } catch (error) {
    console.error("Error getting API key:", error)
    sendResponse({ 
      error: error instanceof Error ? error.message : "Failed to get API key" 
    })
  }
}

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Open options page on first install
    chrome.runtime.openOptionsPage()
  }
})

// Context menu setup
chrome.contextMenus.create({
  id: "commentcraft-generate",
  title: "Generate Comment with CommentCraft",
  contexts: ["selection"],
  documentUrlPatterns: [
    "https://www.linkedin.com/*",
    "https://twitter.com/*",
    "https://x.com/*",
    "https://www.instagram.com/*",
    "https://www.facebook.com/*",
    "https://www.reddit.com/*"
  ]
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "commentcraft-generate" && tab?.id) {
    // Send message to content script to generate comment for selected text
    chrome.tabs.sendMessage(tab.id, {
      action: "generateFromSelection",
      selectedText: info.selectionText
    })
  }
})
