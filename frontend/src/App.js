import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"

function App() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generateContent = async () => {
    if (!prompt) {
      alert("Please enter a prompt!");
      return;
    }

    setLoading(true);
    setOutput("");

    try {
      const response = await axios.get(`http://localhost:3000/api/get-content/${prompt}`);

      if (response.data.success) {
        setOutput(response.data.data);
      } else {
        setOutput(`Error: ${response.data.message}`);
      }
    } catch (error) {
      alert("Server error. Try again later.", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="HoleBody">
      <h1>AI Content Generator</h1>
      <div className="output">{output}</div>
      <input
        className="form-control"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
      />

      <button onClick={generateContent} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>

      
      </div>
    </div>
  );
}

export default App;
