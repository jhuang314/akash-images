import React from "react";

export default function ErrorMessage({ message }) {
  return <p className="has-text-weight-bold has-text-danger">{message}</p>;
}
