import React, { useState, useEffect } from 'react';

function Module({ id, oscMessages, removeModule, onEffectTrigger }) {
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedEffect, setSelectedEffect] = useState('Burst');
  const [lastFilteredMessage, setLastFilteredMessage] = useState(null);

  useEffect(() => {
    if (!oscMessages.length) return;

    // Find the last message that matches the criteria
    const filtered = [...oscMessages].reverse().find((oscMessage) => {
      // Parse the message address
      const messageParts = oscMessage.address.split('_');
      if (messageParts.length < 5) {
        console.warn('Invalid message format:', oscMessage.address);
        return false;
      }

      // Message format: Note_noteNumber_Reference_midiNumber_velocity
      const [prefix, noteNumber, refLabel, midiNumberStr, velocityStr] = messageParts;

      // Parse midiNumber and velocity into integers
      const midiNumber = parseInt(midiNumberStr, 10);
      const velocity = parseInt(velocityStr, 10);

      if (isNaN(midiNumber) || isNaN(velocity)) {
        console.warn('Invalid MIDI number or velocity:', midiNumberStr, velocityStr);
        return false;
      }

      // Apply velocity filter (only allow messages with non-zero velocity)
      if (velocity === 0) {
        return false;
      }

      // Apply reference filter
      const matchesReference = reference
        ? refLabel.toLowerCase() === reference.toLowerCase()
        : true;

      // Apply notes filter (based on midiNumber)
      const notesArray = notes
        ? notes.split(',').map((n) => parseInt(n.trim(), 10))
        : [];
      const matchesNote = notesArray.length
        ? notesArray.includes(midiNumber)
        : true;

      return matchesReference && matchesNote;
    });

    if (filtered) {
      // Only trigger the effect if it's a new message
      if (
        !lastFilteredMessage ||
        lastFilteredMessage.address !== filtered.address
      ) {
        setLastFilteredMessage(filtered);
        onEffectTrigger(selectedEffect);
      }
    }
  }, [oscMessages, reference, notes, selectedEffect]);

  return (
    <div className="module-card">
      <button className="remove-button" onClick={() => removeModule(id)}>
        x
      </button>
      <h3>Module</h3>
      <label>
        Reference:
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Reference"
        />
      </label>
      <label>
        MIDI Notes:
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., 36,38"
        />
      </label>
      <label>
        Effect:
        <select
          value={selectedEffect}
          onChange={(e) => setSelectedEffect(e.target.value)}
        >
          <option value="Burst">Burst</option>
          <option value="Light Up">Light Up</option>
        </select>
      </label>
      <div className="filtered-messages">
        <h4>Last Message:</h4>
        {lastFilteredMessage ? (
          <div>{lastFilteredMessage.address}</div>
        ) : (
          <p>No messages match.</p>
        )}
      </div>
    </div>
  );
}

export default Module;