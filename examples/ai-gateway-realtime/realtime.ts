import { gateway } from '@ai-sdk/gateway';
import { config } from 'dotenv';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import WebSocket from 'ws';

config({ path: resolve(process.cwd(), '.env.local') });

const modelId = 'xai/grok-voice-think-fast-1.0';
const sampleRateHz = 24_000;
const outputPath = resolve(process.cwd(), 'realtime-output.wav');

function pcm16ToWav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = pcm.length;
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      'AI_GATEWAY_API_KEY is missing. Add it to .env.local before running.',
    );
  }

  const { token, url } = await gateway.experimental_realtime.getToken({
    model: modelId,
  });

  const model = gateway.experimental_realtime(modelId);
  const wsConfig = model.getWebSocketConfig({ token, url });
  const ws = new WebSocket(wsConfig.url, wsConfig.protocols);

  const audioChunks: Buffer[] = [];

  const send = async (
    event: Parameters<typeof model.serializeClientEvent>[0],
  ) => {
    ws.send(JSON.stringify(await model.serializeClientEvent(event)));
  };

  ws.on('open', async () => {
    console.log(`Connected to ${modelId}`);
    await send({
      type: 'conversation-item-create',
      item: {
        type: 'text-message',
        role: 'user',
        text: 'Say hello in one short sentence.',
      },
    });
    await send({ type: 'response-create' });
  });

  ws.on('message', (data) => {
    const parsed = model.parseServerEvent(JSON.parse(data.toString()));
    const events = Array.isArray(parsed) ? parsed : [parsed];

    for (const event of events) {
      switch (event.type) {
        case 'audio-transcript-delta': {
          process.stdout.write(event.delta);
          break;
        }
        case 'audio-delta': {
          audioChunks.push(Buffer.from(event.delta, 'base64'));
          break;
        }
        case 'response-done': {
          process.stdout.write('\n');
          const pcm = Buffer.concat(audioChunks);
          if (pcm.length === 0) {
            console.warn('No audio-delta chunks received; skipping WAV write.');
          } else {
            const wav = pcm16ToWav(pcm, sampleRateHz);
            writeFileSync(outputPath, wav);
            console.log(
              `Wrote ${wav.length} bytes to ${outputPath} (${pcm.length} PCM16 bytes @ ${sampleRateHz} Hz)`,
            );
          }
          ws.close();
          break;
        }
        case 'error': {
          console.error('Realtime error:', event.message, event.code ?? '');
          ws.close();
          break;
        }
        default: {
          break;
        }
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });

  ws.on('close', (code, reason) => {
    console.log(
      `WebSocket closed (${code})${reason?.length ? `: ${reason}` : ''}`,
    );
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
