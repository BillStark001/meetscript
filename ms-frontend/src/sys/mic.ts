export type AudioDeviceScheme = {
  value: string;
  text: string;
};

export type InitAudioDeviceScheme = {
  start: () => void;
  stop: () => void;
  context: AudioContext;
  input: MediaStreamAudioSourceNode;
  recorder: ScriptProcessorNode;
};

export const getAudioDevices = async (): Promise<AudioDeviceScheme[]> => {
  await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000 } });
  const devs = await navigator.mediaDevices.enumerateDevices();
  return devs.filter(x => x.kind == 'audioinput').map(dev => {
    return { value: dev.deviceId, text: dev.label || `UNKNOWN ${dev.deviceId}` };
  });
};


export const initAudioDevice = async (deviceId: string, onData: (data: Blob) => void | undefined): Promise<InitAudioDeviceScheme> => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId,
    }
  });

  const context = new AudioContext({
    sampleRate: 16000,
  });
  const input = context.createMediaStreamSource(stream);
  const recorder = context.createScriptProcessor(8192, 1, 1);

  let startTime = 0;
  const start = () => {
    startTime = Date.now();
    input.connect(recorder);
    recorder.connect(context.destination);
  };

  const stop = () => {
    recorder.disconnect();
  };

  recorder.onaudioprocess = (e) => {
    let maxRange = 0;
    const data = e.inputBuffer.getChannelData(0);
    for (var i = 1; i < data.length; i++) {
      if (Math.abs(data[i]) > maxRange) {
        maxRange = data[i];
      }
    }

    // append current timestamp
    const uint8Array = new Uint8Array(8);
    const dataView = new DataView(uint8Array.buffer);
    dataView.setBigUint64(0, BigInt(startTime + e.playbackTime * 1000), false);

    if (maxRange > 0.003) {
      onData(new Blob([dataView, data]));
    }
  };

  return {
    start,
    stop,
    context,
    input,
    recorder,
  };

};