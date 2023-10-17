// src/components/Layout.js
import React from 'react';
import { Box, Button, Container } from '@chakra-ui/react';
import TestApp from './TestApp';
import { RouterProvider, createBrowserRouter, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Profile from './pages/ProfilePage';

export const AppLayout = ({ children }: React.PropsWithChildren<object>) => {
  const navigate = useNavigate();
  
  return (
    <>
      <Box minHeight="100vh">
        <Box bg='blue.500' p={4}>
          <Button onClick={() => navigate('/test')}> test </Button>
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

const router = createBrowserRouter([
  {
    path: '/', 
    element: <AppLayout>Router Root</AppLayout>
  },
  {
    path: '/auth',
    element: <AppLayout><LoginPage /></AppLayout>,
  },
  {
    path: '/user',
    element: <AppLayout><Profile /></AppLayout>,
  },
  {
    path: '/test',
    element:  <AppLayout><TestApp /></AppLayout>,
  },
]);

export const App = () => {
  return <RouterProvider router={router} />;
}

export default App;
