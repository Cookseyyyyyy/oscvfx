import React, { useEffect, useState } from 'react';
import './App.css';
import Module from './components/module';

function App() {
  const [oscMessages, setOscMessages] = useState([]);
  const [modules, setModules] = useState([]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8081');

    socket.onopen = () => {
      console.log('WebSocket Client Connected');
    };

    socket.onmessage = (message) => {
      try {
        const oscData = JSON.parse(message.data);
        console.log('Received OSC data:', oscData);

        setOscMessages((prevMessages) => [...prevMessages, oscData]);
      } catch (err) {
        console.error('Error parsing message data:', err);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, []);

  const addModule = () => {
    setModules((prevModules) => [...prevModules, { id: Date.now() }]);
  };

  const removeModule = (id) => {
    setModules((prevModules) => prevModules.filter((module) => module.id !== id));
  };

  return (
    <div className="App">
      <div className="modules-container">
        {modules.map((module) => (
          <Module
            key={module.id}
            id={module.id}
            oscMessages={oscMessages}
            removeModule={removeModule}
          />
        ))}
        <button className="add-button" onClick={addModule}>
          +
        </button>
      </div>
    </div>
  );
}

export default App;