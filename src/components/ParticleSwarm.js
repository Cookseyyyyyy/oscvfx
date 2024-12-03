// src/components/ParticleSwarm.js

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Noise } from 'noisejs';

function ParticleSwarm({ burstTrigger, lightUpTrigger }) {
  const mountRef = useRef(null);

  // References to mutable variables that persist across re-renders
  const positionsRef = useRef([]);
  const velocitiesRef = useRef([]);
  const accelerationsRef = useRef([]);
  const colorsRef = useRef([]);
  const lightingUpRef = useRef([]);
  const particlesRef = useRef();
  const noiseRef = useRef(new Noise(Math.random()));
  const noiseTimeRef = useRef(0);
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    // Set up the scene, camera, and renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1000);
    camera.position.z = 150;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting (optional for better visuals)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Create particles
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const accelerations = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3); // For RGB colors
    const lightingUp = []; // To track per-particle lighting up state

    for (let i = 0; i < particleCount; i++) {
      // Random position inside a sphere
      const radius = 50;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Initialize velocities and accelerations to zero
      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;

      accelerations[i * 3] = 0;
      accelerations[i * 3 + 1] = 0;
      accelerations[i * 3 + 2] = 0;

      // Initialize colors to blue (0x0077ff)
      colors[i * 3] = 0x00 / 255;     // Red
      colors[i * 3 + 1] = 0x77 / 255; // Green
      colors[i * 3 + 2] = 0xff / 255; // Blue

      // Initialize lighting up state
      lightingUp[i] = { isActive: false, startTime: 0 };
    }

    positionsRef.current = positions;
    velocitiesRef.current = velocities;
    accelerationsRef.current = accelerations;
    colorsRef.current = colors;
    lightingUpRef.current = lightingUp;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    particlesRef.current = particles;

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      noiseTimeRef.current += delta * 0.1; // Adjust for desired speed

      const positionsArray = positionsRef.current;
      const velocitiesArray = velocitiesRef.current;
      const accelerationsArray = accelerationsRef.current;
      const colorsArray = colorsRef.current;
      const lightingUp = lightingUpRef.current;
      const particleCount = positionsArray.length / 3;

      for (let i = 0; i < particleCount; i++) {
        const index = i * 3;

        // Create Vector3 objects for position, velocity, acceleration
        const position = new THREE.Vector3(
          positionsArray[index],
          positionsArray[index + 1],
          positionsArray[index + 2]
        );

        const velocity = new THREE.Vector3(
          velocitiesArray[index],
          velocitiesArray[index + 1],
          velocitiesArray[index + 2]
        );

        const acceleration = new THREE.Vector3(
          accelerationsArray[index],
          accelerationsArray[index + 1],
          accelerationsArray[index + 2]
        );

        // Apply central attraction force
        const attractionForce = position.clone().negate().multiplyScalar(0.1);
        acceleration.add(attractionForce);

        // Apply turbulent force using Perlin noise
        const noiseStrength = 100;
        const nx = noiseRef.current.simplex3(position.x * 0.05, position.y * 0.01, noiseTimeRef.current);
        const ny = noiseRef.current.simplex3(position.y * 0.05, position.z * 0.01, noiseTimeRef.current);
        const nz = noiseRef.current.simplex3(position.z * 0.05, position.x * 0.01, noiseTimeRef.current);
        const noiseForce = new THREE.Vector3(nx, ny, nz).multiplyScalar(noiseStrength);
        acceleration.add(noiseForce);

        // Apply frictional force
        const friction = velocity.clone().multiplyScalar(-0.05);
        acceleration.add(friction);

        // Update velocity and position
        velocity.add(acceleration.clone().multiplyScalar(delta));
        position.add(velocity.clone().multiplyScalar(delta));

        // Reset acceleration
        acceleration.set(0, 0, 0);

        // Keep particles within a sphere of radius 100
        const maxRadius = 100;
        if (position.length() > maxRadius) {
          position.setLength(maxRadius);
          // Reflect velocity
          velocity.reflect(position.clone().normalize());
        }

        // Update the positions array
        positionsArray[index] = position.x;
        positionsArray[index + 1] = position.y;
        positionsArray[index + 2] = position.z;

        // Update velocities and accelerations arrays
        velocitiesArray[index] = velocity.x;
        velocitiesArray[index + 1] = velocity.y;
        velocitiesArray[index + 2] = velocity.z;

        accelerationsArray[index] = acceleration.x;
        accelerationsArray[index + 1] = acceleration.y;
        accelerationsArray[index + 2] = acceleration.z;

        // Handle light up effect per particle
        if (lightingUp[i].isActive) {
          const elapsed = performance.now() - lightingUp[i].startTime;
          const duration = 500; // Duration in milliseconds
          const t = elapsed / duration;

          if (t < 1) {
            // Ease out curve
            const easedT = 1 - Math.pow(1 - t, 3);

            // Interpolate color from yellow back to blue
            const startColor = new THREE.Color(0xffff00); // Yellow
            const endColor = new THREE.Color(0x0077ff); // Blue
            const currentColor = startColor.lerp(endColor, easedT);

            // Update colors array
            colorsArray[index] = currentColor.r;
            colorsArray[index + 1] = currentColor.g;
            colorsArray[index + 2] = currentColor.b;
          } else {
            // End of animation
            colorsArray[index] = 0x00 / 255;     // Red
            colorsArray[index + 1] = 0x77 / 255; // Green
            colorsArray[index + 2] = 0xff / 255; // Blue
            lightingUp[i].isActive = false;
          }
        }
      }

      // Flag that positions and colors need updating
      particles.geometry.attributes.position.needsUpdate = true;
      particles.geometry.attributes.color.needsUpdate = true;

      renderer.render(scene, camera);
    }

    animate();

    // Handle window resize
    const handleResize = () => {
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      renderer.dispose();
      mountRef.current.removeChild(renderer.domElement);
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array, runs once on mount

  // Handle Burst Effect
  useEffect(() => {
    if (burstTrigger) {
      console.log('Burst effect triggered!');

      const accelerationsArray = accelerationsRef.current;
      const positionsArray = positionsRef.current;
      const particleCount = positionsArray.length / 3;

      for (let i = 0; i < particleCount; i++) {
        const index = i * 3;

        const position = new THREE.Vector3(
          positionsArray[index],
          positionsArray[index + 1],
          positionsArray[index + 2]
        );

        const acceleration = new THREE.Vector3(
          accelerationsArray[index],
          accelerationsArray[index + 1],
          accelerationsArray[index + 2]
        );

        // Apply an outward acceleration
        const burstStrength = 1000; // Adjust for desired burst intensity
        const direction = position.clone().normalize();
        const burstForce = direction.multiplyScalar(burstStrength);
        acceleration.add(burstForce);

        // Update accelerations array
        accelerationsArray[index] = acceleration.x;
        accelerationsArray[index + 1] = acceleration.y;
        accelerationsArray[index + 2] = acceleration.z;
      }
    }
  }, [burstTrigger]);

  // Handle Light Up Effect
  useEffect(() => {
    if (lightUpTrigger) {
      console.log('Light up effect triggered!');

      const now = performance.now();
      const lightingUp = lightingUpRef.current;
      const particleCount = lightingUp.length;

      for (let i = 0; i < particleCount; i++) {
        lightingUp[i].isActive = true;
        lightingUp[i].startTime = now;
      }
    }
  }, [lightUpTrigger]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}

export default ParticleSwarm;