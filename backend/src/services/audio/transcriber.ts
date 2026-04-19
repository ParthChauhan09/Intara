/**
 * transcriber.ts
 * Transcribes audio using Groq's free Whisper API.
 * - Free tier: 7200 seconds of audio/day (~2 hours of calls)
 * - Uses Whisper Large v3 — better accuracy than local base model
 * - OpenAI-compatible API, just different base URL
 *
 * Get a free key at: console.groq.com → API Keys
 * Add to .env: GROQ_API_KEY=gsk_...
 */

import fs   from 'fs';
import path from 'path';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL        = 'whisper-large-v3-turbo'; // fast + accurate, free on Groq

export async function transcribeAudio(filePath: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY not set. Get a free key at console.groq.com and add it to .env'
    );
  }

  console.log(`[transcriber] Sending to Groq Whisper: ${path.basename(filePath)}`);

  // Build multipart form — Groq expects the same format as OpenAI
  const fileBuffer  = fs.readFileSync(filePath);
  const fileName    = path.basename(filePath);
  const mimeType    = getMimeType(fileName);

  const formData = new FormData();
  formData.append('file',  new Blob([fileBuffer], { type: mimeType }), fileName);
  formData.append('model', MODEL);
  formData.append('response_format', 'json');

  const response = await fetch(GROQ_API_URL, {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body:    formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq Whisper error ${response.status}: ${err.slice(0, 200)}`);
  }

  const result = await response.json() as { text: string };
  const transcript = result.text?.trim();

  if (!transcript) throw new Error('Groq returned empty transcript');

  console.log(`[transcriber] Transcript received (${transcript.length} chars)`);
  return transcript;
}

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const map: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.mp4': 'audio/mp4',
    '.webm': 'audio/webm',
    '.ogg': 'audio/ogg',
  };
  return map[ext] ?? 'audio/mpeg';
}
