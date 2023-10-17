


export const fetchApiRoot = async () => {
  try {
    const res = await fetch('/api');
    return await res.json();
  } catch (e) {
    return { detail: String(e) };
  }
};

export const fetchUserLogin = async (username: string, password: string) => {
  try {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    };
    const res = await fetch('/api/user/login', requestOptions);
    return await res.json();
  } catch (e) {
    return { detail: String(e) };
  }
};

