import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import AudioRecorder from "./AudioRecorder";

function App() {
    return (
        <div className="container">
            <img src="../logo.png" className="logo" />
            <h1>Send us a recording of a cough sound</h1>
            <AudioRecorder />
        </div>
    );
}

export default App;
