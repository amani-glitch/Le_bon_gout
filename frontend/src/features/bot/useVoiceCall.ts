import { useCallback, useEffect, useRef, useState } from "react";

import { env } from "@/app/config/env";

export type CallStatus = "idle" | "connecting" | "live" | "error";

export interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
}

interface ControlFrame {
  type: string;
  role?: "user" | "assistant";
  text?: string;
  invalidate?: string[];
  handoff?: string | null;
  order_id?: string | null;
  message?: string;
}

interface VoiceCallHandlers {
  /** Called with the query keys the server says to refresh (e.g. ["cart"]). */
  onInvalidate?: (keys: string[]) => void;
  /** Called when the bot wants to route the SPA somewhere (card checkout). */
  onHandoff?: (path: string) => void;
  /** Which assistant profile to call: B2C "concierge" (default) or B2B "sales". */
  assistant?: "concierge" | "sales";
}

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

// AudioWorklet that downsamples the mic to 16 kHz mono PCM16 and posts frames.
const CAPTURE_WORKLET = `
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / ${INPUT_SAMPLE_RATE};
    this.carry = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    const out = [];
    let i = this.carry;
    for (; i < ch.length; i += this.ratio) out.push(ch[Math.floor(i)]);
    this.carry = i - ch.length;
    const pcm = new Int16Array(out.length);
    for (let j = 0; j < out.length; j++) {
      let s = Math.max(-1, Math.min(1, out[j]));
      pcm[j] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    if (pcm.length) this.port.postMessage(pcm.buffer, [pcm.buffer]);
    return true;
  }
}
registerProcessor('capture-processor', CaptureProcessor);
`;

export function useVoiceCall(handlers: VoiceCallHandlers = {}) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartRef = useRef(0);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const flushPlayback = useCallback(() => {
    for (const s of sourcesRef.current) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    sourcesRef.current = [];
    nextStartRef.current = 0;
    setIsSpeaking(false);
  }, []);

  const enqueueAudio = useCallback((buffer: ArrayBuffer) => {
    const ctx = playbackCtxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const pcm = new Int16Array(buffer);
    const f32 = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) f32[i] = pcm[i] / 0x8000;
    const audioBuffer = ctx.createBuffer(1, f32.length, OUTPUT_SAMPLE_RATE);
    audioBuffer.copyToChannel(f32, 0);
    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(ctx.destination);
    const startAt = Math.max(ctx.currentTime, nextStartRef.current);
    src.start(startAt);
    nextStartRef.current = startAt + audioBuffer.duration;
    setIsSpeaking(true);
    sourcesRef.current.push(src);
    src.onended = () => {
      sourcesRef.current = sourcesRef.current.filter((s) => s !== src);
      if (sourcesRef.current.length === 0) setIsSpeaking(false);
    };
  }, []);

  const appendTranscript = useCallback((role: "user" | "assistant", text: string) => {
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role) {
        return [...prev.slice(0, -1), { role, text: last.text + text }];
      }
      return [...prev, { role, text }];
    });
  }, []);

  const stop = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    captureCtxRef.current?.close().catch(() => {});
    captureCtxRef.current = null;
    playbackCtxRef.current?.close().catch(() => {});
    playbackCtxRef.current = null;
    sourcesRef.current = [];
    nextStartRef.current = 0;
    setIsSpeaking(false);
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setTranscript([]);
    setStatus("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const playbackCtx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
      playbackCtxRef.current = playbackCtx;
      // Browsers start an AudioContext suspended until a user gesture; the call
      // is launched from a click, so resume it now — otherwise the model's
      // speech never plays (only the text transcript shows).
      void playbackCtx.resume().catch(() => {});

      const assistant = handlersRef.current.assistant ?? "concierge";
      const url =
        assistant === "sales" ? `${env.wsUrl}/bot/voice?assistant=sales` : `${env.wsUrl}/bot/voice`;
      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onmessage = (ev) => {
        if (ev.data instanceof ArrayBuffer) {
          enqueueAudio(ev.data);
          return;
        }
        let frame: ControlFrame;
        try {
          frame = JSON.parse(ev.data as string);
        } catch {
          return;
        }
        switch (frame.type) {
          case "ready":
            setStatus("live");
            break;
          case "transcript":
            if (frame.role && frame.text) appendTranscript(frame.role, frame.text);
            break;
          case "interrupted":
            flushPlayback();
            break;
          case "state":
            if (frame.invalidate?.length) handlersRef.current.onInvalidate?.(frame.invalidate);
            if (frame.handoff) handlersRef.current.onHandoff?.(frame.handoff);
            break;
          case "error":
            setError(frame.message ?? "The call failed.");
            setStatus("error");
            break;
        }
      };

      ws.onerror = () => {
        setError("Couldn't connect to the concierge.");
        setStatus("error");
      };
      ws.onclose = () => {
        if (wsRef.current === ws) stop();
      };

      ws.onopen = async () => {
        const captureCtx = new AudioContext();
        captureCtxRef.current = captureCtx;
        const blobUrl = URL.createObjectURL(
          new Blob([CAPTURE_WORKLET], { type: "application/javascript" }),
        );
        await captureCtx.audioWorklet.addModule(blobUrl);
        URL.revokeObjectURL(blobUrl);
        const source = captureCtx.createMediaStreamSource(stream);
        const worklet = new AudioWorkletNode(captureCtx, "capture-processor");
        worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(e.data);
        };
        source.connect(worklet);
        // Keep the node alive without audibly looping the mic back.
        worklet.connect(captureCtx.destination);
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Microphone access was denied.");
      setStatus("error");
      stop();
    }
  }, [appendTranscript, enqueueAudio, flushPlayback, stop]);

  const sendText = useCallback((text: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "text", text }));
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { status, transcript, isSpeaking, error, start, stop, sendText };
}
