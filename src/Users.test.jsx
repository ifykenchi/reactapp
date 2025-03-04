import React from "react";
import {
	render,
	screen,
	waitFor,
	within,
	cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Users from "./Users";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

const mockUsers = [
	{
		id: 1,
		firstName: "Emily",
		lastName: "Johnson",
		email: "emily.johnson@x.dummyjson.com",
		gender: "female",
	},
	{
		id: 2,
		firstName: "Michael",
		lastName: "Williams",
		email: "michael.williams@x.dummyjson.com",
		gender: "male",
	},
];

beforeEach(() => {
	vi.clearAllMocks();
	global.fetch = vi.fn((url) => {
		if (url === "/api/users") {
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockUsers),
			});
		} else if (url.startsWith("/api/users/")) {
			const userId = url.split("/").pop();
			const user = mockUsers.find((u) => u.id === parseInt(userId));
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve(user),
			});
		}
		return Promise.reject(new Error("Invalid URL"));
	});
	render(<Users />);
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("Users", () => {
	// Renders page heading
	it("renders the page heading", () => {
		expect(screen.getByText(/users list/i)).toBeInTheDocument();
	});

	// If Mock API call is succeeds
	it("fetches and displays users", async () => {
		await waitFor(() => {
			expect(screen.getByText(/emily johnson/i)).toBeInTheDocument();
			expect(screen.getByText(/michael williams/i)).toBeInTheDocument();
		});
	});

	// If clicking a user toggles the dropdown functionality
	it("toggles dropdown when clicked", async () => {
		await waitFor(() =>
			expect(screen.getAllByRole("listitem")).toHaveLength(2)
		);

		const userList = screen.getByRole("list");
		const userItems = within(userList).getAllByRole("listitem");

		const emilyItem = userItems.find((item) =>
			item.textContent.includes("Emily Johnson")
		);
		expect(emilyItem).toBeInTheDocument();

		await userEvent.click(emilyItem);
		await waitFor(() =>
			expect(screen.getByText(/first name: emily/i)).toBeInTheDocument()
		);

		await userEvent.click(emilyItem);
		await waitFor(() =>
			expect(screen.queryByText(/first name: emily/i)).not.toBeInTheDocument()
		);
	});

	// Shows error message when API call fails
	it("shows error message when API call fails", async () => {
		global.fetch.mockImplementationOnce(() =>
			Promise.reject(new Error("API Error"))
		);

		cleanup();
		render(<Users />);

		await waitFor(() =>
			expect(screen.getByText("Error: API Error")).toBeInTheDocument()
		);
	});

	// Accessibility Test
	it("renders with correct structure", async () => {
		await waitFor(() => {
			const headings = screen.getAllByRole("heading", { level: 1 });
			expect(headings).toHaveLength(1);
		});

		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
			"Users List"
		);
	});

	// Spying Test
	it("calls fetch with the correct URL when a user is clicked", async () => {
		await waitFor(() =>
			expect(screen.getAllByRole("listitem")).toHaveLength(2)
		);

		const userList = screen.getByRole("list");
		const userItems = within(userList).getAllByRole("listitem");
		const emilyItem = userItems.find((item) =>
			item.textContent.includes("Emily Johnson")
		);

		expect(emilyItem).toBeInTheDocument();
		await userEvent.click(emilyItem);
		expect(global.fetch).toHaveBeenCalledWith("/api/users/1");
	});

	// Spy test for when same user is clicked twice
	it("does not call fetch again when same user is clicked twice", async () => {
		await waitFor(() =>
			expect(screen.getAllByRole("listitem")).toHaveLength(2)
		);

		const userList = screen.getByRole("list");
		const userItems = within(userList).getAllByRole("listitem");
		const emilyItem = userItems.find((item) =>
			item.textContent.includes("Emily Johnson")
		);

		expect(emilyItem).toBeInTheDocument();
		await userEvent.click(emilyItem);
		await userEvent.click(emilyItem);
		expect(global.fetch).toHaveBeenCalledTimes(2); // two because of the useEffect fetch call and then the one for emily when it is clicked
	});
});
