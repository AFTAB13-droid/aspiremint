"use client";

/**
 * Sana Voice & Speech Engine
 * Powered by Web Speech API (Synthesis & Recognition)
 */

export class SanaSpeechEngine {
  private static cachedVoice: SpeechSynthesisVoice | null = null;
  private static isSpeakingNow: boolean = false;

  /**
   * Check if text-to-speech is supported in the current browser
   */
  static isSpeechSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  /**
   * Check if speech-to-text (microphone) is supported in the current browser
   */
  static isRecognitionSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    );
  }

  /**
   * Find the sweetest, most natural female voice available in the browser
   */
  private static getBestFemaleVoice(): SpeechSynthesisVoice | null {
    if (!this.isSpeechSupported()) return null;
    if (this.cachedVoice) return this.cachedVoice;

    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Preferred: Indian English or Hindi Female voices
    const indianFemale = voices.find((v) => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      return (
        (lang.includes("en-in") || lang.includes("hi-in")) &&
        (name.includes("female") || name.includes("heera") || name.includes("kaveri") || name.includes("google"))
      );
    });

    if (indianFemale) {
      this.cachedVoice = indianFemale;
      return indianFemale;
    }

    // 2. High-Quality Natural Female Voices (Google, Apple, Microsoft)
    const naturalFemale = voices.find((v) => {
      const name = v.name.toLowerCase();
      return (
        name.includes("female") ||
        name.includes("samantha") ||
        name.includes("victoria") ||
        name.includes("zira") ||
        name.includes("karen") ||
        name.includes("google uk english female") ||
        name.includes("google us english")
      );
    });

    if (naturalFemale) {
      this.cachedVoice = naturalFemale;
      return naturalFemale;
    }

    // 3. Fallback to any English voice
    const englishVoice = voices.find((v) => v.lang.startsWith("en"));
    this.cachedVoice = englishVoice || voices[0] || null;
    return this.cachedVoice;
  }

  /**
   * Clean text for seamless pronunciation
   */
  static sanitizeForSpeech(rawText: string): string {
    if (!rawText) return "";
    return rawText
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // replace markdown links [name](url) with just name
      .replace(/[*_#`~>]/g, "") // remove formatting
      .replace(/https?:\/\/\S+/g, "") // remove URLs
      .replace(/[✨🌸📦🎁👛⚡✅⏳❌🛡️👋🎉🪔💥🚀]/g, "") // remove emojis that some TTS engines pronounce literally
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Make Sana speak aloud with sweet female tone
   */
  static speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (!this.isSpeechSupported()) return;

    try {
      window.speechSynthesis.cancel(); // Stop any existing speech

      const cleanText = this.sanitizeForSpeech(text);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Select female voice
      const voice = this.getBestFemaleVoice();
      if (voice) {
        utterance.voice = voice;
      }

      // Tune voice for sweet, pleasant, warm tone
      utterance.pitch = 1.15; // Slightly higher pitch for sweet female voice
      utterance.rate = 1.0; // Natural conversational speed
      utterance.volume = 1.0;

      utterance.onstart = () => {
        this.isSpeakingNow = true;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.isSpeakingNow = false;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        this.isSpeakingNow = false;
        if (onError) onError(e);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
      this.isSpeakingNow = false;
      if (onError) onError(e);
    }
  }

  /**
   * Stop Sana's voice immediately
   */
  static stop() {
    if (this.isSpeechSupported()) {
      window.speechSynthesis.cancel();
      this.isSpeakingNow = false;
    }
  }

  /**
   * Check if speech is actively playing
   */
  static isSpeaking(): boolean {
    return this.isSpeakingNow;
  }

  /**
   * Start Speech-to-Text Microphone Dictation
   */
  static startListening(
    onResult: (transcript: string) => void,
    onError?: (error: any) => void,
    onEnd?: () => void
  ): { stop: () => void } | null {
    if (!this.isRecognitionSupported()) {
      if (onError) onError("Microphone dictation not supported in this browser");
      return null;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = "en-IN"; // Supports Indian English, Hindi & Hinglish naturally
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript || "";
        if (transcript) {
          onResult(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        if (onError) onError(event.error);
      };

      recognition.onend = () => {
        if (onEnd) onEnd();
      };

      recognition.start();

      return {
        stop: () => {
          try {
            recognition.stop();
          } catch (e) {}
        },
      };
    } catch (e) {
      if (onError) onError(e);
      return null;
    }
  }
}
