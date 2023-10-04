import { Input, InputProps } from '@chakra-ui/react';

export const ReadOnlyInput = (props: InputProps) => (
  <Input
    bg='gray.100'
    { ...props } 
    readOnly={true}
  />
);