import { useEffect, useState } from "react";
import { InitAudioDeviceScheme, initAudioDevice } from "../sys/mic";
import { useTranscript } from "@/components/TranscriptView";

export const requireWsToken = async (provider: boolean = false) => {
  const res = await fetch(`/api/meet/ws_request?provider=${provider}`);
  const json = await res.json();
  return json.access_token;
};


export const createProviderWs = async (token: string, deviceId: string): Promise<[WebSocket, InitAudioDeviceScheme]> => {
  let socket: WebSocket | undefined = undefined;

  const sender = (data: Blob) => {
    socket?.send(data);
  }
  const mediaRecorder = await initAudioDevice(deviceId, sender);

  socket = new WebSocket(`${location.protocol == 'https:' ? 'wss:' : 'ws:'
    }//${location.host}/ws/meet/provide?token=${encodeURIComponent(token)}&format=float32`);

  socket.onmessage = function (event) {
    let eventData: Record<string, unknown> | undefined = undefined;
    try {
      eventData = JSON.parse(event.data);
    } catch (e) {
      eventData = undefined;
    }
    if (eventData?.['code'] === 0) {
      mediaRecorder.start();
    } else if (typeof eventData?.['partial'] === 'boolean') {
    }
  };

  socket.onerror = () => {
    mediaRecorder.stop();
  };

  socket.onclose = () => {
    mediaRecorder.stop();
  };

  return [socket, mediaRecorder];
};


export const createConsumerWs = async (token: string, handler: MeetingSocketHandler) => {
  let socket: WebSocket | undefined = undefined;

  socket = new WebSocket(`${location.protocol == 'https:' ? 'wss:' : 'ws:'
    }//${location.host}/ws/meet/consume?token=${encodeURIComponent(token)}`);

  socket.onmessage = function (event) {
    let eventData: Record<string, unknown> | undefined = undefined;
    try {
      eventData = JSON.parse(event.data);
    } catch (e) {
      eventData = undefined;
    }
    if (eventData?.['code'] === 0) {
      handler.onStart(event, eventData);
    } else if (typeof eventData?.['partial'] === 'boolean') {
      handler.onMessage(event, eventData as TranscriptionResult);
    }
  };

  socket.onerror = function (error) {
    handler.onStop(error);
  };

  socket.onclose = function (event) {
    handler.onStop(event);
  };
  return socket;
};

export const useTranscriptorWs = (token: string, deviceId: string) => {
  const [socket, setSocket] = useState<WebSocket | undefined>();
  const [recorder, setRecorder] = useState<InitAudioDeviceScheme | undefined>();
  return {
    async start() {
      if (recorder)
        return;
      const [s, r] = await createProviderWs(token, deviceId);
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
};

type TranscriptionStartEvent = {
  type: 'start',
  data: any,
};

type TranscriptionMessageEvent = {
  type: 'message',
  body: TranscriptionResult,
};

type TranscriptionCloseEvent = {
  type: 'close',
  code: number,
  reason?: string,
};

export type TranscriptionEvent = TranscriptionStartEvent | TranscriptionMessageEvent | TranscriptionCloseEvent;


export const useTranscriptionBroadcasterWs = (token: string) => {
  const [socket, setSocket] = useState<WebSocket | undefined>();
  const { onMessage, clear } = useTranscript();
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
          if (data.text === 'Thank you.' || data.text === ' Thank you.')
            return;
          console.log(data);
          window.postMessage({ type: 'message', body: data }, location.origin);
          onMessage(data);
        },
      }));
    },
    stop() {
      socket?.close();
      setSocket(undefined);
    }
  }
};

export const useTranscriptionReceiverWs = () => {

  const { onMessage, clear } = useTranscript();
  const handleMessage = (e: MessageEvent<TranscriptionEvent>) => {
    console.log(e.origin, e.data);
    if (e.origin !== location.origin)
      return;
    const data = e.data as TranscriptionEvent ?? {};
    if (data.type == 'start') {
      // do nothing
      console.log(data);
      clear();
    } else if (data.type == 'message') {
      onMessage(data.body);
    } else if (data.type == 'close') {
      // do nothing
      console.log(data);
    }
  }
  return useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    }
  }, []);
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