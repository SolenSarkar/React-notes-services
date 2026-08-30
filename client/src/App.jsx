import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Notes from "./pages/Notes";
import Admin from "./pages/Admin";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!savedUser || !token) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      return null;
    }
  });

  const [authPage, setAuthPage] = useState("login");

  const [currentPage, setCurrentPage] =
    useState("notes");

  const handleLogin = (data) => {
    localStorage.setItem("token", data.token);

    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    setUser(data.user);
    setCurrentPage("notes");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setAuthPage("login");
    setCurrentPage("notes");
  };

  if (!user) {
    if (authPage === "register") {
      return (
        <Register
          onRegister={handleLogin}
          onSwitchToLogin={() =>
            setAuthPage("login")
          }
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() =>
          setAuthPage("register")
        }
      />
    );
  }

  // Admin page
  if (
    user.role === "admin" &&
    currentPage === "admin"
  ) {
    return (
      <Admin
        user={user}
        onBack={() =>
          setCurrentPage("notes")
        }
        onLogout={handleLogout}
      />
    );
  }

  // Normal Notes page
  return (
    <Notes
      user={user}
      onLogout={handleLogout}
      onOpenAdmin={() =>
        setCurrentPage("admin")
      }
    />
  );
}

export default App;