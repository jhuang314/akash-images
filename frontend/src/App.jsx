import React, { useEffect, useState } from "react";
import { socket } from "./socket";
import ImageGenerator from "./components/ImageGenerator";
import Header from "./components/Header";
import { LayoutContext } from "./layout";

export default function App() {
  const [layout, setLayout] = useState("grid");

  useEffect(() => {
    function onConnect() {
      console.log("ws connected");
    }

    function onDisconnect() {
      console.log("ws disconnected");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <LayoutContext.Provider value={{ layout, setLayout }}>
      <div className="columns">
        <div className="column">
          <Header />
          <ImageGenerator />
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
