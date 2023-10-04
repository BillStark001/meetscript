import React from 'react';
import { createStandaloneToast } from '@chakra-ui/react';

const { toast } = createStandaloneToast();

export const showMessage = (payload: {
  title?: React.ReactNode;
  desc?: React.ReactNode;
  status: 'info' | 'warning' | 'success' | 'error';
}) => {
  const { title, desc, status } = payload;
  toast({
    title,
    description: desc,
    status,
    position: 'top',
    isClosable: true,
  });
};
