// Profile.tsx

import { useState } from 'react';
import { Input, Button } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { userAtom } from './LoginPage';

const ProfilePage = () => {
  const [user] = useAtom(userAtom);
  const [newUsername, setNewUsername] = useState(user.username);

  const handleUpdateProfile = async () => {
    // try {
    //   await updateProfileAPI(user.username, newUsername);
    //   setUser({ isLoggedIn: true, username: newUsername });
    // } catch (error) {
    //   console.error(error);
    // }
  };

  return <>
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
  </>;
}

export default ProfilePage;
