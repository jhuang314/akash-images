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
          <img src={img} alt="genimage" />
        </figure>
      ) : partialImg ? (
        <figure className="image">
          <img src={partialImg} />
        </figure>
      ) : (
        <figure className="image">
          <img src="https://placehold.co/600x600?text=Queued..." />
        </figure>
      )}
    </div>
  );
}
