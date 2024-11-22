import { useState, useEffect, useCallback } from "react";
import ErrorMessage from "./ErrorMessage";
import ImageResult from "./ImageResult";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretUp, faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { socket } from "../socket";

const INITIAL_GUIDANCE = 7.5;
const INITIAL_STEPS = 5;
const SEED = 1337;

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState(SEED);
  const [guidanceScale, setGuidanceScale] = useState(INITIAL_GUIDANCE);
  const [numInfSteps, setNumInfSteps] = useState(INITIAL_STEPS);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingImg, setLoadingImg] = useState(false);
  const [moreOptions, setMoreOptions] = useState(false);
  // array of {img, imgPrompt}
  // const [images, setImages] = useState([]);
  const [tasks, setTasks] = useState([]);

  const cleanFormData = () => {
    setPrompt("");
    setNegativePrompt("");
    setSeed(SEED);
    setGuidanceScale(INITIAL_GUIDANCE);
    setNumInfSteps(INITIAL_STEPS);
    setLoadingImg(false);
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

      // setLoadingImg(false);

      const response = await fetch(`/image/${taskId}`, requestOptions);

      if (!response.ok) {
        setErrorMessage("Ooops! Something went wrong fetching the image");
        setLoadingImg(false);
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

    return () => {
      socket.off("task completed", taskCompleted);
    };
  }, [tasks, fetchNewImage]);

  // create a function that handles creating the lead
  const handleGenerateImage = async (e) => {
    const requestOptions = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };

    setLoadingImg(true);

    const response = await fetch(
      `/api/generate2/?prompt=${prompt}&negative_prompt=${negativePrompt}&num_inference_steps=${numInfSteps}&guidance_scale=${guidanceScale}&seed=${seed}`,
      requestOptions,
    );

    if (!response.ok) {
      setErrorMessage("Ooops! Something went wrong generating the image");
      setLoadingImg(false);
    } else {
      const { task_id } = await response.json();

      setTasks([{ taskId: task_id, promptImg: prompt }, ...tasks]);

      cleanFormData();
    }
  };

  // create a function that handles creating the lead
  // const handleGenerateImageOriginal = async (e) => {
  //   const requestOptions = {
  //     method: "GET",
  //     headers: { "Content-Type": "application/json" },
  //   };

  //   setLoadingImg(true);

  //   const response = await fetch(
  //     `/api/generate/?prompt=${prompt}&negative_prompt=${negativePrompt}&num_inference_steps=${numInfSteps}&guidance_scale=${guidanceScale}&seed=${seed}`,
  //     requestOptions,
  //   );

  //   if (!response.ok) {
  //     setErrorMessage("Ooops! Something went wrong generating the image");
  //     setLoadingImg(false);
  //   } else {
  //     const imageBlob = await response.blob();
  //     const imageObjectURL = URL.createObjectURL(imageBlob);

  //     setImages([{ img: imageObjectURL, promptImg: prompt }, ...images]);

  //     cleanFormData();
  //   }
  // };

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
              {/* <label className="label">More Options</label> */}
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
      {loadingImg ? (
        <div className="column">
          <progress className="progress is-small is-primary" max="100">
            Loading
          </progress>
        </div>
      ) : (
        <></>
      )}

      {/* {tasks.map((t) => (
        <div>{t.taskId}</div>
      ))} */}
      {tasks.map(({ img, promptImg, taskId }, i) => (
        <ImageResult img={img} promptImg={promptImg} taskId={taskId} key={i} />
      ))}

      {/* {images.map(({ img, promptImg }) => (
        <ImageResult img={img} promptImg={promptImg} key={img} />
      ))} */}
    </>
  );
}
