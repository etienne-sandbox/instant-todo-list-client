import { useEffect, useState } from "react";
import { TodoList } from "./TodoList";

export const App = () => {
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001")
      .then((res) => {
        setApiStatus(true);
      })
      .catch((err) => {
        setApiStatus(false);
      });
  }, []);

  if (apiStatus === null) {
    return <p>Checking API status...</p>;
  }

  if (apiStatus === false) {
    return (
      <p>
        Cannot find the API. Make sure to have the{" "}
        <a href="https://github.com/instant-api/todo-list">Instant Todo API</a>{" "}
        running on port 3001.
      </p>
    );
  }

  return <TodoList />;
};
