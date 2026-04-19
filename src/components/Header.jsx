import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Header = () => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0984e3 0%, #2d3436 100%)',
        color: 'white',
        pt: 5,
        pb: 5,
        mb: 4,
        boxShadow: '0 10px 30px rgba(9, 132, 227, 0.3)',
        borderBottomLeftRadius: { xs: 20, md: 40 },
        borderBottomRightRadius: { xs: 20, md: 40 },
      }}
    >
      <Container maxWidth="xl">
        <Typography variant="h3" component="h1" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>
          ⚡ ChargeSense
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.85, mt: 1, fontWeight: 500, fontSize: '1.2rem' }}>
          Advanced EV Charging Stop Pattern & Fleet Analytics
        </Typography>
      </Container>
    </Box>
  );
};

export default Header;