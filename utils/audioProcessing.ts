/**
 * Converts a base64 string to a Uint8Array.
 */
const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };
  
  /**
   * Wraps raw PCM data in a WAV file header.
   * Gemini TTS 2.5 defaults: 24kHz, 1 channel (Mono), 16-bit PCM.
   */
  export const pcmToWavBlob = (base64Pcm: string, sampleRate = 24000): Blob => {
    const audioData = base64ToUint8Array(base64Pcm);
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = audioData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
  
    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + dataSize, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, byteRate, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, blockAlign, true);
    // bits per sample
    view.setUint16(34, bitsPerSample, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, dataSize, true);
  
    // Write PCM data
    const bytes = new Uint8Array(buffer, 44);
    bytes.set(audioData);
  
    return new Blob([buffer], { type: 'audio/wav' });
  };
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };