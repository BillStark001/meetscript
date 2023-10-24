import asyncio
import os
import time
import torch

from subprocess import CalledProcessError, run

from transcript.w_whisper import WhisperWorker

from whisper.audio import load_audio

async def test():
  audio = load_audio(os.path.expanduser('~/OSR_us_000_0010_8k.wav'))
  L = 1000
  S = []
  last_time = 0
  while audio.size > L * 16:
    S.append((last_time, audio[:L * 16]))
    last_time += L
    audio = audio[L * 16:]
  if audio.size:
    S.append((last_time, audio[:L * 16]))
  
  worker = WhisperWorker('small')
  await worker.init_model()
  
  print(f'CUDA is available: {torch.cuda.is_available()}')
  
  tstart_all = time.time()
  for i in range(len(S) // 4 + 1): 
    if not S:
      break
    Sh = S[:4]
    S = S[4:] if len(S) > 4 else []
    for timestamp, sample in Sh:
      await worker.enqueue_chunk(timestamp, sample)
    tstart = time.time()
    res = await worker.transcribe_once()
    tend = time.time() - tstart
    for result in res:
      print(f'{" " if not result.partial else ">"} [{tend:.3f}s] [{result.start}-{result.end}]', result.text)
  tend_all = time.time() - tstart_all
  print(f'Elapsed time: {tend_all:.3f}s')
  
if __name__ == '__main__':
  asyncio.run(test())