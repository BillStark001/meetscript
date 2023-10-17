// Profile.tsx

import { useState } from 'react';
import { Input, Button, Center } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { userAtom } from './LoginPage';

function Profile() {
  const [user, setUser] = useAtom(userAtom);
  const [newUsername, setNewUsername] = useState(user.username);

  const handleUpdateProfile = async () => {
    // try {
    //   await updateProfileAPI(user.username, newUsername);
    //   setUser({ isLoggedIn: true, username: newUsername });
    // } catch (error) {
    //   console.error(error);
    // }
  };

  return (
    <Center>
      <div>
        <h1>Profile</h1>
        <Input
          type="text"
          placeholder="new username"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />
        <Button onClick={handleUpdateProfile}>Save</Button>
      </div>
    </Center>
  );
}

export default Profile;
