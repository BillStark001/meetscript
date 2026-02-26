import React, { useState } from 'react';
import {
  Box,
  Input,
  IconButton,
  Stack,
  Wrap,
  Editable,
} from '@chakra-ui/react';

// Inline icon replacements (no @chakra-ui/icons in v3)
const AddIcon = () => <span style={{ fontWeight: 'bold' }}>+</span>;
const MinusIcon = () => <span style={{ fontWeight: 'bold' }}>−</span>;

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
      <Stack gap={1}>
        {Object.entries(data).map(([key, value], i) => (
          <Wrap gap={1} mt={i === 0 ? 0 : 1} key={key}>
            {readOnly?.has(key) ?
              <label style={{ width: String(width), margin: '4px', padding: '4px' }}>
                {readOnly.get(key)}
              </label> :

              <Editable.Root
                w={width}
                value={i === tempIndex ? tempKey : key}
                onValueChange={(e) => setTempKey(e.value)}
                onValueCommit={(e) => {
                  handleChangeKey(key, e.value);
                  setTempIndex(-1);
                }}
              >
                <Editable.Preview m={1} p={1} />
                <Editable.Input
                  p={1}
                  onFocus={() => {
                    setTempKey(key);
                    setTempIndex(i);
                  }}
                />
              </Editable.Root>
            }

            <Input
              p={1}
              w={width}
              value={value}
              onChange={(e) => handleChangeValue(key, e.target.value)}
            />
            <IconButton
              aria-label="Remove pair"
              disabled={readOnly?.has(key)}
              onClick={() => handleRemovePair(key)}
            >
              <MinusIcon />
            </IconButton>
          </Wrap>
        ))}
      </Stack>
      <Wrap gap={1} mt={1}>
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
          onClick={handleAddPair}
        >
          <AddIcon />
        </IconButton>
      </Wrap>
    </Box>
  );
};

export default EditableKeyValuePairs;
