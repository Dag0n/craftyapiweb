import Main from "./Main";
import "./App.css";
import { ChakraProvider } from "@chakra-ui/react";

function App() {
  return (
    <ChakraProvider>
      <Main />
    </ChakraProvider>
  );
}

export default App;
