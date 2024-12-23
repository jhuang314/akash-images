import React from "react";
import { Portal } from "react-portal";
import ImageFigure from "./ImageFigure";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useState } from "react";
import DownloadImageButton from "./DownloadImageButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-regular-svg-icons";

function classNames(...args) {
  return args.filter(Boolean).join(" ");
}

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
  const [showModal, setShowModal] = useState(false);

  const onImageClick = (event) => {
    setShowModal(true);
  };

  const onDialogClose = (event) => {
    setShowModal(false);
  };

  return (
    <div className="cell">
      <button onClick={onImageClick}>
        <ImageFigure img={img} partialImg={partialImg} />
      </button>

      <Portal>
        <div
          id="modal-js-example"
          className={classNames("modal", showModal && "is-active")}
        >
          <div className="modal-background" onClick={onDialogClose}></div>

          <div className="modal-content">
            <div className="box">
              <ImageFigure img={img} partialImg={partialImg} />
              <p>
                Prompt: "{promptImg}" &nbsp;&nbsp;&nbsp;
                <CopyToClipboard text={promptImg}>
                  <button>
                    <FontAwesomeIcon icon={faCopy}></FontAwesomeIcon>
                  </button>
                </CopyToClipboard>
              </p>
              {negativePrompt ? (
                <p>
                  Negative Prompt: "{negativePrompt}" &nbsp;&nbsp;&nbsp;
                  <CopyToClipboard text={negativePrompt}>
                    <button>
                      <FontAwesomeIcon icon={faCopy}></FontAwesomeIcon>
                    </button>
                  </CopyToClipboard>
                </p>
              ) : (
                <></>
              )}
              <p>Total Steps: {totalIteration}</p>
              <p>Seed: {seed}</p>
              <p>Guidance Scale: {guidanceScale}</p>
              <br />

              {img ? (
                <DownloadImageButton imageUrl={img} filename="image.png" />
              ) : (
                <>
                  {partialImg ? (
                    <p>
                      ({iteration} / {totalIteration}) Generating image
                      <progress
                        className="progress is-small is-primary"
                        value={iteration}
                        max={totalIteration}
                      >
                        Loading
                      </progress>
                    </p>
                  ) : (
                    <p>(Queued...) Generating image</p>
                  )}
                </>
              )}
            </div>
          </div>

          <button
            className="modal-close is-large"
            aria-label="close"
            onClick={onDialogClose}
          ></button>
        </div>
      </Portal>
    </div>
  );
}
