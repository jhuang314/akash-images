import React from "react";

export default function ImageResultCell({
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
    <div className="cell">
      {img ? (
        <figure className="image">
          <img src={img} alt="generated image" />
        </figure>
      ) : partialImg ? (
        <figure className="image">
          <img src={partialImg} alt="partially generated image" />
        </figure>
      ) : (
        <figure className="image">
          <img
            src="https://placehold.co/600x600?text=Queued..."
            alt="queued image"
          />
        </figure>
      )}
    </div>
  );
}
