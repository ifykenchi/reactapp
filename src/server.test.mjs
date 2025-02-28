import request from "supertest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import http from "http";
import { fetchUsers, fetchUserById } from "./server.mjs";

// Mocking global fetch
global.fetch = vi.fn();

let server;

beforeEach(() => {
	vi.clearAllMocks();
	server = http.createServer(async (req, res) => {
		const { default: app } = await import("./server.mjs");
		app.emit("request", req, res);
	});
});

afterEach(() => {
	server.close();
});

describe("Server API Tests", () => {
	// Test fetching all users
	it("should return a list of users", async () => {
		const mockUsers = [{ id: 1, firstName: "John", lastName: "Doe" }];
		fetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ users: mockUsers }),
		});

		const res = await request(server).get("/api/users");

		expect(res.status).toBe(200);
		expect(res.body).toEqual(mockUsers);
	});

	// Test fetching a user by ID
	it("should return a user by ID", async () => {
		const mockUser = { id: 1, firstName: "John", lastName: "Doe" };
		fetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockUser),
		});

		const res = await request(server).get("/api/users/1");

		expect(res.status).toBe(200);
		expect(res.body).toEqual(mockUser);
	});

	// Test invalid user ID (non-numeric)
	it("should return 400 for invalid user ID", async () => {
		const res = await request(server).get("/api/users/abc");

		expect(res.status).toBe(400);
		expect(res.body).toEqual({ error: "Invalid User ID" });
	});

	// Test API failure (mocking fetch failure)
	it("should handle API failure when fetching users", async () => {
		fetch.mockRejectedValueOnce(new Error("API Error"));

		const res = await request(server).get("/api/users");

		expect(res.status).toBe(200); // Because it returns an empty array
		expect(res.body).toEqual([]);
	});

	// Test API failure when fetching a user by ID
	it("should return user not found if API request fails", async () => {
		fetch.mockRejectedValueOnce(new Error("User not found"));

		const res = await request(server).get("/api/users/1");

		expect(res.status).toBe(200);
		expect(res.body).toEqual({ error: "User not found" });
	});

	// Test unknown route
	it("should return 404 for unknown routes", async () => {
		const res = await request(server).get("/unknown-route");

		expect(res.status).toBe(404);
		expect(res.body).toEqual({ error: "Route does not exist" });
	});

	// Spying tests
	it("should call fetchUsers when hitting /api/users", async () => {
		const spy = vi
			.spyOn(await import("./server.mjs"), "fetchUsers")
			.mockResolvedValue([]);

		await request(server).get("/api/users");

		expect(spy).toHaveBeenCalledTimes(1);
	});

	it("should call fetchUserById when hitting /api/users/:id", async () => {
		const spy = vi
			.spyOn(await import("./server.mjs"), "fetchUserById")
			.mockResolvedValue({});

		await request(server).get("/api/users/1");

		expect(spy).toHaveBeenCalledWith("1");
		expect(spy).toHaveBeenCalledTimes(1);
	});
});
