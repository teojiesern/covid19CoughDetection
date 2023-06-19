import { useState, useRef } from "react";
const mimeType = "audio/wav";
const AudioRecorder = () => {
    // const [permission, setPermission] = useState(false);
    // const mediaRecorder = useRef(null);
    // const [recordingStatus, setRecordingStatus] = useState("inactive");
    // const [stream, setStream] = useState(null);
    // const [audioChunks, setAudioChunks] = useState([]);
    // const [audio, setAudio] = useState(null);

    // const getMicrophonePermission = async () => {
    //     if ("MediaRecorder" in window) {
    //         try {
    //             const streamData = await navigator.mediaDevices.getUserMedia({
    //                 audio: true,
    //                 video: false,
    //             });
    //             setPermission(true);
    //             setStream(streamData);
    //         } catch (err) {
    //             alert(err.message);
    //         }
    //     } else {
    //         alert("The MediaRecorder API is not supported in your browser.");
    //     }
    // };

    // const startRecording = async () => {
    //     setRecordingStatus("recording");
    //     //create new Media recorder instance using the stream
    //     const media = new MediaRecorder(stream, { type: mimeType });
    //     //set the MediaRecorder instance to the mediaRecorder ref
    //     mediaRecorder.current = media;
    //     //invokes the start method to start the recording process
    //     mediaRecorder.current.start();
    //     let localAudioChunks = [];
    //     mediaRecorder.current.ondataavailable = (event) => {
    //         if (typeof event.data === "undefined") return;
    //         if (event.data.size === 0) return;
    //         localAudioChunks.push(event.data);
    //     };
    //     setAudioChunks(localAudioChunks);
    // };

    // const stopRecording = () => {
    //     setRecordingStatus("inactive");
    //     //stops the recording instance
    //     mediaRecorder.current.stop();
    //     mediaRecorder.current.onstop = () => {
    //         //creates a blob file from the audiochunks data
    //         const audioBlob = new Blob(audioChunks, { type: mimeType });
    //         sendAudioDataToBackend(audioBlob);
    //         //creates a playable URL from the blob file.
    //         const audioUrl = URL.createObjectURL(audioBlob);
    //         setAudio(audioUrl);
    //         setAudioChunks([]);
    //     };
    // };

    const [permission, setPermission] = useState(false);
    const [recordingStatus, setRecordingStatus] = useState("inactive");
    const [audioChunks, setAudioChunks] = useState([]);
    const [audio, setAudio] = useState(null);

    const getMicrophonePermission = async () => {
        try {
            const streamData = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
            });
            setPermission(true);
        } catch (err) {
            alert(err.message);
        }
    };

    const startRecording = async () => {
        setRecordingStatus("recording");
        const context = new AudioContext();
        const source = context.createMediaStreamSource(streamData);
        const processor = context.createScriptProcessor(1024, 1, 1);

        source.connect(processor);
        processor.connect(context.destination);

        let localAudioChunks = [];
        processor.onaudioprocess = (e) => {
            const audioData = e.inputBuffer.getChannelData(0);
            localAudioChunks.push(audioData);
        };
        setAudioChunks(localAudioChunks);
    };

    const stopRecording = () => {
        setRecordingStatus("inactive");
        //stops the recording instance
        processor.disconnect();
        //creates a blob file from the audiochunks data
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        sendAudioDataToBackend(audioBlob);
        //creates a playable URL from the blob file.
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudio(audioUrl);
        setAudioChunks([]);
    };

    const sendAudioDataToBackend = async (audioBlob) => {
        try {
            const response = await fetch(
                "http://127.0.0.1:8000/app/api/audio-input/",
                {
                    method: "POST",
                    body: audioBlob,
                    headers: {
                        "Content-Type": "audio/wav",
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                // Handle the response data here
                console.log("Output:", data.output);
                document.getElementById("output").innerText =
                    "Covid: " +
                    data.output[0][0].toFixed(2) * 100 +
                    "% | Healthy: " +
                    data.output[0][1].toFixed(2) * 100 +
                    "%";
            } else {
                console.log("Error:", response.status);
            }
        } catch (error) {
            console.log("Error:", error.message);
        }
    };

    return (
        <div>
            <h2>Audio Recorder</h2>
            <div className="audio-controls">
                {!permission ? (
                    <button onClick={getMicrophonePermission} type="button">
                        Get Microphone
                    </button>
                ) : null}
                {permission && recordingStatus === "inactive" ? (
                    <button onClick={startRecording} type="button">
                        Start Recording
                    </button>
                ) : null}
                {recordingStatus === "recording" ? (
                    <button onClick={stopRecording} type="button">
                        Stop Recording
                    </button>
                ) : null}
                {audio ? (
                    <div className="audio-container">
                        <audio src={audio} controls></audio>
                    </div>
                ) : null}
            </div>
        </div>
    );
};
export default AudioRecorder;
