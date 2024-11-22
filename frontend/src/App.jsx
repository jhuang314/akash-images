import React, { useState, useEffect } from "react";
import { socket } from "./socket";
import ImageGenerator from "./components/ImageGenerator";
import Header from "./components/Header";

export default function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      console.log("ws connected");
      setIsConnected(true);
    }

    function onDisconnect() {
      console.log("ws disconnected");
      setIsConnected(false);
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
