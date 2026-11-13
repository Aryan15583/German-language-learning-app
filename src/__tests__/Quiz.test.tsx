import { fireEvent, render, screen } from "@testing-library/react-native";
import { Quiz } from "../components/Quiz";
import type { Question } from "../lib/questions";
import { speakGerman } from "../lib/speech";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../lib/speech", () => ({ speakGerman: jest.fn(), stopSpeaking: jest.fn() }));

const choice: Question = {
  kind: "choice",
  direction: "de-x",
  prompt: "Schatz",
  answer: "darling",
  options: ["darling", "bunny", "kiss", "heart"],
  german: "Schatz",
};

const typing: Question = { kind: "type", prompt: "tired", answer: "müde", german: "müde" };

beforeEach(() => jest.clearAllMocks());

describe("<Quiz />", () => {
  it("marks a correct choice and reports the score", async () => {
    const onFinish = jest.fn();
    await render(<Quiz questions={[choice]} onFinish={onFinish} />);

    expect(screen.getByText("What does this mean?")).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText("Answer: darling"));

    expect(screen.getByText("Richtig! ✓")).toBeOnTheScreen();
    expect(speakGerman).not.toHaveBeenCalled(); // the German was already on screen
    await fireEvent.press(screen.getByText("See results"));
    expect(onFinish).toHaveBeenCalledWith(1, 1);
  });

  it("shows the right answer and reads it aloud after a mistake", async () => {
    const onFinish = jest.fn();
    await render(<Quiz questions={[choice]} onFinish={onFinish} />);

    await fireEvent.press(screen.getByLabelText("Answer: bunny"));

    expect(screen.getByText("Nicht ganz — not quite")).toBeOnTheScreen();
    expect(screen.getByText(/Correct answer:/)).toHaveTextContent("Correct answer: darling");
    expect(speakGerman).toHaveBeenCalledWith("Schatz");
    await fireEvent.press(screen.getByText("See results"));
    expect(onFinish).toHaveBeenCalledWith(0, 1);
  });

  it("ignores a second tap once a question is answered", async () => {
    const onFinish = jest.fn();
    await render(<Quiz questions={[choice]} onFinish={onFinish} />);
    await fireEvent.press(screen.getByLabelText("Answer: darling"));
    await fireEvent.press(screen.getByLabelText("Answer: bunny"));
    expect(screen.getByText("Richtig! ✓")).toBeOnTheScreen();
  });

  it("accepts typed answers using the umlaut keys", async () => {
    const onFinish = jest.fn();
    await render(<Quiz questions={[typing]} onFinish={onFinish} />);

    expect(screen.getByText("Type this in German")).toBeOnTheScreen();
    const input = screen.getByLabelText("Your answer in German");
    await fireEvent.changeText(input, "m");
    await fireEvent.press(screen.getByLabelText("Insert ü"));
    await fireEvent.changeText(input, "müde");
    await fireEvent.press(screen.getByText("Check"));

    expect(screen.getByText("Richtig! ✓")).toBeOnTheScreen();
    expect(speakGerman).toHaveBeenCalledWith("müde");
  });

  it("accepts 'ue' for 'ü' when typing", async () => {
    const onFinish = jest.fn();
    await render(<Quiz questions={[typing]} onFinish={onFinish} />);
    await fireEvent.changeText(screen.getByLabelText("Your answer in German"), "muede");
    await fireEvent.press(screen.getByText("Check"));
    expect(screen.getByText("Richtig! ✓")).toBeOnTheScreen();
  });

  it("walks through several questions and counts only correct ones", async () => {
    const onFinish = jest.fn();
    await render(<Quiz questions={[choice, typing]} onFinish={onFinish} />);

    expect(screen.getByText("1 / 2", { exact: false })).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText("Answer: darling"));
    await fireEvent.press(screen.getByText("Continue"));

    expect(screen.getByText("2 / 2", { exact: false })).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText("Your answer in German"), "Hund");
    await fireEvent.press(screen.getByText("Check"));
    expect(screen.getByText("Nicht ganz — not quite")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("See results"));

    expect(onFinish).toHaveBeenCalledWith(1, 2);
  });
});
