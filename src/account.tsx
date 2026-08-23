import { Link, useNavigate } from "react-router-dom";
import { Content, Layout, NavBar } from "./common";
import React from "react";
import { Button, Divider, Field, Input, Menu, MenuDivider, MenuGroupHeader, MenuItem, MenuPopover, MenuTrigger, Switch, Text } from "@fluentui/react-components";
import { PersonFilled } from "@fluentui/react-icons";
import { User } from "firebase/auth";
import { signIn, signUp, signOut, sendLink } from "./storage-firebase";
import { FirebaseAuthContext } from "./storage-firebase-auth-context";

function useLocalStorage(key: string, defaultValue: any = null): any {
  const [value, setValue] = React.useState(
    () => JSON.parse(localStorage.getItem(key) ?? defaultValue)
  );
  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  });
  return [value, setValue];
}

const KEY_EMAIL = "email";
const KEY_PASSWORDLESS = "passwordless";

function PasswordlessLogin({ email, setEmail }) {
  const [status, setStatus] = React.useState("");
  const [inProgress, setInProgress] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setInProgress(true);
      await sendLink(email, setStatus);
    } catch (error) {
      setStatus(error.toString());
    } finally {
      setInProgress(false);
    }
  }

  return <form style={{ display: "flex", flexDirection: "column", gap: 8 }} onSubmit={submit}>
    <Field label="Email Address">
      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    </Field>

    <Button type="submit" disabled={inProgress}>Send a link</Button>

    <Text>{status}</Text>
  </form>
}

export function EmailPasswordSignIn({ email, setEmail }) {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [inProgress, setInProgress] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();

    try {
      setInProgress(true);
      await signIn(email, password, setStatus);
      setTimeout(() => navigate("/"), 300);
    } catch (error) {
      setStatus(error.toString());
    } finally {
      setInProgress(false);
    }
  };

  return <form style={{ display: "flex", flexDirection: "column", gap: 8 }} onSubmit={submit}>
    <Field label="Email Address">
      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    </Field>

    <Field label="Password">
      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
    </Field>

    <Button type="submit" disabled={inProgress}>Sign In</Button>

    <Text>{status}</Text>
  </form>
}

export function AccountSignIn() {
  const [passwordless, setPasswordless] = useLocalStorage(KEY_PASSWORDLESS, true);
  const [email, setEmail] = useLocalStorage(KEY_EMAIL);

  return (
    <Layout>
      <NavBar title="Account" subtitle="Sign In" back="../.." />
      <Content>
        <h1>Sign In</h1>

        <Field hint="Choose whether you want to login by email & password or use an email link.">
          <Switch label="Passwordless login"
                  checked={passwordless}
                  onChange={(e) => setPasswordless(e.target.checked)} />
        </Field>

        <Divider style={{ maxHeight: 0 }} />

        {passwordless 
          ? <PasswordlessLogin email={email} setEmail={setEmail} />
          : <EmailPasswordSignIn email={email} setEmail={setEmail} />
        }

        <div>Don't have an account? Try <Link to="/account/signup">Sign Up</Link> instead.</div>
      </Content>
    </Layout>
  );
}

export function EmailPasswordSignUp({ email, setEmail }) {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [inProgress, setInProgress] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();

    try {
      setInProgress(true);
      await signUp(email, password, setStatus);
      setTimeout(() => navigate("/"), 300);
    } catch (error) {
      setStatus(error.toString());
    } finally {
      setInProgress(false);
    }
  };

    return <form style={{ display: "flex", flexDirection: "column", gap: 8 }} onSubmit={submit}>
      <Field label="Email Address">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>

      <Field label="Password">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>

      <Text>{status}</Text>

      <Button type="submit" disabled={inProgress}>Sign Up</Button>
    </form>
}

export function AccountSignUp() {
  const [passwordless, setPasswordless] = useLocalStorage(KEY_PASSWORDLESS, true);
  const [email, setEmail] = useLocalStorage(KEY_EMAIL);

  return (
    <Layout>
      <NavBar title="Account" subtitle="Sign Up" back="../.." />
      <Content>
        <h1>Sign Up</h1>

        <Field hint="Choose whether you want to sign up by email & password or use an email link.">
          <Switch label="Passwordless login"
                  checked={passwordless}
                  onChange={(e) => setPasswordless(e.target.checked)} />
        </Field>

        <Divider style={{ maxHeight: 0 }} />

        {passwordless 
          ? <PasswordlessLogin email={email} setEmail={setEmail} />
          : <EmailPasswordSignUp email={email} setEmail={setEmail} />
        }

        <div>Already have an account? Try <Link to="/account/signin">Sign In</Link> instead.</div>
      </Content>
    </Layout>
  );
}

function UserDetails(props: { user: User }) {
  return <>
    <Field label="Username">
      <Input disabled value={props.user.email} />
    </Field>

    <div style={{ display: "flex", gap: 8 }}>
      <Button onClick={() => alert("not implemented")}>Change Password</Button>
      <Button onClick={() => signOut()}>Sign Out</Button>
      <Button onClick={() => props.user.delete()}>Delete User</Button>
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
  const { isReady, user } = React.useContext(FirebaseAuthContext);

  return (
    <Layout>
      <NavBar title="Account" subtitle="Information" back="../.." />
      <Content>
        {isReady ? (user ? 
                      <UserDetails user={user} /> :
                      <AnonymousOptions /> ) 
                 : "Loading..."}
      </Content>
    </Layout>
  );
}

export function AccountMenu() {
  const navigate = useNavigate();
  const { isReady, user } = React.useContext(FirebaseAuthContext);

  return <Menu>
    <MenuTrigger>
      <Button icon={<PersonFilled />} style={{ borderRadius: 99 }} size="large" />
    </MenuTrigger>
    <MenuPopover>
      {isReady ? (user ? <>
          <MenuGroupHeader>{user.email}</MenuGroupHeader>
          <MenuDivider />
          <MenuItem onClick={() => navigate("/account/me")}>View Profile</MenuItem>
          <MenuItem onClick={() => signOut().then(() => navigate("/"))}>Sign Out</MenuItem>
        </> :
        <>
          <MenuItem onClick={() => navigate("/account/signin")}>Sign In</MenuItem>
          <MenuItem onClick={() => navigate("/account/signup")}>Sign Up</MenuItem>
        </>) : "Loading..."
      }
    </MenuPopover>
  </Menu>
}
