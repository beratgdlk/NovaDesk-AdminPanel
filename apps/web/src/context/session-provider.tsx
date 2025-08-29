type UserShowResponse = {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
};
import { createContext, useContext } from "react";

const SessionContext = createContext<UserShowResponse | null>(null);

const SessionProvider = ({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserShowResponse;
}) => {
  return (
    <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
  );
};

const useSession = () => {
  const user = useContext(SessionContext);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export { SessionProvider, useSession };
