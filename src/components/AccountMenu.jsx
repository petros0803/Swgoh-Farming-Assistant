import { useRef, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/authContext';
import { AccountValidationError } from '../services/playerAccounts';
import Button from './ui/Button';
import TextField from './ui/TextField';

const EMPTY_DRAFT = {
  id: '',
  name: '',
  description: '',
  allyCode: ''
};

function showDialog(dialog) {
  if (!dialog || dialog.hasAttribute('open')) return;
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
    return;
  }
  dialog.setAttribute('open', '');
}

function hideDialog(dialog) {
  if (!dialog || !dialog.hasAttribute('open')) return;
  if (typeof dialog.close === 'function') {
    dialog.close();
    return;
  }
  dialog.removeAttribute('open');
}

export default function AccountMenu({ currentAllyCode = '', onUseAccount }) {
  const {
    configured,
    ready,
    user,
    accounts,
    accountsError,
    signIn,
    signUp,
    signOut,
    saveAccount,
    removeAccount
  } = useAuth();
  const dialogRef = useRef(null);
  const closingRef = useRef(false);
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState('');

  function resetDraft(allyCode = currentAllyCode) {
    setDraft({ ...EMPTY_DRAFT, allyCode });
    setFieldErrors({});
    setPendingDeleteId('');
  }

  function closeMenu() {
    if (closingRef.current) return;
    closingRef.current = true;
    setMode('sign-in');
    setPassword('');
    setFormError('');
    setNotice('');
    setSubmitting(false);
    resetDraft('');
    hideDialog(dialogRef.current);
    closingRef.current = false;
  }

  function openMenu() {
    setFormError('');
    setNotice('');
    if (!draft.id) {
      setDraft((current) => ({
        ...current,
        allyCode: current.allyCode || currentAllyCode
      }));
    }
    showDialog(dialogRef.current);
  }

  async function handleAuth(event) {
    event.preventDefault();
    setFormError('');
    setNotice('');
    setSubmitting(true);

    try {
      if (mode === 'sign-up') {
        const result = await signUp({ email, password });
        if (result.needsConfirmation) {
          setNotice('Check your email to confirm the account, then sign in.');
          setMode('sign-in');
          setPassword('');
        }
      } else {
        await signIn({ email, password });
        setPassword('');
      }
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    setSubmitting(true);

    try {
      await saveAccount(draft);
      resetDraft(currentAllyCode);
    } catch (error) {
      if (error instanceof AccountValidationError) setFieldErrors(error.fields);
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(account) {
    if (pendingDeleteId !== account.id) {
      setPendingDeleteId(account.id);
      return;
    }

    setFormError('');
    setSubmitting(true);
    try {
      await removeAccount(account.id);
      if (draft.id === account.id) resetDraft(currentAllyCode);
      setPendingDeleteId('');
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    setFormError('');
    setSubmitting(true);
    try {
      await signOut();
      closeMenu();
    } catch (error) {
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  if (!ready) return null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={openMenu}
        aria-label={user ? `Accounts for ${user.email}` : 'Sign in'}
      >
        {user ? 'Accounts' : 'Sign in'}
      </Button>
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-labelledby="account-menu-title"
        onClose={closeMenu}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeMenu();
        }}
      >
        <Panel>
          <HeadingRow>
            <div>
              <Title id="account-menu-title">
                {user ? 'Your accounts' : 'Sign in'}
              </Title>
              <Intro>
                {user
                  ? 'Each login can keep several ally codes, with a name and description.'
                  : 'Sign in to store ally codes on your account.'}
              </Intro>
            </div>
            <Button type="button" variant="ghost" onClick={closeMenu}>Close</Button>
          </HeadingRow>

          {formError && <Alert role="alert">{formError}</Alert>}
          {notice && <Notice role="status">{notice}</Notice>}
          {user && accountsError && <Alert role="alert">{accountsError}</Alert>}

          {!configured && (
            <Setup>
              <p>Add these to <code>.env</code> in the project root, then restart the dev server:</p>
              <code>VITE_SUPABASE_URL</code>
              <code>VITE_SUPABASE_ANON_KEY</code>
              <p>
                Use the anon key from Supabase project settings. Then run
                {' '}
                <code>supabase/player_accounts.sql</code>
                {' '}
                in the SQL editor.
              </p>
            </Setup>
          )}

          {configured && !user && (
            <Form onSubmit={handleAuth}>
              <Field>
                <Label htmlFor="account-email">Email</Label>
                <TextField
                  id="account-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  required
                  maxLength={254}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="account-password">Password</Label>
                <TextField
                  id="account-password"
                  type="password"
                  autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                  value={password}
                  required
                  minLength={6}
                  maxLength={72}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
              <Button type="submit" loading={submitting}>
                {mode === 'sign-up' ? 'Create account' : 'Sign in with email'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={submitting}
                onClick={() => {
                  setMode((current) => (current === 'sign-up' ? 'sign-in' : 'sign-up'));
                  setFormError('');
                  setNotice('');
                }}
              >
                {mode === 'sign-up' ? 'Already registered? Sign in' : 'Need an account? Create one'}
              </Button>
            </Form>
          )}

          {configured && user && (
            <>
              <SignedInAs>
                Signed in as
                {' '}
                <strong>{user.email}</strong>
              </SignedInAs>
              <Form onSubmit={handleSave}>
                <Field>
                  <Label htmlFor="account-name">Account name</Label>
                  <TextField
                    id="account-name"
                    value={draft.name}
                    maxLength={80}
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? 'account-name-error' : undefined}
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  />
                  {fieldErrors.name && <FieldError id="account-name-error">{fieldErrors.name}</FieldError>}
                </Field>
                <Field>
                  <Label htmlFor="account-description">Description</Label>
                  <TextArea
                    id="account-description"
                    value={draft.description}
                    maxLength={500}
                    rows={3}
                    aria-invalid={Boolean(fieldErrors.description)}
                    aria-describedby={fieldErrors.description ? 'account-description-error' : undefined}
                    onChange={(event) => setDraft((current) => ({
                      ...current,
                      description: event.target.value
                    }))}
                  />
                  {fieldErrors.description && (
                    <FieldError id="account-description-error">{fieldErrors.description}</FieldError>
                  )}
                </Field>
                <Field>
                  <Label htmlFor="account-ally-code">Account ally code</Label>
                  <TextField
                    id="account-ally-code"
                    inputMode="numeric"
                    maxLength={11}
                    value={draft.allyCode}
                    aria-invalid={Boolean(fieldErrors.allyCode)}
                    aria-describedby={fieldErrors.allyCode ? 'account-ally-code-error' : undefined}
                    onChange={(event) => setDraft((current) => ({
                      ...current,
                      allyCode: event.target.value
                    }))}
                  />
                  {fieldErrors.allyCode && (
                    <FieldError id="account-ally-code-error">{fieldErrors.allyCode}</FieldError>
                  )}
                </Field>
                <FormActions>
                  <Button type="submit" loading={submitting}>
                    {draft.id ? 'Save changes' : 'Save account'}
                  </Button>
                  {draft.id && (
                    <Button type="button" variant="ghost" onClick={() => resetDraft(currentAllyCode)}>
                      Cancel edit
                    </Button>
                  )}
                </FormActions>
              </Form>

              {accounts.length === 0 ? (
                <Empty>No saved accounts yet.</Empty>
              ) : (
                <AccountList>
                  {accounts.map((account) => (
                    <AccountItem key={account.id}>
                      <AccountName>{account.name}</AccountName>
                      <AccountCode>{account.allyCode}</AccountCode>
                      {account.description && <AccountDescription>{account.description}</AccountDescription>}
                      <RowActions>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            onUseAccount(account);
                            closeMenu();
                          }}
                        >
                          {`Sync ${account.name}`}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setDraft({
                              id: account.id,
                              name: account.name,
                              description: account.description,
                              allyCode: account.allyCode
                            });
                            setFieldErrors({});
                            setFormError('');
                            setPendingDeleteId('');
                          }}
                        >
                          {`Edit ${account.name}`}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={submitting}
                          onClick={() => handleDelete(account)}
                        >
                          {pendingDeleteId === account.id
                            ? `Confirm delete ${account.name}`
                            : `Delete ${account.name}`}
                        </Button>
                      </RowActions>
                    </AccountItem>
                  ))}
                </AccountList>
              )}
              <Button type="button" variant="ghost" disabled={submitting} onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          )}
        </Panel>
      </Dialog>
    </>
  );
}

