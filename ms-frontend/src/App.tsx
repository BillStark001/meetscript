// src/components/Layout.js
import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import TestApp from './TestApp';

export const AppLayout = ({ children }: React.PropsWithChildren<object>) => {
  return (
    <>
      <Box minHeight="100vh">
        <Box bg='blue.500' p={4}>
          <Container maxW="container.xl">
            test header
          </Container>
        </Box>
        <Container maxW="container.xl" pt={8}>
          {children}
        </Container>
      </Box>
    </>
  );
};

export const App = () => {
  return <AppLayout>
    <TestApp />
  </AppLayout>
}

export default App;
