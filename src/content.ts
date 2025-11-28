interface CommentInput {
  platform: "linkedin" | "x" | "instagram" | "facebook" | "reddit"
  post_text: string
  author_handle: string
  author_role: string
  sentiment_hint: "positive" | "neutral" | "negative" | "mixed"
  desired_tone: string
  max_length_chars: number
  avoid_keywords: string[]
  user_instruction: string
}

const PLATFORM_SELECTORS = {
  linkedin: {
    postText: [".feed-shared-text", "[data-test-id='post-text']", ".feed-shared-update-v2__description", ".feed-shared-text__text", ".feed-shared-mini-update-v2__commentary", ".break-words"],
    authorName: [".feed-shared-actor__name", "[data-test-id='actor-name']", ".feed-shared-actor__title", ".hoverable-link-text"],
    commentBox: ["[data-test-id='comments-comment-box-textarea']", ".ql-editor", ".comments-comment-textarea", ".feed-shared-text-input__container", ".mentions-text-editor__contenteditable"]
  },
  x: {
    postText: ["[data-testid='tweetText']", ".css-1dbjc4n.r-37qu5q.r-1qd0xha.r-a023e6.r-rjixqe.r-16dba41"],
    authorName: ["[data-testid='User-Name'] a", ".css-4rbku5.css-18t94o4.css-1dbjc4n.r-1loqt21.r-1wbh5a2.r-dnmrzs"],
    commentBox: ["[data-testid='tweetTextarea_0']", ".public-DraftEditorPlaceholder-root", ".css-1dbjc4n.r-1aw1wy-6.r-18u37iz"]
  },
  instagram: {
    postText: ["article div span", ".css-1q2y3gz", ".C4VMK"],
    authorName: ["article header a", ".css-1q2y3gz", ".C7VMK"],
    commentBox: ["textarea[aria-label='Add a comment…']", ".XQXOT", ".Ypffh"]
  },
  facebook: {
    postText: ["[data-testid='post_message']", ".x1lliihq.x6ikm8r.x10wlt62.x1n2onr6"],
    authorName: ["[data-testid='story-subtitle']", ".x1lliihq.x6ikm8r.x10wlt62"],
    commentBox: ["[data-testid='comment-Composer-Input']", ".x1lliihq.x6ikm8r.x10wlt62.x1n2onr6.xlyipyv"]
  },
  reddit: {
    postText: ["[data-testid='post-content'] h3", "h3[slot='title']", ".p13z-unf"],
    authorName: ["[data-testid='post-content'] a[href*='/user/']", ".p13z-unf"],
    commentBox: ["textarea[name='comment']", ".public-DraftEditorPlaceholder-root", ".comment-textarea"]
  }
}

class CommentCraftContent {
  private currentPlatform: keyof typeof PLATFORM_SELECTORS | null = null
  private floatingPanel: HTMLElement | null = null

  constructor() {
    this.init()
  }

  private init() {
    this.detectPlatform()
    if (this.currentPlatform) {
      this.observeCommentBoxes()
      this.setupKeyboardShortcuts()
    }
  }

  private detectPlatform() {
    const url = window.location.href
    
    if (url.includes("linkedin.com")) this.currentPlatform = "linkedin"
    else if (url.includes("twitter.com") || url.includes("x.com")) this.currentPlatform = "x"
    else if (url.includes("instagram.com")) this.currentPlatform = "instagram"
    else if (url.includes("facebook.com")) this.currentPlatform = "facebook"
    else if (url.includes("reddit.com")) this.currentPlatform = "reddit"
  }

