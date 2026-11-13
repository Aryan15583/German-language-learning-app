import { useColorScheme } from "react-native";

const light = {
  bg: "#FFF7F5",
  surface: "#FFFFFF",
  text: "#2B1D22",
  muted: "#7A6870",
  accent: "#E2557A",
  accentSoft: "#FDE3EA",
  a: "#E2557A",
  aSoft: "#FBE1E8",
  b: "#3F74CC",
  bSoft: "#E1EAFA",
  good: "#2F9E6B",
  goodSoft: "#DDF3E8",
  bad: "#D64545",
  badSoft: "#FBE2E2",
  border: "#F0DDE2",
  onAccent: "#FFFFFF",
};

const dark: typeof light = {
  bg: "#1C1417",
  surface: "#2A1F23",
  text: "#F6EEF0",
  muted: "#B8A6AD",
  accent: "#FF7A9C",
  accentSoft: "#46262F",
  a: "#FF7A9C",
  aSoft: "#4A2731",
  b: "#7AA6FF",
  bSoft: "#24314A",
  good: "#4CC38A",
  goodSoft: "#1D3A2D",
  bad: "#FF6B6B",
  badSoft: "#4A2222",
  border: "#3D2D33",
  onAccent: "#1C1417",
};

export type Palette = typeof light;

export function usePalette(): Palette {
  return useColorScheme() === "dark" ? dark : light;
}

export const partnerColor = (c: Palette, i: 0 | 1) => (i ? c.b : c.a);
export const partnerSoft = (c: Palette, i: 0 | 1) => (i ? c.bSoft : c.aSoft);
