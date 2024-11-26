import React from "react";

export default function ImageFigure({ img, partialImg }) {
  return (
    <>
      {img ? (
        <figure className="image">
          <img src={img} alt="generated" />
        </figure>
      ) : partialImg ? (
        <figure className="image">
          <img src={partialImg} alt="partially generated" />
        </figure>
      ) : (
        <figure className="image">
          <img src="https://placehold.co/600x600?text=Queued..." alt="queued" />
        </figure>
      )}
    </>
  );
}
