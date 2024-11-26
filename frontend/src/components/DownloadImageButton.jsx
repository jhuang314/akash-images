import React, { useRef } from "react";

export default function DownloadImageButton({ imageUrl, filename }) {
  const hiddenAnchor = useRef(null);

  const handleDownload = () => {
    hiddenAnchor.current.click();
  };

  return (
    <div>
      <button className="button" onClick={handleDownload}>
        Download image
      </button>

      <a
        href={imageUrl}
        download={filename}
        ref={hiddenAnchor}
        style={{ display: "none" }}
        tabIndex={-1}
      >
        &nbsp;
      </a>
    </div>
  );
}
