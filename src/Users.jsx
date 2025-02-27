import React from "react";
import "./users.css";
import { useEffect, useState } from "react";

export default function Users() {
	const [users, setUsers] = useState([]);
	const [error, setError] = useState(null);
	const [selectedUser, setSelectedUser] = useState(null);

	useEffect(() => {
		fetch("/api/users")
			.then((res) => {
				if (!res.ok) {
					throw new Error("No response from the Server");
				}
				return res.json();
			})
			.then((data) => {
				setUsers(data);
				// console.log(data);
			})
			.catch((err) => {
				setError(err.message);
			});
	}, []);

	const fetchUserDetails = (id) => {
		if (selectedUser && selectedUser.id === id) {
			setSelectedUser(null);
			return;
		}

		fetch(`/api/users/${id}`)
			.then((res) => res.json())
			.then((data) => setSelectedUser(data))
			.catch((err) => setError(err.message));
	};

	if (error) return <p>Error: {error}</p>;

	return (
		<div>
			<h1>Users List</h1>
			<ol>
				{users.map((user) => (
					<li
						className='user'
						key={user.id}
						onClick={() => fetchUserDetails(user.id)}
					>
						<strong>
							{user.firstName} {user.lastName}
						</strong>{" "}
						- {user.email}
						{/* Dropdown */}
						{selectedUser && selectedUser.id === user.id && (
							<div className='dropdown'>
								<p>
									<strong>First Name: {selectedUser.firstName}</strong>
								</p>
								<p>
									<strong>Last Name: {selectedUser.lastName}</strong>
								</p>
								<p>
									<strong>Email: {selectedUser.email}</strong>
								</p>
								<p>
									<strong>Gender: {selectedUser.gender}</strong>
								</p>
							</div>
						)}
					</li>
				))}
			</ol>
		</div>
	);
}
