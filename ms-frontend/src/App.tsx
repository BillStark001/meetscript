// src/components/Layout.js
import React from 'react';
import { Box, Button, Container } from '@chakra-ui/react';
import ProviderPage from './pages/ProviderPage';
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import EntryPage from './pages/EntryPage';
import StandaloneTranscriptPage from './pages/StandaloneTranscriptPage';
import ConsumerPage from './pages/ConsumerPage';

export const AppLayout = ({ children }: React.PropsWithChildren<object>) => {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname.startsWith('/w/') || location.pathname == '/w') {
    return <>{children}</>;
  }

  return (
    <>
      <Box minHeight="100vh">
        <Box bg='blue.500' p={4}>
          <Button onClick={() => navigate('/')}> root </Button>
          <Button onClick={() => navigate('/provide')}> provide </Button>
          <Button onClick={() => navigate('/consume')}> consume </Button>
          <Button onClick={() => navigate('/auth')}> auth </Button>
          <Button onClick={() => navigate('/user')}> user </Button>
        </Box>
        <Container maxW="container.xl" pt={8}>
          {children}
        </Container>
      </Box>
    </>
  );
};

export const App = () => {
  return <HashRouter basename='/'>
    <AppLayout>
      <Routes>
        <Route path='/' element={<EntryPage />} />
        <Route path='/auth' element={<LoginPage />} />
        <Route path='/user' element={<ProfilePage />} />
        <Route path='/provide' element={<ProviderPage />} />
        <Route path='/consume' element={<ConsumerPage />} />
        <Route path='/w/t' element={<StandaloneTranscriptPage />} />
      </Routes>
    </AppLayout>
  </HashRouter>;
}

export default App;
