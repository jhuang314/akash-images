import React from "react";

export default function ImageResult({ img, promptImg, taskId }) {
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
            <figcaption>Generating image for "{promptImg}"</figcaption>
          </figure>
          <progress className="progress is-small is-primary" max="100">
            Loading
          </progress>
        </>
      )}
    </div>
  );
}
