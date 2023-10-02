// Reference: https://github.com/yuelinghunyu/blog-demo/blob/master/audio/js/record.js


export type AudioConfig = {
  channelCount: number;
  sampleBits: number;
  sampleRate: number;
  bufferSize: number;
};

export const DefaultConfig: AudioConfig = Object.freeze({
  sampleBits: 16,
  sampleRate: 16000,
  bufferSize: 4096,
  channelCount: 1,
});

const reshapeWavData = (sampleBits: number, offset: number, iBytes: Float32Array, oData: DataView) => {
  if (sampleBits === 8) {
    for (let i = 0; i < iBytes.length; i++, offset++) {
      let s = Math.max(-1, Math.min(1, iBytes[i]))
      let val = s < 0 ? s * 0x8000 : s * 0x7FFF
      val = Math.floor(255 / (65535 / (val + 32768)))
      oData.setInt8(offset, val);
    }
  } else {
    for (let i = 0; i < iBytes.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, iBytes[i]))
      oData.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }
  return oData;
};

export const convertWav = (bytes: Float32Array, config: Readonly<AudioConfig>) => {
  const { sampleBits, sampleRate, channelCount } = config;

  const dataLength = bytes.length * (sampleBits / 8)
  const buffer = new ArrayBuffer(44 + dataLength)

  let data = new DataView(buffer);
  let offset = 0;

  const writeString = (str: string) => {
    for (var i = 0; i < str.length; i++) {
      data.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  // Resource Exchange File Identifier
  writeString('RIFF');
  offset += 4;
  // Total number of bytes from the next address to the end of the file, i.e., file size - 8
  data.setUint32(offset, 36 + dataLength, true);
  offset += 4;
  // WAV file identifier
  writeString('WAVE');
  offset += 4;
  // Waveform Format Identifier
  writeString('fmt ');
  offset += 4;
  // Filter bytes, usually 0x10 = 16
  data.setUint32(offset, 16, true);
  offset += 4
  // Format category (PCM format sample data)
  data.setUint16(offset, 1, true);
  offset += 2
  // Number of channels
  data.setUint16(offset, channelCount, true);
  offset += 2
  // Sample rate, number of samples per second, representing playback speed for each channel
  data.setUint32(offset, sampleRate, true);
  offset += 4
  // Data transmission rate (average number of bytes per second) Single channel × Data bits per second × Sample data bits / 8
  data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true);
  offset += 4
  // Quick data adjustment number, number of bytes per sample, single channel × Number of data bits per sample / 8
  data.setUint16(offset, channelCount * (sampleBits / 8), true);
  offset += 2
  // Number of data bits per sample
  data.setUint16(offset, sampleBits, true);
  offset += 2
  // Data Identifier
  writeString('data');
  offset += 4
  // Total number of sampled data, i.e., data total size - 44
  data.setUint32(offset, dataLength, true);
  offset += 4;

  // Write sampled data
  data = reshapeWavData(sampleBits, offset, bytes, data);
  return data;
};


/**
 * Convert float wave data to 16bit PCM.
 * @param bytes 
 */
export function convertPcm(bytes: Float32Array): DataView;
export function convertPcm(bytes: Float32Array, withMaxRange: false): DataView;
export function convertPcm(bytes: Float32Array, withMaxRange: true): { data: DataView, maxRange: number };
export function convertPcm(bytes: Float32Array, withMaxRange?: boolean) {
  let offset = 0;
  const dataLength = bytes.length * 2;
  const buffer = new ArrayBuffer(dataLength);
  const data = new DataView(buffer); // 16 bits
  let maxRange = 0;
  for (var i = 0; i < bytes.length; i++, offset += 2) {
    var s = Math.max(-1, Math.min(1, bytes[i]));
    maxRange = Math.max(maxRange, Math.abs(s));
    data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return withMaxRange ? { data, maxRange } : data;
}

/**
 * Continuous audio data store.
 */
export class AudioData {

  size: number;
  buffer: Float32Array[];
  inputSampleRate: number;
  inputSampleBits: number;
  outputSampleRate: number;
  outputSampleBits: number;

  private config: AudioConfig;
  private context: AudioContext;

  /**
   * 
   * @param context 
   * @param config 
   */
  constructor(context: AudioContext, config: AudioConfig) {
    this.size = 0;
    this.buffer = [];
    this.inputSampleRate = context.sampleRate;
    this.inputSampleBits = 16;
    this.outputSampleRate = config.sampleRate;
    this.outputSampleBits = config.sampleBits;
    this.config = Object.freeze({ ...config });
    this.context = context;
  }

  input(data: Float32Array) {
    this.buffer.push(new Float32Array(data));
    this.size += data.length;
  }

  getRawData() {
    // merge
    let data = new Float32Array(this.size);
    let offset = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      data.set(this.buffer[i], offset)
      offset += this.buffer[i].length
    }
    // zip
    const getRawDataion = Math.floor(this.inputSampleRate / this.outputSampleRate)
    const length = data.length / getRawDataion;
    const result = new Float32Array(length)
    let index = 0, j = 0;
    while (index < length) {
      result[index] = data[j];
      j += getRawDataion;
      index++
    };
    return result;
  }

  convertWav() {
    const sampleRate = Math.min(this.inputSampleRate, this.outputSampleRate)
    const sampleBits = Math.min(this.inputSampleBits, this.outputSampleBits)
    const bytes = this.getRawData();
    return convertWav(bytes, { ...this.config, sampleBits, sampleRate });
  }

  getFullWavData() {
    const data = this.convertWav();
    return new Blob([data], { type: 'audio/wav' });
  }

  closeContext() {
    this.context.close();
  }

  getWavBuffer() {
    const data = this.convertWav();
    return data.buffer;
  }

  getPcmBuffer() {
    let bytes = this.getRawData(),
      offset = 0,
      sampleBits = this.outputSampleBits,
      dataLength = bytes.length * (sampleBits / 8),
      buffer = new ArrayBuffer(dataLength),
      data = new DataView(buffer);
    for (var i = 0; i < bytes.length; i++, offset += 2) {
      var s = Math.max(-1, Math.min(1, bytes[i]));
      data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([data]);
  }
}