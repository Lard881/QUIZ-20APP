import { RequestHandler } from "express";
// Demo response shape
interface DemoResponse { message: string }

export const handleDemo: RequestHandler = (req, res) => {
  const response: DemoResponse = {
    message: "Hello from Express server",
  };
  res.status(200).json(response);
};
