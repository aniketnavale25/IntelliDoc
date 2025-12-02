import React from "react";
import UploadPDF from "./components/UploadPDF";
import Chat from "./components/Chat";
import "./App.css";

function App() {
  return (
    <div className="app">
      <div className="app-card">
        <div className="app-container">
          <header className="app-header">
            <div className="app-title">
              <h1>Research Assistant AI</h1>
              <p className="app-subtitle">
                Upload a research paper and ask questions using RAG + Agentic AI
              </p>
            </div>
          </header>

          <main className="app-main">
            <UploadPDF />
            <Chat />
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
