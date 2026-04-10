import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to login');
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A0E1A 0%, #1a1040 50%, #0A0E1A 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Orbs */}
      <Box
        sx={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 92, 252, 0.15) 0%, transparent 70%)',
          top: '-10%',
          right: '-5%',
          animation: 'pulse 8s infinite alternate',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)', opacity: 0.5 },
            '100%': { transform: 'scale(1.3)', opacity: 0.8 },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 217, 166, 0.1) 0%, transparent 70%)',
          bottom: '-5%',
          left: '-5%',
          animation: 'pulse2 10s infinite alternate',
          '@keyframes pulse2': {
            '0%': { transform: 'scale(1)', opacity: 0.4 },
            '100%': { transform: 'scale(1.4)', opacity: 0.7 },
          },
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Paper
          sx={{
            p: 5,
            width: 420,
            maxWidth: '90vw',
            borderRadius: 5,
            background: 'rgba(17, 24, 39, 0.7)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(148, 163, 184, 0.08)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #7C5CFC 0%, #00D9A6 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#fff',
                mb: 2,
                boxShadow: '0 8px 25px rgba(124, 92, 252, 0.3)',
              }}
            >
              J
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#F1F5F9', mb: 0.5 }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8' }}>
              Sign in to Jayple Admin Console
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 3,
                bgcolor: 'rgba(239, 68, 68, 0.08)',
                color: '#FF5C6C',
                border: '1px solid rgba(239, 68, 68, 0.15)',
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailRoundedIcon sx={{ color: '#94A3B8', fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockRoundedIcon sx={{ color: '#94A3B8', fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <VisibilityOffRoundedIcon sx={{ fontSize: '1.1rem' }} />
                      ) : (
                        <VisibilityRoundedIcon sx={{ fontSize: '1.1rem' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #7C5CFC 0%, #6C3FE8 100%)',
                boxShadow: '0 8px 25px rgba(124, 92, 252, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #9F85FD 0%, #7C5CFC 100%)',
                  boxShadow: '0 12px 35px rgba(124, 92, 252, 0.45)',
                },
                '&:disabled': {
                  background: 'rgba(124, 92, 252, 0.3)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
            </Button>
          </form>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default Login;
