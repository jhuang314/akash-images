import { useState, useEffect, useCallback, useContext } from "react";
import ErrorMessage from "./ErrorMessage";
import ImageResult from "./ImageResult";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretUp, faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { socket } from "../socket";
import ImageResultCell from "./ImageResultCell";
import { LayoutContext } from "../layout";

const INITIAL_GUIDANCE = 7.5;
const INITIAL_STEPS = 50;
const SEED = 1337;

const base64ImageToUrl = (base64Image) => {
  const imageBinary = atob(base64Image);
  const imageArrayBuffer = Uint8Array.from(imageBinary, (c) => c.charCodeAt(0));
  const blob = new Blob([imageArrayBuffer], { type: "image/jpg" });
  return URL.createObjectURL(blob);
};

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState(SEED);
  const [guidanceScale, setGuidanceScale] = useState(INITIAL_GUIDANCE);
  const [numInfSteps, setNumInfSteps] = useState(INITIAL_STEPS);
  const [errorMessage, setErrorMessage] = useState("");
  const [moreOptions, setMoreOptions] = useState(false);

  const [tasks, setTasks] = useState([]);

  const { layout } = useContext(LayoutContext);

  const cleanFormData = () => {
    setPrompt("");
    setNegativePrompt("");
    setSeed(SEED);
    setGuidanceScale(INITIAL_GUIDANCE);
    setNumInfSteps(INITIAL_STEPS);
    setErrorMessage("");
  };

  const toggleMoreOptions = (e) => {
    e.preventDefault();
    setMoreOptions(!moreOptions);
  };

  // create a function that handles fetching new image
  const fetchNewImage = useCallback(
    async (taskId) => {
      const requestOptions = {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      };

      const response = await fetch(`/image/${taskId}`, requestOptions);

      if (!response.ok) {
        setErrorMessage("Ooops! Something went wrong fetching the image");
      } else {
        const imageBlob = await response.blob();
        const imageObjectURL = URL.createObjectURL(imageBlob);

        const newTasks = [...tasks];
        const taskToUpdate = newTasks.find((t) => t.taskId === taskId);
        if (taskToUpdate) {
          taskToUpdate.img = imageObjectURL;
        }

        setTasks(newTasks);
      }
    },
    [tasks],
  );

  useEffect(() => {
    const taskCompleted = async (t) => {
      await fetchNewImage(t.taskId);
    };

    socket.on("task completed", taskCompleted);

    const taskUpdate = async (t) => {
      const newTasks = [...tasks];
      const taskToUpdate = newTasks.find((task) => task.taskId === t.taskId);
      if (taskToUpdate) {
        taskToUpdate.iteration = t.iteration;
        taskToUpdate.partialImg = base64ImageToUrl(t.image64);
      }

      setTasks(newTasks);
    };

    socket.on("task updated", taskUpdate);

    return () => {
      socket.off("task completed", taskCompleted);
      socket.off("task updated", taskUpdate);
    };
  }, [tasks, fetchNewImage]);

  // generate an image, and save the job's taskId.
  const handleGenerateImage = async (e) => {
    const requestOptions = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };

    const response = await fetch(
      `/api/generate/?prompt=${prompt}&negative_prompt=${negativePrompt}&num_inference_steps=${numInfSteps}&guidance_scale=${guidanceScale}&seed=${seed}`,
      requestOptions,
    );

    if (!response.ok) {
      setErrorMessage("Ooops! Something went wrong generating the image");
    } else {
      const { task_id } = await response.json();

      setTasks([
        {
          taskId: task_id,
          promptImg: prompt,
          negativePrompt: negativePrompt,
          guidanceScale: guidanceScale,
          seed: seed,
          iteration: 0,
          totalIteration: numInfSteps,
        },
        ...tasks,
      ]);

      cleanFormData();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    handleGenerateImage();
  };

  return (
    <>
      <div className="column">
        <form className="box" onSubmit={handleSubmit}>
          <div className="field is-grouped">
            <div className="control is-expanded">
              <div className="control">
                <textarea
                  type="text"
                  placeholder="Describe your image"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="textarea"
                  rows="2"
                  required
                />
              </div>
            </div>
            <div className="control">
              <button className="button is-large" onClick={toggleMoreOptions}>
                <span className="icon">
                  {moreOptions ? (
                    <FontAwesomeIcon icon={faCaretUp} />
                  ) : (
                    <FontAwesomeIcon icon={faCaretDown} />
                  )}
                </span>
              </button>
            </div>
          </div>
          {moreOptions ? (
            <>
              <div className="field">
                <label className="label">Negative Prompt</label>
                <div className="control">
                  <textarea
                    type="text"
                    placeholder="Negative Prompt"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="textarea"
                    rows="2"
                  />
                </div>
              </div>
              <div className="field is-grouped is-grouped-multiline">
                <div className="control">
                  <label className="label">Seed</label>
                  <div className="control">
                    <input
                      type="text"
                      placeholder="seed"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
                <div className="control">
                  <label className="label">Guidance Scale</label>
                  <div className="control">
                    <input
                      type="text"
                      placeholder="guidancescale"
                      value={guidanceScale}
                      onChange={(e) => setGuidanceScale(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
                <div className="control">
                  <label className="label">Inference Steps</label>
                  <div className="control">
                    <input
                      type="number"
                      placeholder="Bigger is Slower, Better Quality"
                      value={numInfSteps}
                      onChange={(e) => setNumInfSteps(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <></>
          )}
          <ErrorMessage message={errorMessage} />
          <br />
          <button className="button is-primary" type="submit">
            Generate Image
          </button>
        </form>
      </div>
      {layout === "grid" ? (
        <div className="column">
          <div className="grid">
            {tasks.map(
              (
                {
                  img,
                  promptImg,
                  taskId,
                  iteration,
                  totalIteration,
                  negativePrompt,
                  seed,
                  guidanceScale,
                  partialImg,
                },
                i,
              ) => (
                <ImageResultCell
                  img={img}
                  promptImg={promptImg}
                  taskId={taskId}
                  iteration={iteration}
                  totalIteration={totalIteration}
                  negativePrompt={negativePrompt}
                  seed={seed}
                  guidanceScale={guidanceScale}
                  partialImg={partialImg}
                  key={i}
                />
              ),
            )}
          </div>
        </div>
      ) : (
        <>
          {tasks.map(
            (
              {
                img,
                promptImg,
                taskId,
                iteration,
                totalIteration,
                negativePrompt,
                seed,
                guidanceScale,
                partialImg,
              },
              i,
            ) => (
              <ImageResult
                img={img}
                promptImg={promptImg}
                taskId={taskId}
                iteration={iteration}
                totalIteration={totalIteration}
                negativePrompt={negativePrompt}
                seed={seed}
                guidanceScale={guidanceScale}
                partialImg={partialImg}
                key={i}
              />
            ),
          )}
        </>
      )}
    </>
  );
}
