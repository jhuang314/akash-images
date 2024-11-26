import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-regular-svg-icons";
import { CopyToClipboard } from "react-copy-to-clipboard";

export default function ImageResult({
  img,
  promptImg,
  taskId,
  iteration,
  totalIteration,
  negativePrompt,
  seed,
  guidanceScale,
  partialImg,
}) {
  return (
    <div className="column">
      {img ? (
        <figure className="image">
          <img src={img} alt="generated" />
          <figcaption>
            Prompt: "{promptImg}" &nbsp;&nbsp;&nbsp;
            <CopyToClipboard text={promptImg}>
              <button>
                <FontAwesomeIcon icon={faCopy}></FontAwesomeIcon>
              </button>
            </CopyToClipboard>
          </figcaption>
          {negativePrompt ? (
            <figcaption>
              Negative Prompt: "{negativePrompt}" &nbsp;&nbsp;&nbsp;
              <CopyToClipboard text={negativePrompt}>
                <button>
                  <FontAwesomeIcon icon={faCopy}></FontAwesomeIcon>
                </button>
              </CopyToClipboard>
            </figcaption>
          ) : (
            <></>
          )}
          <figcaption>Total Steps: {totalIteration}</figcaption>
          {seed ? <figcaption>Seed: "{seed}"</figcaption> : <></>}
          {guidanceScale ? (
            <figcaption>Guidance Scale: "{guidanceScale}"</figcaption>
          ) : (
            <></>
          )}
        </figure>
      ) : (
        <>
          {/* <progress
            className="progress is-small is-primary"
            value={iteration}
            max={totalIteration}
          >
            Loading
          </progress> */}
          <figure className="image">
            {iteration === 0 ? (
              <figcaption>
                {" "}
                (Queued...) Generating image for "{promptImg}"
              </figcaption>
            ) : (
              <figcaption>
                {" "}
                ({iteration} / {totalIteration}) Generating image for "
                {promptImg}"
              </figcaption>
            )}
            <img src={partialImg} alt="partially generated " />
          </figure>
        </>
      )}
      <hr />
    </div>
  );
}
