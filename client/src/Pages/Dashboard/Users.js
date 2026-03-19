import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Users.css";

const GestioneUsers = () => {
  const [utenti, setUtenti] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users")
      .then((response) => {
        console.log("Response data:", response.data);
        if (Array.isArray(response.data)) {
          setUtenti(response.data);
        } else {
          console.error("Response is not an array:", response.data);
        }
      })
      .catch((error) => {
        console.error("error fetching users:", error);
      });
  });

  const handleDeleteUser = (userId) => {
    axios
      .delete(`http://localhost:5000/api/users/${userId}`)
      .then(() => {
        setUtenti(utenti.filter((elem) => elem.id !== userId));
      })
      .catch((error) => {
        console.error("Error deleting user:", error);
      });
  };


  return (
  <div>
    <table className="element-table">
            <thead>
              <tr>                
                <th>Id</th>
                <th>Email</th>
                <th>Role</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {utenti                
                .map((utenti) => (
                  <tr key={utenti.id}>                    
                    <td>{utenti.id}</td>
                    <td>{utenti.email}</td>
                    <td>{utenti.role}</td>
                    <td><button
                        className="delete-button"
                        onClick={() => handleDeleteUser(utenti.id)}
                      >
                        X
                      </button></td>
                  </tr>
                ))}
            </tbody>
          </table>
  

  </div>
  );
};

export default GestioneUsers;
