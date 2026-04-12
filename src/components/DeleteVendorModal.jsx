import React, { useState, useEffect } from 'react';
import {
  Modal, Box, Typography, Button, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel, IconButton,
  CircularProgress, Alert,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';

const QUESTIONS = [
  {
    id: 1,
    question: "the most successfull franchies in ipl",
    options: [
      { id: 'op1', text: 'csk', correct: true },
      { id: 'op2', text: 'aus', correct: false },
      { id: 'op3', text: 'eng', correct: false },
    ]
  },
  {
    id: 2,
    question: "which sports is ipl",
    options: [
      { id: 'op1', text: 'footbal', correct: false },
      { id: 'op2', text: 'cricket', correct: true },
      { id: 'op3', text: 'kabadi', correct: false },
    ]
  },
  {
    id: 3,
    question: "who is no 7",
    options: [
      { id: 'op1', text: 'dhoni', correct: true },
      { id: 'op2', text: 'virat kolhi', correct: false },
      { id: 'op3', text: 'rohitsharma', correct: false },
    ]
  }
];

const DeleteVendorModal = ({ open, onClose, onConfirm, vendorName }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const randomQ = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
      setCurrentQuestion(randomQ);
      setSelectedOption('');
      setError('');
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!selectedOption) {
      setError('Please select an answer');
      return;
    }

    const option = currentQuestion.options.find(o => o.id === selectedOption);
    if (!option || !option.correct) {
      setError('Incorrect answer! Please try again.');
      // Randomize again on failure
      const randomQ = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
      setCurrentQuestion(randomQ);
      setSelectedOption('');
      return;
    }

    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError('Failed to delete vendor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={loading ? undefined : onClose}>
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 400 }, bgcolor: 'background.paper', borderRadius: 4,
        boxShadow: 24, p: 4, outline: 'none'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningRoundedIcon /> Delete Vendor
          </Typography>
          {!loading && <IconButton onClick={onClose} size="small"><CloseRoundedIcon /></IconButton>}
        </Box>

        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          This will permanently delete <strong>{vendorName}</strong> and all their associated data. This action cannot be undone.
        </Typography>

        {currentQuestion && (
          <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
            <FormLabel component="legend" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary', fontSize: '0.9rem' }}>
              Security Question: {currentQuestion.question}
            </FormLabel>
            <RadioGroup value={selectedOption} onChange={(e) => { setSelectedOption(e.target.value); setError(''); }}>
              {currentQuestion.options.map((opt) => (
                <FormControlLabel key={opt.id} value={opt.id} control={<Radio size="small" />} label={opt.text} />
              ))}
            </RadioGroup>
          </FormControl>
        )}

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '0.75rem' }}>{error}</Alert>}

        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Button fullWidth variant="outlined" onClick={onClose} disabled={loading} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button fullWidth variant="contained" color="error" onClick={handleConfirm} disabled={loading}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Delete'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default DeleteVendorModal;
