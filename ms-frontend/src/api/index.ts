export const fetchApiRoot = async () => {
  try {
    const res = await fetch('/api');
    return await res.json();
  } catch (e) {
    return { error: String(e) };
  }
};

