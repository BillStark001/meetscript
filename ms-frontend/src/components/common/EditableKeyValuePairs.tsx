import React, { useState } from 'react';
import {
  Box,
  Input,
  IconButton,
  Stack,
  Wrap,
  Editable,
  EditableInput,
  EditablePreview,
  FormLabel,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';

export type EditableKeyValuePairsProps = {
  data: Record<string, string>;
  setData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  readOnly?: Map<string, undefined | string>;
  width?: number | string;
};

export const EditableKeyValuePairs = ({ data, setData, readOnly, width }: EditableKeyValuePairsProps) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [tempKey, setTempKey] = useState('');
  const [tempIndex, setTempIndex] = useState(-1);

  width = width ?? '160px';

  const handleAddPair = () => {
    if (newKey.trim() && newValue) {
      setData((prevPairs) => ({
        ...prevPairs,
        [newKey.trim()]: newValue,
      }));
      setNewKey('');
      setNewValue('');
    }
  };

  const handleRemovePair = (key: string) => {
    setData((prevPairs) => {
      const updatedPairs = { ...prevPairs };
      delete updatedPairs[key];
      return updatedPairs;
    });
  };

  const handleChangeKey = (key: string, newKey: string) => {
    if (newKey) {
      setData((prevPairs) => {
        const entries = Object.entries(prevPairs).map(([k, v]) => {
          if (k === key)
            return [newKey, v];
          return [k, v];
        });
        return Object.fromEntries(entries);
      });
    }
  };

  const handleChangeValue = (key: string, newValue: string) => {
    setData((prevPairs) => ({
      ...prevPairs,
      [key]: newValue,
    }));
  };

  return (
    <Box>
      <Stack spacing={1}>
        {Object.entries(data).map(([key, value], i) => (
          <Wrap spacing={1} mt={i == 0 ? 0 : 1} key={key}>
            {readOnly?.has(key) ?
              <FormLabel w={width} m={1} p={1}>
                {readOnly.get(key)}
              </FormLabel> :

              <Editable
                w={width}
                value={i == tempIndex ? tempKey : key}
                onFocus={() => {
                  setTempKey(key);
                  setTempIndex(i);
                }}
                onChange={(e) => setTempKey(e)}
                onSubmit={(e) => {
                  handleChangeKey(key, e);
                  setTempIndex(-1);
                }}
              >
                <EditablePreview m={1} p={1} />
                <Input p={1} as={EditableInput} />
              </Editable>
            }

            <Input
              p={1}
              w={width}
              value={value}
              onChange={(e) => handleChangeValue(key, e.target.value)}
            />
            <IconButton
              aria-label="Remove pair"
              icon={<MinusIcon />}
              isDisabled={readOnly?.has(key)}
              onClick={() => handleRemovePair(key)}
            />
          </Wrap>
        ))}
      </Stack>
      <Wrap spacing={1} mt={1}>
        <Input
          p={1}
          w={width}
          placeholder="Enter key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
        <Input
          p={1}
          w={width}
          placeholder="Enter value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
        />
        <IconButton
          aria-label="Add pair"
          icon={<AddIcon />}
          onClick={handleAddPair}
        />
      </Wrap>
    </Box>
  );
};

export default EditableKeyValuePairs;
