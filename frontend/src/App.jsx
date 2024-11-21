import ImageGenerator from "./components/ImageGenerator";
import Header from "./components/Header";

export default function App() {
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
