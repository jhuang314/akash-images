import React from "react";

export default function ImageResult({
  img,
  promptImg,
  taskId,
  iteration,
  totalIteration,
}) {
  return (
    <div className="column">
      {img ? (
        <figure>
          <img src={img} alt="genimage" />
          <figcaption>{promptImg}</figcaption>
        </figure>
      ) : (
        <>
          <figure>
            <figcaption>
              {" "}
              ({iteration} / {totalIteration}) Generating image for "{promptImg}
              "
            </figcaption>
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
