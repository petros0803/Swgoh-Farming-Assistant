import Button from './ui/Button';
import TextField from './ui/TextField';
import ThemeSwitch from './ThemeSwitch';
import styled from 'styled-components';

export default function Header({ allyCode, onAllyCodeChange, onSync, loading }) {
  function handleSubmit(event) {
    event.preventDefault();
    onSync();
  }

  return (
    <Bar>
      <Inner>
        <Brand>
          <Logo aria-hidden="true">⚔️</Logo>
          <div>
            <Title>SWGoH HOLOCRON TRACKER</Title>
            <Subtitle>Executor ➔ Leia ➔ JKL ➔ Jabba Command Hub</Subtitle>
          </div>
        </Brand>
        <Actions>
          <ThemeSwitch />
          <Form onSubmit={handleSubmit} autoComplete="off">
            <label className="sr-only" htmlFor="allyCode">Ally Code</label>
            <TextField
              type="text"
              id="allyCode"
              inputMode="numeric"
              placeholder="Ally Code (e.g. 123456789)"
              maxLength={11}
              value={allyCode}
              onChange={(event) => onAllyCodeChange(event.target.value)}
            />
            <Button type="submit" loading={loading}>
              {loading ? 'SYNCING...' : 'SYNC ROSTER'}
            </Button>
          </Form>
        </Actions>
      </Inner>
    </Bar>
  );
}

const Bar = styled.header`
  background-color: ${({ theme }) => theme.colors.header};
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: calc(${({ theme }) => theme.space[8]} + env(safe-area-inset-top)) ${({ theme }) => theme.space[10]} ${({ theme }) => theme.space[8]};
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.header};
  box-shadow: ${({ theme }) => theme.shadows.header};

  ${({ theme }) => theme.media.phone} {
    padding-left: ${({ theme }) => theme.space[8]};
    padding-right: ${({ theme }) => theme.space[8]};
  }
`;

const Inner = styled.div`
  max-width: ${({ theme }) => theme.sizes.content};
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[8]};

  ${({ theme }) => theme.media.phone} {
    align-items: stretch;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[7]};
  min-width: 0;
`;

const Logo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes['5xl']};
  line-height: ${({ theme }) => theme.lineHeights.tight};

  ${({ theme }) => theme.media.phone} {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
  }
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.heading};
  color: ${({ theme }) => theme.colors.gold};
  overflow-wrap: anywhere;

  ${({ theme }) => theme.media.phone} {
    font-size: ${({ theme }) => theme.fontSizes.headingPhone};
  }

  ${({ theme }) => theme.media.narrow} {
    font-size: ${({ theme }) => theme.fontSizes.headingNarrow};
  }
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.muted};
  margin-top: ${({ theme }) => theme.space[1]};

  ${({ theme }) => theme.media.narrow} {
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[6]};
  min-width: 0;

  ${({ theme }) => theme.media.phone} {
    width: 100%;
    flex-direction: column;
    align-items: flex-end;
  }
`;

const Form = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.space[5]};
  min-width: 0;

  input {
    min-width: 0;
    flex: 1 1 180px;
  }

  ${({ theme }) => theme.media.phone} {
    width: 100%;
    flex-direction: column;

    input,
    button {
      width: 100%;
    }

    input {
      flex: none;
    }
  }
`;
