import React from "react";

export default function ImageResult({ img, promptImg }) {
  return (
    <div className="column">
      {img ? (
        <figure>
          <img src={img} alt="genimage" />
          <figcaption>{promptImg}</figcaption>
        </figure>
      ) : (
        <></>
      )}
    </div>
  );
}
