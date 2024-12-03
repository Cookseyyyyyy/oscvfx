import React, { useEffect, useState } from 'react';
import './App.css';
import Module from './components/module';
import ParticleSwarm from './components/ParticleSwarm';

function App() {
  const [oscMessages, setOscMessages] = useState([]);
  const [modules, setModules] = useState([]);

  // Effect triggers
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [lightUpTrigger, setLightUpTrigger] = useState(0);

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

  // Handle effect triggers from modules
  const handleEffectTrigger = (effect) => {
    if (effect === 'Burst') {
      setBurstTrigger((prev) => prev + 1); // Increment to trigger useEffect
    } else if (effect === 'Light Up') {
      setLightUpTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className="App">
      <ParticleSwarm
        burstTrigger={burstTrigger}
        lightUpTrigger={lightUpTrigger}
      />
      <div className="modules-container">
        {modules.map((module) => (
          <Module
            key={module.id}
            id={module.id}
            oscMessages={oscMessages}
            removeModule={removeModule}
            onEffectTrigger={handleEffectTrigger}
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