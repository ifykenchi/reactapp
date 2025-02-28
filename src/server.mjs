import http from "http";

const PORT = 3000;

// fetch all users
export async function fetchUsers() {
	try {
		const response = await fetch("https://dummyjson.com/users?limit=20");
		if (!response.ok) {
			throw new Error("No response from the API");
		}
		const data = await response.json();
		return data.users;
	} catch (error) {
		console.error(`Error: ${error}`);
		return [];
	}
}

// fetch a single user by id
export async function fetchUserById(userId) {
	try {
		const response = await fetch(`https://dummyjson.com/users/${userId}`);
		if (!response.ok) {
			throw new Error("User not found");
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error(`Error: ${error}`);
		return { error: "User not found" };
	}
}

const server = http.createServer(async (req, res) => {
	const reqUrl = new URL(req.url, `http://${req.headers.host}`);

	if (reqUrl.pathname === "/api/users" && req.method === "GET") {
		const users = await fetchUsers();

		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify(users));
	} else if (
		reqUrl.pathname.startsWith("/api/users/") &&
		req.method === "GET"
	) {
		const userId = reqUrl.pathname.split("/")[3];

		// confirm userId is a number
		if (!userId || isNaN(userId)) {
			res.writeHead(400, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Invalid User ID" }));
			return;
		}

		const user = await fetchUserById(userId);

		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify(user));
	} else {
		res.writeHead(404, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: "Route does not exist" }));
	}
});

server.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

export default server;
