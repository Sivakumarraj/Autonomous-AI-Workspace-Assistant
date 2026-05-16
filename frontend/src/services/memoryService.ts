const API_URL = "http://127.0.0.1:8000";

export async function getMemories() {
  try {
    const response = await fetch(`${API_URL}/memory/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    console.log("Memory API Response:", data);

    return data;

  } catch (error) {
    console.error("Failed to fetch memories:", error);
    return [];
  }
}