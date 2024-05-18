import "./Improviser.scss";

import { useContext, useEffect, useState } from "react";
import { ImproviserContext } from "./ImproviserProvider";
import { FileUploaderContext } from "../FileUploader/FileUploaderProvider";

import classNames from "classnames";
import Slider from "../Slider/Slider";

import HelpBox from "../HelpBox/HelpBox";
import ButtonPanel from "../ButtonPanel/ButtonPanel";

import { Midi } from "@tonejs/midi";

function setStorageValue(setValue, key) {
  return (value) => {
    setValue(value);
    localStorage.setItem(key, JSON.stringify(value));
  };
}

function getStorageValue(key) {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : undefined;
}

/* cache for all midi files loaded in current session */
const FILE_CACHE = {};

function filesToMidi(files) {
  return files.map(async (file) => {
    if (FILE_CACHE[file.name]) {
      return FILE_CACHE[file.name];
    } else {
      const url = URL.createObjectURL(file);
      const midi = await Midi.fromUrl(url);
      FILE_CACHE[file.name] = midi;
      return midi;
    }
  });
}

export default function Improviser() {
  const { improviser } = useContext(ImproviserContext);
  const { files } = useContext(FileUploaderContext);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [downloadURL, setDownloadURL] = useState(false);
  const [isTrained, setIsTrained] = useState(false);
  const [status, setStatus] = useState(false);

  /* UI control parameters */
  const [numNotes, setNumNotes] = useState(getStorageValue("numNotes") || 500);
  const [tempo, setTempo] = useState(getStorageValue("tempo") || 90);
  const [markovOrder, setMarkovOrder] = useState(getStorageValue("markovOrder") || 5);
  const [initialOrder, setInitialOrder] = useState(getStorageValue("initialOrder") || 1);
  const [reinforcementFactor, setReinforcementFactor] = useState(getStorageValue("reinforcementFactor") || 180);
  const [maxReinforcement, setMaxReinforcement] = useState(getStorageValue("maxReinforcement") || 66);

  async function train() {
    /* convert String to Number */
    setIsTrained(false);
    setStatus(`training improviser...`);
    const midiFiles = filesToMidi(selectedFiles);

    const predictability = Number(initialOrder);
    if (improviser.getPredictability() !== predictability) {
      improviser.setPredictability(predictability);
    }

    await improviser.trainBase(midiFiles);

    setStatus("done training!");
    setIsTrained(true);
    setDownloadURL(false);
  }

  async function generate() {
    setDownloadURL(false);
    setStatus("generating MIDI...");

    const memory = Number(markovOrder) + 1;
    if (improviser.getMemory() !== memory) {
      improviser.setMemory(memory, false);
    }
    const bufferArray = await improviser.generateRecursively(
      Number(numNotes),
      Number(tempo),
      Math.log2(Number(reinforcementFactor) / 100),
      Number(maxReinforcement) / 100
    );

    const blob = new Blob([bufferArray], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    setDownloadURL(url);
    setStatus("done generating!");
  }

  function makeFileName() {
    return `output.mid`;
  }

  useEffect(() => {
    const sel = [];
    Object.keys(files).forEach((name) => files[name].selected && sel.push(files[name].file));
    setSelectedFiles(sel);
  }, [files]);

  return (
    <div className="Improviser">
      <h2>SETTINGS</h2>
      <p className="description">Set the training and generation settings.</p>
      <div className="form-container">
        <form className="form" onSubmit={(e) => e.preventDefault()}>
          <div className="train-form">
            <label htmlFor="initialOrder">
              Initial Markov order <HelpBox>Order of the initial Markov model. Lower values increase the chances of dissimilarity between training and generated data.</HelpBox>
            </label>
            <Slider
              name={"initialOrder"}
              value={initialOrder}
              inMin={1}
              inMax={10}
              outMin={1}
              outMax={10}
              setValue={(value) => {
                setStorageValue(setInitialOrder, "initialOrder")(value);
                setIsTrained(false);
              }}
            />
          </div>
          <ButtonPanel>
            <button onClick={train} disabled={!selectedFiles.length}>
              Train
            </button>
          </ButtonPanel>
          <div className="generate-form">
            <div className="form-subsection">Behavior</div>
            <div></div>
            <label htmlFor="memory">
              Order-boosting steps{" "}
              <HelpBox>
                The number of times the generated output is used as training data for a new Markov model, that is one order higher than the previous one. 0 steps is equivalent to a regular markov model.
              </HelpBox>
            </label>
            <Slider
              name={"memory"}
              value={markovOrder}
              inMin={0}
              inMax={15}
              outMin={0}
              outMax={15}
              setValue={(value) => {
                setStorageValue(setMarkovOrder, "markovOrder")(value);
              }}
            />
            <label htmlFor="reinforcement-slider">
              Prediction reinforcement
              <HelpBox>
                <p>
                  Factor by which each prediction's transition probability is reinforced, when below the reinforcement threshold. 1 is equivalent to no reinforcement.
                </p>
              </HelpBox>
            </label>
            <Slider
              name={"reinforcement-slider"}
              value={reinforcementFactor}
              inMin={100}
              inMax={200}
              outMin={1.}
              outMax={2.}
              setValue={setStorageValue(setReinforcementFactor, "reinforcementFactor")}
            />
            <label htmlFor="max-reinforcement-slider">
              Reinforcement threshold
              <HelpBox>
                <p>
                  Value below which prediction reinforcement can be applied, so as to prevent excesive repetitions in the output. 1 is equivalent to no threshold, 0 is equivalent to no reinforcement.
                </p>
              </HelpBox>
            </label>
            <Slider
              name={"max-reinforcement-slider"}
              value={maxReinforcement}
              setValue={setStorageValue(setMaxReinforcement, "maxReinforcement")}
            />
            <div className="form-subsection">Output</div>
            <div></div>
            <label htmlFor="num-notes">
              Number of notes
              <HelpBox>Number of notes to be generated.</HelpBox>
            </label>
            <Slider
              name={"num-notes"}
              value={numNotes}
              inMin={50}
              inMax={3000}
              outMin={50}
              outMax={3000}
              step={50}
              setValue={setStorageValue(setNumNotes, "numNotes")}
            />
            <label htmlFor="tempo">
              Tempo
              <HelpBox>Desired tempo in beats per minute (BPM).</HelpBox>
            </label>
            <Slider name={"tempo"} value={tempo} inMin={40} inMax={208} outMin={40} outMax={208} setValue={setStorageValue(setTempo, "tempo")} />
          </div>

          <ButtonPanel>
            <button onClick={generate} disabled={!isTrained}>
              Generate
            </button>
            <button
              className={classNames({ disabled: !downloadURL })}
              onClick={() => {
                const link = document.createElement("a");
                link.href = downloadURL;
                link.download = makeFileName();
                link.click();
                setStatus("downloading...");
                setTimeout(() => {
                  URL.revokeObjectURL(downloadURL);
                  setStatus(false);
                }, 2000);
                setDownloadURL(false);
              }}
            >
              Download
            </button>
          </ButtonPanel>
        </form>
        {status && <div className="status">{status}</div>}
      </div>
    </div>
  );
}
