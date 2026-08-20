import React from "react";
import { auth } from "./storage-firebase";
import { User } from "firebase/auth";

export const FirebaseAuthContext = React.createContext<{ isReady: boolean, user: User | null }>(null);

export function FirebaseAuthProvider({children}) {
  const [user, setUser] = React.useState<User | null>();
  const [isReady, setIsReady] = React.useState<boolean>(false);

  React.useEffect(() => {
    return auth.onAuthStateChanged((newUser) => {
      setUser(newUser);
      setIsReady(true);
    });
  });

  return <FirebaseAuthContext.Provider value={{ isReady, user }}>
    {children}
  </FirebaseAuthContext.Provider>;
}
