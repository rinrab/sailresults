import { useNavigate } from "react-router-dom";
import { Content, Layout, NavBar } from "./common";
import React from "react";
import { Button, Field, Input, Text } from "@fluentui/react-components";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, User, signOut } from "firebase/auth";

const auth = getAuth();

export function AccountSignIn() {
  const navigate = useNavigate();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const submit = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, username, password);
      navigate("../me");
    } catch (error) {
      setError(error.toString());
    }
  };

  return (
    <Layout>
      <NavBar title="Account" subtitle="Sign In" back="../.." />
      <Content>
        <form style={{ display: "flex", flexDirection: "column", gap: 8 }} onSubmit={submit}>
          <Field label="Email Address">
            <Input type="email" value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>

          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>

          <Text>{error}</Text>

          <Button type="submit">Sign In</Button>
        </form>
      </Content>
    </Layout>
  );
}

export function AccountSignUp() {
  const navigate = useNavigate();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const submit = async (e) => {
    e.preventDefault();

    try {
      await createUserWithEmailAndPassword(auth, username, password);
      navigate("../me");
    } catch (error) {
      setError(error.toString());
    }
  };

  return (
    <Layout>
      <NavBar title="Account" subtitle="Sign Up" back="../.." />
      <Content>
        <form style={{ display: "flex", flexDirection: "column", gap: 8 }} onSubmit={submit}>
          <Field label="Email Address">
            <Input type="email" value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>

          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>

          <Text>{error}</Text>

          <Button type="submit">Sign Up</Button>
        </form>
      </Content>
    </Layout>
  );
}

function UserDetails(props: { user: User, update: () => void }) {
  return <>
    <Field label="Username">
      <Input disabled value={props.user.email} />
    </Field>

    <div style={{ display: "flex", gap: 8 }}>
      <Button onClick={() => alert("not implemented")}>Change Password</Button>
      <Button onClick={() => signOut(auth).then(() => props.update())}>Sign Out</Button>
      <Button onClick={() => props.user.delete().then(() => props.update())}>Delete User</Button>
    </div>
  </>;
}

function AnonymousOptions() {
  const navigate = useNavigate();

  return <>
    <div style={{ display: "flex", gap: 8 }}>
      <Button onClick={() => navigate("../signin")}>Sign In</Button>
      <Button onClick={() => navigate("../signup")}>Sign Up</Button>
    </div>
  </>;
}

export function AccountMe() {
  const [isReady, setIsReady] = React.useState(false);
  const [dummy, setDummy] = React.useState(1);

  auth.authStateReady().then(() => setIsReady(true));

  const update = () => {
    setDummy(dummy + 1);
  };

  return (
    <Layout>
      <NavBar title="Account" subtitle="Information" back="../.." />
      <Content>
        {isReady ? (auth.currentUser ? 
                      <UserDetails user={auth.currentUser} update={update} /> :
                      <AnonymousOptions /> ) 
                 : "Loading..."}
      </Content>
    </Layout>
  );
}
