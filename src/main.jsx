import React from "react";
import ReactDOM from "react-dom";
import "./styles.css";
import { App } from "./App";
import { QueryClientProvider } from "react-query";
import { queryClient } from "./queryClient";
import { ReactQueryDevtools } from "react-query/devtools";

ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools />
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
