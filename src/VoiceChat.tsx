import React, { useState, useRef } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";

const VoiceChat = () => {
  const [transcript, setTranscript] = useState("");
  const [romanSindhi, setRomanSindhi] = useState("");
  const [audioSrc, setAudioSrc] = useState("");
  const [recording, setRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Start recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("audio", audioBlob, "input.wav");

      try {
        const res = await fetch("https://sindhi-bot-backend.onrender.com/voice-chat", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("API error");
        const data = await res.json();

        setTranscript(data.transcript);
        setRomanSindhi(data.roman_sindhi);

        // Convert base64 audio to blob URL
        const audioBase64 = data.audio_base64;
        const audioBlobResp = new Blob(
          [Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0))],
          { type: "audio/wav" }
        );
        setAudioSrc(URL.createObjectURL(audioBlobResp));
      } catch (err) {
        console.error(err);
        alert("Error calling backend API");
      }
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-lg mt-10">
      <h1 className="text-3xl font-bold text-center mb-6">🎙 Voice Sindhi AI</h1>

      <div className="flex justify-center mb-4">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`px-6 py-3 rounded-lg text-white font-semibold ${
            recording ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <p><span className="font-semibold">Transcript:</span> {transcript}</p>
        <p><span className="font-semibold">Roman Sindhi:</span> {romanSindhi}</p>
      </div>

      {audioSrc && (
        <div className="mt-6">
          <AudioPlayer src={audioSrc} autoPlay />
        </div>
      )}
    </div>
  );
};

export default VoiceChat;
