import React from "react";
import Ky from "ky";

export function TodoList() {
  const [todos, setTodos] = React.useState(null);
  const [todosUpdate, setTodoUpdate] = React.useState(0);
  const [newTodoName, setNewTodoName] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [editingTodo, setEditingTodo] = React.useState(null);
  const [editingTodoName, setEditingTodoName] = React.useState("");
  const [pendingToggle, setPendingToggle] = React.useState({});

  const todosResolved =
    todos === null
      ? null
      : todos.map((todo) => {
          if (pendingToggle[todo.id] !== undefined) {
            return {
              ...todo,
              done: pendingToggle[todo.id],
            };
          }
          return todo;
        });

  React.useEffect(() => {
    let canceled = false;
    Ky("http://localhost:3001/todos")
      .json()
      .then((todos) => {
        if (canceled) {
          return;
        }
        setPendingToggle({});
        setTodos(todos);
      });
    return () => {
      canceled = true;
    };
  }, [todosUpdate]);

  const addTodo = React.useCallback((name) => {
    if (name.length === 0) {
      return;
    }
    setPending(true);
    Ky.post("http://localhost:3001/todo", {
      json: {
        name,
      },
    })
      .then((todos) => {
        setPending(false);
        setTodoUpdate((v) => v + 1);
        setNewTodoName("");
      })
      .catch(() => {
        setPending(false);
      });
  }, []);

  const toggleTodo = React.useCallback((id, done) => {
    setPending(true);
    setPendingToggle((prev) => ({ ...prev, [id]: done }));
    Ky.put(`http://localhost:3001/todo/${id}`, {
      json: {
        done,
      },
    })
      .then(() => {
        setPending(false);
        setTodoUpdate((v) => v + 1);
      })
      .catch(() => {
        setPendingToggle((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        setPending(false);
      });
  }, []);

  const renameTodo = React.useCallback((id, name) => {
    setPending(true);
    Ky.put(`http://localhost:3001/todo/${id}`, {
      json: {
        name,
      },
    })
      .then(() => {
        setPending(false);
        setEditingTodo(null);
        setTodoUpdate((v) => v + 1);
      })
      .catch(() => {
        setPending(false);
      });
  }, []);

  const removeTodo = React.useCallback((id) => {
    setPending(true);
    Ky.delete(`http://localhost:3001/todo/${id}`)
      .then(() => {
        setPending(false);
        setTodoUpdate((v) => v + 1);
      })
      .catch(() => {
        setPending(false);
      });
  }, []);

  if (todosResolved === null) {
    return <p>Loading...</p>;
  }

  return (
    <div className="center">
      {todosResolved.map((todo) => {
        if (todo.id === editingTodo) {
          return (
            <div key={todo.id} className="todo">
              <div
                className={"checkbox" + (todo.done ? " checked" : "")}
                onClick={(e) => {
                  toggleTodo(todo.id, !todo.done);
                }}
              >
                {todo.done ? <span>✓</span> : null}
              </div>
              <input
                value={editingTodoName}
                onChange={(e) => setEditingTodoName(e.target.value)}
                onKeyDown={(e) => {
                  if (pending) {
                    return;
                  }
                  if (e.key === "Enter") {
                    renameTodo(todo.id, editingTodoName);
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
                  renameTodo(todo.id, editingTodoName);
                }}
              >
                ✓
              </button>
            </div>
          );
        }
        return (
          <div key={todo.id} className="todo">
            <div
              className={"checkbox" + (todo.done ? " checked" : "")}
              onClick={(e) => {
                toggleTodo(todo.id, !todo.done);
              }}
            >
              {todo.done ? <span>✓</span> : null}
            </div>
            <div
              className="name"
              onClick={() => {
                setEditingTodoName(todo.name);
                setEditingTodo(todo.id);
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
                removeTodo(todo.id);
              }}
            >
              ✖
            </button>
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
