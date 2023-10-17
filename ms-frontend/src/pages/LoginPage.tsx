// Login.tsx

import { useState } from 'react';
import { Input, Button, Center } from '@chakra-ui/react';
import { atom, useAtom } from 'jotai';
import { fetchUserLogin } from '@/api';

export const userAtom = atom({ isLoggedIn: false, username: '' });

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [, setUser] = useAtom(userAtom);

  const handleLogin = async () => {
    try {
      const user = await fetchUserLogin(username, password);
      setUser({ isLoggedIn: true, username: user.username });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Center>
      <div>
        <h1>Login</h1>
        <Input
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button onClick={handleLogin}>Login</Button>
      </div>
    </Center>
  );
}

export default LoginPage;
