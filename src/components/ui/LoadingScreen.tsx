import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,1) 0%, rgba(37,99,235,0.5) 50%, rgba(0,0,0,0) 100%)',
          boxShadow: '0 0 20px 5px rgba(59, 130, 246, 0.5)',
          marginBottom: '20px',
        }}
      />
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '1.2rem',
          letterSpacing: '2px',
          fontWeight: 300,
          background: '-webkit-linear-gradient(45deg, #60a5fa, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        LOADING CAPABLE
      </motion.h2>
    </div>
  );
}