  private observeCommentBoxes() {
    if (!this.currentPlatform) return

    const selectors = PLATFORM_SELECTORS[this.currentPlatform].commentBox
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            if (this.isCommentBox(element)) {
              this.attachCommentCraftButton(element)
            }
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Check for existing comment boxes
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        this.attachCommentCraftButton(element as HTMLElement)
      })
    })
  }

  private isCommentBox(element: Element): boolean {
    if (!this.currentPlatform) return false
    
    const selectors = PLATFORM_SELECTORS[this.currentPlatform].commentBox
    return selectors.some(selector => element.matches(selector))
  }

  private attachCommentCraftButton(commentBox: HTMLElement) {
    if (commentBox.hasAttribute("data-commentcraft-attached")) return

    commentBox.setAttribute("data-commentcraft-attached", "true")

    const button = document.createElement("button")
    button.textContent = "🤖 CommentCraft"
    button.style.cssText = `
      background: #0f62a6;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      margin: 4px;
      position: relative;
      z-index: 1000;
    `

    button.addEventListener("click", () => {
      this.showFloatingPanel(commentBox)
    })

    // Insert button near the comment box
    const parent = commentBox.parentElement
    if (parent) {
      parent.insertBefore(button, commentBox)
    } else {
      commentBox.insertBefore(button, commentBox.firstChild)
    }
  }

  private showFloatingPanel(commentBox: HTMLElement) {
    this.hideFloatingPanel()

    const panel = document.createElement("div")
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      max-height: 500px;
      background: white;
      border: 1px solid #e1e5e9;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      overflow: hidden;
    `

    const header = document.createElement("div")
    header.style.cssText = `
      background: #0f62a6;
      color: white;
      padding: 12px 16px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `
    header.innerHTML = `
      <span>CommentCraft Suggestions</span>
      <button style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>
    `

    const content = document.createElement("div")
    content.style.cssText = `
      padding: 16px;
      max-height: 400px;
      overflow-y: auto;
    `
    content.innerHTML = "<p>Loading suggestions...</p>"

    panel.appendChild(header)
    panel.appendChild(content)
    document.body.appendChild(panel)

    this.floatingPanel = panel

    // Close handlers
    header.querySelector("button")?.addEventListener("click", () => {
      this.hideFloatingPanel()
    })

    panel.addEventListener("click", (e) => {
      if (e.target === panel) {
        this.hideFloatingPanel()
      }
    })

    // Generate comments
    this.generateAndDisplayComments(content, commentBox)
  }

  private hideFloatingPanel() {
    if (this.floatingPanel) {
      this.floatingPanel.remove()
      this.floatingPanel = null
    }
  }

  private async generateAndDisplayComments(container: HTMLElement, commentBox: HTMLElement) {
    try {
      console.log("CommentCraft: Starting comment generation...")
      
      const postData = this.extractPostData()
      console.log("CommentCraft: Extracted post data:", postData)
      
      if (!postData.post_text) {
        console.error("CommentCraft: No post text found")
        container.innerHTML = "<p>Could not extract post content. Please try selecting the post text manually.</p>"
        return
      }

      console.log("CommentCraft: Sending message to background script...")
      
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        action: "generateComments",
        data: postData
      })

      console.log("CommentCraft: Received response from background:", response)

      if (response.error) {
        console.error("CommentCraft: Background script returned error:", response.error)
        container.innerHTML = `<p style="color: red;">Error: ${response.error}</p>`
        return
      }

      if (!response.comments || !Array.isArray(response.comments)) {
        console.error("CommentCraft: Invalid response format:", response)
        container.innerHTML = `<p style="color: red;">Invalid response from server. Please check your API key configuration.</p>`
        return
      }

      console.log("CommentCraft: Displaying comments...")
      this.displayComments(container, response.comments, commentBox)
    } catch (error) {
      console.error("CommentCraft: Failed to generate comments:", error)
      container.innerHTML = `<p style="color: red;">Failed to generate comments: ${error instanceof Error ? error.message : "Unknown error"}</p>`
    }
  }

  private displayComments(container: HTMLElement, comments: any[], commentBox: HTMLElement) {
    container.innerHTML = ""

    comments.forEach(comment => {
      const commentDiv = document.createElement("div")
      commentDiv.style.cssText = `
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 12px;
      `

      commentDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">${comment.tone}</span>
          <span style="font-size: 11px; color: #6b7280;">${comment.length_chars} chars</span>
        </div>
        <p style="font-size: 13px; color: #1f2937; margin-bottom: 6px; line-height: 1.4;">${comment.text}</p>
        <p style="font-size: 11px; color: #6b7280; margin-bottom: 8px; font-style: italic;">${comment.rationale}</p>
        <button style="background: #10b981; color: white; border: none; border-radius: 4px; padding: 6px 12px; font-size: 11px; cursor: pointer;">Use This Comment</button>
      `

      const useButton = commentDiv.querySelector("button")
      useButton?.addEventListener("click", () => {
        this.insertComment(commentBox, comment.text)
        this.hideFloatingPanel()
      })

      container.appendChild(commentDiv)
    })
  }

  private insertComment(commentBox: HTMLElement, text: string) {
    // Focus the comment box
    commentBox.focus()

    // Try different methods to insert text based on platform
    if (this.currentPlatform === "linkedin" || this.currentPlatform === "facebook") {
      // For contenteditable divs
      commentBox.innerText = text
      const event = new Event("input", { bubbles: true })
      commentBox.dispatchEvent(event)
    } else if (this.currentPlatform === "x" || this.currentPlatform === "instagram") {
      // For textarea elements
      const textarea = commentBox as HTMLTextAreaElement
      textarea.value = text
      const event = new Event("input", { bubbles: true })
      textarea.dispatchEvent(event)
    } else {
      // Fallback method
      commentBox.focus()
      document.execCommand("insertText", false, text)
    }
  }

  private extractPostData(): CommentInput {
    if (!this.currentPlatform) {
      console.error("CommentCraft: No platform detected")
      return this.getDefaultInput()
    }

    console.log("CommentCraft: Extracting data for platform:", this.currentPlatform)

    const selectors = PLATFORM_SELECTORS[this.currentPlatform]
    let postText = ""
    let authorHandle = ""

    // Extract post text
    for (const selector of selectors.postText) {
      const element = document.querySelector(selector)
      if (element?.textContent) {
        postText = element.textContent.trim()
        console.log(`CommentCraft: Found post text with selector "${selector}":`, postText.substring(0, 100) + "...")
        break
      }
    }

    // Extract author name
    for (const selector of selectors.authorName) {
      const element = document.querySelector(selector)
      if (element?.textContent) {
        authorHandle = element.textContent.trim()
        console.log(`CommentCraft: Found author with selector "${selector}":`, authorHandle)
        break
      }
    }

    if (!postText) {
      console.error("CommentCraft: Could not extract post text with any selector:", selectors.postText)
    }

    return {
      platform: this.currentPlatform,
      post_text: postText,
      author_handle: authorHandle,
      author_role: "",
      sentiment_hint: "neutral",
      desired_tone: "",
      max_length_chars: 0,
      avoid_keywords: [],
      user_instruction: ""
    }
  }

  private getDefaultInput(): CommentInput {
    return {
      platform: "linkedin",
      post_text: "",
      author_handle: "",
      author_role: "",
      sentiment_hint: "neutral",
      desired_tone: "",
      max_length_chars: 0,
      avoid_keywords: [],
      user_instruction: ""
    }
  }

  private setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + Shift + C to toggle CommentCraft
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault()
        // Find first comment box and show panel
        const commentBox = document.querySelector("[data-commentcraft-attached]")
        if (commentBox) {
          this.showFloatingPanel(commentBox as HTMLElement)
        }
      }
    })
  }
}

// Initialize the content script
new CommentCraftContent()