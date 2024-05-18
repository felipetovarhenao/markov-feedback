import "./AppHeader.scss";
import { Icon } from "@iconify/react";
import logo from "../../assets/logo.png";

export default function AppHeader() {
  return (
    <div className="AppHeader">
      <div className="header">
        <h1 className="title">
          emergent patterns
        </h1>
        <h3 className="subtitle">
          music generation through markovian feedback
        </h3>
      </div>
      <div>
        <p>
          This is a web implementation of a feedback-based Markov model for symbolic music generation.
        </p>
        <br />
        <p>To start, follow these steps:</p>
        <ol className="step-list">
          <li>
            <b>Upload</b> one or more MIDI files, and select the ones you want to use.
          </li>
          <li>
            <b>Train</b> the model.
          </li>
          <li>
            <b>Configure</b> the training and generation settings, such as order-boosting steps, prediction reinforcement, tempo, etc. To learn more about each
            setting, hover over the icon next to their name and read the description box.
          </li>
          <li>
            <b>Generate</b> MIDI.
          </li>
          <li>
            <b>Download</b> generated MIDI.
          </li>
        </ol>
      </div>
    </div>
  );
}
