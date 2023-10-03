import { useState } from "react";
import { InitAudioDeviceScheme, initAudioDevice } from "../sys/mic";

export const requireWsToken = async () => {
  const res = await fetch('/api/meet/ws_request');
  const json = await res.json();
  return json.access_token;
};


export const createWs = async (token: string, deviceId: string, handler: MeetingSocketHandler): Promise<[WebSocket, InitAudioDeviceScheme]> => {
  let socket: WebSocket | undefined = undefined;

  const sender = (data: Blob) => {
    socket?.send(data);
  }
  const mediaRecorder = await initAudioDevice(deviceId, sender);

  socket = new WebSocket(`${
    location.protocol == 'https:' ? 'wss:' : 'ws:'
  }//${location.host}/ws/meet/provide?token=${encodeURIComponent(token)}&format=int16`);
  
  socket.onmessage = function (event) {
    let eventData: Record<string, unknown> | undefined = undefined;
    try {
      eventData = JSON.parse(event.data);
    } catch (e) {
      eventData = undefined;
    }
    if (eventData?.['code'] === 0) {
      mediaRecorder.start();
      handler.onStart(event, eventData);
    } else if (typeof eventData?.['partial'] === 'boolean') {
      handler.onMessage(event, eventData as TranscriptionResult);
    }
  };
  
  socket.onerror = function (error) {
    mediaRecorder.stop();
    handler.onStop(error);
  };
  
  socket.onclose = function (event) {
    mediaRecorder.stop();
    handler.onStop(event);
  };
  
  
  return [socket, mediaRecorder];
};

export const useTranscriptorWs = (token: string, deviceId: string, handler: MeetingSocketHandler) => {
  const [socket, setSocket] = useState<WebSocket | undefined>();
  const [recorder, setRecorder] = useState<InitAudioDeviceScheme | undefined>();
  return {
    async start() {
      if (recorder)
        return;
      const [s, r] = await createWs(token, deviceId, handler);
      setSocket(s);
      setRecorder(r);
    },
    stop() {
      recorder?.stop();
      socket?.close();
      setSocket(undefined);
      setRecorder(undefined);
    }
  }
}

export type TranscriptionResult = {
  partial: boolean,
  start: number,
  end: number,
  text: string,
  lang: string,
};

export type MeetingSocketHandler = {
  onStart(event: Event, data: Record<string, unknown>): void;
  onStop(event: Event): void;
  onMessage(event: Event, data: TranscriptionResult): void;
};