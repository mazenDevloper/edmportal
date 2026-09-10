
const BIN_ID = "68e3800cae596e708f07cf32";
const MASTER_KEY = "$2a$10$SYrYv.ct8hiMU9YeUxEQ.ecRkOrTqs.TDchJRV3wW.aKJnDXy2oVy";

export async function fetchBin() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: {
        "X-Master-Key": MASTER_KEY,
      },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error("Failed to fetch bin");
    const data = await res.json();
    return data.record;
  } catch (error) {
    console.error("Error fetching bin:", error);
    return null;
  }
}

export async function updateBin(data: any) {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": MASTER_KEY,
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update bin");
    return await res.json();
  } catch (error) {
    console.error("Error updating bin:", error);
    throw error;
  }
}
