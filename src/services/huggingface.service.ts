import axios from 'axios';
import logger from '../config/logger';
import { env } from '../config/env';

type TranscribeResult = { text?: string; error?: string };
type SentimentResult = { label?: string; score?: number; error?: string };

class HuggingFaceService {
  private apiKey: string | undefined = process.env.HUGGINGFACE_API_KEY || env.HUGGINGFACE_API_KEY;
  private baseUrl = 'https://api-inference.huggingface.co/models';

  private getAuthHeader() {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  /**
   * Transcribe audio buffer using a Hugging Face Whisper-compatible model.
   * Model suggestions: 'openai/whisper-small' (good trade-off) or a wav2vec2 model for PT.
   */
  async transcribeAudio(buffer: Buffer, model = 'openai/whisper-small'): Promise<TranscribeResult> {
    if (!this.apiKey) {
      return { error: 'HUGGINGFACE_API_KEY não configurada' };
    }

    try {
      const res = await axios.post(`${this.baseUrl}/${model}`, buffer, {
        headers: {
          ...this.getAuthHeader(),
          'Content-Type': 'audio/wav',
        },
        responseType: 'json',
        timeout: 120000,
      });

      // Whisper models usually respond with { text: '...' }
      if (res.data && typeof res.data === 'object') {
        return { text: (res.data as any).text || JSON.stringify(res.data) };
      }

      return { text: String(res.data) };
    } catch (error: any) {
      logger.error('HuggingFace transcribe error', { message: error.message, stack: error.stack });
      return { error: error.message };
    }
  }

  /**
   * Analyze sentiment for a given text using a multilingual sentiment model.
   * Example model: 'nlptown/bert-base-multilingual-uncased-sentiment'
   */
  async analyzeSentiment(text: string, model = 'nlptown/bert-base-multilingual-uncased-sentiment'): Promise<SentimentResult> {
    if (!this.apiKey) {
      return { error: 'HUGGINGFACE_API_KEY não configurada' };
    }

    try {
      const res = await axios.post(
        `${this.baseUrl}/${model}`,
        { inputs: text },
        { headers: { ...this.getAuthHeader(), 'Content-Type': 'application/json' }, timeout: 30000 }
      );

      // Many HF sentiment models return an array of labels with scores
      if (Array.isArray(res.data) && res.data.length > 0) {
        const best = res.data[0];
        return { label: best.label || JSON.stringify(best), score: best.score || 0 };
      }

      // Fallback: return raw data stringified
      return { label: JSON.stringify(res.data) };
    } catch (error: any) {
      logger.error('HuggingFace sentiment error', { message: error.message, stack: error.stack });
      return { error: error.message };
    }
  }
}

export default new HuggingFaceService();
