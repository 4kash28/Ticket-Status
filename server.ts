import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import { createServer } from "http";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Define the Ticket type
export interface Ticket {
  id: string;
  userName: string;
  issueDescription: string;
  createdAt: number;
  status: "pending" | "resolved";
}

// In-memory store for tickets
let tickets: Ticket[] = [
  {
    id: uuidv4(),
    userName: "Alice Smith",
    issueDescription: "Cannot access the VPN from home network.",
    createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    status: "pending",
  },
  {
    id: uuidv4(),
    userName: "Bob Jones",
    issueDescription: "Printer on 3rd floor is out of toner.",
    createdAt: Date.now() - 1000 * 60 * 30, // 30 mins ago
    status: "pending",
  },
  {
    id: uuidv4(),
    userName: "Charlie Brown",
    issueDescription: "Needs Adobe Creative Cloud license assigned.",
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    status: "pending",
  },
  {
    id: uuidv4(),
    userName: "Alice Smith",
    issueDescription: "Monitor flickering intermittently.",
    createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    status: "pending",
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  
  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Send initial state to the newly connected client
    socket.emit("sync_tickets", tickets);

    // Handle adding a new ticket
    socket.on("add_ticket", (data: { userName: string; issueDescription: string }) => {
      const newTicket: Ticket = {
        id: uuidv4(),
        userName: data.userName,
        issueDescription: data.issueDescription,
        createdAt: Date.now(),
        status: "pending",
      };
      tickets.push(newTicket);
      // Broadcast the updated list to all clients
      io.emit("sync_tickets", tickets);
    });

    // Handle resolving/deleting a ticket
    socket.on("resolve_ticket", (ticketId: string) => {
      tickets = tickets.filter(t => t.id !== ticketId);
      // Broadcast the updated list to all clients
      io.emit("sync_tickets", tickets);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
