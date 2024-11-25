import React from "react";

export default function ImageResult({
  img,
  promptImg,
  taskId,
  iteration,
  totalIteration,
  negativePrompt,
  seed,
  guidanceScale,
}) {
  return (
    <div className="column">
      {img ? (
        <figure>
          <img src={img} alt="genimage" />
          <figcaption>Prompt: "{promptImg}"</figcaption>
          <figcaption>Total Steps: {totalIteration}</figcaption>
          {negativePrompt ? (
            <figcaption>Negative Prompt: "{negativePrompt}"</figcaption>
          ) : (
            <></>
          )}
          {seed ? <figcaption>Seed: "{seed}"</figcaption> : <></>}
          {guidanceScale ? (
            <figcaption>Guidance Scale: "{guidanceScale}"</figcaption>
          ) : (
            <></>
          )}
        </figure>
      ) : (
        <>
          <figure>
            {iteration == 0 ? (
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
          </figure>
          <progress
            className="progress is-small is-primary"
            value={iteration}
            max={totalIteration}
          >
            Loading
          </progress>
        </>
      )}
    </div>
  );
}
