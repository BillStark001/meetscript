import asyncio

from subprocess import CalledProcessError, run

from transcript.w_whisper import WhisperWorker

def load_audio(file: str, sr: int = 16000):
  # fmt: 0ff
  cmd = [
      "ffmpeg",
      "-nostdin",
      "-threads", "0",
      "-i", file,
      "-f", "s16le",
      "-ac", "1",
      "-acodec", "pcm_s16le",
      "-ar", str(sr),
      "-"
  ]
  # fmt: on
  try:
    out = run(cmd, capture_output=True, check=True).stdout
  except CalledProcessError as e:
    raise RuntimeError(f"Failed to load audio: {e.stderr.decode()}") from e

  return out
  # return np.frombuffer(out, np.int16).flatten().astype(np.float32) / 32768.0

async def test():
  audio = load_audio('/Users/billstark001/Desktop/micro-machines.wav')
  L = 1000
  S = []
  last_time = 0
  while len(audio) > L * 32:
    S.append((last_time, audio[:L * 32]))
    last_time += L
    audio = audio[L * 32:]
  S.append((last_time, audio[:L * 32]))
  
  worker = WhisperWorker('small')
  await worker.init_model()
  
  for i in range(len(S) // 4 + 1):
    if not S:
      break
    Sh = S[:4]
    S = S[4:] if len(S) > 4 else []
    for t, s in Sh:
      await worker.enqueue_chunk(t, s)
    res = await worker.transcribe_once()
    for result in res:
      print(result.text if not result.partial else f'> [{result.start}-{result.end}] {result.text}')
  
if __name__ == '__main__':
  asyncio.run(test())