const Dialog = styled.dialog`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(460px, calc(100vw - 32px));
  max-height: min(760px, calc(100vh - 32px));
  margin: 0;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};

  &::backdrop {
    background: rgba(0, 0, 0, 0.72);
  }
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[7]};
  max-height: min(760px, calc(100vh - 32px));
  overflow: auto;
  padding: ${({ theme }) => theme.space[10]};
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.lift};
`;

const HeadingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[6]};
`;

const Title = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  letter-spacing: ${({ theme }) => theme.letterSpacing.tight};
  color: ${({ theme }) => theme.colors.gold};
`;

const Intro = styled.p`
  margin-top: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.base};
  line-height: ${({ theme }) => theme.lineHeights.body};
`;

const Setup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.colors.body};
  line-height: ${({ theme }) => theme.lineHeights.body};

  code {
    font-family: ${({ theme }) => theme.fonts.body};
    color: ${({ theme }) => theme.colors.gold};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[6]};
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text};
`;

const TextArea = styled.textarea`
  width: 100%;
  resize: vertical;
  min-height: 76px;
  background-color: ${({ theme }) => theme.colors.bg};
  border: ${({ theme }) => theme.borders.thin} solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => `${theme.space[5]} ${theme.space[8]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: ${({ theme }) => theme.fonts.body};
  line-height: ${({ theme }) => theme.lineHeights.body};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.blue};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.focus};
  }
`;

const FormActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[5]};
`;

const Alert = styled.p`
  padding: ${({ theme }) => theme.space[6]};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.dangerSoft};
  color: ${({ theme }) => theme.colors.red};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const Notice = styled.p`
  padding: ${({ theme }) => theme.space[6]};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.infoSoft};
  color: ${({ theme }) => theme.colors.text};
`;

const FieldError = styled.p`
  color: ${({ theme }) => theme.colors.red};
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

const SignedInAs = styled.p`
  color: ${({ theme }) => theme.colors.muted};

  strong {
    color: ${({ theme }) => theme.colors.text};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`;

const Empty = styled.p`
  color: ${({ theme }) => theme.colors.muted};
`;

const AccountList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[5]};
`;

const AccountItem = styled.li`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[6]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.sunken};
`;

const AccountName = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const AccountCode = styled.span`
  color: ${({ theme }) => theme.colors.gold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.wide};
`;

const AccountDescription = styled.p`
  color: ${({ theme }) => theme.colors.body};
  line-height: ${({ theme }) => theme.lineHeights.body};
`;

const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[4]};
  margin-top: ${({ theme }) => theme.space[3]};
`;
