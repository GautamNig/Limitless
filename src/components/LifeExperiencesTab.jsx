import React, { useState } from 'react';

const LifeExperiencesTab = () => {
  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={iconStyle}>📖</div>
        <h2 style={titleStyle}>Life Experiences</h2>
        <p style={descriptionStyle}>
          Browse inspiring life experiences shared by our community.
        </p>
        <p style={comingSoonStyle}>
          Coming soon! This feature is currently under development.
        </p>
        <div style={featuresStyle}>
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>✨</span>
            <span>Read real stories from real people</span>
          </div>
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>💬</span>
            <span>Engage with comments and discussions</span>
          </div>
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>👍</span>
            <span>Show appreciation for impactful stories</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= STYLES =============

const containerStyle = {
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(26, 37, 47, 0.9)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2rem'
};

const contentStyle = {
  maxWidth: '500px',
  textAlign: 'center',
  padding: '2rem',
  backgroundColor: 'rgba(44, 62, 80, 0.7)',
  borderRadius: '16px',
  border: '1px solid #34495e',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
};

const iconStyle = {
  fontSize: '4rem',
  marginBottom: '1rem',
  opacity: 0.8
};

const titleStyle = {
  fontSize: '2rem',
  color: '#FFD700',
  margin: '0 0 1rem 0',
  fontWeight: '700'
};

const descriptionStyle = {
  fontSize: '1.1rem',
  color: '#bdc3c7',
  margin: '0 0 2rem 0',
  lineHeight: '1.5'
};

const comingSoonStyle = {
  fontSize: '1rem',
  color: '#3498db',
  margin: '0 0 2rem 0',
  padding: '1rem',
  backgroundColor: 'rgba(52, 152, 219, 0.1)',
  borderRadius: '8px',
  border: '1px solid rgba(52, 152, 219, 0.3)'
};

const featuresStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginTop: '2rem'
};

const featureItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '0.75rem 1rem',
  backgroundColor: 'rgba(52, 73, 94, 0.3)',
  borderRadius: '8px',
  color: '#ecf0f1',
  fontSize: '1rem'
};

const featureIconStyle = {
  fontSize: '1.5rem'
};

export default LifeExperiencesTab;