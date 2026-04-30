export async function handler() {
  const res = await fetch("https://data.ottrec.ca/export/latest.json");
  const data = await res.json();
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}
