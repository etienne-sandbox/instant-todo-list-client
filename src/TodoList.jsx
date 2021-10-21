import { useState, useCallback, Fragment } from "react";
import Ky from "ky";
import { useMutation, useQuery } from "react-query";
import { queryClient } from "./queryClient";
import { nanoid } from "nanoid";

export function TodoList() {
  const [todosUpdate, setTodoUpdate] = useState(0);
  const [newTodoName, setNewTodoName] = useState("");
  const [editingTodo, setEditingTodo] = useState(null);
  const [editingTodoName, setEditingTodoName] = useState("");
  const [pendingToggle, setPendingToggle] = useState({});

  const todosRes = useQuery("todos", () =>
    Ky("http://localhost:3001/todos").json()
  );

  const addTodoMut = useMutation(
    (name) => {
      return Ky.post("http://localhost:3001/todo", { json: { name } });
    },
    {
      onMutate: async (name) => {
        await queryClient.cancelQueries("todos");
        const previousTodos = queryClient.getQueryData("todos");
        queryClient.setQueryData("todos", (old) => [
          ...old,
          { id: nanoid(10), name, done: false, creating: true },
        ]);
        return { previousTodos };
      },
      onError: (_err, _newTodo, context) => {
        queryClient.setQueryData("todos", context.previousTodos);
      },
      onSuccess: () => {
        setNewTodoName("");
      },
      onSettled: () => {
        queryClient.invalidateQueries("todos");
      },
    }
  );

  const toggleTodoMut = useMutation(
    ({ id, done }) => {
      return Ky.put(`http://localhost:3001/todo/${id}`, { json: { done } });
    },
    {
      onMutate: async ({ id, done }) => {
        await queryClient.cancelQueries("todos");
        const previousTodos = queryClient.getQueryData("todos");
        queryClient.setQueryData("todos", (old) =>
          old.map((todo) =>
            todo.id === id ? { ...todo, done, updating: true } : todo
          )
        );
        return { previousTodos };
      },
      onError: (_err, _newTodo, context) => {
        queryClient.setQueryData("todos", context.previousTodos);
      },
      onSettled: () => {
        queryClient.invalidateQueries("todos");
      },
    }
  );

  const removeTodoMut = useMutation(
    (id) => Ky.delete(`http://localhost:3001/todo/${id}`),
    {
      onMutate: async (id) => {
        await queryClient.cancelQueries("todos");
        const previousTodos = queryClient.getQueryData("todos");
        queryClient.setQueryData("todos", (old) =>
          old.map((todo) =>
            todo.id === id ? { ...todo, deleted: true } : todo
          )
        );
        return { previousTodos };
      },
      onError: (_err, _newTodo, context) => {
        queryClient.setQueryData("todos", context.previousTodos);
      },
      onSettled: () => {
        queryClient.invalidateQueries("todos");
      },
    }
  );

  const renameTodoMut = useMutation(
    ({ id, name }) => {
      return Ky.put(`http://localhost:3001/todo/${id}`, { json: { name } });
    },
    {
      onMutate: async ({ id, name }) => {
        await queryClient.cancelQueries("todos");
        const previousTodos = queryClient.getQueryData("todos");
        queryClient.setQueryData("todos", (old) =>
          old.map((todo) =>
            todo.id === id ? { ...todo, name, updating: true } : todo
          )
        );
        return { previousTodos };
      },
      onSuccess: () => {
        setEditingTodo(null);
      },
      onError: (_err, _newTodo, context) => {
        queryClient.setQueryData("todos", context.previousTodos);
      },
      onSettled: () => {
        queryClient.invalidateQueries("todos");
      },
    }
  );

  const addTodo = useCallback((name) => {
    if (name.length === 0) {
      return;
    }
    addTodoMut.mutate(name);
  }, []);

  const pending =
    addTodoMut.isLoading || toggleTodoMut.isLoading || renameTodoMut.isLoading;

  if (todosRes.isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="center">
      <h1>Todos {pending || todosRes.isFetching ? "..." : ""}</h1>
      {todosRes.data.map((todo) => {
        return (
          <div key={todo.id} className="todo">
            <div
              className={
                "checkbox" +
                (todo.done ? " checked" : "") +
                (todo.updating ? " updating" : "") +
                (todo.creating ? " creating" : "")
              }
              onClick={(e) => {
                toggleTodoMut.mutate({ id: todo.id, done: !todo.done });
              }}
            >
              {todo.done ? <span>✓</span> : null}
            </div>
            {todo.id === editingTodo ? (
              <Fragment>
                <input
                  value={editingTodoName}
                  onChange={(e) => setEditingTodoName(e.target.value)}
                  onKeyDown={(e) => {
                    if (pending) {
                      return;
                    }
                    if (e.key === "Enter") {
                      renameTodoMut.mutate({
                        id: todo.id,
                        name: editingTodoName,
                      });
                    }
                  }}
                />
                <button
                  className="rename"
                  disabled={pending}
                  onClick={() => {
                    if (pending) {
                      return;
                    }
                    renameTodoMut.mutate({
                      id: todo.id,
                      name: editingTodoName,
                    });
                  }}
                >
                  {renameTodoMut.isLoading ? "..." : "✓"}
                </button>
              </Fragment>
            ) : (
              <Fragment>
                <div
                  className="name"
                  onClick={() => {
                    setEditingTodoName(todo.name);
                    setEditingTodo(todo.id);
                  }}
                  style={{
                    textDecoration: todo.deleted ? "line-through" : "none",
                  }}
                >
                  {todo.name}
                </div>
                <button
                  className="delete"
                  disabled={pending}
                  onClick={() => {
                    if (pending) {
                      return;
                    }
                    removeTodoMut.mutate(todo.id);
                  }}
                >
                  ✖
                </button>
              </Fragment>
            )}
          </div>
        );
      })}
      <div className="add">
        <input
          type="text"
          placeholder="New Todo"
          value={newTodoName}
          onChange={(e) => {
            if (pending) {
              return;
            }
            setNewTodoName(e.target.value);
          }}
          onKeyDown={(e) => {
            if (pending) {
              return;
            }
            if (e.key === "Enter") {
              addTodo(newTodoName);
            }
          }}
        />
        <button disabled={pending} onClick={() => addTodo(newTodoName)}>
          Add Todo
        </button>
      </div>
    </div>
  );
}
