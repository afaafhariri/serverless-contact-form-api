export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event));
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Hello from Lambda!" }),
  };
};
