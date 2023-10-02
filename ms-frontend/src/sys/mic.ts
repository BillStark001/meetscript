export type AudioDeviceScheme = {
  value: string;
  text: string;
};

export const getAudioDevices = async (): Promise<AudioDeviceScheme[]> => {
  await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000 } });
  const devs = await navigator.mediaDevices.enumerateDevices();
  console.log(devs);
  return devs.filter(x => x.kind == 'audioinput').map(dev => {
    return { value: dev.deviceId, text: dev.label || `UNKNOWN ${dev.deviceId}` };
  });
};

export const initAudioDevice = async (deviceId: string, onData: (data: Blob) => void | undefined) => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId,
      sampleRate: 16000,
      channelCount: 1,
    }
  });

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'audio/webm;rate=16000',
  });


  const audioCtx = new AudioContext({
    sampleRate: 16000,
  });

  const _dav = async (ev: BlobEvent) => {
    if (ev.data.size == 0)
      return;

    const currentUTCMilliseconds = Date.now();
    const uint8Array = new Uint8Array(8);
    const dataView = new DataView(uint8Array.buffer);
    dataView.setBigUint64(0, BigInt(currentUTCMilliseconds), false);
    const audioBuffer = await audioCtx.decodeAudioData(await ev.data.arrayBuffer());

    onData(new Blob([uint8Array, audioBuffer.getChannelData(0)]));
  };

  mediaRecorder.ondataavailable = (ev) => _dav(ev);

  return mediaRecorder;

};