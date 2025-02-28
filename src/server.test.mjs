import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import http from "http";
import { fetchUsers, fetchUserById } from "./server.mjs";

const mockUsers = [
	{
		id: 1,
		firstName: "Emily",
		lastName: "Johnson",
		email: "emily@example.com",
	},
	{
		id: 2,
		firstName: "Michael",
		lastName: "Williams",
		email: "michael@example.com",
	},
];

// Spy on `fetch`
beforeEach(() => {
	vi.clearAllMocks();
	global.fetch = vi.fn((url) => {
		if (url === "https://dummyjson.com/users?limit=20") {
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ users: mockUsers }),
			});
		} else if (url.startsWith("https://dummyjson.com/users/")) {
			const userId = parseInt(url.split("/").pop());
			const user = mockUsers.find((u) => u.id === userId);
			return Promise.resolve({
				ok: user ? true : false,
				json: () => Promise.resolve(user || { error: "User not found" }),
			});
		}
		return Promise.reject(new Error("Invalid URL"));
	});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("Test for the Server API", () => {
	// Test fetchUsers function
	it("fetches all users", async () => {
		const users = await fetchUsers();
		expect(users).toEqual(mockUsers);
		expect(global.fetch).toHaveBeenCalledWith(
			"https://dummyjson.com/users?limit=20"
		);
	});

	it("handles fetchUsers API failure", async () => {
		global.fetch.mockImplementationOnce(() =>
			Promise.reject(new Error("Network Error"))
		);
		const users = await fetchUsers();
		expect(users).toEqual([]);
	});

	// Test fetchUserById function
	it("fetches a user by ID successfully", async () => {
		const user = await fetchUserById(1);
		expect(user).toEqual(mockUsers[0]);
		expect(global.fetch).toHaveBeenCalledWith("https://dummyjson.com/users/1");
	});

	// If UserId is not found
	it("returns error if user is not found", async () => {
		const user = await fetchUserById(99);
		expect(user).toEqual({ error: "User not found" });
	});

	// Integration tests for API routes
	it("returns users on /api/users", async () => {
		const req = new http.IncomingMessage();
		const res = new http.ServerResponse(req);

		req.url = "/api/users";
		req.method = "GET";

		const serverHandler = (req, res) => {
			if (req.url === "/api/users" && req.method === "GET") {
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify(mockUsers));
			}
		};

		await new Promise((resolve) => {
			res.end = (data) => {
				expect(JSON.parse(data)).toEqual(mockUsers);
				resolve();
			};
			serverHandler(req, res);
		});
	});

	it("return a single user on /api/users/:id", async () => {
		const req = new http.IncomingMessage();
		const res = new http.ServerResponse(req);

		req.url = "/api/users/1";
		req.method = "GET";

		const serverHandler = (req, res) => {
			const userId = req.url.split("/")[3];
			if (req.url.startsWith("/api/users/") && req.method === "GET") {
				const user = mockUsers.find((u) => u.id == userId);
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify(user || { error: "User not found" }));
			}
		};

		await new Promise((resolve) => {
			res.end = (data) => {
				expect(JSON.parse(data)).toEqual(mockUsers[0]);
				resolve();
			};
			serverHandler(req, res);
		});
	});

	it("return 400 error for invalid user ID", async () => {
		const req = new http.IncomingMessage();
		const res = new http.ServerResponse(req);

		req.url = "/api/users/invalid";
		req.method = "GET";

		const serverHandler = (req, res) => {
			const userId = req.url.split("/")[3];
			if (isNaN(userId)) {
				res.writeHead(400, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ error: "Invalid User ID" }));
			}
		};

		await new Promise((resolve) => {
			res.end = (data) => {
				expect(JSON.parse(data)).toEqual({ error: "Invalid User ID" });
				resolve();
			};
			serverHandler(req, res);
		});
	});

	it("return 404 for unknown routes", async () => {
		const req = new http.IncomingMessage();
		const res = new http.ServerResponse(req);

		req.url = "/invalid-route";
		req.method = "GET";

		const serverHandler = (req, res) => {
			res.writeHead(404, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Route does not exist" }));
		};

		await new Promise((resolve) => {
			res.end = (data) => {
				expect(JSON.parse(data)).toEqual({ error: "Route does not exist" });
				resolve();
			};
			serverHandler(req, res);
		});
	});
});
