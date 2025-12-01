import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CreateProfilePopup = ({ isOpen, onClose }) => {
  const { user, userProfile, createUserProfile, deleteUserProfile } = useAuth();
  const [mode, setMode] = useState('create');
  const [formData, setFormData] = useState({
    bio: '',
    website: '',
    location: '',
    interests: '',
    skills: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form when popup opens
  useEffect(() => {
    if (isOpen) {
      if (userProfile) {
        setMode('edit');
        setFormData({
          bio: userProfile.bio || '',
          website: userProfile.website || '',
          location: userProfile.location || '',
          interests: userProfile.interests || '',
          skills: userProfile.skills || ''
        });
      } else {
        setMode('create');
        setFormData({
          bio: '',
          website: '',
          location: '',
          interests: '',
          skills: ''
        });
      }
    }
  }, [isOpen, userProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await createUserProfile(formData);
      onClose();
      // alert(`Profile ${mode === 'create' ? 'created' : 'updated'} successfully!`);
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} profile:`, error);
      // alert(`Failed to ${mode === 'create' ? 'create' : 'update'} profile. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteUserProfile();
      onClose();
      // alert('Profile deleted successfully!');
    } catch (error) {
      console.error('Error deleting profile:', error);
      // alert('Failed to delete profile. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={popupStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2>{mode === 'create' ? 'Create Your Profile' : 'Edit Your Profile'}</h2>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>
        
        {mode === 'edit' && userProfile && (
          <div style={currentInfoStyle}>
            <p style={currentInfoTextStyle}>You already have a profile! Update your information below.</p>
            <div style={previewSectionStyle}>
              <img
                src={user.photoURL}
                alt={user.displayName}
                style={previewImageStyle}
              />
              <div style={previewInfoStyle}>
                <strong style={previewNameStyle}>{user.displayName}</strong>
                <p style={previewEmailStyle}>{user.email}</p>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  style={deleteButtonStyle}
                  type="button"
                >
                  🗑️ Delete Profile
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={deleteConfirmOverlayStyle}>
            <div style={deleteConfirmStyle}>
              <h3 style={deleteConfirmTitleStyle}>Delete Profile?</h3>
              <p style={deleteConfirmTextStyle}>
                Are you sure you want to delete your profile? 
                This will remove you from the community grid. 
                This action cannot be undone.
              </p>
              <div style={deleteConfirmButtonsStyle}>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  style={deleteCancelButtonStyle}
                  disabled={isSubmitting}
                  type="button"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteProfile}
                  style={deleteConfirmButtonStyle}
                  disabled={isSubmitting}
                  type="button"
                >
                  {isSubmitting ? 'Deleting...' : 'Yes, Delete Profile'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Bio <span style={optionalStyle}>(Optional)</span>
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              style={textareaStyle}
              rows="4"
              maxLength="500"
            />
            <div style={charCountStyle}>
              {formData.bio.length}/500 characters
            </div>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Website <span style={optionalStyle}>(Optional)</span>
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://yourwebsite.com"
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Location <span style={optionalStyle}>(Optional)</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Your city and country"
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Interests <span style={optionalStyle}>(Optional)</span>
            </label>
            <input
              type="text"
              name="interests"
              value={formData.interests}
              onChange={handleChange}
              placeholder="e.g., Programming, Design, Music, Hiking"
              style={inputStyle}
            />
            <div style={hintStyle}>
              Separate multiple interests with commas
            </div>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Skills <span style={optionalStyle}>(Optional)</span>
            </label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g., JavaScript, React, Node.js, Design"
              style={inputStyle}
            />
            <div style={hintStyle}>
              Separate multiple skills with commas
            </div>
          </div>

          <div style={buttonGroupStyle}>
            <div style={leftButtonsStyle}>
              {mode === 'edit' && (
                <button 
                  type="button" 
                  onClick={() => setShowDeleteConfirm(true)}
                  style={deleteButtonInFormStyle}
                  disabled={isSubmitting}
                >
                  Delete Profile
                </button>
              )}
            </div>
            <div style={rightButtonsStyle}>
              <button 
                type="button" 
                onClick={onClose} 
                style={cancelButtonStyle}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                style={mode === 'create' ? createButtonStyle : updateButtonStyle}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span style={loadingTextStyle}>
                    <span style={spinnerStyle}></span> Processing...
                  </span>
                ) : mode === 'create' ? 'Create Profile' : 'Update Profile'}
              </button>
            </div>
          </div>
        </form>

        <div style={footerStyle}>
          <p style={footerTextStyle}>
            Your profile photo and name are automatically imported from Google.
            {mode === 'edit' && ' Changes will be reflected immediately in the community grid.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Styles
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 11000,
  padding: '1rem'
};

const popupStyle = {
  backgroundColor: '#2c3e50',
  border: '1px solid #34495e',
  borderRadius: '16px',
  padding: '2rem',
  width: '90%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  animation: 'modalFadeIn 0.3s ease'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid #34495e'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.8rem',
  cursor: 'pointer',
  color: '#95a5a6',
  padding: '0.25rem',
  borderRadius: '4px',
  lineHeight: 1
};

const currentInfoStyle = {
  backgroundColor: 'rgba(52, 73, 94, 0.3)',
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '1.5rem',
  borderLeft: '4px solid #3498db'
};

const currentInfoTextStyle = {
  margin: '0 0 0.75rem 0',
  color: '#bdc3c7',
  fontSize: '0.9rem'
};

const previewSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};

const previewImageStyle = {
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid #3498db'
};

const previewInfoStyle = {
  flex: 1
};

const previewNameStyle = {
  display: 'block',
  color: '#ecf0f1',
  marginBottom: '0.25rem'
};

const previewEmailStyle = {
  margin: '0 0 0.5rem 0',
  fontSize: '0.85rem',
  color: '#95a5a6'
};

const deleteButtonStyle = {
  backgroundColor: 'transparent',
  color: '#e74c3c',
  border: '1px solid #e74c3c',
  padding: '0.25rem 0.75rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  transition: 'all 0.2s ease'
};

const deleteConfirmOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 12000
};

const deleteConfirmStyle = {
  backgroundColor: '#2c3e50',
  border: '1px solid #34495e',
  borderRadius: '12px',
  padding: '2rem',
  width: '90%',
  maxWidth: '400px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
};

const deleteConfirmTitleStyle = {
  margin: '0 0 1rem 0',
  color: '#e74c3c',
  fontSize: '1.5rem'
};

const deleteConfirmTextStyle = {
  margin: '0 0 1.5rem 0',
  color: '#bdc3c7',
  lineHeight: '1.5',
  fontSize: '0.95rem'
};

const deleteConfirmButtonsStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end'
};

const deleteCancelButtonStyle = {
  padding: '0.75rem 1.5rem',
  border: '1px solid #34495e',
  borderRadius: '8px',
  backgroundColor: 'transparent',
  color: '#bdc3c7',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '500'
};

const deleteConfirmButtonStyle = {
  padding: '0.75rem 1.5rem',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#e74c3c',
  color: 'white',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const fieldGroupStyle = {
  display: 'flex',
  flexDirection: 'column'
};

const labelStyle = {
  marginBottom: '0.5rem',
  fontWeight: '600',
  color: '#ecf0f1',
  fontSize: '0.95rem'
};

const optionalStyle = {
  color: '#95a5a6',
  fontWeight: 'normal',
  fontSize: '0.85rem'
};

const inputStyle = {
  padding: '0.75rem',
  border: '1px solid #34495e',
  borderRadius: '8px',
  backgroundColor: '#1a252f',
  color: '#ecf0f1',
  fontSize: '1rem',
  transition: 'border-color 0.2s ease'
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '100px',
  fontFamily: 'inherit'
};

const charCountStyle = {
  textAlign: 'right',
  fontSize: '0.8rem',
  color: '#95a5a6',
  marginTop: '0.25rem'
};

const hintStyle = {
  fontSize: '0.8rem',
  color: '#95a5a6',
  fontStyle: 'italic',
  marginTop: '0.25rem'
};

const buttonGroupStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '1rem',
  gap: '1rem'
};

const leftButtonsStyle = {
  flex: 1
};

const rightButtonsStyle = {
  display: 'flex',
  gap: '1rem'
};

const deleteButtonInFormStyle = {
  padding: '0.75rem 1.5rem',
  border: '1px solid #e74c3c',
  borderRadius: '8px',
  backgroundColor: 'transparent',
  color: '#e74c3c',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '500',
  transition: 'all 0.2s ease'
};

const cancelButtonStyle = {
  padding: '0.75rem 1.5rem',
  border: '1px solid #34495e',
  borderRadius: '8px',
  backgroundColor: 'transparent',
  color: '#bdc3c7',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '500',
  transition: 'all 0.2s ease'
};

const createButtonStyle = {
  padding: '0.75rem 1.5rem',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#27ae60',
  color: 'white',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '600',
  transition: 'all 0.2s ease'
};

const updateButtonStyle = {
  ...createButtonStyle,
  backgroundColor: '#3498db'
};

const loadingTextStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const spinnerStyle = {
  display: 'inline-block',
  width: '16px',
  height: '16px',
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: 'white',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const footerStyle = {
  marginTop: '1.5rem',
  paddingTop: '1.5rem',
  borderTop: '1px solid #34495e'
};

const footerTextStyle = {
  margin: 0,
  fontSize: '0.85rem',
  color: '#95a5a6',
  lineHeight: '1.4'
};

// Add animations
const styleSheet = document.createElement('style');
styleSheet.innerText = `
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(styleSheet);

export default CreateProfilePopup;