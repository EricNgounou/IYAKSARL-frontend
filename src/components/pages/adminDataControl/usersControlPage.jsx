import { useEffect, useState } from 'react';
import { fetchAllUsers } from '../../helpers';
import { Spinner } from '../../Dynamic';
export function UsersControlPage() {
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    fetchAllUsers(setAllUsers);
  }, []);

  return (
    <section id="users_control" className="main">
      {allUsers.length ? (
        <>
          <section className="left_side">
            <ul></ul>
            <ul className="users_list">
              {allUsers.map((user) => (
                <li key={user._id} className="user_list_item">
                  {user.username}
                </li>
              ))}
            </ul>
          </section>

          <section className="control_side_display">
            {/* User details will be displayed here */}
          </section>
        </>
      ) : (
        <Spinner />
      )}
    </section>
  );
}
