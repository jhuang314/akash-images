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

    // function onFooEvent(value) {
    //   console.log("task done", value);
    //   setFooEvents((previous) => [...previous, value]);
    // }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    // socket.on("task completed", onFooEvent);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      // socket.off("foo", onFooEvent);
    };
  }, []);

  return (
    <>
      <p>State: {"" + isConnected}</p>
      <div className="columns">
        <div className="column">
          <Header />
          <ImageGenerator />
        </div>
      </div>
    </>
  );
}
