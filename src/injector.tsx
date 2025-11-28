// import React from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./styles.css"

// This component can be injected into the page for inline UI
export function injectCommentCraftUI(targetElement: HTMLElement) {
  const container = document.createElement("div")
  container.id = "commentcraft-injected-ui"
  container.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 10000;
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-top: 4px;
  `
  
  targetElement.style.position = "relative"
  targetElement.appendChild(container)
  
  const root = createRoot(container)
  root.render(<App />)
  
  return () => {
    root.unmount()
    container.remove()
  }
}

// Cleanup function to remove injected UI
export function cleanupCommentCraftUI() {
  const element = document.getElementById("commentcraft-injected-ui")
  if (element) {
    element.remove()
  }
}
