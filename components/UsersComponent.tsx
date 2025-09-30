import { useMsal } from "@azure/msal-react";
import axios from "axios";

const getUsers = async (accessToken: string) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_GRAPH_API}/users`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};

const UsersComponent = () => {
  const { instance, accounts } = useMsal();

  const fetchUsers = async () => {
    try {
      const response = await instance.acquireTokenSilent({
        scopes: ["User.Read.All"],
        account: accounts[0],
      });

      const users = await getUsers(response.accessToken);
      console.log(users);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
    }
  };

  return <button onClick={fetchUsers}>Récupérer les utilisateurs</button>;
};

export default UsersComponent;
