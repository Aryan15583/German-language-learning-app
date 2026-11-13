import * as Speech from "expo-speech";

/** Read German text aloud with the device's German voice. */
export function speakGerman(text: string) {
  Speech.stop();
  Speech.speak(text, { language: "de-DE", rate: 0.9 });
}

export const stopSpeaking = () => {
  Speech.stop();
};
