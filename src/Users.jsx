import React from "react";
import "./users.css";
import { useEffect, useState } from "react";

export default function Users() {
	const [users, setUsers] = useState([]);
	const [error, setError] = useState(null);
	const [selected, setSelected] = useState(null);

	useEffect(() => {
		fetch("https://dummyjson.com/users?limit=20")
			.then((res) => {
				if (!res.ok) {
					throw new Error("No response from the API");
				}
				return res.json();
			})
			.then((data) => {
				setUsers(data.users);
				// console.log(data.users);
			})
			.catch((err) => {
				setError(err.message);
			});
	}, []);

	if (error) return <p>Error: {error}</p>;

	return (
		<div>
			<h1>Users List</h1>
			<ol>
				{users.map((user) => (
					<li
						className='user'
						key={user.id}
						onClick={() => setSelected(selected === user.id ? null : user.id)}
					>
						<strong>
							{user.firstName} {user.lastName}
						</strong>{" "}
						- {user.email}
						{/* Dropdown */}
						{selected === user.id && (
							<div className='dropdown'>
								<p>
									<strong>First Name: {user.firstName}</strong>
								</p>
								<p>
									<strong>Last Name: {user.lastName}</strong>
								</p>
								<p>
									<strong>Email: {user.email}</strong>
								</p>
								<p>
									<strong>Gender: {user.gender}</strong>
								</p>
							</div>
						)}
					</li>
				))}
			</ol>
		</div>
	);
}
