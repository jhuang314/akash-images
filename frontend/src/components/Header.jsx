import React, { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMoon,
  faSun,
  faBorderAll,
  faGripLinesVertical,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { LayoutContext } from "../layout";

export default function Header() {
  const [lightTheme, setLightTheme] = useState(false);
  const { layout, setLayout } = useContext(LayoutContext);

  const toggleLayout = () => {
    if (layout === "grid") {
      setLayout("column");
    } else {
      setLayout("grid");
    }
  };

  const toggleTheme = () => {
    setLightTheme(!lightTheme);
  };

  useEffect(() => {
    document
      .querySelector("html")
      .setAttribute("data-theme", lightTheme ? "light" : "dark");
  });

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <h1 className="title has-text-danger navbar-item">
          Akash Image Generator
        </h1>
      </div>

      <div id="navbarBasicExample" className="navbar-menu">
        <div className="navbar-start"></div>

        <div className="navbar-end">
          <div className="navbar-item">
            <div className="buttons">
              <button className="button" onClick={toggleLayout}>
                <span className="icon">
                  {layout === "column" ? (
                    <FontAwesomeIcon icon={faGripLinesVertical} />
                  ) : (
                    <FontAwesomeIcon icon={faBorderAll} />
                  )}
                </span>
              </button>
              <button className="button" onClick={toggleTheme}>
                <span className="icon">
                  {lightTheme ? (
                    <FontAwesomeIcon icon={faSun} />
                  ) : (
                    <FontAwesomeIcon icon={faMoon} />
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
