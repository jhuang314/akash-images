import React, { useEffect } from "react";
import { socket } from "./socket";
import ImageGenerator from "./components/ImageGenerator";
import Header from "./components/Header";

export default function App() {
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
    <>
      <div className="columns">
        <div className="column">
          <Header />
          <ImageGenerator />
        </div>
      </div>
    </>
  );
}
