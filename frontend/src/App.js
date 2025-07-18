// import React from "react";
// import DeviceData from "./DeviceData";
// import Layout from "./components/Layout";
// import './index.css';

// function App() {
//   return (
//     <div className="App">
//       <DeviceData />
//     </div>
//   );
// }

// export default App;



import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginRegisterPage from "./LoginRegisterPage";
import DeviceData from "./DeviceData";
import Layout from "./components/Layout";

function App() {
  const [user, setUser] = useState(localStorage.getItem("userEmail"));

  const handleLogin = (email) => {
    setUser(email);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginRegisterPage onLogin={handleLogin} />} />
        <Route
      path="/dashboard"
      element={
        user ? (
          <Layout userEmail={user} onLogout={() => {
            localStorage.removeItem("userEmail");
            setUser(null);
          }}>
            <DeviceData />
          </Layout>
        ) : (
          <Navigate to="/" replace />
        )
      }
    />
      </Routes>
    </Router>
  );
}

export default App;
