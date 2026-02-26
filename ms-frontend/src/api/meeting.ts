import { useEffect, useState } from "react";
import { InitAudioDeviceScheme, initAudioDevice } from "../sys/mic";
import { useTranscript, TranscriptionResult, CorrectionEvent } from "@/components/TranscriptView";

export const requireWsToken = async (provider: boolean = false) => {
  const endpoint = provider ? '/api/meet/ws_request/provide' : '/api/meet/ws_request/consume';
  const res = await fetch(endpoint);
  const json = await res.json();
  return json.access_token;
};

export const createProviderWs = async (token: string, deviceId: string): Promise<[WebSocket, InitAudioDeviceScheme]> => {
  let socket: WebSocket | undefined = undefined;

  const sender = (data: Blob) => {
    socket?.send(data);
  };
  const mediaRecorder = await initAudioDevice(deviceId, sender);

  socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/meet/provide?token=${encodeURIComponent(token)}&format=float32`);

  socket.onmessage = function (event) {
    let eventData: Record<string, unknown> | undefined;
    try { eventData = JSON.parse(event.data); } catch { eventData = undefined; }
    if (eventData?.['code'] === 0) {
      mediaRecorder.start();
    }
  };

  socket.onerror = () => mediaRecorder.stop();
  socket.onclose = () => mediaRecorder.stop();

  return [socket, mediaRecorder];
};

export const createConsumerWs = async (token: string, handler: MeetingSocketHandler) => {
  const socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/meet/consume?token=${encodeURIComponent(token)}`);

  socket.onmessage = function (event) {
    let eventData: Record<string, unknown> | undefined;
    try { eventData = JSON.parse(event.data); } catch { eventData = undefined; }
    if (!eventData) return;
    if (eventData['code'] === 0) {
      handler.onStart(event, eventData);
    } else if (eventData['type'] === 'transcription') {
      handler.onMessage(event, eventData as unknown as TranscriptionResult);
    } else if (eventData['type'] === 'correction') {
      handler.onCorrection?.(event, eventData as unknown as CorrectionEvent);
    }
  };

  socket.onerror = (error) => handler.onStop(error);
  socket.onclose = (event) => handler.onStop(event);
  return socket;
};

export const useTranscriptorWs = (token: string, deviceId: string) => {
  const [socket, setSocket] = useState<WebSocket | undefined>();
  const [recorder, setRecorder] = useState<InitAudioDeviceScheme | undefined>();
  return {
    async start() {
      if (recorder) return;
      const [s, r] = await createProviderWs(token, deviceId);
      setSocket(s);
      setRecorder(r);
    },
    stop() {
      recorder?.stop();
      socket?.close();
      setSocket(undefined);
      setRecorder(undefined);
    },
  };
};

type TranscriptionStartEvent = { type: 'start'; data: unknown };
type TranscriptionMessageEvent = { type: 'message'; body: TranscriptionResult };
type TranscriptionCloseEvent = { type: 'close'; code: number; reason?: string };
export type TranscriptionEvent = TranscriptionStartEvent | TranscriptionMessageEvent | TranscriptionCloseEvent;

export const useTranscriptionBroadcasterWs = (token: string) => {
  const [socket, setSocket] = useState<WebSocket | undefined>();
  const { onMessage, onCorrection, clear } = useTranscript();
  return {
    async start() {
      setSocket(await createConsumerWs(token, {
        onStart(_, data) {
          window.postMessage({ type: 'start', data }, location.origin);
          clear();
        },
        onStop(eventIn) {
          const event = eventIn as CloseEvent;
          window.postMessage({ type: 'close', code: event.code, reason: event.reason }, location.origin);
        },
        onMessage(_, data) {
          if (data.text === 'Thank you.' || data.text === ' Thank you.') return;
          window.postMessage({ type: 'message', body: data }, location.origin);
          onMessage(data);
        },
        onCorrection(_, data) {
          window.postMessage({ type: 'correction', ...data }, location.origin);
          onCorrection(data);
        },
      }));
    },
    stop() {
      socket?.close();
      setSocket(undefined);
    },
  };
};

export const useTranscriptionReceiverWs = () => {
  const { onMessage, onCorrection, clear } = useTranscript();
  const handleMessage = (e: MessageEvent<TranscriptionEvent>) => {
    if (e.origin !== location.origin) return;
    const data = e.data ?? {};
    if (data.type === 'start') {
      clear();
    } else if (data.type === 'message') {
      onMessage(data.body);
    }
    // 'close' and 'correction' are ignored in receiver window
  };
  return useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
};

export type MeetingSocketHandler = {
  onStart(event: Event, data: Record<string, unknown>): void;
  onStop(event: Event): void;
  onMessage(event: Event, data: TranscriptionResult): void;
  onCorrection?(event: Event, data: CorrectionEvent): void;
};