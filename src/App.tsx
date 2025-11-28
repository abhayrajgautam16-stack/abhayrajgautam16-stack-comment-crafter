import { useState, useEffect } from "react"
import { geminiService } from "./services/geminiService"

interface Comment {
  id: number
  tone: string
  text: string
  length_chars: number
  rationale: string
}

export default function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setCurrentTab(tabs[0])
    })
  }, [])

  const generateComments = async () => {
    if (!currentTab?.url) return

    setIsLoading(true)
    setError(null)

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: extractPostData
      })

      const postData = results[0]?.result
      if (!postData) {
        setError("Could not extract post data. Make sure you are on a supported platform.")
        return
      }

      const response = await geminiService.generateComments(postData)
      setComments(response.comments)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate comments")
    } finally {
      setIsLoading(false)
    }
  }

  const copyComment = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const isSupportedPlatform = () => {
    const url = currentTab?.url || ""
    return url.includes("linkedin.com") || 
           url.includes("twitter.com") || 
           url.includes("x.com") || 
           url.includes("instagram.com") || 
           url.includes("facebook.com") || 
           url.includes("reddit.com")
  }

  return (
    <div className="app">
      <header className="header">
        <h1>CommentCraft</h1>
        <p className="subtitle">AI-powered comment suggestions</p>
      </header>

      <main className="main">
        {!isSupportedPlatform() ? (
          <div className="error">
            <p>Unsupported platform</p>
            <p>Visit LinkedIn, X, Instagram, Facebook, or Reddit</p>
          </div>
        ) : (
          <>
            <button 
              onClick={generateComments}
              disabled={isLoading}
              className="generate-btn"
            >
              {isLoading ? "Generating..." : "Generate Comments"}
            </button>

            {error && <div className="error">{error}</div>}

            {comments.length > 0 && (
              <div className="comments">
                <h3>Suggested Comments</h3>
                {comments.map((comment) => (
                  <div key={comment.id} className="comment">
                    <div className="comment-header">
                      <span className="tone">{comment.tone}</span>
                      <span className="length">{comment.length_chars} chars</span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                    <p className="rationale">{comment.rationale}</p>
                    <button 
                      onClick={() => copyComment(comment.text)}
                      className="copy-btn"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function extractPostData() {
  const url = window.location.href
  let platform: "linkedin" | "x" | "instagram" | "facebook" | "reddit" = "linkedin"
  let postText = ""
  let authorHandle = ""
  let authorRole = ""

  if (url.includes("linkedin.com")) {
    platform = "linkedin"
    const postElement = document.querySelector(".feed-shared-text") || 
                       document.querySelector("[data-test-id='post-text']")
    postText = postElement?.textContent || ""
    
    const authorElement = document.querySelector(".feed-shared-actor__name") ||
                        document.querySelector("[data-test-id='actor-name']")
    authorHandle = authorElement?.textContent || ""
  } else if (url.includes("twitter.com") || url.includes("x.com")) {
    platform = "x"
    const tweetElement = document.querySelector("[data-testid='tweetText']")
    postText = tweetElement?.textContent || ""
    
    const authorElement = document.querySelector("[data-testid='User-Name'] a")
    authorHandle = authorElement?.textContent || ""
  } else if (url.includes("instagram.com")) {
    platform = "instagram"
    const captionElement = document.querySelector("article div span")
    postText = captionElement?.textContent || ""
    
    const authorElement = document.querySelector("article header a")
    authorHandle = authorElement?.textContent || ""
  } else if (url.includes("facebook.com")) {
    platform = "facebook"
    const postElement = document.querySelector("[data-testid='post_message']")
    postText = postElement?.textContent || ""
    
    const authorElement = document.querySelector("[data-testid='story-subtitle']")
    authorHandle = authorElement?.textContent || ""
  } else if (url.includes("reddit.com")) {
    platform = "reddit"
    const postElement = document.querySelector("[data-testid='post-content'] h3") ||
                       document.querySelector("h3[slot='title']")
    postText = postElement?.textContent || ""
    
    const authorElement = document.querySelector("[data-testid='post-content'] a[href*='/user/']")
    authorHandle = authorElement?.textContent || ""
  }

  return {
    platform,
    post_text: postText,
    author_handle: authorHandle,
    author_role: authorRole,
    sentiment_hint: "neutral" as "positive" | "neutral" | "negative" | "mixed",
    desired_tone: "",
    max_length_chars: 0,
    avoid_keywords: [],
    user_instruction: ""
  }
}